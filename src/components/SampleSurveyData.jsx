// 샘플 설문 데이터 - 서비스 피드백 설문
export const SAMPLE_SURVEY = {
  id: 'sample_survey',
  title: '픽서치 서비스 개선 피드백 설문조사',
  description: '더 나은 서비스를 제공하기 위해 여러분의 소중한 의견을 듣고자 합니다',
  survey_purpose: '고객들이 서비스를 사용하면서 느낀 불편함과 개선사항을 파악하여 서비스 품질을 향상시키기 위함',
  usage_purpose: '서비스 품질 향상 및 고객 만족도 개선',
  status: 'closed',
  target_participants: 10000,
  completed_responses: 10000,
  survey_type: 'premium',
  created_date: '2025-01-01T00:00:00Z'
};

export const SAMPLE_QUESTIONS = [
  {
    id: 'q1',
    question_text: '픽서치 서비스를 어떻게 알게 되셨나요?',
    question_type: 'multiple_choice',
    options: ['검색 엔진', 'SNS 광고', '지인 추천', '블로그/커뮤니티', '기타'],
    order: 0
  },
  {
    id: 'q2',
    question_text: '서비스를 이용하시는 주된 목적은 무엇인가요? (중복 선택 가능)',
    question_type: 'multiple_select',
    options: ['고객 피드백 수집', '시장 조사', '제품 만족도 조사', '학술 연구', '이벤트 참여'],
    order: 1
  },
  {
    id: 'q3',
    question_text: '서비스 이용 중 가장 불편했던 점을 자유롭게 작성해주세요',
    question_type: 'short_answer',
    order: 2
  },
  {
    id: 'q4',
    question_text: '다음 중 어떤 디자인을 더 선호하시나요?',
    question_type: 'image_choice',
    image_urls: [
      'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400',
      'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400'
    ],
    image_descriptions: ['심플한 디자인', '화려한 디자인'],
    order: 3
  },
  {
    id: 'q5',
    question_text: '서비스 UI/UX에 얼마나 만족하시나요?',
    question_type: 'likert_scale',
    order: 4
  },
  {
    id: 'q6',
    question_text: '전반적인 서비스 만족도를 0~10점으로 평가해주세요',
    question_type: 'numeric_rating',
    order: 5
  },
  {
    id: 'q7',
    question_text: '다음 기능의 중요도를 순위별로 매겨주세요',
    question_type: 'ranking',
    options: ['AI 자동 분석', '실시간 결과 확인', '다양한 질문 유형', '데이터 다운로드', '타겟팅 기능'],
    order: 6
  },
  {
    id: 'q8',
    question_text: '어떤 기능이 추가되면 좋을까요? (중복 선택 가능)',
    question_type: 'multiple_select',
    options: ['모바일 앱', '설문 템플릿', '팀 협업 기능', '고급 통계 분석', 'API 연동'],
    order: 7
  },
  {
    id: 'q9',
    question_text: '서비스의 가격 정책에 대해 어떻게 생각하시나요?',
    question_type: 'multiple_choice',
    options: ['매우 비싸다', '조금 비싸다', '적절하다', '저렴하다', '매우 저렴하다'],
    order: 8
  },
  {
    id: 'q10',
    question_text: '픽서치를 지인에게 추천하실 의향이 있으신가요?',
    question_type: 'likert_scale',
    order: 9
  }
];

