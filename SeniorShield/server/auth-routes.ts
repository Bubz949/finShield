import { Router } from "express";
import { storage } from "./storage";
import { 
  hashPassword, 
  verifyPassword, 
  generateToken
} from "./auth";
import { z } from "zod";

const router = Router();

// Debug route
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes working" });
});

// Validation schemas
const passwordSchema = z.string()
  .min(12, "Password must be at least 12 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const registerSchema = z.object({
  username: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  email: z.string().email(),
  password: passwordSchema.optional(), // Optional for magic link users
  fullName: z.string().min(2).max(100),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional()
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

const magicLinkSchema = z.object({
  email: z.string().email()
});

const verifyTokenSchema = z.object({
  token: z.string()
});

const setup2FASchema = z.object({
  token: z.string()
});

// Register new user
router.post("/register", async (req, res) => {
  try {
    console.log("Register request body:", req.body);
    const { username, email, password, fullName } = req.body;
    
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("Hashing password...");
    // Hash password
    const hashedPassword = await hashPassword(password);
    console.log("Password hashed successfully");

    console.log("Creating user...");
    // Create user
    const user = await storage.createUser({
      username,
      email,
      password: hashedPassword,
      fullName,
      emailVerified: true // Skip email verification for now
    });
    console.log("User created:", user.id);

    console.log("Generating token...");
    // Generate auth token
    const token = generateToken(user.id);
    console.log("Token generated");

    res.status(201).json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Login with username/password
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await storage.getUserByUsername(username);
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id);
    
    res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Request magic link
router.post("/magic-link", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // For now, just return success (magic link functionality can be implemented later)
    res.json({ message: "If an account exists, a magic link has been sent" });
  } catch (error) {
    console.error("Magic link error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



export const authRoutes = router;