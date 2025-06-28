import { Request } from "express";

interface ChatContext {
  userId: number;
  recentTransactions?: any[];
  userProfile?: any;
  alerts?: any[];
}

export class ChatService {
  private getSystemPrompt(context: ChatContext): string {
    return `You are FinShield Assistant, a helpful AI assistant for a financial safety platform designed for seniors. 

Your role is to:
1. Help users understand their transactions and spending patterns
2. Explain app features and how to use them
3. Provide guidance on financial security and fraud prevention
4. Answer questions about alerts and account activity

Key guidelines:
- Be friendly, patient, and use simple language
- Focus on financial safety and security
- Never provide specific financial advice or investment recommendations
- If asked about suspicious transactions, guide users to review them in the app
- Keep responses concise and helpful
- If you don't know something, admit it and suggest contacting support

User context:
- User ID: ${context.userId}
- Recent transactions available: ${context.recentTransactions?.length || 0}
- Active alerts: ${context.alerts?.length || 0}

Remember: You're here to help seniors stay safe with their finances and use the FinShield app effectively.`;
  }

  async getChatResponse(message: string, context: ChatContext): Promise<string> {
    // For now, provide rule-based responses
    // In production, you'd integrate with OpenAI or similar service
    
    const lowerMessage = message.toLowerCase();
    
    // Transaction-related queries
    if (lowerMessage.includes('transaction') || lowerMessage.includes('spending')) {
      return "I can help you understand your transactions! You can view all your recent transactions in the 'Transactions' section of the app. If you see anything suspicious, you can flag it for review. Would you like me to explain how to review a specific transaction?";
    }
    
    // Alert-related queries
    if (lowerMessage.includes('alert') || lowerMessage.includes('warning')) {
      return "Alerts help keep your finances safe! You'll see alerts for unusual spending, suspicious transactions, or bill reminders. Check the Alert Center on your dashboard to review any active alerts. High-priority alerts will also show as banners at the top of your dashboard.";
    }
    
    // Security-related queries
    if (lowerMessage.includes('security') || lowerMessage.includes('fraud') || lowerMessage.includes('scam')) {
      return "FinShield helps protect you from fraud by monitoring your transactions for unusual patterns. Always verify unexpected charges, never share your banking details, and contact your bank immediately if you suspect fraud. You can also flag suspicious transactions in the app for review.";
    }
    
    // App navigation help
    if (lowerMessage.includes('how to') || lowerMessage.includes('navigate') || lowerMessage.includes('use')) {
      return "I'm here to help you use FinShield! The main sections are: Dashboard (overview of your finances), Transactions (detailed transaction history), and Settings (manage your preferences). What specific feature would you like help with?";
    }
    
    // Family connections
    if (lowerMessage.includes('family') || lowerMessage.includes('relative')) {
      return "You can connect trusted family members to help monitor your account activity. They can receive alerts about suspicious transactions and help you stay safe. Go to Settings to manage your family connections.";
    }
    
    // General greeting or unclear query
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return "Hello! I'm here to help you with FinShield. I can assist with understanding your transactions, explaining app features, or answering questions about account security. What would you like to know?";
    }
    
    // Default response
    return "I'm here to help with your FinShield app and financial safety questions. You can ask me about transactions, alerts, app features, or security tips. What specific question do you have?";
  }
}

export const chatService = new ChatService();