import { Transaction } from '../../shared/schema';
import * as tf from '@tensorflow/tfjs-node';
import { RandomForestClassifier } from './enhanced-models';

// Feature engineering functions
export function extractTransactionFeatures(transaction: Transaction, historicalTransactions: Transaction[]) {
  // Time-based features
  const hour = new Date(transaction.transactionDate).getHours();
  const dayOfWeek = new Date(transaction.transactionDate).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Amount-based features
  const amount = Math.abs(parseFloat(transaction.amount.toString()));
  
  // Calculate historical statistics for this merchant
  const merchantTransactions = historicalTransactions.filter(t => t.merchant === transaction.merchant);
  const merchantAvgAmount = merchantTransactions.length > 0 
    ? merchantTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0) / merchantTransactions.length 
    : 0;
  
  // Calculate historical statistics for this category
  const categoryTransactions = historicalTransactions.filter(t => t.category === transaction.category);
  const categoryAvgAmount = categoryTransactions.length > 0
    ? categoryTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0) / categoryTransactions.length
    : 0;

  // Velocity checks
  const last24Hours = historicalTransactions.filter(t => {
    const timeDiff = new Date(transaction.transactionDate).getTime() - new Date(t.transactionDate).getTime();
    return timeDiff <= 24 * 60 * 60 * 1000;
  });
  
  const transactionVelocity24h = last24Hours.length;
  const totalAmount24h = last24Hours.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount.toString())), 0);

  return {
    hour,
    isWeekend: isWeekend ? 1 : 0,
    amount,
    amountVsMerchantAvg: amount / (merchantAvgAmount || amount),
    amountVsCategoryAvg: amount / (categoryAvgAmount || amount),
    transactionVelocity24h,
    totalAmount24h,
    merchantFrequency: merchantTransactions.length / historicalTransactions.length,
    categoryFrequency: categoryTransactions.length / historicalTransactions.length,
  };
}

// Anomaly detection using neural network autoencoder
export class AnomalyDetector {
  private model: tf.LayersModel | null = null;
  private threshold: number = 0.5;

  async train(transactions: Transaction[]) {
    const features = transactions.map(t => 
      extractTransactionFeatures(t, transactions.filter(ht => 
        new Date(ht.transactionDate) < new Date(t.transactionDate)
      ))
    );

    const featureMatrix = features.map(f => Object.values(f));
    const numFeatures = featureMatrix[0].length;
    
    // Build autoencoder for anomaly detection
    const input = tf.input({shape: [numFeatures]});
    const encoded = tf.layers.dense({units: Math.floor(numFeatures / 2), activation: 'relu'}).apply(input);
    const decoded = tf.layers.dense({units: numFeatures, activation: 'linear'}).apply(encoded);
    
    this.model = tf.model({inputs: input, outputs: decoded as tf.SymbolicTensor});
    this.model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    const xs = tf.tensor2d(featureMatrix);
    await this.model.fit(xs, xs, {
      epochs: 50,
      batchSize: 32,
      verbose: 0
    });
    
    // Calculate threshold based on reconstruction errors
    const predictions = this.model.predict(xs) as tf.Tensor;
    const errors = tf.losses.meanSquaredError(xs, predictions);
    const errorData = await errors.data();
    this.threshold = Array.from(errorData).sort((a, b) => b - a)[Math.floor(errorData.length * 0.1)];
    
    xs.dispose();
    predictions.dispose();
    errors.dispose();
  }

  async detectAnomaly(transaction: Transaction, historicalTransactions: Transaction[]) {
    if (!this.model) {
      throw new Error('Model not trained');
    }

    const features = extractTransactionFeatures(transaction, historicalTransactions);
    const featureVector = Object.values(features);
    
    const xs = tf.tensor2d([featureVector]);
    const prediction = this.model.predict(xs) as tf.Tensor;
    const error = tf.losses.meanSquaredError(xs, prediction);
    const errorValue = (await error.data())[0];
    
    const score = Math.min(Math.round((errorValue / this.threshold) * 100), 100);
    
    xs.dispose();
    prediction.dispose();
    error.dispose();
    
    return {
      score,
      isAnomaly: score > 70,
      features
    };
  }
}

// Behavioral profiling
export class BehavioralProfiler {
  private userProfiles: Map<number, any> = new Map();

  updateProfile(userId: number, transactions: Transaction[]) {
    const profile = {
      typicalDayHours: new Set<number>(),
      typicalMerchants: new Set<string>(),
      typicalCategories: new Set<string>(),
      averageAmount: 0,
      transactionFrequency: 0, // transactions per day
    };

    // Calculate profile metrics
    transactions.forEach(t => {
      const hour = new Date(t.transactionDate).getHours();
      profile.typicalDayHours.add(hour);
      profile.typicalMerchants.add(t.merchant);
      profile.typicalCategories.add(t.category);
    });

    // Calculate average amount
    const totalAmount = transactions.reduce((sum, t) => 
      sum + Math.abs(parseFloat(t.amount.toString())), 0);
    profile.averageAmount = totalAmount / transactions.length;

    // Calculate transaction frequency
    const daysDiff = (new Date(transactions[transactions.length - 1].transactionDate).getTime() - 
      new Date(transactions[0].transactionDate).getTime()) / (1000 * 60 * 60 * 24);
    profile.transactionFrequency = transactions.length / (daysDiff || 1);

    this.userProfiles.set(userId, profile);
  }

