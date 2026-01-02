-- PickSearch Database Schema - Reset and Create
-- Run this if you get "policy already exists" errors
-- This will DROP existing policies and recreate everything

-- =====================================================
-- DROP ALL EXISTING POLICIES FIRST
-- =====================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Surveys policies
DROP POLICY IF EXISTS "Users can view own surveys" ON surveys;
DROP POLICY IF EXISTS "Users can create surveys" ON surveys;
DROP POLICY IF EXISTS "Users can update own surveys" ON surveys;
DROP POLICY IF EXISTS "Users can delete own surveys" ON surveys;
DROP POLICY IF EXISTS "Anyone can view live surveys" ON surveys;
DROP POLICY IF EXISTS "Admins can view all surveys" ON surveys;
DROP POLICY IF EXISTS "Admins can update all surveys" ON surveys;

-- Questions policies
DROP POLICY IF EXISTS "Anyone can view questions of live surveys" ON questions;
DROP POLICY IF EXISTS "Survey owners can manage questions" ON questions;
DROP POLICY IF EXISTS "Admins can manage all questions" ON questions;

-- Responses policies
DROP POLICY IF EXISTS "Anyone can create responses" ON responses;
DROP POLICY IF EXISTS "Anyone can update in-progress responses" ON responses;
DROP POLICY IF EXISTS "Survey owners can view responses" ON responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON responses;

-- Credit transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON credit_transactions;

-- Coin transactions policies
DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Admins can manage all coin transactions" ON coin_transactions;

-- Pricing configs policies
DROP POLICY IF EXISTS "Anyone can view active pricing" ON pricing_configs;
DROP POLICY IF EXISTS "Admins can manage pricing" ON pricing_configs;

-- System configs policies
DROP POLICY IF EXISTS "Anyone can view system configs" ON system_configs;
DROP POLICY IF EXISTS "Admins can manage system configs" ON system_configs;

-- Support tickets policies
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON support_tickets;

-- FAQs policies
DROP POLICY IF EXISTS "Anyone can view active FAQs" ON faqs;
DROP POLICY IF EXISTS "Admins can manage FAQs" ON faqs;

-- SEO settings policies
DROP POLICY IF EXISTS "Anyone can view SEO settings" ON seo_settings;
DROP POLICY IF EXISTS "Admins can manage SEO settings" ON seo_settings;

-- Customer memos policies
DROP POLICY IF EXISTS "Admins can manage customer memos" ON customer_memos;

-- =====================================================
-- DROP EXISTING TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
DROP TRIGGER IF EXISTS update_credit_transactions_updated_at ON credit_transactions;
DROP TRIGGER IF EXISTS update_pricing_configs_updated_at ON pricing_configs;
DROP TRIGGER IF EXISTS update_system_configs_updated_at ON system_configs;
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
DROP TRIGGER IF EXISTS update_seo_settings_updated_at ON seo_settings;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =====================================================
-- NOW RUN THE ORIGINAL SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  custom_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  referred_by TEXT,
  refund_bank_name TEXT,
  refund_account_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. SURVEYS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'review', 'live', 'scheduled', 'closed', 'rejected')),
  survey_type TEXT DEFAULT 'paid' CHECK (survey_type IN ('free', 'paid')),
  secret_key TEXT UNIQUE,
  completion_secret_code TEXT,
  target_participants INTEGER,
  completed_responses INTEGER DEFAULT 0,
  in_progress_count INTEGER DEFAULT 0,
  creator_name TEXT,
  target_persona TEXT,
  target_options JSONB,
  landing_enabled BOOLEAN DEFAULT false,
  landing_title TEXT,
  landing_description TEXT,
  landing_image_url TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'multiple_choice', 'short_answer', 'multiple_select', 'ranking',
    'choice_with_other', 'numeric_rating', 'likert_scale',
    'image_choice', 'image_banner'
  )),
  options JSONB,
  image_urls JSONB,
  "order" INTEGER DEFAULT 0,
  parent_question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  parent_branch_option TEXT,
  branch_end_type TEXT CHECK (branch_end_type IN ('continue', 'end_survey', NULL)),
  branch_targets JSONB,
  max_selections INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. RESPONSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  session_id TEXT,
  ip_address TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  answers JSONB,
  secret_code TEXT,
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. CREDIT TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'refund', 'usage')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  depositor_name TEXT,
  proof_type TEXT,
  proof_image_url TEXT,
  company_name TEXT,
  company_registration_number TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. COIN TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'referral_bonus', 'referred_bonus', 'monthly_bonus', 'admin_grant', 'usage'
  )),
  description TEXT,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. PRICING CONFIGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pricing_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price_per_response INTEGER NOT NULL,
  min_responses INTEGER DEFAULT 1,
  max_responses INTEGER,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 8. SYSTEM CONFIGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 9. SUPPORT TICKETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 10. FAQS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 11. SEO SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  og_image_url TEXT,
  keywords TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 12. CUSTOMER MEMOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_memos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  memo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_secret_key ON surveys(secret_key);
CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_questions_parent_id ON questions(parent_question_id);
CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);
CREATE INDEX IF NOT EXISTS idx_responses_ip ON responses(ip_address);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_memos_user_id ON customer_memos(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_memos ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SURVEYS policies
CREATE POLICY "Users can view own surveys" ON surveys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create surveys" ON surveys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own surveys" ON surveys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own surveys" ON surveys
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view live surveys" ON surveys
  FOR SELECT USING (status = 'live');

CREATE POLICY "Admins can view all surveys" ON surveys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all surveys" ON surveys
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- QUESTIONS policies
CREATE POLICY "Anyone can view questions of live surveys" ON questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = questions.survey_id AND surveys.status = 'live')
  );

CREATE POLICY "Survey owners can manage questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = questions.survey_id AND surveys.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all questions" ON questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RESPONSES policies (allow anonymous responses)
CREATE POLICY "Anyone can create responses" ON responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update in-progress responses" ON responses
  FOR UPDATE USING (status = 'in_progress');

CREATE POLICY "Survey owners can view responses" ON responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = responses.survey_id AND surveys.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all responses" ON responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- CREDIT_TRANSACTIONS policies
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions" ON credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON credit_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- COIN_TRANSACTIONS policies
CREATE POLICY "Users can view own coin transactions" ON coin_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all coin transactions" ON coin_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- PRICING_CONFIGS policies (read-only for users)
CREATE POLICY "Anyone can view active pricing" ON pricing_configs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage pricing" ON pricing_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SYSTEM_CONFIGS policies
CREATE POLICY "Anyone can view system configs" ON system_configs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage system configs" ON system_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SUPPORT_TICKETS policies
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- FAQS policies
CREATE POLICY "Anyone can view active FAQs" ON faqs
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage FAQs" ON faqs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- SEO_SETTINGS policies
CREATE POLICY "Anyone can view SEO settings" ON seo_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage SEO settings" ON seo_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- CUSTOMER_MEMOS policies
CREATE POLICY "Admins can manage customer memos" ON customer_memos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_credit_transactions_updated_at BEFORE UPDATE ON credit_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pricing_configs_updated_at BEFORE UPDATE ON pricing_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_seo_settings_updated_at BEFORE UPDATE ON seo_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