// 10,000명의 응답 데이터 생성
const generateResponses = () => {
  const responses = [];
  
  for (let i = 0; i < 10000; i++) {
    responses.push({
      id: `response_${i}`,
      survey_id: 'sample_survey',
      status: 'completed',
      answers: [
        // Q1: 어떻게 알게 되셨나요?
        { question_id: 'q1', answer: ['검색 엔진', 'SNS 광고', '지인 추천', '블로그/커뮤니티', '기타'][Math.floor(Math.random() * 5)] },
        
        // Q2: 이용 목적 (다중선택)
        { question_id: 'q2', answer: (() => {
          const options = ['고객 피드백 수집', '시장 조사', '제품 만족도 조사', '학술 연구', '이벤트 참여'];
          const selected = options.filter(() => Math.random() > 0.6);
          return selected.length > 0 ? selected.join(', ') : options[0];
        })() },
        
        // Q3: 좋았던 점 (주관식)
        { question_id: 'q3', answer: [
          '타겟팅 기능이 정말 정교해요',
          'AI 분석 결과가 놀라울 정도로 정확해요',
          '가격이 너무 합리적이라 좋아요',
          'UI가 깔끔하고 예뻐요',
          '설문 결과가 실시간으로 보여서 좋아요',
          '고객 지원이 빠르고 친절해요',
          '사용하기 너무 편리해요',
          '원하는 타겟에게 정확히 도달해요',
          '보고서 기능이 강력해요',
          '친구에게 추천하고 싶어요'
        ][Math.floor(Math.random() * 10)] },
        
        // Q4: 이미지 선택
        { question_id: 'q4', answer: Math.random() > 0.35 ? '0' : '1' },
        
        // Q5: UI/UX 만족도 (리커트)
        { question_id: 'q5', answer: String(Math.floor(Math.random() * 2) + 4) }, // 4-5 집중
        
        // Q6: 전반적 만족도 (0-10)
        { question_id: 'q6', answer: String(Math.floor(Math.random() * 3) + 8) }, // 8-10 집중
        
        // Q7: 기능 중요도 순위
        { question_id: 'q7', answer: JSON.stringify({
          '타겟팅 기능': 1,
          'AI 자동 분석': 2,
          '실시간 결과 확인': 3,
          '데이터 다운로드': 4,
          '다양한 질문 유형': 5
        }) },
        
        // Q8: 추가 희망 기능 (다중선택)
        { question_id: 'q8', answer: (() => {
          const options = ['모바일 앱', '설문 템플릿', '팀 협업 기능', '고급 통계 분석', 'API 연동'];
          const selected = options.filter(() => Math.random() > 0.5);
          return selected.length > 0 ? selected.join(', ') : options[0];
        })() },
        
        // Q9: 가격 정책
        { question_id: 'q9', answer: ['매우 저렴하다', '저렴하다', '적절하다'][Math.floor(Math.random() * 3)] },
        
        // Q10: 추천 의향
        { question_id: 'q10', answer: String(Math.floor(Math.random() * 2) + 4) } // 4-5 집중
      ]
    });
  }
  
  return responses;
};

export const SAMPLE_RESPONSES = generateResponses();

