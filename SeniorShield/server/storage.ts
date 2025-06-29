import { 
  users, accounts, transactions, alerts, familyMembers, bills, situations, authTokens,
  type User, type InsertUser, 
  type Account, type InsertAccount,
  type Transaction, type InsertTransaction,
  type Alert, type InsertAlert,
  type FamilyMember, type InsertFamilyMember,
  type Bill, type InsertBill,
  type Situation, type InsertSituation,
  type AuthToken, type InsertAuthToken
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Auth token operations
  createAuthToken(token: InsertAuthToken): Promise<AuthToken>;
  getAuthToken(token: string): Promise<AuthToken | undefined>;
  markAuthTokenUsed(token: string): Promise<AuthToken | undefined>;
  deleteAuthToken(token: string): Promise<boolean>;

  // Account operations
  getAccountsByUserId(userId: number): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  getAccountByYodleeId(yodleeId: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined>;
  updateAccountBalance(id: number, balance: string): Promise<Account | undefined>;

  // Transaction operations
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionsByAccountId(accountId: number, userId: number): Promise<Transaction[]>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  getRecentTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionByYodleeId(yodleeId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined>;

  // Alert operations
  getAlertsByUserId(userId: number): Promise<Alert[]>;
  getUnreadAlerts(userId: number): Promise<Alert[]>;
  getAlertById(id: number): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: number): Promise<Alert | undefined>;
  markAlertAsResolved(id: number): Promise<Alert | undefined>;

  // Family member operations
  getFamilyMembersByUserId(userId: number): Promise<FamilyMember[]>;
  getFamilyMember(id: number): Promise<FamilyMember | undefined>;
  createFamilyMember(familyMember: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: number, updates: Partial<FamilyMember>): Promise<FamilyMember | undefined>;
  deleteFamilyMember(id: number): Promise<boolean>;

  // Bill operations
  getBillsByUserId(userId: number): Promise<Bill[]>;
  getUpcomingBills(userId: number, days?: number): Promise<Bill[]>;
  createBill(bill: InsertBill): Promise<Bill>;

  // Situation operations
  getSituationsByUserId(userId: number): Promise<Situation[]>;
  getActiveSituationsByUserId(userId: number): Promise<Situation[]>;
  getSituation(id: number): Promise<Situation | undefined>;
  createSituation(situation: InsertSituation): Promise<Situation>;
  updateSituation(id: number, updates: Partial<Situation>): Promise<Situation | undefined>;
  deleteSituation(id: number): Promise<boolean>;
  getSituationsNeedingReminders(): Promise<Situation[]>;


}

import fs from 'fs';
import path from 'path';

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private transactions: Map<number, Transaction>;
  private alerts: Map<number, Alert>;
  private familyMembers: Map<number, FamilyMember>;
  private bills: Map<number, Bill>;
  private situations: Map<number, Situation>;
  private authTokens: Map<string, AuthToken>;
  private currentId: number;
  private dataFile: string;

  constructor() {
    this.dataFile = path.join(process.cwd(), 'data.json');
    this.users = new Map();
    this.accounts = new Map();
    this.transactions = new Map();
    this.alerts = new Map();
    this.familyMembers = new Map();
    this.bills = new Map();
    this.situations = new Map();
    this.authTokens = new Map();
    this.currentId = 1;

    // Load existing data or initialize with mock data
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        
        // Restore data from file
        this.currentId = data.currentId || 1;
        
        if (data.users) {
          data.users.forEach((user: any) => {
            this.users.set(user.id, { ...user, createdAt: new Date(user.createdAt) });
          });
        }
        
        if (data.accounts) {
          data.accounts.forEach((account: any) => {
            this.accounts.set(account.id, { ...account, createdAt: new Date(account.createdAt) });
          });
        }
        
        if (data.transactions) {
          data.transactions.forEach((transaction: any) => {
            this.transactions.set(transaction.id, { 
              ...transaction, 
              createdAt: new Date(transaction.createdAt),
              transactionDate: new Date(transaction.transactionDate)
            });
          });
        }
        
        if (data.alerts) {
          data.alerts.forEach((alert: any) => {
            this.alerts.set(alert.id, { ...alert, createdAt: new Date(alert.createdAt) });
          });
        }
        
        if (data.familyMembers) {
          data.familyMembers.forEach((member: any) => {
            this.familyMembers.set(member.id, { ...member, createdAt: new Date(member.createdAt) });
          });
        }
        
        console.log('Data loaded from file');
      } else {
        console.log('No existing data file found, starting with empty data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      console.log('Starting with empty data due to error');
    }
  }

  private saveData() {
    try {
      const data = {
        currentId: this.currentId,
        users: Array.from(this.users.values()),
        accounts: Array.from(this.accounts.values()),
        transactions: Array.from(this.transactions.values()),
        alerts: Array.from(this.alerts.values()),
        familyMembers: Array.from(this.familyMembers.values()),
        bills: Array.from(this.bills.values())
      };
      
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private initializeMockData() {
    // No demo data initialization
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      Object.assign(user, updates);
      this.users.set(id, user);
    }
    return user;
  }

  // Auth token operations
  async createAuthToken(insertToken: InsertAuthToken): Promise<AuthToken> {
    const token: AuthToken = { ...insertToken, createdAt: new Date() };
    this.authTokens.set(token.token, token);
    return token;
  }

  async getAuthToken(token: string): Promise<AuthToken | undefined> {
    return this.authTokens.get(token);
  }

  async markAuthTokenUsed(token: string): Promise<AuthToken | undefined> {
    const authToken = this.authTokens.get(token);
    if (authToken) {
      authToken.usedAt = new Date();
      this.authTokens.set(token, authToken);
    }
    return authToken;
  }

  async deleteAuthToken(token: string): Promise<boolean> {
    return this.authTokens.delete(token);
  }

  // Account operations
  async getAccountsByUserId(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(account => account.userId === userId);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async verifyAccountOwnership(accountId: number, userId: number): Promise<boolean> {
    const account = await this.getAccount(accountId);
    return account?.userId === userId;
  }

  async getAccountByYodleeId(yodleeId: string): Promise<Account | undefined> {
    return Array.from(this.accounts.values()).find(account => account.yodleeAccountId === yodleeId);
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.currentId++;
    const account: Account = { ...insertAccount, id, createdAt: new Date() };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (account) {
      Object.assign(account, updates);
      this.accounts.set(id, account);
    }
    return account;
  }

  async updateAccountBalance(id: number, balance: string): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (account) {
      account.balance = balance;
      this.accounts.set(id, account);
    }
    return account;
  }

  // Transaction operations
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());
  }

  async getTransactionsByAccountId(accountId: number, userId: number): Promise<Transaction[]> {
    // First verify account ownership
    const isOwner = await this.verifyAccountOwnership(accountId, userId);
    if (!isOwner) {
      return [];
    }

    return Array.from(this.transactions.values())
      .filter(transaction => transaction.accountId === accountId)
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    const userAccounts = await this.getAccountsByUserId(userId);
    const accountIds = userAccounts.map(account => account.id);
    
    return Array.from(this.transactions.values())
      .filter(transaction => accountIds.includes(transaction.accountId))
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
  }

  async getRecentTransactions(userId: number, limit: number = 10): Promise<Transaction[]> {
    const transactions = await this.getTransactionsByUserId(userId);
    return transactions.slice(0, limit);
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByYodleeId(yodleeId: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      transaction => transaction.yodleeTransactionId === yodleeId
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentId++;
    const transaction: Transaction = { ...insertTransaction, id, createdAt: new Date() };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (transaction) {
      Object.assign(transaction, updates);
      this.transactions.set(id, transaction);
    }
    return transaction;
  }

  // Alert operations
  async getAlertsByUserId(userId: number): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(alert => alert.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getUnreadAlerts(userId: number): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(alert => alert.userId === userId && !alert.isRead)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getAlertById(id: number): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.currentId++;
    const alert: Alert = { ...insertAlert, id, createdAt: new Date() };
    this.alerts.set(id, alert);
    return alert;
  }

  async markAlertAsRead(id: number): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.isRead = true;
      this.alerts.set(id, alert);
    }
    return alert;
  }

  async markAlertAsResolved(id: number): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.isResolved = true;
      this.alerts.set(id, alert);
    }
    return alert;
  }

  // Family member operations
  async getFamilyMembersByUserId(userId: number): Promise<FamilyMember[]> {
    return Array.from(this.familyMembers.values()).filter(member => member.userId === userId);
  }

  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    return this.familyMembers.get(id);
  }

  async createFamilyMember(insertFamilyMember: InsertFamilyMember): Promise<FamilyMember> {
    const id = this.currentId++;
    const familyMember: FamilyMember = { 
      ...insertFamilyMember, 
      id, 
      createdAt: new Date(),
      phoneNumber: insertFamilyMember.phoneNumber || null,
      receiveAlerts: insertFamilyMember.receiveAlerts ?? true,
      alertTypes: insertFamilyMember.alertTypes || []
    };
    this.familyMembers.set(id, familyMember);
    return familyMember;
  }

  async updateFamilyMember(id: number, updates: Partial<FamilyMember>): Promise<FamilyMember | undefined> {
    const familyMember = this.familyMembers.get(id);
    if (familyMember) {
      Object.assign(familyMember, updates);
      this.familyMembers.set(id, familyMember);
    }
    return familyMember;
  }

  async deleteFamilyMember(id: number): Promise<boolean> {
    return this.familyMembers.delete(id);
  }

  // Bill operations
  async getBillsByUserId(userId: number): Promise<Bill[]> {
    return Array.from(this.bills.values()).filter(bill => bill.userId === userId);
  }

  async getUpcomingBills(userId: number, days: number = 7): Promise<Bill[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    return Array.from(this.bills.values())
      .filter(bill => bill.userId === userId && bill.dueDate <= cutoffDate && !bill.isPaid);
  }

  async createBill(insertBill: InsertBill): Promise<Bill> {
    const id = this.currentId++;
    const bill: Bill = { ...insertBill, id, createdAt: new Date() };
    this.bills.set(id, bill);
    return bill;
  }

  // Situation operations
  async getSituationsByUserId(userId: number): Promise<Situation[]> {
    return Array.from(this.situations.values()).filter(situation => situation.userId === userId);
  }

  async getActiveSituationsByUserId(userId: number): Promise<Situation[]> {
    return Array.from(this.situations.values())
      .filter(situation => situation.userId === userId && situation.isActive);
  }

  async getSituation(id: number): Promise<Situation | undefined> {
    return this.situations.get(id);
  }

  async createSituation(insertSituation: InsertSituation): Promise<Situation> {
    const id = this.currentId++;
    const situation: Situation = { ...insertSituation, id, createdAt: new Date() };
    this.situations.set(id, situation);
    return situation;
  }

  async updateSituation(id: number, updates: Partial<Situation>): Promise<Situation | undefined> {
    const situation = this.situations.get(id);
    if (situation) {
      Object.assign(situation, updates);
      this.situations.set(id, situation);
    }
    return situation;
  }

  async deleteSituation(id: number): Promise<boolean> {
    return this.situations.delete(id);
  }

  async getSituationsNeedingReminders(): Promise<Situation[]> {
    const now = new Date();
    return Array.from(this.situations.values())
      .filter(situation => {
        if (!situation.isActive) return false;
        if (!situation.lastReminderSent) return true;
        const daysSinceReminder = (now.getTime() - situation.lastReminderSent.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceReminder >= situation.reminderFrequency;
      });
  }


}

import { PostgresStorage } from './db-storage';

export const storage = new PostgresStorage();
