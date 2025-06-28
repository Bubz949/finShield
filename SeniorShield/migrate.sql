-- Create tables for FinShield application

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    two_factor_secret TEXT,
    two_factor_enabled BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    profile_completed BOOLEAN DEFAULT false,
    living_profile TEXT,
    spending_profile TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Auth tokens table
CREATE TABLE IF NOT EXISTS auth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    account_number TEXT NOT NULL,
    balance DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    bank_name TEXT,
    bank_phone TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    yodlee_account_id TEXT UNIQUE,
    yodlee_provider_name TEXT,
    yodlee_last_update TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    merchant TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP NOT NULL,
    is_spending BOOLEAN DEFAULT true,
    suspicious_score INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT false,
    review_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    yodlee_transaction_id TEXT UNIQUE,
    yodlee_base_type TEXT,
    yodlee_category_type TEXT,
    yodlee_status TEXT
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    transaction_id INTEGER,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Family members table
CREATE TABLE IF NOT EXISTS family_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT,
    receive_alerts BOOLEAN DEFAULT true,
    alert_types TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    bill_name TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    frequency TEXT NOT NULL,
    category TEXT NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    is_recurring BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert demo user if not exists
INSERT INTO users (username, email, password, full_name, phone_number, profile_completed, living_profile, spending_profile)
SELECT 'mary.johnson', 'mary.johnson@email.com', 'password123', 'Mary Johnson', '(555) 123-4567', true,
       '["I live alone in my own home", "I manage most things myself but my daughter helps with technology", "I have a medical alert system", "I am comfortable with basic technology but avoid complex online tasks"]',
       '["I mostly shop at local stores and pay with cash or debit card", "My largest expenses are groceries, utilities, and medical costs", "I prefer to pay bills in person or by phone", "Any online purchase over $100 would be unusual for me"]'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'mary.johnson');