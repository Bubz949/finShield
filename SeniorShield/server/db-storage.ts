import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, desc, and, lte } from 'drizzle-orm';
import { 
  users, accounts, transactions, alerts, familyMembers, bills, authTokens,
  type User, type InsertUser, 
  type Account, type InsertAccount,
  type Transaction, type InsertTransaction,
  type Alert, type InsertAlert,
  type FamilyMember, type InsertFamilyMember,
  type Bill, type InsertBill,
  type AuthToken, type InsertAuthToken
} from "@shared/schema";
import { IStorage } from "./storage";

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

export class PostgresStorage implements IStorage {
  constructor() {
    // Database connection is handled by drizzle
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Auth token operations
  async createAuthToken(insertToken: InsertAuthToken): Promise<AuthToken> {
    const result = await db.insert(authTokens).values(insertToken).returning();
    return result[0];
  }

  async getAuthToken(token: string): Promise<AuthToken | undefined> {
    const result = await db.select().from(authTokens).where(eq(authTokens.token, token)).limit(1);
    return result[0];
  }

  async markAuthTokenUsed(token: string): Promise<AuthToken | undefined> {
    const result = await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.token, token)).returning();
    return result[0];
  }

  async deleteAuthToken(token: string): Promise<boolean> {
    const result = await db.delete(authTokens).where(eq(authTokens.token, token));
    return result.rowCount > 0;
  }

  // Account operations
  async getAccountsByUserId(userId: number): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const result = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
    return result[0];
  }

  async getAccountByYodleeId(yodleeId: string): Promise<Account | undefined> {
    const result = await db.select().from(accounts).where(eq(accounts.yodleeAccountId, yodleeId)).limit(1);
    return result[0];
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const result = await db.insert(accounts).values(insertAccount).returning();
    return result[0];
  }

  async updateAccount(id: number, updates: Partial<Account>): Promise<Account | undefined> {
    const result = await db.update(accounts).set(updates).where(eq(accounts.id, id)).returning();
    return result[0];
  }

  async updateAccountBalance(id: number, balance: string): Promise<Account | undefined> {
    const result = await db.update(accounts).set({ balance }).where(eq(accounts.id, id)).returning();
    return result[0];
  }

  // Transaction operations
  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.transactionDate));
  }

  async getTransactionsByAccountId(accountId: number, userId: number): Promise<Transaction[]> {
    // Verify account ownership first
    const account = await this.getAccount(accountId);
    if (!account || account.userId !== userId) {
      return [];
    }
    return await db.select().from(transactions).where(eq(transactions.accountId, accountId)).orderBy(desc(transactions.transactionDate));
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    const userAccounts = await this.getAccountsByUserId(userId);
    const accountIds = userAccounts.map(account => account.id);
    
    if (accountIds.length === 0) return [];
    
    return await db.select().from(transactions)
      .where(eq(transactions.accountId, accountIds[0])) // Simplified for now
      .orderBy(desc(transactions.transactionDate));
  }

  async getRecentTransactions(userId: number, limit: number = 10): Promise<Transaction[]> {
    const userTransactions = await this.getTransactionsByUserId(userId);
    return userTransactions.slice(0, limit);
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0];
  }

  async getTransactionByYodleeId(yodleeId: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.yodleeTransactionId, yodleeId)).limit(1);
    return result[0];
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(insertTransaction).returning();
    return result[0];
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const result = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();
    return result[0];
  }

  // Alert operations
  async getAlertsByUserId(userId: number): Promise<Alert[]> {
    return await db.select().from(alerts).where(eq(alerts.userId, userId)).orderBy(desc(alerts.createdAt));
  }

  async getUnreadAlerts(userId: number): Promise<Alert[]> {
    return await db.select().from(alerts).where(and(eq(alerts.userId, userId), eq(alerts.isRead, false))).orderBy(desc(alerts.createdAt));
  }

  async getAlertById(id: number): Promise<Alert | undefined> {
    const result = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
    return result[0];
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const result = await db.insert(alerts).values(insertAlert).returning();
    return result[0];
  }

  async markAlertAsRead(id: number): Promise<Alert | undefined> {
    const result = await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id)).returning();
    return result[0];
  }

  async markAlertAsResolved(id: number): Promise<Alert | undefined> {
    const result = await db.update(alerts).set({ isResolved: true }).where(eq(alerts.id, id)).returning();
    return result[0];
  }

  // Family member operations
  async getFamilyMembersByUserId(userId: number): Promise<FamilyMember[]> {
    return await db.select().from(familyMembers).where(eq(familyMembers.userId, userId));
  }

  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    const result = await db.select().from(familyMembers).where(eq(familyMembers.id, id)).limit(1);
    return result[0];
  }

  async createFamilyMember(insertFamilyMember: InsertFamilyMember): Promise<FamilyMember> {
    const result = await db.insert(familyMembers).values(insertFamilyMember).returning();
    return result[0];
  }

  async updateFamilyMember(id: number, updates: Partial<FamilyMember>): Promise<FamilyMember | undefined> {
    const result = await db.update(familyMembers).set(updates).where(eq(familyMembers.id, id)).returning();
    return result[0];
  }

  async deleteFamilyMember(id: number): Promise<boolean> {
    const result = await db.delete(familyMembers).where(eq(familyMembers.id, id));
    return result.rowCount > 0;
  }

  // Bill operations
  async getBillsByUserId(userId: number): Promise<Bill[]> {
    return await db.select().from(bills).where(eq(bills.userId, userId));
  }

  async getUpcomingBills(userId: number, days: number = 7): Promise<Bill[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    return await db.select().from(bills)
      .where(and(eq(bills.userId, userId), lte(bills.dueDate, cutoffDate), eq(bills.isPaid, false)));
  }

  async createBill(insertBill: InsertBill): Promise<Bill> {
    const result = await db.insert(bills).values(insertBill).returning();
    return result[0];
  }
}