// AI 리포트 샘플 데이터
export const SAMPLE_AI_REPORT = {
  summary: `총 10,000명의 고객이 참여한 이번 설문조사에서 픽서치 서비스에 대한 매우 긍정적인 피드백을 수집했습니다.

주요 인사이트:
• 65%의 사용자가 '검색 엔진'을 통해 서비스를 발견했으며, 이는 SEO 전략의 효과를 입증합니다
• 고객들은 주로 '고객 피드백 수집'과 '시장 조사' 목적으로 서비스를 이용하고 있습니다
• 서비스 만족도는 8.9점으로 매우 높으며, 특히 타겟팅 기능에 대한 만족도가 압도적입니다
• '타겟팅 기능'과 'AI 자동 분석' 기능이 가장 핵심적인 가치로 평가되었습니다
• 가격 정책에 대해서는 '매우 저렴하다'는 의견이 68%로 가성비가 뛰어난 서비스로 인식되고 있습니다

개선 방향:
현재의 높은 만족도를 유지하며, 모바일 앱 등 추가 편의 기능 확장에 집중하는 것이 좋습니다.`,
  
  questions: [
    {
      qid: 'q1',
      type: 'multiple_choice',
      title: '픽서치 서비스를 어떻게 알게 되셨나요?',
      data: {
        labels: ['검색 엔진', 'SNS 광고', '지인 추천', '블로그/커뮤니티', '기타'],
        values: [6500, 1500, 1200, 600, 200],
        percentages: [65, 15, 12, 6, 2]
      },
      insight: '검색 엔진을 통한 유입이 압도적으로 높아 SEO 전략이 효과적임을 보여줍니다',
      ai_analysis: '유기적 검색 유입이 주된 고객 획득 경로입니다. SNS 광고와 지인 추천도 상당한 비중을 차지하고 있어, 입소문 마케팅과 소셜미디어 전략을 강화할 필요가 있습니다.'
    },
    {
      qid: 'q2',
      type: 'multiple_select',
      title: '서비스를 이용하시는 주된 목적은 무엇인가요? (중복 선택 가능)',
      data: {
        labels: ['고객 피드백 수집', '시장 조사', '제품 만족도 조사', '학술 연구', '이벤트 참여'],
        values: [5800, 4200, 3500, 1800, 700],
        percentages: [58, 42, 35, 18, 7]
      },
      insight: '고객 피드백 수집과 시장 조사가 주요 이용 목적으로 나타났습니다',
      ai_analysis: 'B2B 고객이 주된 타겟층임을 확인할 수 있습니다. 기업의 고객 인사이트 발굴과 시장 분석 니즈에 초점을 맞춘 기능 개발이 필요합니다.'
    },
    {
      qid: 'q3',
      type: 'short_answer',
      title: '서비스 이용 중 가장 좋았던 점을 자유롭게 작성해주세요',
      data: {
        text_responses: [
          '타겟팅 기능이 정말 정교해요',
          'AI 분석 결과가 놀라울 정도로 정확해요',
          '가격이 너무 합리적이라 좋아요',
          'UI가 깔끔하고 예뻐요',
          '설문 결과가 실시간으로 보여서 좋아요',
          '고객 지원이 빠르고 친절해요',
          '사용하기 너무 편리해요',
          '원하는 타겟에게 정확히 도달해요',
          '보고서 기능이 강력해요',
          '친구에게 추천하고 싶어요',
          '가성비가 최고예요',
          '데이터 분석이 너무 편해요'
        ]
      },
      insight: '타겟팅 정교함, AI 분석, 합리적인 가격에 대한 칭찬이 주를 이룹니다',
      ai_analysis: '사용자들은 서비스의 핵심 가치인 타겟팅과 AI 분석에 매우 만족하고 있습니다. 특히 가격 대비 성능에 대한 긍정적인 반응이 압도적이며, 이는 충성 고객 확보에 큰 도움이 될 것입니다.'
    },
    {
      qid: 'q4',
      type: 'image_choice',
      title: '다음 중 어떤 디자인을 더 선호하시나요?',
      data: {
        labels: ['심플한 디자인', '화려한 디자인'],
        values: [6500, 3500],
        percentages: [65, 35]
      },
      insight: '심플하고 깔끔한 디자인을 선호하는 사용자가 압도적으로 많습니다',
      ai_analysis: '미니멀리즘 디자인 트렌드가 반영된 결과입니다. 기능의 복잡성을 시각적 단순함으로 보완하는 전략이 효과적일 것으로 보입니다.'
    },
    {
      qid: 'q5',
      type: 'likert_scale',
      title: '서비스 UI/UX에 얼마나 만족하시나요?',
      data: {
        distribution: [100, 200, 1500, 4800, 3400],
        percentages: [1, 2, 15, 48, 34],
        average: 4.2
      },
      insight: '82% 이상의 사용자가 UI/UX에 만족하거나 매우 만족하고 있습니다',
      ai_analysis: '직관적이고 깔끔한 UI/UX가 사용자 만족도를 높이는 주요 요인입니다. 현재의 디자인 기조를 유지하면서 미세한 사용성 개선을 이어가는 것이 좋겠습니다.'
    },
    {
      qid: 'q6',
      type: 'numeric_rating',
      title: '전반적인 서비스 만족도를 0~10점으로 평가해주세요',
      data: {
        distribution: [0, 0, 50, 100, 250, 600, 1200, 1800, 3000, 2000, 1000],
        average: 8.9
      },
      insight: '평균 8.9점의 매우 높은 만족도를 기록했습니다',
      ai_analysis: '대부분의 사용자가 8점 이상을 부여하여 서비스 품질에 대한 신뢰도가 매우 높습니다. 특히 타겟팅 기능과 가격 경쟁력이 이러한 높은 만족도를 견인한 것으로 분석됩니다.'
    },
    {
      qid: 'q7',
      type: 'ranking',
      title: '다음 기능의 중요도를 순위별로 매겨주세요',
      data: {
        labels: ['타겟팅 기능', 'AI 자동 분석', '실시간 결과 확인', '다양한 질문 유형', '데이터 다운로드'],
        values: [10000, 10000, 10000, 10000, 10000],
        average_ranks: [1.2, 1.8, 3.1, 4.2, 4.7]
      },
      insight: '타겟팅 기능이 압도적으로 1위, AI 자동 분석이 2위로 선정되었습니다',
      ai_analysis: '사용자들은 픽서치의 정교한 타겟팅 기능을 가장 핵심적인 가치로 여기고 있습니다. 그 다음으로 AI를 통한 인사이트 도출을 중요하게 생각하므로, 이 두 가지 핵심 역량을 지속적으로 강화해야 합니다.'
    },
    {
      qid: 'q8',
      type: 'multiple_select',
      title: '어떤 기능이 추가되면 좋을까요? (중복 선택 가능)',
      data: {
        labels: ['모바일 앱', '설문 템플릿', '팀 협업 기능', '고급 통계 분석', 'API 연동'],
        values: [6800, 5200, 4500, 3800, 2700],
        percentages: [68, 52, 45, 38, 27]
      },
      insight: '모바일 앱과 설문 템플릿 기능에 대한 수요가 가장 높습니다',
      ai_analysis: '모바일 퍼스트 전략이 필요합니다. 응답자의 68%가 모바일 앱을 원하고 있어, 모바일 앱 개발이 최우선 과제입니다. 설문 템플릿 제공으로 사용자의 시작 장벽을 낮추는 것도 중요합니다.'
    },
    {
      qid: 'q9',
      type: 'multiple_choice',
      title: '서비스의 가격 정책에 대해 어떻게 생각하시나요?',
      data: {
        labels: ['매우 비싸다', '조금 비싸다', '적절하다', '저렴하다', '매우 저렴하다'],
        values: [50, 150, 800, 2200, 6800],
        percentages: [0.5, 1.5, 8, 22, 68]
      },
      insight: '68%가 "매우 저렴하다"고 응답하여 압도적인 가격 경쟁력을 입증했습니다',
      ai_analysis: '경쟁사 대비 파격적인 가격 정책이 사용자들에게 큰 호응을 얻고 있습니다. "저렴하다"는 의견까지 합치면 90%가 가격에 만족하고 있어, 가성비가 서비스의 강력한 무기가 되고 있습니다.'
    },
    {
      qid: 'q10',
      type: 'likert_scale',
      title: '픽서치를 지인에게 추천하실 의향이 있으신가요?',
      data: {
        distribution: [50, 100, 350, 2500, 7000],
        percentages: [0.5, 1, 3.5, 25, 70],
        average: 4.8
      },
      insight: '추천 의향이 평균 4.8점으로 매우 높으며, 70%가 적극 추천 의향을 보였습니다',
      ai_analysis: '매우 높은 NPS(순추천지수)가 예상됩니다. 타겟팅 정확도와 가격 만족도가 결합되어 자발적인 바이럴 확산이 일어날 수 있는 최적의 환경입니다.'
    }
  ]
};