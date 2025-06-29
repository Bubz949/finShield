import { Request } from "express";
import { storage } from "./storage";
import type { Situation } from "@shared/schema";

interface ChatContext {
  userId: number;
  recentTransactions?: any[];
  userProfile?: any;
  alerts?: any[];
  userProfile?: any;
}



export class ChatService {
  private getSystemPrompt(context: ChatContext): string {
    const profileContext = this.getProfileContext(context.userProfile);
    
    return `You are Nuvanta Assistant, a helpful AI assistant for a financial safety platform designed for seniors. 

Your role is to:
1. Help users understand their transactions and spending patterns
2. Explain app features and how to use them
3. Provide guidance on financial security and fraud prevention
4. Answer questions about alerts and account activity
5. Update user profiles when they mention life situation changes

Key guidelines:
- Be friendly, patient, and use simple language
- Focus on financial safety and security
- Never provide specific financial advice or investment recommendations
- If asked about suspicious transactions, guide users to review them in the app
- Keep responses concise and helpful
- If you don't know something, admit it and suggest contacting support
- When users mention life situations (hospital, travel, recovery, etc.), update their profile to adjust fraud detection

User context:
- User ID: ${context.userId}
- Recent transactions available: ${context.recentTransactions?.length || 0}
- Active alerts: ${context.alerts?.length || 0}
${profileContext}

Remember: You're here to help seniors stay safe with their finances and use the Nuvanta app effectively.`;
  }

  async getChatResponse(message: string, context: ChatContext): Promise<{ response: string; profileUpdate?: any }> {
    const lowerMessage = message.toLowerCase();
    
    // Profile update queries
    if (this.detectProfileUpdate(lowerMessage)) {
      const profileUpdate = await this.handleProfileUpdate(message, context);
      if (profileUpdate) {
        return {
          response: this.generateProfileUpdateResponse(profileUpdate),
          profileUpdate
        };
      }
    }
    
    // Transaction-related queries
    if (lowerMessage.includes('transaction') || lowerMessage.includes('spending')) {
      const situationContext = this.getSituationContext(context.activeSituations);
      return {
        response: `I can help you understand your transactions! ${situationContext} You can view all your recent transactions in the 'Transactions' section of the app. If you see anything suspicious, you can flag it for review. Would you like me to explain how to review a specific transaction?`
      };
    }
    
    // Alert-related queries
    if (lowerMessage.includes('alert') || lowerMessage.includes('warning')) {
      return {
        response: "Alerts help keep your finances safe! You'll see alerts for unusual spending, suspicious transactions, or bill reminders. Check the Alert Center on your dashboard to review any active alerts. High-priority alerts will also show as banners at the top of your dashboard."
      };
    }
    
    // Security-related queries
    if (lowerMessage.includes('security') || lowerMessage.includes('fraud') || lowerMessage.includes('scam')) {
      return {
        response: "Nuvanta helps protect you from fraud by monitoring your transactions for unusual patterns. Always verify unexpected charges, never share your banking details, and contact your bank immediately if you suspect fraud. You can also flag suspicious transactions in the app for review."
      };
    }
    
    // App navigation help
    if (lowerMessage.includes('how to') || lowerMessage.includes('navigate') || lowerMessage.includes('use')) {
      return {
        response: "I'm here to help you use Nuvanta! The main sections are: Dashboard (overview of your finances), Transactions (detailed transaction history), and Settings (manage your preferences). What specific feature would you like help with?"
      };
    }
    
    // Family connections
    if (lowerMessage.includes('family') || lowerMessage.includes('relative')) {
      return {
        response: "You can connect trusted family members to help monitor your account activity. They can receive alerts about suspicious transactions and help you stay safe. Go to Settings to manage your family connections."
      };
    }
    
    // General greeting or unclear query
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return {
        response: "Hello! I'm here to help you with Nuvanta. I can assist with understanding your transactions, explaining app features, answering questions about account security, or helping you manage life situations that affect your spending. What would you like to know?"
      };
    }
    
