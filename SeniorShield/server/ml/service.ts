import { Transaction } from '../../shared/schema';
import { FraudDetectionService } from './models';
import { storage } from '../storage';

class MLService {
  private fraudDetectionService: FraudDetectionService;
  private isInitialized: boolean = false;

  constructor() {
    this.fraudDetectionService = new FraudDetectionService();
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Get historical transactions for training
    const historicalTransactions = await storage.getAllTransactions();
    await this.fraudDetectionService.initialize(historicalTransactions);
    
    this.isInitialized = true;
    console.log('ML Service initialized successfully');
  }

  async analyzeTransaction(transaction: Transaction, userId: number): Promise<{
    suspiciousScore: number;
    isAnomaly: boolean;
    anomalyScore: number;
    behavioralScore: number;
    features: any;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Get user profile and historical transactions
    const [user, historicalTransactions] = await Promise.all([
      storage.getUser(userId),
      storage.getTransactionsByUserId(userId)
    ]);
    
    // Analyze the transaction with profile data
    const result = await this.fraudDetectionService.analyzeTransaction(
      transaction,
      userId,
      historicalTransactions,
      user
    );

    // Apply profile-based adjustments
    const adjustedResult = this.applyProfileAdjustments(result, transaction, user);

    // If transaction is suspicious (after adjustments), create an alert
    if (adjustedResult.isAnomaly) {
      await storage.createAlert({
        userId,
        transactionId: transaction.id,
        alertType: 'suspicious_transaction',
        severity: adjustedResult.suspiciousScore >= 90 ? 'high' : 'medium',
        title: 'Suspicious Transaction Detected',
        description: `Transaction of ${transaction.amount} at ${transaction.merchant} has been flagged as suspicious with a risk score of ${adjustedResult.suspiciousScore}/100.`,
      });
    }

    return adjustedResult;
  }

  async reanalyzeHistoricalTransactions(userId: number, historicalTransactions: Transaction[]) {
    return this.fraudDetectionService.reanalyzeHistoricalTransactions(userId, historicalTransactions);
  }

  private applyProfileAdjustments(result: any, transaction: Transaction, user: any): any {
    if (!user?.spendingProfile) {
      return result;
    }

    const spendingProfile = JSON.parse(user.spendingProfile);
    if (!spendingProfile.currentSituation) {
      return result;
    }

    let adjustedScore = result.suspiciousScore;
    const adjustmentReasons = [];

    // Hospital situation adjustments
    if (spendingProfile.currentSituation === 'hospital') {
      if (['medical', 'pharmacy', 'food_delivery'].includes(transaction.category)) {
        adjustedScore = Math.max(0, adjustedScore - 30);
        adjustmentReasons.push('Expected medical/pharmacy spending during hospital stay');
      }
      if (['grocery', 'gas_station', 'retail'].includes(transaction.category)) {
        adjustedScore = Math.min(100, adjustedScore + 20);
        adjustmentReasons.push('Unusual non-medical spending during hospital stay');
      }
    }

    // Travel situation adjustments
    if (spendingProfile.currentSituation === 'travel') {
      if (['restaurants', 'hotels', 'transportation', 'entertainment'].includes(transaction.category)) {
        adjustedScore = Math.max(0, adjustedScore - 25);
        adjustmentReasons.push('Expected travel-related spending');
      }
      const amount = Math.abs(parseFloat(transaction.amount.toString()));
      if (amount > 200) {
        adjustedScore = Math.max(0, adjustedScore - 15);
        adjustmentReasons.push('Higher spending amounts expected during travel');
      }
    }

    // Recovery situation adjustments
    if (spendingProfile.currentSituation === 'recovery') {
      if (['medical', 'pharmacy', 'home_services', 'food_delivery'].includes(transaction.category)) {
        adjustedScore = Math.max(0, adjustedScore - 20);
        adjustmentReasons.push('Expected recovery-related spending');
      }
    }

    return {
      ...result,
      suspiciousScore: adjustedScore,
      isAnomaly: adjustedScore > 70,
      profileAdjustments: adjustmentReasons,
      originalScore: result.suspiciousScore
    };
  }

  // Analyze a batch of transactions (useful for background processing)
  async analyzeTransactions(transactions: Transaction[]): Promise<Map<number, any>> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results = new Map<number, any>();
    
    for (const transaction of transactions) {
      const result = await this.analyzeTransaction(transaction, transaction.accountId);
      results.set(transaction.id, result);
    }

    return results;
  }
}

// Export singleton instance
export const mlService = new MLService();