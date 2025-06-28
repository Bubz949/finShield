import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authRoutes } from "./auth-routes";
import { yodleeRoutes } from "./yodlee-routes";
import { verifyToken } from "./auth";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import sanitize from "sanitize-html";
import { auditLog } from "./audit-logger";
import { mlService } from "./ml/service";
import { chatService } from "./chat-service";

// Helper functions for risk trends
function calculateDailyRiskTrends(transactions: any[]) {
  const dailyStats = new Map<string, { total: number; suspicious: number; amount: number; suspiciousAmount: number }>();
  
  transactions.forEach(t => {
    const date = new Date(t.transactionDate).toISOString().split('T')[0];
    if (!dailyStats.has(date)) {
      dailyStats.set(date, { total: 0, suspicious: 0, amount: 0, suspiciousAmount: 0 });
    }
    
    const stats = dailyStats.get(date)!;
    stats.total++;
    stats.amount += Math.abs(parseFloat(t.amount.toString()));
    
    if (t.isFlagged) {
      stats.suspicious++;
      stats.suspiciousAmount += Math.abs(parseFloat(t.amount.toString()));
    }
  });

  return Array.from(dailyStats.entries()).map(([date, stats]) => ({
    date,
    totalTransactions: stats.total,
    suspiciousTransactions: stats.suspicious,
    riskPercentage: (stats.suspicious / stats.total) * 100,
    totalAmount: stats.amount,
    suspiciousAmount: stats.suspiciousAmount,
    riskExposurePercentage: (stats.suspiciousAmount / stats.amount) * 100
  }));
}

function calculateWeeklyRiskTrends(transactions: any[]) {
  const weeklyStats = new Map<string, { total: number; suspicious: number; amount: number; suspiciousAmount: number }>();
  
  transactions.forEach(t => {
    const date = new Date(t.transactionDate);
    const week = getWeekNumber(date);
    const weekKey = `${date.getFullYear()}-W${week}`;
    
    if (!weeklyStats.has(weekKey)) {
      weeklyStats.set(weekKey, { total: 0, suspicious: 0, amount: 0, suspiciousAmount: 0 });
    }
    
    const stats = weeklyStats.get(weekKey)!;
    stats.total++;
    stats.amount += Math.abs(parseFloat(t.amount.toString()));
    
    if (t.isFlagged) {
      stats.suspicious++;
      stats.suspiciousAmount += Math.abs(parseFloat(t.amount.toString()));
    }
  });

  return Array.from(weeklyStats.entries()).map(([weekKey, stats]) => ({
    week: weekKey,
    totalTransactions: stats.total,
    suspiciousTransactions: stats.suspicious,
    riskPercentage: (stats.suspicious / stats.total) * 100,
    totalAmount: stats.amount,
    suspiciousAmount: stats.suspiciousAmount,
    riskExposurePercentage: (stats.suspiciousAmount / stats.amount) * 100
  }));
}

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function generateQuestions(answer: string, type: 'living' | 'spending', previousAnswers: string[]) {
  const answerLower = answer.toLowerCase();
  
  if (type === 'living') {
    if (answerLower.includes('alone')) {
      return [
        "How do you handle emergencies when you're alone?",
        "Who do you contact for help with important decisions?",
        "What safety measures do you have in place at home?",
        "How comfortable are you using technology for daily tasks?"
      ];
    } else if (answerLower.includes('family')) {
      return [
        "How involved is your family in your financial decisions?",
        "Do family members help you with technology or online tasks?",
        "What concerns do you have about financial privacy?",
        "How do you prefer to communicate with family about money?"
      ];
    }
  } else if (type === 'spending') {
    if (answerLower.includes('online') || answerLower.includes('internet')) {
      return [
        "What websites do you commonly shop on?",
        "How do you verify if an online store is legitimate?",
        "Do you save payment information on websites?",
        "What would make you suspicious of an online purchase?"
      ];
    } else if (answerLower.includes('cash')) {
      return [
        "When do you prefer to use cards instead of cash?",
        "How often do you check your bank statements?",
        "What would be an unusually large purchase for you?",
        "Do you have any recurring automatic payments?"
      ];
    }
  }
  
  // Default questions
  return type === 'living' 
    ? ["How do you manage your daily activities?", "Who helps you with important decisions?", "What are your main safety concerns?", "How comfortable are you with technology?"]
    : ["What are your largest monthly expenses?", "How do you prefer to pay for things?", "Do you have any recurring subscriptions?", "What would be an unusual purchase for you?"];
}

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// CSRF protection configuration
const csrfProtection = csrf({ cookie: true });