    // Default response
    return {
      response: "I'm here to help with your Nuvanta app and financial safety questions. You can ask me about transactions, alerts, app features, security tips, or tell me about life situations like hospital stays or travel that might affect your spending patterns. What specific question do you have?"
    };
  }

  private detectProfileUpdate(message: string): boolean {
    const updateKeywords = [
      'hospital', 'surgery', 'medical', 'recovery', 'sick', 'illness',
      'travel', 'vacation', 'trip', 'away', 'visiting',
      'family visit', 'staying with', 'house sitting',
      'rehabilitation', 'therapy', 'treatment',
      'moving', 'relocating', 'temporary'
    ];
    
    return updateKeywords.some(keyword => message.includes(keyword));
  }

  private async handleProfileUpdate(message: string, context: ChatContext): Promise<any> {
    const lowerMessage = message.toLowerCase();
    const user = await storage.getUser(context.userId);
    
    if (!user) return null;
    
    const currentSpending = user.spendingProfile ? JSON.parse(user.spendingProfile) : {};
    const currentLiving = user.livingProfile ? JSON.parse(user.livingProfile) : {};
    
    let updatedSpending = { ...currentSpending };
    let updatedLiving = { ...currentLiving };
    
    // Hospital/Medical situations
    if (lowerMessage.includes('hospital') || lowerMessage.includes('surgery') || lowerMessage.includes('medical')) {
      updatedSpending.currentSituation = 'hospital';
      updatedSpending.expectedCategories = ['medical', 'pharmacy', 'food_delivery'];
      updatedSpending.reducedActivity = true;
      updatedLiving.temporaryChange = 'hospital_stay';
      updatedLiving.assistanceNeeded = true;
    }
    
    // Travel situations
    else if (lowerMessage.includes('travel') || lowerMessage.includes('vacation') || lowerMessage.includes('trip')) {
      updatedSpending.currentSituation = 'travel';
      updatedSpending.expectedCategories = ['restaurants', 'hotels', 'transportation', 'entertainment'];
      updatedSpending.higherSpending = true;
      updatedLiving.temporaryChange = 'traveling';
    }
    
    // Recovery situations
    else if (lowerMessage.includes('recovery') || lowerMessage.includes('rehabilitation') || lowerMessage.includes('therapy')) {
      updatedSpending.currentSituation = 'recovery';
      updatedSpending.expectedCategories = ['medical', 'pharmacy', 'home_services'];
      updatedSpending.limitedMobility = true;
      updatedLiving.temporaryChange = 'recovery_period';
      updatedLiving.assistanceNeeded = true;
    }
    
    return {
      spendingProfile: updatedSpending,
      livingProfile: updatedLiving,
      situationType: updatedSpending.currentSituation
    };
  }

  private generateProfileUpdateResponse(update: any): string {
    switch (update.situationType) {
      case 'hospital':
        return "I understand you're in the hospital. I've updated your profile to expect minimal day-to-day spending and will adjust fraud detection accordingly. The system will now expect medical and pharmacy transactions while being more alert to unusual retail spending. Take care and focus on your recovery!";
      
      case 'travel':
        return "I see you're traveling! I've updated your spending profile to expect different patterns like restaurants and hotels in new locations. This will help reduce false fraud alerts while you're away. The system will be more accepting of higher spending amounts and new merchant locations.";
      
      case 'recovery':
        return "I've noted that you're in recovery. I've updated your profile to expect reduced activity and more medical/pharmacy purchases, plus home services and deliveries. The system will be less sensitive to changes in your normal shopping patterns during this time.";
      
      default:
        return "I've updated your profile based on what you've told me. This will help the AI better understand your current circumstances and adjust fraud detection accordingly.";
    }
  }

  private getProfileContext(userProfile?: any): string {
    if (!userProfile?.spendingProfile) return '';
    
    const spending = JSON.parse(userProfile.spendingProfile);
    if (spending.currentSituation) {
      return `Given your current situation (${spending.currentSituation}), the AI is adjusting its expectations for your spending patterns. `;
    }
    return '';
  }
}


}

export const chatService = new ChatService();