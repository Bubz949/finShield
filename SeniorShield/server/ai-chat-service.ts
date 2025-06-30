import OpenAI from 'openai';
import { storage } from './storage';

interface ChatContext {
  userId: number;
  recentTransactions?: any[];
  alerts?: any[];
  userProfile?: any;
}

export class AIChatService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
    });
  }

  private buildSystemPrompt(context: ChatContext): string {
    const userInfo = this.getUserContextInfo(context);
    
    return `You are Nuvanta Assistant, a helpful AI assistant for a financial safety platform designed specifically for seniors.

Your role is to:
1. Help users understand their transactions and spending patterns
2. Explain app features and how to use them
3. Provide guidance on financial security and fraud prevention
4. Answer questions about alerts and account activity
5. Update user profiles when they mention life situation changes

Key guidelines:
- Be friendly, patient, and use simple, clear language appropriate for seniors
- Focus on financial safety and security
- Never provide specific financial advice or investment recommendations
- If asked about suspicious transactions, guide users to review them in the app
- Keep responses concise and helpful (2-3 sentences max)
- If you don't know something, admit it and suggest contacting support
- When users mention life situations (hospital, travel, recovery, etc.), acknowledge and suggest profile updates

User Context:
${userInfo}

Remember: You're here to help seniors stay safe with their finances and use the Nuvanta app effectively. Always prioritize their safety and understanding.`;
  }

  private getUserContextInfo(context: ChatContext): string {
    let info = `- User ID: ${context.userId}\n`;
    
    if (context.recentTransactions?.length) {
      info += `- Recent transactions: ${context.recentTransactions.length} transactions\n`;
      const flaggedCount = context.recentTransactions.filter(t => t.isFlagged).length;
      if (flaggedCount > 0) {
        info += `- Flagged transactions: ${flaggedCount} suspicious transactions detected\n`;
      }
    }
    
    if (context.alerts?.length) {
      info += `- Active alerts: ${context.alerts.length} unresolved alerts\n`;
      const highPriorityAlerts = context.alerts.filter(a => a.severity === 'high').length;
      if (highPriorityAlerts > 0) {
        info += `- High priority alerts: ${highPriorityAlerts} requiring attention\n`;
      }
    }

    if (context.userProfile?.spendingProfile) {
      try {
        const spending = JSON.parse(context.userProfile.spendingProfile);
        if (spending.currentSituation) {
          info += `- Current situation: ${spending.currentSituation} (profile adjusted for this situation)\n`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return info;
  }

  async getChatResponse(message: string, context: ChatContext): Promise<{ response: string; profileUpdate?: any }> {
    try {
      // Check if user mentions life situations that need profile updates
      const profileUpdate = await this.detectAndHandleProfileUpdate(message, context);
      
      const systemPrompt = this.buildSystemPrompt(context);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again.";

      return {
        response,
        profileUpdate
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Fallback to rule-based response if OpenAI fails
      return {
        response: "I'm having trouble connecting to my AI service right now. For immediate help with transactions, check the Transactions section. For alerts, visit the Alert Center. For security questions, contact support."
      };
    }
  }

  private async detectAndHandleProfileUpdate(message: string, context: ChatContext): Promise<any> {
    const lowerMessage = message.toLowerCase();
    
    // Keywords that indicate life situation changes
    const situationKeywords = {
      hospital: ['hospital', 'surgery', 'medical', 'sick', 'illness', 'doctor', 'treatment'],
      travel: ['travel', 'vacation', 'trip', 'away', 'visiting', 'holiday'],
      recovery: ['recovery', 'rehabilitation', 'therapy', 'recovering', 'healing'],
      moving: ['moving', 'relocating', 'new home', 'address change']
    };

    for (const [situation, keywords] of Object.entries(situationKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return await this.createProfileUpdate(situation, context);
      }
    }

    return null;
  }

  private async createProfileUpdate(situationType: string, context: ChatContext): Promise<any> {
    const user = await storage.getUser(context.userId);
    if (!user) return null;

    const currentSpending = user.spendingProfile ? JSON.parse(user.spendingProfile) : {};
    const currentLiving = user.livingProfile ? JSON.parse(user.livingProfile) : {};

    let updatedSpending = { ...currentSpending };
    let updatedLiving = { ...currentLiving };

    switch (situationType) {
      case 'hospital':
        updatedSpending.currentSituation = 'hospital';
        updatedSpending.expectedCategories = ['medical', 'pharmacy', 'food_delivery'];
        updatedSpending.reducedActivity = true;
        updatedLiving.temporaryChange = 'hospital_stay';
        updatedLiving.assistanceNeeded = true;
        break;
      
      case 'travel':
        updatedSpending.currentSituation = 'travel';
        updatedSpending.expectedCategories = ['restaurants', 'hotels', 'transportation', 'entertainment'];
        updatedSpending.higherSpending = true;
        updatedLiving.temporaryChange = 'traveling';
        break;
      
      case 'recovery':
        updatedSpending.currentSituation = 'recovery';
        updatedSpending.expectedCategories = ['medical', 'pharmacy', 'home_services'];
        updatedSpending.limitedMobility = true;
        updatedLiving.temporaryChange = 'recovery_period';
        updatedLiving.assistanceNeeded = true;
        break;
    }

    return {
      spendingProfile: updatedSpending,
      livingProfile: updatedLiving,
      situationType
    };
  }
}

export const aiChatService = new AIChatService();