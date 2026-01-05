-- Survey Categories 테이블 추가
-- Supabase SQL Editor에서 실행하세요

-- 테이블 생성
CREATE TABLE IF NOT EXISTS survey_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_survey_categories_user_id ON survey_categories(user_id);

-- RLS 활성화
ALTER TABLE survey_categories ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own categories" ON survey_categories;
DROP POLICY IF EXISTS "Users can create categories" ON survey_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON survey_categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON survey_categories;
DROP POLICY IF EXISTS "Admins can manage all categories" ON survey_categories;

-- RLS 정책 생성
CREATE POLICY "Users can view own categories" ON survey_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create categories" ON survey_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON survey_categories
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all categories" ON survey_categories
  FOR SELECT USING (
    public.is_admin()
  );

CREATE POLICY "Admins can manage all categories" ON survey_categories
  FOR ALL USING (
    public.is_admin()
  );