  async analyzeTransaction(userId: number, transaction: Transaction): Promise<number> {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      return 0; // No profile available
    }

    let riskScore = 0;
    const hour = new Date(transaction.transactionDate).getHours();
    const amount = Math.abs(parseFloat(transaction.amount.toString()));

    // Unusual hour
    if (!profile.typicalDayHours.has(hour)) {
      riskScore += 20;
    }

    // New merchant
    if (!profile.typicalMerchants.has(transaction.merchant)) {
      riskScore += 15;
    }

    // New category
    if (!profile.typicalCategories.has(transaction.category)) {
      riskScore += 10;
    }

    // Unusual amount (more than 2x average)
    if (amount > profile.averageAmount * 2) {
      riskScore += 25;
    }

    return Math.min(riskScore, 100);
  }
}

// Fraud detection service that combines all approaches
export class FraudDetectionService {
  private anomalyDetector: AnomalyDetector;
  private behavioralProfiler: BehavioralProfiler;
  private userClassifiers: Map<number, RandomForestClassifier> = new Map();

  constructor() {
    this.anomalyDetector = new AnomalyDetector();
    this.behavioralProfiler = new BehavioralProfiler();
  }

  async initialize(historicalTransactions: Transaction[]) {
    // Train anomaly detection model
    await this.anomalyDetector.train(historicalTransactions);

    // Group transactions by user
    const userTransactions = new Map<number, Transaction[]>();
    historicalTransactions.forEach(t => {
      if (!userTransactions.has(t.accountId)) {
        userTransactions.set(t.accountId, []);
      }
      userTransactions.get(t.accountId)!.push(t);
    });

    // Initialize per-user models
    for (const [userId, transactions] of userTransactions.entries()) {
      // Build behavioral profile
      this.behavioralProfiler.updateProfile(userId, transactions);
      
      // Create and train Random Forest classifier
      const classifier = new RandomForestClassifier(userId);
      const labels = transactions.map(t => t.isFlagged);
      await classifier.train(transactions, labels);
      this.userClassifiers.set(userId, classifier);
    }
  }

  async analyzeTransaction(transaction: Transaction, userId: number, historicalTransactions: Transaction[], userProfile?: any) {
    // Get anomaly detection score
    const anomalyResult = await this.anomalyDetector.detectAnomaly(transaction, historicalTransactions);
    
    // Get behavioral analysis score
    const behavioralScore = await this.behavioralProfiler.analyzeTransaction(userId, transaction);

    // Get Random Forest classifier score
    let classifierScore = 0;
    if (this.userClassifiers.has(userId)) {
      classifierScore = await this.userClassifiers.get(userId)!.predict(transaction, historicalTransactions);
    } else {
      // Create new classifier for this user if it doesn't exist
      const classifier = new RandomForestClassifier(userId);
      await classifier.train(historicalTransactions, historicalTransactions.map(t => t.isFlagged));
      this.userClassifiers.set(userId, classifier);
      classifierScore = await classifier.predict(transaction, historicalTransactions);
    }

    // Get profile-based score
    const profileScore = this.analyzeWithProfile(transaction, userProfile);
    
    // Combine scores with weighted average including profile
    const combinedScore = Math.round(
      (anomalyResult.score * 0.3) + 
      (behavioralScore * 0.25) + 
      (classifierScore * 0.25) +
      (profileScore * 0.2)
    );

    return {
      suspiciousScore: combinedScore,
      isAnomaly: combinedScore > 70,
      anomalyScore: anomalyResult.score,
      behavioralScore,
      classifierScore,
      profileScore,
      features: anomalyResult.features
    };
  }

  private analyzeWithProfile(transaction: Transaction, userProfile?: any): number {
    if (!userProfile?.livingProfile || !userProfile?.spendingProfile) {
      return 0;
    }

    let riskScore = 0;
    const amount = Math.abs(parseFloat(transaction.amount.toString()));
    const merchant = transaction.merchant.toLowerCase();
    
    try {
      const livingAnswers = JSON.parse(userProfile.livingProfile);
      const spendingAnswers = JSON.parse(userProfile.spendingProfile);
      
      // Check for profile-based risk factors
      const avoidOnline = spendingAnswers.some((answer: string) => 
        answer.toLowerCase().includes('avoid') && answer.toLowerCase().includes('online'));
      const prefersCash = spendingAnswers.some((answer: string) => 
        answer.toLowerCase().includes('cash'));
      const livesAlone = livingAnswers.some((answer: string) => 
        answer.toLowerCase().includes('alone'));
      
      if (merchant.includes('online') && avoidOnline) riskScore += 30;
      if (amount > 100 && prefersCash) riskScore += 20;
      if (livesAlone && new Date(transaction.transactionDate).getHours() < 6) riskScore += 15;
      
    } catch (error) {
      console.error('Error parsing user profile:', error);
    }
    
    return Math.min(riskScore, 100);
  }

