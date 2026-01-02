import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateCreatorNames() {
  console.log('=== Creator Name 업데이트 스크립트 ===\n');

  // 1. 모든 설문 조회
  const { data: surveys, error: surveyError } = await supabase
    .from('surveys')
    .select('id, title, creator_name, user_id')
    .not('creator_name', 'is', null);

  if (surveyError) {
    console.error('설문 조회 실패:', surveyError);
    return;
  }

  console.log(`총 ${surveys.length}개 설문 발견\n`);

  // 2. 프로필 조회 (custom_name, full_name)
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, custom_name, email');

  if (profileError) {
    console.error('프로필 조회 실패:', profileError);
    return;
  }

  // 프로필을 id로 맵핑
  const profileMap = {};
  profiles.forEach(p => {
    profileMap[p.id] = p;
  });

  console.log('--- 현재 상태 ---');
  let updateCount = 0;
  const updates = [];

  for (const survey of surveys) {
    const profile = profileMap[survey.user_id];
    if (!profile) {
      console.log(`[SKIP] ${survey.title} - 프로필 없음`);
      continue;
    }

    const currentName = survey.creator_name;
    const shouldBe = profile.custom_name || profile.full_name || profile.email || 'Unknown';

    console.log(`[${survey.title}]`);
    console.log(`  현재 creator_name: ${currentName}`);
    console.log(`  custom_name: ${profile.custom_name || '(없음)'}`);
    console.log(`  full_name: ${profile.full_name || '(없음)'}`);

    // custom_name이 있고, creator_name이 full_name이거나 email인 경우 업데이트
    if (profile.custom_name && currentName !== profile.custom_name) {
      console.log(`  → 업데이트 필요: ${currentName} → ${profile.custom_name}`);
      updates.push({
        id: survey.id,
        newName: profile.custom_name,
        oldName: currentName,
        title: survey.title
      });
      updateCount++;
    } else {
      console.log(`  → 변경 불필요`);
    }
    console.log('');
  }

  console.log(`\n--- 업데이트 대상: ${updateCount}개 ---\n`);

  if (updates.length > 0) {
    console.log('업데이트 진행 중...\n');

    for (const update of updates) {
      const { error } = await supabase
        .from('surveys')
        .update({ creator_name: update.newName })
        .eq('id', update.id);

      if (error) {
        console.log(`[실패] ${update.title}: ${error.message}`);
      } else {
        console.log(`[성공] ${update.title}: ${update.oldName} → ${update.newName}`);
      }
    }

    console.log('\n=== 업데이트 완료 ===');
  } else {
    console.log('업데이트할 항목이 없습니다.');
  }
}

updateCreatorNames().catch(console.error);
