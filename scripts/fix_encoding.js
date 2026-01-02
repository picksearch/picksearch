import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixEncodingIssues() {
  console.log('=== 인코딩 오류 수정 스크립트 ===\n');

  // 1. API Test Survey 조회
  const { data: surveys, error } = await supabase
    .from('surveys')
    .select('id, title, survey_purpose, target_options')
    .eq('title', 'API Test Survey');

  if (error) {
    console.error('조회 실패:', error);
    return;
  }

  console.log(`API Test Survey ${surveys.length}개 발견\n`);

  for (const survey of surveys) {
    console.log(`ID: ${survey.id}`);
    console.log(`현재 survey_purpose: ${survey.survey_purpose}`);
    console.log(`현재 target_options:`, JSON.stringify(survey.target_options, null, 2));

    // 깨진 데이터 수정
    const { error: updateError } = await supabase
      .from('surveys')
      .update({
        survey_purpose: '20-40대 직장인 대상 서비스 만족도 조사',
        target_options: {
          gender: ['male', 'female'],
          age_range: { min: 20, max: 49 },
          regions: ['서울', '경기', '인천'],
          occupation: ['office_worker']
        }
      })
      .eq('id', survey.id);

    if (updateError) {
      console.log(`[실패] ${updateError.message}`);
    } else {
      console.log(`[성공] 데이터 수정 완료`);
    }
    console.log('');
  }

  // 검증
  const { data: fixed } = await supabase
    .from('surveys')
    .select('id, title, survey_purpose, target_options')
    .eq('title', 'API Test Survey');

  console.log('=== 수정 후 확인 ===');
  for (const s of fixed) {
    console.log(`survey_purpose: ${s.survey_purpose}`);
    console.log(`target_options:`, JSON.stringify(s.target_options, null, 2));
  }
}

fixEncodingIssues().catch(console.error);
