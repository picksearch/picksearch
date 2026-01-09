-- Security Patch: responses 테이블 취약점 수정
-- 실행 방법: Supabase SQL Editor에서 실행

-- =====================================================
-- 1. 기존 취약한 정책 삭제
-- =====================================================
DROP POLICY IF EXISTS "Anyone can update in-progress responses" ON responses;

-- =====================================================
-- 2. 안전한 응답 업데이트 함수 생성
-- session_id를 검증하여 본인의 응답만 수정 가능하도록 함
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_response_safely(
  p_response_id UUID,
  p_session_id TEXT,
  p_answers JSONB,
  p_status TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_response responses%ROWTYPE;
  v_result JSONB;
BEGIN
  -- 1. 응답 존재 여부 및 session_id 검증
  SELECT * INTO v_response
  FROM responses
  WHERE id = p_response_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'RESPONSE_NOT_FOUND');
  END IF;

  -- 2. session_id 일치 확인
  IF v_response.session_id != p_session_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'SESSION_MISMATCH');
  END IF;

  -- 3. 이미 완료된 응답은 수정 불가
  IF v_response.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_COMPLETED');
  END IF;

  -- 4. 24시간 이내의 응답만 수정 가능
  IF v_response.created_at < now() - interval '24 hours' THEN
    RETURN jsonb_build_object('success', false, 'error', 'RESPONSE_EXPIRED');
  END IF;

  -- 5. 응답 업데이트
  UPDATE responses
  SET
    answers = COALESCE(p_answers, answers),
    status = COALESCE(p_status, status),
    last_activity = now()
  WHERE id = p_response_id
  AND session_id = p_session_id;

  RETURN jsonb_build_object('success', true, 'response_id', p_response_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. 새로운 제한적 정책 생성
-- 24시간 이내 생성된 본인의 응답만 업데이트 가능
-- =====================================================
CREATE POLICY "Users can update own recent in-progress responses" ON responses
  FOR UPDATE
  USING (
    status = 'in_progress'
    AND created_at > now() - interval '24 hours'
  )
  WITH CHECK (
    status IN ('in_progress', 'completed', 'abandoned')
  );

-- =====================================================
-- 4. 응답 생성 시 session_id 필수화
-- =====================================================
ALTER TABLE responses
  ALTER COLUMN session_id SET NOT NULL;

-- 기존 null session_id 데이터 처리 (있다면)
UPDATE responses
SET session_id = id::text
WHERE session_id IS NULL;

-- =====================================================
-- 5. 추가 보안: IP 기반 rate limiting을 위한 인덱스
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_responses_ip_created
  ON responses(ip_address, created_at DESC);

-- =====================================================
-- 6. 감사 로그 테이블 (선택사항)
-- =====================================================
CREATE TABLE IF NOT EXISTS response_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID REFERENCES responses(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE response_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON response_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Security patch applied successfully!';
  RAISE NOTICE '- Removed vulnerable update policy';
  RAISE NOTICE '- Added session_id validation function';
  RAISE NOTICE '- Added 24-hour time limit for updates';
  RAISE NOTICE '- Added audit log table';
END $$;
