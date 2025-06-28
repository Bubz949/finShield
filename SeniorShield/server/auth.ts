import { randomBytes, createHash } from "crypto";
import { authenticator } from "otplib";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { InsertUser, User } from "../shared/schema";
import nodemailer from "nodemailer";

// Ensure required environment variables are present
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET environment variable is required");
  process.exit(1);
}

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error("SMTP configuration environment variables are required");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes
const EMAIL_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Secure email configuration with TLS
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    minVersion: 'TLSv1.2',
    ciphers: 'HIGH:MEDIUM:!aNULL:!MD5:!RC4'
  }
});

// Track login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export async function hashPassword(password: string): Promise<string> {
  // Use a stronger work factor (12-14 is recommended for production)
  return bcrypt.hash(password, 14);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: number, expiresIn: string = "1d"): string {
  return jwt.sign(
    { 
      userId,
      iat: Math.floor(Date.now() / 1000)
    }, 
    JWT_SECRET, 
    { 
      expiresIn,
      algorithm: 'HS512' // Use a stronger algorithm
    }
  );
}

export function checkLoginAttempts(identifier: string): boolean {
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    loginAttempts.set(identifier, { count: 0, lastAttempt: Date.now() });
    return true;
  }

  // Reset attempts if lockout time has passed
  if (Date.now() - attempts.lastAttempt > LOGIN_LOCKOUT_TIME) {
    loginAttempts.set(identifier, { count: 0, lastAttempt: Date.now() });
    return true;
  }

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }

  attempts.count++;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(identifier, attempts);
  return true;
}

export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

export async function createMagicLink(email: string): Promise<string> {
  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY);

  await storage.createAuthToken({
    userId: user.id,
    token: token,
    type: "magic_link",
    expiresAt
  });

  const magicLink = `${process.env.APP_URL}/api/auth/verify-magic-link?token=${token}`;
  
  await emailTransporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Your Secure Login Link - Nuvanta",
    text: `Click here to log in: ${magicLink}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuvanta Login</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Nuvanta</h1>
                  <p style="color: #e8eaff; margin: 10px 0 0 0; font-size: 16px;">Financial Security Platform</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Secure Login Request</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    You requested a secure login link for your Nuvanta account. Click the button below to access your dashboard safely.
                  </p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${magicLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">Access My Account</a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #888888; font-size: 14px; line-height: 1.5; margin: 25px 0 0 0;">
                    This link will expire in 15 minutes for your security. If you didn't request this login, please ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 25px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center;">
                        <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                          © 2024 Nuvanta. Protecting your financial future.
                        </p>
                        <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                          This is an automated message. Please do not reply to this email.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`
  });

  return token;
}

export async function verifyMagicLink(token: string): Promise<User | null> {
  const authToken = await storage.getAuthToken(token);
  
  if (!authToken || 
      authToken.type !== "magic_link" || 
      authToken.usedAt || 
      authToken.expiresAt < new Date()) {
    return null;
  }

  await storage.markAuthTokenUsed(token);
  return storage.getUser(authToken.userId);
}

export async function setup2FA(userId: number): Promise<string> {
  const secret = authenticator.generateSecret();
  await storage.updateUser(userId, { 
    twoFactorSecret: secret,
    twoFactorEnabled: false // Will be enabled after verification
  });
  
  return secret;
}

export function generate2FAQRCode(email: string, secret: string): string {
  const serviceName = "YourApp";
  return authenticator.keyuri(email, serviceName, secret);
}

export async function verify2FAToken(userId: number, token: string): Promise<boolean> {
  const user = await storage.getUser(userId);
  if (!user?.twoFactorSecret) return false;

  return authenticator.verify({
    token,
    secret: user.twoFactorSecret
  });
}

export async function enable2FA(userId: number, token: string): Promise<boolean> {
  const isValid = await verify2FAToken(userId, token);
  if (!isValid) return false;

  await storage.updateUser(userId, { twoFactorEnabled: true });
  return true;
}

export async function createEmailVerificationToken(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY);

  await storage.createAuthToken({
    userId,
    token,
    type: "email_verification",
    expiresAt
  });

  return token;
}

export async function verifyEmail(token: string): Promise<boolean> {
  const authToken = await storage.getAuthToken(token);
  
  if (!authToken || 
      authToken.type !== "email_verification" || 
      authToken.usedAt || 
      authToken.expiresAt < new Date()) {
    return false;
  }

  await storage.markAuthTokenUsed(token);
  await storage.updateUser(authToken.userId, { emailVerified: true });
  return true;
}

export async function generateBackupCodes(userId: number): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = randomBytes(4).toString("hex");
    codes.push(code);
    
    // Store hashed backup codes
    const hashedCode = createHash("sha256").update(code).digest("hex");
    await storage.createAuthToken({
      userId,
      token: hashedCode,
      type: "2fa_backup",
      expiresAt: new Date("2100-01-01") // Effectively never expires
    });
  }
  
  return codes;
}

export async function verifyBackupCode(userId: number, code: string): Promise<boolean> {
  const hashedCode = createHash("sha256").update(code).digest("hex");
  const authToken = await storage.getAuthToken(hashedCode);
  
  if (!authToken || 
      authToken.type !== "2fa_backup" || 
      authToken.usedAt || 
      authToken.userId !== userId) {
    return false;
  }

  await storage.markAuthTokenUsed(hashedCode);
  return true;
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

  await storage.createAuthToken({
    userId: user.id,
    token: token,
    type: "password_reset",
    expiresAt
  });

  const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;
  
  await emailTransporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Reset Your Password - Nuvanta",
    text: `Click here to reset your password: ${resetLink}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password - Nuvanta</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Nuvanta</h1>
                  <p style="color: #e8eaff; margin: 10px 0 0 0; font-size: 16px;">Financial Security Platform</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    You requested to reset your password for your Nuvanta account. Click the button below to create a new password.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">Reset Password</a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #888888; font-size: 14px; line-height: 1.5; margin: 25px 0 0 0;">
                    This link will expire in 1 hour for your security. If you didn't request this reset, please ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f8f9fa; padding: 25px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center;">
                        <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                          © 2024 Nuvanta. Protecting your financial future.
                        </p>
                        <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                          This is an automated message. Please do not reply to this email.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`
  });

  return token;
}

export async function verifyPasswordResetToken(token: string, newPassword: string): Promise<User | null> {
  const authToken = await storage.getAuthToken(token);
  
  if (!authToken || 
      authToken.type !== "password_reset" || 
      authToken.usedAt || 
      authToken.expiresAt < new Date()) {
    return null;
  }

  const hashedPassword = await hashPassword(newPassword);
  const user = await storage.updateUser(authToken.userId, { password: hashedPassword });
  
  if (user) {
    await storage.markAuthTokenUsed(token);
  }
  
  return user;
}