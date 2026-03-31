-- database/schema.sql
-- Run this in your Supabase SQL editor to create the required tables

-- Table to store QuickBooks OAuth tokens
CREATE TABLE IF NOT EXISTS qb_tokens (
  id BIGSERIAL PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  realm_id VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to prevent duplicate connections per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_qb_tokens_customer_email 
ON qb_tokens(customer_email);

-- Create index for fast realm_id lookups
CREATE INDEX IF NOT EXISTS idx_qb_tokens_realm_id 
ON qb_tokens(realm_id);

-- Table to store customer information
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  business_name VARCHAR(255),
  industry VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store AI preferences
CREATE TABLE IF NOT EXISTS ai_preferences (
  id BIGSERIAL PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL REFERENCES customers(email),
  report_frequency VARCHAR(20) DEFAULT 'weekly', -- daily, weekly, monthly
  preferred_metrics TEXT[], -- array of metric names
  alert_threshold_percentage INTEGER DEFAULT 10,
  communication_style VARCHAR(20) DEFAULT 'professional', -- casual, professional, technical
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for AI preferences
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_preferences_customer_email 
ON ai_preferences(customer_email);

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE qb_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (customize based on your authentication system)

-- Policy for qb_tokens: Only allow access to own tokens
CREATE POLICY "Users can only access their own QB tokens" ON qb_tokens
  FOR ALL USING (customer_email = current_user_email());

-- Policy for customers: Only allow access to own customer record
CREATE POLICY "Users can only access their own customer record" ON customers
  FOR ALL USING (email = current_user_email());

-- Policy for ai_preferences: Only allow access to own preferences
CREATE POLICY "Users can only access their own AI preferences" ON ai_preferences
  FOR ALL USING (customer_email = current_user_email());

-- Helper function to get current user email (customize for your auth system)
-- This is a placeholder - replace with your actual user identification logic
CREATE OR REPLACE FUNCTION current_user_email()
RETURNS TEXT AS $$
BEGIN
  -- For demo purposes, return a placeholder
  -- In production, this should extract email from JWT or session
  RETURN 'demo@example.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_qb_tokens_updated_at 
  BEFORE UPDATE ON qb_tokens 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_preferences_updated_at 
  BEFORE UPDATE ON ai_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo customer for testing
INSERT INTO customers (email, business_name, industry) 
VALUES ('demo@example.com', 'Demo Business LLC', 'Professional Services')
ON CONFLICT (email) DO NOTHING;

-- Insert demo AI preferences
INSERT INTO ai_preferences (customer_email, report_frequency, preferred_metrics, communication_style)
VALUES (
  'demo@example.com', 
  'weekly', 
  ARRAY['revenue', 'expenses', 'profit_margin', 'cash_flow'],
  'professional'
) ON CONFLICT (customer_email) DO NOTHING;
