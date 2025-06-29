-- Add situations table for tracking user life circumstances
CREATE TABLE IF NOT EXISTS situations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  situation_type TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  expected_end_date TIMESTAMP,
  actual_end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  spending_expectations TEXT, -- JSON string
  reminder_frequency INTEGER DEFAULT 7, -- days
  last_reminder_sent TIMESTAMP,
  ai_learning_data TEXT, -- JSON string for ML context
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_situations_user_active ON situations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_situations_reminders ON situations(is_active, last_reminder_sent, reminder_frequency);

-- Add new alert type for situation reminders
-- (This assumes the alerts table already exists)
-- No schema change needed as alert_type is already a text field