  // Update models with feedback and reanalyze historical transactions
  async updateModels(transaction: Transaction, userId: number, isActuallyFraud: boolean, historicalTransactions: Transaction[]) {
    // Update behavioral profile
    this.behavioralProfiler.updateProfile(userId, [...historicalTransactions, transaction]);
    
    // Update Random Forest classifier
    if (this.userClassifiers.has(userId)) {
      await this.userClassifiers.get(userId)!.updateModel(transaction, isActuallyFraud, historicalTransactions);
    }
    
    // Trigger reverse analysis of historical transactions
    await this.reanalyzeHistoricalTransactions(userId, historicalTransactions);
  }

  async reanalyzeHistoricalTransactions(userId: number, historicalTransactions: Transaction[]) {
    const storage = require('../storage').storage;
    const user = await storage.getUser(userId);
    
    for (const oldTransaction of historicalTransactions) {
      const daysSinceTransaction = (Date.now() - new Date(oldTransaction.transactionDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceTransaction < 30) continue;
      
      const priorTransactions = historicalTransactions.filter(t => 
        new Date(t.transactionDate) < new Date(oldTransaction.transactionDate)
      );
      
      const newAnalysis = await this.analyzeTransaction(oldTransaction, userId, priorTransactions, user);
      const oldScore = oldTransaction.suspiciousScore || 0;
      const scoreDifference = Math.abs(newAnalysis.suspiciousScore - oldScore);
      
      if ((newAnalysis.suspiciousScore > 70 && oldScore < 50) || scoreDifference > 30) {
        await storage.updateTransaction(oldTransaction.id, {
          suspiciousScore: newAnalysis.suspiciousScore,
          isFlagged: newAnalysis.isAnomaly
        });
        
        await storage.createAlert({
          userId,
          transactionId: oldTransaction.id,
          alertType: 'retrospective_analysis',
          severity: newAnalysis.suspiciousScore >= 90 ? 'high' : 'medium',
          title: 'Historical Transaction Flagged',
          description: `A ${Math.round(daysSinceTransaction)}-day-old transaction at ${oldTransaction.merchant} for ${oldTransaction.amount} has been retrospectively flagged as suspicious (risk score: ${newAnalysis.suspiciousScore}/100).`
        });
      }
    }
  }

  // Reverse AI analysis - reanalyze old transactions with new knowledge
  async reanalyzeHistoricalTransactions(userId: number, historicalTransactions: Transaction[]) {
    const storage = require('../storage').storage;
    const user = await storage.getUser(userId);
    
    for (const oldTransaction of historicalTransactions) {
      // Skip if transaction is too recent (less than 30 days old)
      const daysSinceTransaction = (Date.now() - new Date(oldTransaction.transactionDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceTransaction < 30) continue;
      
      // Get transactions that occurred before this old transaction for context
      const priorTransactions = historicalTransactions.filter(t => 
        new Date(t.transactionDate) < new Date(oldTransaction.transactionDate)
      );
      
      // Reanalyze with current models and knowledge
      const newAnalysis = await this.analyzeTransaction(oldTransaction, userId, priorTransactions, user);
      
      // Check if risk assessment has significantly changed
      const oldScore = oldTransaction.suspiciousScore || 0;
      const scoreDifference = Math.abs(newAnalysis.suspiciousScore - oldScore);
      
      // If transaction now looks suspicious (and wasn't before) or score increased significantly
      if ((newAnalysis.suspiciousScore > 70 && oldScore < 50) || scoreDifference > 30) {
        // Update the transaction
        await storage.updateTransaction(oldTransaction.id, {
          suspiciousScore: newAnalysis.suspiciousScore,
          isFlagged: newAnalysis.isAnomaly
        });
        
        // Create retrospective alert
        await storage.createAlert({
          userId,
          transactionId: oldTransaction.id,
          alertType: 'retrospective_analysis',
          severity: newAnalysis.suspiciousScore >= 90 ? 'high' : 'medium',
          title: 'Historical Transaction Flagged',
          description: `A ${Math.round(daysSinceTransaction)}-day-old transaction at ${oldTransaction.merchant} for ${oldTransaction.amount} has been retrospectively flagged as suspicious (risk score: ${newAnalysis.suspiciousScore}/100).`
        });
      }
    }
  }
}