// Sanitize function for user input
function sanitizeInput(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitize(obj) : obj;
  }
  
  const result: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    result[key] = sanitizeInput(obj[key]);
  }
  return result;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Security headers disabled for HTTP access
  // app.use(helmet({
  //   contentSecurityPolicy: {
  //     directives: {
  //       defaultSrc: ["'self'"],
  //       scriptSrc: ["'self'"],
  //       styleSrc: ["'self'", "'unsafe-inline'"],
  //       imgSrc: ["'self'", "data:", "https:"],
  //       connectSrc: ["'self'"],
  //       fontSrc: ["'self'"],
  //       objectSrc: ["'none'"],
  //       mediaSrc: ["'self'"],
  //       frameSrc: ["'none'"],
  //     },
  //   },
  //   crossOriginEmbedderPolicy: true,
  //   crossOriginOpenerPolicy: true,
  //   crossOriginResourcePolicy: { policy: "same-site" },
  //   dnsPrefetchControl: true,
  //   frameguard: { action: "deny" },
  //   hidePoweredBy: true,
  //   hsts: {
  //     maxAge: 31536000,
  //     includeSubDomains: true,
  //     preload: true
  //   },
  //   ieNoOpen: true,
  //   noSniff: true,
  //   permittedCrossDomainPolicies: { permittedPolicies: "none" },
  //   referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  //   xssFilter: true
  // }));

  // Authentication middleware - moved to top
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          req.user = { id: decoded.userId };
        }
      } catch (error) {
        console.error('Token verification failed:', error);
      }
    }
    next();
  });

  // Rate limiting disabled for development
  // app.use(apiLimiter);

  // CSRF protection completely disabled
  // app.use((req, res, next) => {
  //   if (req.method === 'GET' || req.path.startsWith('/assets/')) {
  //     next();
  //   } else {
  //     csrfProtection(req, res, next);
  //   }
  // });

  // Input sanitization middleware
  app.use((req, res, next) => {
    req.body = sanitizeInput(req.body);
    req.query = sanitizeInput(req.query);
    req.params = sanitizeInput(req.params);
    next();
  });

  // Response headers middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    if (err.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
  });

  // Auth routes
  app.use("/api/auth", authRoutes);

  // Yodlee routes
  app.use("/api/yodlee", yodleeRoutes);



  // Protected route middleware
  const requireAuth = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Dashboard data endpoint
  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      const [
        user,
        accounts,
        recentTransactions,
        alerts,
        familyMembers
      ] = await Promise.all([
        storage.getUser(userId),
        storage.getAccountsByUserId(userId),
        storage.getRecentTransactions(userId, 10),
        storage.getAlertsByUserId(userId),
        storage.getFamilyMembersByUserId(userId)
      ]);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate stats
      const unreadAlerts = alerts.filter(alert => !alert.isRead);
      const weeklyAlerts = alerts.filter(alert => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return alert.createdAt! >= weekAgo;
      });

      // Calculate spending by category
      const spendingByCategory = recentTransactions
        .filter(t => t.isSpending)
        .reduce((acc, transaction) => {
          const category = transaction.category;
          const amount = Math.abs(parseFloat(transaction.amount));
          acc[category] = (acc[category] || 0) + amount;
          return acc;
        }, {} as Record<string, number>);

      res.json({
        user,
        accounts,
        recentTransactions,
        alerts: unreadAlerts.slice(0, 5), // Most recent unread alerts
        familyMembers,
        stats: {
          protectedAccounts: accounts.length,
          weeklyAlerts: weeklyAlerts.length,
          unreadAlerts: unreadAlerts.length
        },
        spendingByCategory
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all alerts for user
  app.get("/api/alerts", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const alerts = await storage.getAlertsByUserId(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Alerts error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark alert as read
  app.patch("/api/alerts/:alertId/read", requireAuth, async (req, res) => {
    try {
      const alertId = parseInt(req.params.alertId);
      
      // Get alert to check ownership
      const alert = await storage.getAlertById(alertId);
      if (!alert || alert.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedAlert = await storage.markAlertAsRead(alertId);
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      console.error("Mark alert read error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark alert as resolved
  app.patch("/api/alerts/:alertId/resolve", requireAuth, async (req, res) => {
    try {
      const alertId = parseInt(req.params.alertId);
      
      // Get alert to check ownership
      const alert = await storage.getAlertById(alertId);
      if (!alert || alert.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedAlert = await storage.markAlertAsResolved(alertId);
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      console.error("Resolve alert error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get transactions for user with ML analysis
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getRecentTransactions(userId, limit);
      
      // Analyze transactions if they haven't been analyzed yet
      const analyzedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          if (transaction.suspiciousScore === 0) {
            const analysis = await mlService.analyzeTransaction(transaction, userId);
            // Update transaction with analysis results
            await storage.updateTransaction(transaction.id, {
              suspiciousScore: analysis.suspiciousScore,
              isFlagged: analysis.isAnomaly
            });
            return {
              ...transaction,
              suspiciousScore: analysis.suspiciousScore,
              isFlagged: analysis.isAnomaly,
              analysis: {
                anomalyScore: analysis.anomalyScore,
                behavioralScore: analysis.behavioralScore,
                features: analysis.features
              }
            };
          }
          return transaction;
        })
      );
      
      res.json(analyzedTransactions);
    } catch (error) {
      console.error("Transactions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update transaction review status and provide feedback for ML models
  app.patch("/api/transactions/:transactionId/review", requireAuth, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      const { reviewStatus, isFraudulent } = req.body;
      
      // Get transaction to check ownership
      const transaction = await storage.getTransaction(transactionId);
      const account = transaction ? await storage.getAccount(transaction.accountId) : null;
      
      if (!transaction || !account || account.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      if (!["pending", "approved", "blocked"].includes(reviewStatus)) {
        return res.status(400).json({ message: "Invalid review status" });
      }

      // Get historical transactions for this user for model updates
      const historicalTransactions = await storage.getTransactionsByUserId(req.user!.id);
      
      // Update ML models with user feedback
      if (typeof isFraudulent === 'boolean') {
        await mlService.updateModels(transaction, req.user!.id, isFraudulent, historicalTransactions);
      }
      
      // Update transaction status
      const updatedTransaction = await storage.updateTransaction(transactionId, { 
        reviewStatus,
        isFlagged: isFraudulent || false
      });
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Update transaction error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get family members for user
  app.get("/api/family-members", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const familyMembers = await storage.getFamilyMembersByUserId(userId);
      res.json(familyMembers);
    } catch (error) {
      console.error("Family members error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get ML insights and statistics
  app.get("/api/ml-insights", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const transactions = await storage.getRecentTransactions(userId, 100);
      
      // Calculate insights
      const suspiciousTransactions = transactions.filter(t => t.isFlagged);
      const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);
      const suspiciousAmount = suspiciousTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);
      
      // Group by category
      const categoryRisks = transactions.reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = {
            total: 0,
            suspicious: 0,
            avgScore: 0,
            transactions: 0
          };
        }
        acc[t.category].transactions++;
        acc[t.category].total += Math.abs(parseFloat(t.amount.toString()));
        if (t.isFlagged) {
          acc[t.category].suspicious++;
        }
        acc[t.category].avgScore += t.suspiciousScore || 0;
        return acc;
      }, {} as Record<string, any>);

      // Calculate averages
      Object.keys(categoryRisks).forEach(category => {
        categoryRisks[category].avgScore /= categoryRisks[category].transactions;
      });

      // Get recent alerts
      const alerts = await storage.getAlertsByUserId(userId);
      const recentAlerts = alerts
        .filter(a => a.alertType === 'suspicious_transaction')
        .slice(0, 5);

      res.json({
        summary: {
          totalTransactions: transactions.length,
          suspiciousTransactions: suspiciousTransactions.length,
          suspiciousPercentage: (suspiciousTransactions.length / transactions.length) * 100,
          totalAmount,
          suspiciousAmount,
          riskExposurePercentage: (suspiciousAmount / totalAmount) * 100
        },
        categoryRisks,
        recentAlerts,
        riskTrends: {
          daily: calculateDailyRiskTrends(transactions),
          weekly: calculateWeeklyRiskTrends(transactions)
        }
      });
    } catch (error) {
      console.error("ML insights error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Analyze transaction in real-time
  app.post("/api/transactions/analyze", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { transaction } = req.body;

      if (!transaction || !transaction.accountId) {
        return res.status(400).json({ message: "Invalid transaction data" });
      }

      // Verify account ownership
      const account = await storage.getAccount(transaction.accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Analyze transaction using ML service
      const analysis = await mlService.analyzeTransaction(transaction, userId);

      // If transaction is highly suspicious (score > 90), create immediate alert
      if (analysis.suspiciousScore > 90) {
        await storage.createAlert({
          userId,
          transactionId: transaction.id,
          alertType: "suspicious_transaction",
          severity: "high",
          title: "High Risk Transaction Detected",
          description: `Transaction of ${transaction.amount} at ${transaction.merchant} has been flagged as highly suspicious. Please review immediately.`,
        });

        // Notify family members who are set up for alerts
        const familyMembers = await storage.getFamilyMembersByUserId(userId);
        const notifyMembers = familyMembers.filter(member => 
          member.receiveAlerts && member.alertTypes.includes("suspicious_transaction")
        );

        // In a real implementation, you would send emails/SMS here
        console.log(`Notifying ${notifyMembers.length} family members about suspicious transaction`);
      }

      res.json({
        transaction,
        analysis,
        riskLevel: analysis.suspiciousScore > 90 ? "high" : 
                   analysis.suspiciousScore > 70 ? "medium" : "low",
        recommendedAction: analysis.suspiciousScore > 90 ? "block" : 
                         analysis.suspiciousScore > 70 ? "review" : "allow",
        features: analysis.features
      });
    } catch (error) {
      console.error("Transaction analysis error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get transactions for specific account
  app.get("/api/accounts/:accountId/transactions", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const accountId = parseInt(req.params.accountId);
      const transactions = await storage.getTransactionsByAccountId(accountId, userId);
      res.json(transactions);
    } catch (error) {
      console.error("Account transactions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create family member
  app.post("/api/family-members", requireAuth, async (req, res) => {
    try {
      // Ensure the family member is being created for the authenticated user
      const familyMemberData = { ...req.body, userId: req.user!.id };
      const familyMember = await storage.createFamilyMember(familyMemberData);
      res.status(201).json(familyMember);
    } catch (error) {
      console.error("Create family member error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update family member
  app.patch("/api/family-members/:memberId", requireAuth, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      
      // Get family member to check ownership
      const existingMember = await storage.getFamilyMember(memberId);
      if (!existingMember || existingMember.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const familyMember = await storage.updateFamilyMember(memberId, req.body);
      
      if (!familyMember) {
        return res.status(404).json({ message: "Family member not found" });
      }
      
      res.json(familyMember);
    } catch (error) {
      console.error("Update family member error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete family member
  app.delete("/api/family-members/:memberId", requireAuth, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      
      // Get family member to check ownership
      const existingMember = await storage.getFamilyMember(memberId);
      if (!existingMember || existingMember.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const success = await storage.deleteFamilyMember(memberId);
      
      if (!success) {
        return res.status(404).json({ message: "Family member not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete family member error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Profile setup endpoints
  app.post("/api/profile/generate-questions", requireAuth, async (req, res) => {
    try {
      const { answer, type, previousAnswers } = req.body;
      
      // Simple AI-like question generation based on answer
      const questions = generateQuestions(answer, type, previousAnswers);
      
      res.json({ questions });
    } catch (error) {
      console.error("Generate questions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/profile/complete", requireAuth, async (req, res) => {
    try {
      const { livingProfile, spendingProfile } = req.body;
      const userId = req.user!.id;
      
      await storage.updateUser(userId, {
        livingProfile: JSON.stringify(livingProfile),
        spendingProfile: JSON.stringify(spendingProfile),
        profileCompleted: true
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Complete profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get bank actions for transaction
  app.post("/api/bank-actions", requireAuth, async (req, res) => {
    try {
      const { transactionId, notes } = req.body;
      const userId = req.user!.id;
      
      // Verify transaction ownership
      const transaction = await storage.getTransaction(transactionId);
      const account = transaction ? await storage.getAccount(transaction.accountId) : null;
      
      if (!transaction || !account || account.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Import bank actions service
      const { generateBankActionPlan } = require('./bank-actions');
      
      // Generate bank-specific action plan
      const actionPlan = generateBankActionPlan(transaction, account);
      
      // Create alert for user with bank actions
      await storage.createAlert({
        userId,
        transactionId,
        alertType: "bank_actions",
        severity: "high",
        title: "Bank Actions Available",
        description: `Contact ${actionPlan.bankInfo.name} at ${actionPlan.bankInfo.fraudHotline} to report suspicious transaction.`
      });
      
      res.json(actionPlan);
    } catch (error) {
      console.error("Bank actions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Chat endpoint
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const { message } = req.body;
      const userId = req.user!.id;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Get user context for better responses
      const [recentTransactions, alerts] = await Promise.all([
        storage.getRecentTransactions(userId, 10),
        storage.getAlertsByUserId(userId)
      ]);
      
      const context = {
        userId,
        recentTransactions,
        alerts: alerts.filter(a => !a.isResolved)
      };
      
      const response = await chatService.getChatResponse(message, context);
      
      res.json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
