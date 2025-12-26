import React, { useState } from "react";
import { InvokeLLM } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Plus, Trash2, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { Sparkles, Loader2, ArrowRight, ArrowLeft, Home, Target, BarChart3, User, MessageSquare, Palette, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TARGET_OPTIONS } from "@/components/targetOptions";
import { format, addDays, isBefore, startOfDay, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function AIQuestionGenerator() {
  const navigate = useNavigate();
  
  // URL에서 타입 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const typeFromUrl = urlParams.get('type');
  
  const [surveyType, setSurveyType] = useState(typeFromUrl || null);
  const [showSurveyTypeModal, setShowSurveyTypeModal] = useState(!typeFromUrl);
  
  // Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const purposeOptions = [
    "신제품/서비스 출시 전 반응 조사",
    "브랜드 인지도 및 이미지 조사",
    "기존 제품/서비스 만족도 조사",
    "시장 트렌드 및 소비자 라이프스타일 파악",
    "이벤트/프로모션 기획을 위한 사전 조사"
  ];

  const usageOptions = [
    "내부 분석용 (솔직한 피드백 위주)",
    "마케팅 전략 수립 (구체적 데이터 위주)",
    "제품/서비스 개선 (불편사항/Pain Point 발굴)",
    "투자자/제안서/보고서 제출용 (객관적 신뢰도 중요)",
    "학술/연구 논문용 (통계적 유의성 중요)",
    "콘텐츠/보도자료 배포용 (흥미로운 결과 위주)"
  ];

  const [formData, setFormData] = useState({
    목적: '',
    조사대상: '',
    타겟페르소나: '',
    조사영역: '',
    문항형식: '다양한 형식 혼합',
    톤앤매너: '친근하고 부드럽게',
    활용목적: usageOptions[0]
  });

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isDirectPurpose, setIsDirectPurpose] = useState(false);
  const [isDirectUsage, setIsDirectUsage] = useState(false);
  const [isDirectTarget, setIsDirectTarget] = useState(false);
  const [targetSettings, setTargetSettings] = useState({});

  const calculateMinStartDate = () => {
    const now = new Date();
    const hour = now.getHours();
    // Base: Tomorrow if < 14:00, Day after tomorrow if >= 14:00
    let minDate = addDays(now, 1);
    if (hour >= 14) {
      minDate = addDays(now, 2);
    }
    return startOfDay(minDate);
  };

  const handleTargetOptionToggle = (category, field, value, type) => {
    const currentTargets = { ...targetSettings };
    if (!currentTargets[category]) currentTargets[category] = {};
    
    const currentValues = currentTargets[category][field];

    if (type === 'radio') {
      if (currentValues === value) {
        delete currentTargets[category][field];
      } else {
        currentTargets[category][field] = value;
        if (category === 'APP_USAGE' && field === 'app_category') {
          delete currentTargets[category]['custom_app_text'];
        }
      }
    } else if (type === 'checkbox') {
      const prev = Array.isArray(currentValues) ? currentValues : [];
      if (prev.includes(value)) {
        const next = prev.filter(v => v !== value);
        if (next.length === 0) delete currentTargets[category][field];
        else currentTargets[category][field] = next;
      } else {
        currentTargets[category][field] = [...prev, value];
      }
    }

    if (Object.keys(currentTargets[category]).length === 0) {
      delete currentTargets[category];
    }

    setTargetSettings(currentTargets);
  };

  const handleTargetTextChange = (category, field, text) => {
    const currentTargets = { ...targetSettings };
    if (!currentTargets[category]) currentTargets[category] = {};
    
    if (text.trim()) {
      currentTargets[category][field] = text;
      if (category === 'APP_USAGE' && field === 'custom_app_text') {
        delete currentTargets[category]['app_category'];
      }
    } else {
      delete currentTargets[category][field];
      if (Object.keys(currentTargets[category]).length === 0) delete currentTargets[category];
    }
    setTargetSettings(currentTargets);
  };

  const targetOptionsByTier = {
    basic: [
      "전국 20~60세 남녀 (일반 대중)",
      "20대 남녀 (대학생/사회초년생)",
      "30대 남녀 (직장인/신혼부부)",
      "40~50대 남녀 (중장년층)",
      "여성 전용 (뷰티/패션)",
      "남성 전용 (자동차/테크)"
    ],
    standard: [
      "전국 20~60세 남녀 (일반 대중)",
      "수도권 거주 2040 남녀",
      "직장인 (사무직/전문직)",
      "전업주부 및 기혼 여성",
      "1인 가구 자취생"
    ],
    premium: [
      "최근 3개월 내 온라인 쇼핑 경험자",
      "자녀가 있는 3040 기혼자",
      "반려동물 양육 인구",
      "여행/레저 관심 고관여층",
      "특정 브랜드/제품 사용 경험자"
    ],
    vip: [
      "고소득 전문직 종사자",
      "특정 아파트/거주지 거주자",
      "명품/프리미엄 서비스 이용자",
      "C-Level 의사결정권자",
      "특정 질환/건강 고민 보유자"
    ],
    targeted: [
      "SKP DB 기반 정밀 타겟팅",
      "특정 앱(App) 설치/이용자",
      "특정 오프라인 매장 방문 경험자",
      "경쟁사 서비스 이탈 고객",
      "맞춤형 페르소나 타겟"
    ]
  };

  const getTargetSuggestions = () => {
    const tier = surveyType || 'basic';
    return targetOptionsByTier[tier] || targetOptionsByTier['basic'];
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);

  const getTierLimit = () => {
    switch (surveyType) {
      case 'basic': return 10;
      case 'standard': return 13;
      case 'premium': return 15;
      case 'vip': return 20;
      default: return 10;
    }
  };

  const handleGenerate = async () => {
  if (!formData.목적 || !formData.조사영역) {
  alert('필수 항목을 모두 입력해주세요!');
  return;
  }

  setIsGenerating(true);

  const totalPointsLimit = getTierLimit();

  // Determine Target Audience Description
  let targetAudienceDesc = "불특정 다수 (전체)";
  if (surveyType === 'basic') {
  targetAudienceDesc = "불특정 다수 (전체) - 타겟팅 없음";
  } else if (Object.keys(targetSettings).length > 0) {
  targetAudienceDesc = "아래 상세 타겟 설정 참조";
  } else {
  targetAudienceDesc = "전체 (상세 타겟 미설정)";
  }

  // Format target settings for prompt
  const targetDetails = Object.entries(targetSettings).map(([cat, fields]) => {
  const fieldStrs = Object.entries(fields).map(([field, val]) => {
    return `${field}: ${Array.isArray(val) ? val.join(', ') : val}`;
  });
  return `${cat} [${fieldStrs.join(' | ')}]`;
  }).join('\n      ');

  try {
  const prompt = `
  당신은 ‘픽서치(PickSearch)’의 전용 AI 설문 설계 엔진입니다.

  당신의 역할은:
  사용자가 입력한 정보를 기반으로, 
  픽서치에서 제공하는 질문 타입들
  [객관식(multiple_choice), 주관식(short_answer), 다중선택(multiple_select), 순위형(ranking), 수치평정(numeric_rating), 리커트척도(likert_scale), 이미지선택(image_choice), 이미지배너(image_banner)]
  만을 사용하여 **해당 비즈니스 목적에 최적화된 설문지**를 자동으로 설계하는 것입니다.

  **중요 제한 사항:**
  1. **개인정보 수집 금지:** 이름, 전화번호, 이메일, 상세주소, 나이, 성별, 거주지역 등 개인 식별 가능 정보(PII)를 묻는 질문은 절대 포함하지 마십시오. (개인정보 동의 절차가 없음)
  2. **문항 수 최대화:** 제공된 '목표 총 포인트'(${totalPointsLimit}점)를 **최대한 꽉 채워서** 문항을 생성하십시오. 부족하지 않게 충분한 문항을 만들어주세요.

  ────────────────────
  [입력으로 제공되는 정보]
  ────────────────────
  - 설문 목적: ${formData.목적}
  - 조사 대상: ${targetAudienceDesc}
  ${Object.keys(targetSettings).length > 0 ? `- 상세 타겟 설정:\n      ${targetDetails}` : ''}
  ${formData.타겟페르소나 ? `- 타겟 페르소나: ${formData.타겟페르소나}` : ''}
  - 주요 조사 영역: ${formData.조사영역}
  - 문항 형식(선호): ${formData.문항형식}
  - 톤앤매너: ${formData.톤앤매너}
  - 결과 활용 목적: ${formData.활용목적}
  - 목표 총 포인트(문항 가중치 합): 정확히 ${totalPointsLimit}점 (최대한 채울 것)

  ────────────────────
  [타겟 분류(10개 세그먼트)]
────────────────────
아래 10가지 타입 중 하나 이상으로 분류하여 설문을 설계합니다.

1) 브랜드 운영자 / 브랜드 마케터
2) 온라인 쇼핑몰 운영자 / 이커머스 운영팀
3) 오프라인 매장주(요식업/뷰티/헬스/리테일 등)
4) 프랜차이즈 본사
5) 스타트업 대표 / BM 팀 / 전략기획팀
6) Product Owner / 기획자
7) Growth Marketer / 퍼포먼스 마케터
8) UX 리서처 / 컨설팅 회사
9) 공공기관 / 지자체 / 민간 연구소
10) 광고대행사 / 마케팅 대행사

사용자 유형이 명시되지 않은 경우,
‘설문 목적, 주요 조사 영역, 결과 활용 목적, 조사 대상’에서 키워드를 읽고 
위 10개 중 가장 가까운 타입으로 1개 이상을 추론하여 활용합니다.

────────────────────
[각 타겟별 대표 조사 목적과 설문 구조 가이드]
────────────────────
아래 가이드는 설문 문항을 기획할 때 반드시 참고해야 할 우선순위 규칙입니다.
한 타겟 안에서도 실제 목적에 맞게 필요한 블록만 선택/조합합니다.

① 브랜드 운영자 / 브랜드 마케터
- 기본 설문 구조 예:
  1. 브랜드 인지도·인지 경로
  2. 사용/구매 경험 여부 및 빈도
  3. 브랜드/제품 선택 기준 중요도(수치평정/리커트)
  4. 메시지·콘셉트/광고 반응(이미지선택, 객관식)
  5. 경쟁사 대비 강·약점 평가
  6. 페르소나/라이프스타일 관련 항목
  7. 향후 이용/추천 의향 + 개선점(주관식)

② 온라인 쇼핑몰 / 이커머스 운영
- 기본 구조 예:
  1. 쇼핑 경험/구매 여부, 채널
  2. 첫 구매 계기, 상품 선택 기준
  3. 상세페이지/리뷰/가격/배송 등 요소별 만족도
  4. 장바구니/결제 이탈 경험과 이유
  5. 가격대 민감도·지불 의사(수치평정)
  6. 재구매 의향, 추천 의향, 개선점

③ 오프라인 매장주(요식/뷰티/헬스/리테일)
- 기본 구조 예:
  1. 매장 방문 경험/빈도/시간대
  2. 방문 이유, 동행자, 평균 지출
  3. 맛/서비스/가격/위생/분위기 등 요소별 만족도(리커트)
  4. 주변 경쟁 매장 대비 평가
  5. 재방문 의향과 그 이유
  6. 적용 예정 메뉴/서비스/프로모션에 대한 선호도
  7. 개선점·불만 사항(주관식)

④ 프랜차이즈 본사
- 기본 구조 예:
  1. 브랜드 인지도 및 이용 경험(지역 포함)
  2. 방문/구매 빈도와 이용 채널
  3. 메뉴/상품 만족도 및 선호도
  4. 지역별 차이(접근성, 상권 특성 등)
  5. 신규 메뉴/서비스 반응
  6. 본사 정책·프로모션에 대한 인식
  7. 재방문·추천 의향, 가맹점에 대한 의견

⑤ 스타트업 대표 / BM / 전략기획
- 기본 구조 예:
  1. 현재 사용 중인 해결 방식/대체 서비스
  2. 가장 큰 Pain Point와 불편 요소
  3. 제안하는 아이템/서비스 콘셉트에 대한 공감·관심도
  4. 사용 의향, 도입 장벽, 전환 조건
  5. 지불 의사 가격대(WTP)
  6. 경쟁/대체 서비스와의 비교 인식
  7. 이상적인 해결책에 대한 자유 의견(주관식)

⑥ Product Owner / 기획자
- 기본 구조 예:
  1. 기능 인지 여부 및 사용 경험
  2. 사용 목적/사용 빈도
  3. 사용 시 만족도, 불편한 지점(다중선택)
  4. 기능·화면별 중요도/우선순위(순위형)
  5. 사용을 막는 가장 큰 장애 요인
  6. 대안으로 사용하는 방법/서비스
  7. 개선 아이디어·필요 기능(주관식)

⑦ Growth / 퍼포먼스 마케터
- 기본 구조 예:
  1. 최근 캠페인/브랜드 노출 경험 채널
  2. 광고에서 기억나는 메시지/이미지(이미지선택 가능)
  3. 클릭/전환을 결정짓는 요인(다중선택)
  4. 랜딩페이지/오퍼에 대한 반응과 신뢰도
  5. 구매/가입 전환 여부 및 이유
  6. 향후 타겟팅에 유용한 행동·관심사 문항
  7. 광고에 바라는 점/거부감을 주는 요소(주관식)

⑧ UX 리서처 / 컨설팅 회사
- 기본 구조 예:
  1. 대상 서비스/제품 사용 경험 및 패턴
  2. 주요 사용 목적/시나리오
  3. 현재 UX에서 편리한 점 vs 불편한 점
  4. 핵심 과업(Task) 달성 난이도 평가(수치평정)
  5. 경쟁 서비스와 비교 체감
  6. 향후 심층 인터뷰/테스트 참여 의향
  7. 개선 아이디어(주관식)

⑨ 공공기관 / 지자체 / 민간 연구소
- 기본 구조 예:
  1. 거주/활동 지역 및 이용 빈도
  2. 특정 시설/서비스/정책 이용 경험
  3. 편의성/접근성/만족도 평가(리커트)
  4. 지역 소비·이동·여가 패턴
  5. 정책/사업에 대한 인지도와 체감 효과
  6. 개선이 필요하다고 느끼는 부분
  7. 향후 이용·참여 의향

⑩ 광고대행사 / 마케팅 대행사
- 기본 구조 예:
  1. 해당 카테고리/브랜드 이용 현황
  2. 주요 의사결정 요인과 Pain Point
  3. 캠페인 콘셉트·메시지·이미지에 대한 반응
  4. 타겟 세그먼트 특징(연령/라이프스타일/행동)
  5. 채널별 선호도 및 신뢰도
  6. 향후 캠페인 참여 의향, 기대 혜택
  7. 자유 의견(주관식)

────────────────────
[문항 설계 공통 규칙]
────────────────────
1. 전체 문항 수는  각 티어의 최대치로 적용하며(주관식은 2개를 소진합니다)
2. 모든 질문은 설문 목적과 직접적으로 연결되도록 작성합니다.
3. 각 설문은 아래 4단계 구조를 기본으로 합니다:
   (1) 도입부: 응답자 조건/기본 정보/최근 행동 확인 (1~2문항)
   (2) 핵심 목적: 위 타겟별 구조에서 필요한 블록 선택 (3~6문항)
   (3) 행동·경험 기반: 실제 행동, 선택 이유, 결정 과정 (1~3문항)
   (4) 인사이트·개선: Pain Point, 불만, 개선점, 재이용 의향 (1~2문항)

4. 질문 타입 선택 규칙:
   - 만족도/태도/호감(동의 여부) → 리커트척도 (likert_scale)
     *중요: 리커트 척도는 5점 척도이며, 질문 맥락에 맞는 라벨(1~5점)을 직접 작성해야 합니다. options 배열에 순서대로 1점~5점 라벨을 입력하세요.
     예시1 (동의 척도): ["전혀 동의하지 않는다", "동의하지 않는다", "보통이다", "동의한다", "매우 동의한다"]
     예시2 (만족도): ["매우 불만족", "불만족", "보통", "만족", "매우 만족"]
     예시3 (빈도): ["전혀 안 함", "거의 안 함", "가끔", "자주", "매우 자주"]
   - 0~10점 정량 평가 → 수치평정 (numeric_rating)
     *주의: 0~10점 척도이므로 질문에 '1~5점' 등으로 잘못 적지 마십시오.
   - 선택 요인·이유, 복수 행동 → 다중선택 (multiple_select)
   - 가장 중요한 요소/우선순위 → 순위형 (ranking)
     *주의: 시스템상 제시된 **모든 보기의 순위**를 매겨야 합니다. 질문에 '1~3위까지만 선택'이나 '3가지만 선택' 같은 부분 선택 지시를 절대 포함하지 마십시오. 대신 '순서대로 나열해주세요' 등의 표현을 사용하십시오.
   - 단순 여부/경험 → 객관식 (multiple_choice)
   - 깊은 의견·아이디어 → 주관식 (short_answer) (최대 2문항)
   - 디자인/광고/브랜드 자산 비교 평가 → 이미지선택 (image_choice)
   - 브랜드·이벤트/프로모션 노출용 전단지 영역 → 이미지배너 (image_banner)

5. 리커트 척도 추가 규칙:
   - 리커트 척도(likert_scale) 질문의 options 배열에는 반드시 5개의 라벨이 포함되어야 합니다.
   - 첫 번째 라벨은 가장 부정적/낮은 값, 다섯 번째 라벨은 가장 긍정적/높은 값입니다.
   - 라벨은 질문의 맥락과 자연스럽게 연결되어야 합니다.

6. 이미지 관련 규칙 (중요):
   - 디자인, 포장지, 로고 등 **시각적 요소**를 평가하는 질문에는 반드시 'image_choice' 또는 'image_banner'를 사용하십시오.
   - 이미지 관련 질문의 텍스트 끝에는 반드시 **"(이미지를 첨부해주세요)"** 라는 문구를 추가하여 사용자가 이미지를 업로드해야 함을 알 수 있게 하십시오.
   - 이미지배너는 설문 중 한 번만 사용 가능합니다.

6. 선택지 구성:
   - 객관식/다중선택: 4~8개 보기가 자연스럽게 구성되도록 작성
   - 리커트척도: options 배열에 반드시 5개의 라벨 입력 (예: ["전혀 아니다", "아니다", "보통", "그렇다", "매우 그렇다"])
   - 수치평정: 0~10점 고정이므로 질문에 범위 언급 금지
   - 이미지선택: 2개 항목 기준으로 설계 (예: A안 vs B안)
   - 주관식: 질문은 짧고 명확하게, 과도한 서술 요구 금지

7. 톤앤매너:
   - 사용자가 입력한 톤앤매너 값을 설문 전체 문장에 일관되게 반영합니다.
   - 예: “친근하고 부드럽게”라면 존댓말이지만 부담 없고 대화체에 가깝게,
          “전문적이고 신뢰감 있게”라면 다소 포멀한 비즈니스 톤으로.

8. 결과 활용 목적:
   - “투자자/보고서/제안서용”이면 표현을 조금 더 정제하고 신뢰감 있게,
   - “내부 분석용”이면 응답자 스트레스 최소화를 더 우선시합니다.

9. 문항 수 계산 및 포인트 규칙:
   - **주관식(short_answer)은 1문항당 2점**으로 계산
   - **나머지 모든 유형(객관식, 척도 등)은 1문항당 1점**으로 계산
   - 생성된 문항들의 점수 총합이 정확히 ${totalPointsLimit}점이 되도록 맞춰주세요.

────────────────────
이제 위 규칙을 따르며,
입력된 정보(설문 목적, 조사 대상, 주요 조사 영역 등)에 가장 잘 맞는
픽서치 최적형 설문지를 설계하여 JSON으로 반환해.
`;

      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            survey_title: { type: "string" },
            survey_description: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_text: { type: "string" },
                  question_type: { type: "string" },
                  options: {
                    type: "array",
                    items: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });

      // Parse questions for CreateSurvey format
      const parsed = result.questions.map((q, idx) => ({
        id: Date.now() + idx,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        order: idx,
        cost: 0
      }));

      // target_settings를 배열 형태로 저장 (CreateSurvey에서 기대하는 형식)
      const formattedTargetSettings = Object.keys(targetSettings).length > 0 
        ? [{ id: 'CELL_MAIN', name: 'AI 타겟', targets: targetSettings }]
        : [];

      localStorage.setItem('ai_generated_survey', JSON.stringify({
        title: result.survey_title,
        description: result.survey_description,
        purpose: formData.목적,
        target_audience: targetAudienceDesc,
        survey_area: formData.조사영역,
        target_persona: formData.타겟페르소나 || '',
        target_settings: formattedTargetSettings,
        survey_type: surveyType,
        questions: parsed,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null
      }));

      navigate(createPageUrl('CreateSurvey') + '?ai=true');

    } catch (error) {
      console.error('AI 생성 실패:', error);
      alert('AI 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Step Validations
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1: // 목적
        return formData.목적.trim().length > 0 && startDate && endDate;
      case 2: // 대상
        return true; // 타겟 설정은 선택사항이거나 기본값 적용
      case 3: // 내용
        return formData.조사영역.trim().length > 0;
      case 4: // 스타일
        return true; // defaults exist
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps && isCurrentStepValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step UI Renderers
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">어떤 설문조사를 만들고 싶으신가요?</h2>
              <p className="text-gray-500">가장 먼저 설문의 목적을 알려주세요.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  설문 목적 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <Select
                    value={isDirectPurpose ? 'direct' : formData.목적}
                    onValueChange={(value) => {
                      if (value === 'direct') {
                        setIsDirectPurpose(true);
                        setFormData({...formData, 목적: ''});
                      } else {
                        setIsDirectPurpose(false);
                        setFormData({...formData, 목적: value});
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 bg-white border-gray-200 rounded-xl shadow-sm">
                      <SelectValue placeholder="설문 목적 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {purposeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                      <SelectItem value="direct" className="font-semibold text-blue-600">
                        ✨ 직접 입력
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {isDirectPurpose && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Input
                        value={formData.목적}
                        onChange={(e) => setFormData({...formData, 목적: e.target.value})}
                        placeholder="설문 목적을 직접 입력해주세요"
                        className="h-12 bg-white border-blue-200 focus:border-blue-500 rounded-xl text-base shadow-sm"
                        autoFocus
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  결과 활용 목적
                </label>
                <div className="space-y-3">
                  <Select
                    value={isDirectUsage ? 'direct' : formData.활용목적}
                    onValueChange={(value) => {
                      if (value === 'direct') {
                        setIsDirectUsage(true);
                        setFormData({...formData, 활용목적: ''});
                      } else {
                        setIsDirectUsage(false);
                        setFormData({...formData, 활용목적: value});
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 bg-white border-gray-200 rounded-xl shadow-sm">
                      <SelectValue placeholder="활용 목적 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {usageOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                      <SelectItem value="direct" className="font-semibold text-blue-600">
                        ✨ 직접 입력
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {isDirectUsage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Input
                        value={formData.활용목적}
                        onChange={(e) => setFormData({...formData, 활용목적: e.target.value})}
                        placeholder="활용 목적을 직접 입력해주세요"
                        className="h-12 bg-white border-blue-200 focus:border-blue-500 rounded-xl text-base shadow-sm"
                        autoFocus
                      />
                    </motion.div>
                  )}
                  </div>
                  </div>

                  <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                  설문 기간 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal rounded-xl h-12 bg-white shadow-sm border-gray-200 ${!startDate && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                        {startDate ? (
                          endDate ? (
                            <>
                              {format(startDate, "yyyy.MM.dd")} - {format(endDate, "yyyy.MM.dd")}
                              <Badge className="ml-auto bg-blue-50 text-blue-700 border-0 hover:bg-blue-50">
                                {differenceInDays(endDate, startDate) + 1}일간
                              </Badge>
                            </>
                          ) : (
                            format(startDate, "yyyy.MM.dd")
                          )
                        ) : (
                          <span>시작일과 종료일을 선택하세요</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={startDate || calculateMinStartDate()}
                        selected={{ from: startDate, to: endDate }}
                        onSelect={(range) => {
                          setStartDate(range?.from);
                          setEndDate(range?.to);
                        }}
                        numberOfMonths={1}
                        disabled={(date) => isBefore(date, calculateMinStartDate())}
                        locale={ko}
                        className="rounded-xl border shadow-lg"
                        classNames={{
                          day_selected: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600",
                          day_today: "bg-gray-100 text-gray-900",
                          day_range_middle: "aria-selected:bg-blue-50 aria-selected:text-blue-900",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  </div>
                  </div>
                  </div>
                  </div>
                  );

                  case 2:
      return (
      <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">누구에게 물어볼까요?</h2>
        <p className="text-gray-500">
          선택하신 <strong>{surveyType ? surveyType.toUpperCase() : 'BASIC'}</strong> 등급에 맞는 조사 대상을 설정해주세요.
        </p>
      </div>

      <div className="space-y-4">
        {/* 베이직 등급: 타겟팅 불가 */}
        {(!surveyType || surveyType === 'basic') && (
          <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-200">
            <div className="mb-3 text-3xl">📢</div>
            <p className="font-bold text-gray-800 mb-1">전체 (불특정 다수) 노출</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              베이직 등급은 별도의 타겟팅 없이<br/>
              모든 사용자에게 설문이 노출됩니다.
            </p>
          </div>
        )}

        {/* 스탠다드/프리미엄/VIP/타겟 등급: 상세 설정 */}
        {surveyType && surveyType !== 'basic' && (
          <div>
            <label className="text-sm font-bold text-gray-800 mb-3 block flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" />
              상세 타겟 설정
              {surveyType === 'standard' && <span className="text-xs font-normal text-gray-500">(성별/연령만 가능)</span>}
            </label>

            <Accordion type="multiple" className="space-y-3">
              {(() => {
                // VIP 순서 정의: 인구통계 -> 프리미엄(관심사,직업,소득) -> VIP(나머지) -> VVIP(커스텀)
                const vipOrder = [
                  'DEMO', // 인구통계 (뱃지 없음)
                  'INTEREST', 'OCCUPATION', 'SPENDING', // 프리미엄
                  'BEHAVIOR', 'APP_USAGE', 'LOCATION', 'MEMBERSHIP', 'PAYMENT', 'CONTENT', 'MARRIAGE', 'LIFECYCLE', // VIP
                  'CUSTOM_APP', 'CUSTOM_LOCATION' // VVIP
                ];
                
                const premiumKeys = ['INTEREST', 'OCCUPATION', 'SPENDING'];
                const vipKeys = ['BEHAVIOR', 'APP_USAGE', 'LOCATION', 'MEMBERSHIP', 'PAYMENT', 'CONTENT', 'MARRIAGE', 'LIFECYCLE'];
                const vvipKeys = ['CUSTOM_APP', 'CUSTOM_LOCATION'];
                
                // 정렬된 엔트리
                const sortedEntries = surveyType === 'vip' 
                  ? vipOrder.map(key => [key, TARGET_OPTIONS[key]]).filter(([key, cat]) => cat)
                  : Object.entries(TARGET_OPTIONS);
                
                return sortedEntries.map(([key, category]) => {
                    // category가 없거나 fields가 없으면 건너뛰기
                    if (!category || !category.fields) return null;

                    // 스탠다드 등급은 DEMO 카테고리만 표시
                    if (surveyType === 'standard' && key !== 'DEMO') return null;

                    // 프리미엄 등급은 DEMO, INTEREST, OCCUPATION, SPENDING만 표시
                    if (surveyType === 'premium' && !['DEMO', 'INTEREST', 'OCCUPATION', 'SPENDING'].includes(key)) return null;

                    const isActive = targetSettings[key] && Object.keys(targetSettings[key]).length > 0;
                    
                    // 뱃지 타입 결정
                    let badgeType = null;
                    if (surveyType === 'premium' && premiumKeys.includes(key)) {
                      badgeType = 'premium';
                    } else if (surveyType === 'vip') {
                      if (premiumKeys.includes(key)) badgeType = 'premium';
                      else if (vipKeys.includes(key)) badgeType = 'vip';
                      else if (vvipKeys.includes(key)) badgeType = 'vvip';
                    }

                return (
                  <AccordionItem 
                    key={key} 
                    value={key}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden data-[state=open]:border-blue-400 transition-colors"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>
                          {category.label}
                        </span>
                        {badgeType === 'premium' && (
                          <Badge className="bg-orange-100 text-orange-600 border-0 px-1.5 py-0.5 text-[9px] font-bold">
                            프리미엄
                          </Badge>
                        )}
                        {badgeType === 'vip' && (
                          <Badge className="bg-purple-100 text-purple-600 border-0 px-1.5 py-0.5 text-[9px] font-bold">
                            VIP
                          </Badge>
                        )}
                        {badgeType === 'vvip' && (
                          <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 px-1.5 py-0.5 text-[9px] font-bold shadow-sm">
                            VVIP
                          </Badge>
                        )}
                        {isActive && (
                          <Badge className="bg-blue-50 text-blue-700 border-0 w-5 h-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                            {Object.keys(targetSettings[key]).length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2 bg-gray-50/50">
                      <div className="space-y-4">
                        {category.fields.map((field) => {
                          // 스탠다드 등급은 성별/연령만 표시
                          if (surveyType === 'standard' && !['gender', 'age_10s'].includes(field.key)) return null;

                          return (
                            <div key={field.key} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-gray-600">
                                  {field.label}
                                </label>
                                {field.type === 'checkbox' && (
                                  <span className="text-[9px] text-gray-400 bg-white px-1 py-0.5 rounded border border-gray-100">
                                    중복
                                  </span>
                                )}
                              </div>

                              {field.type === 'text' ? (
                                <Input
                                  value={targetSettings[key]?.[field.key] || ''}
                                  onChange={(e) => handleTargetTextChange(key, field.key, e.target.value)}
                                  placeholder={field.placeholder}
                                  className="bg-white border-gray-200 focus:border-blue-500 rounded-lg h-10 text-sm"
                                  />
                                  ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                  {field.options.map((option) => {
                                    const isSelected = field.type === 'radio'
                                      ? targetSettings[key]?.[field.key] === option.value
                                      : targetSettings[key]?.[field.key]?.includes(option.value);

                                    return (
                                      <button
                                        key={option.value}
                                        onClick={() => handleTargetOptionToggle(key, field.key, option.value, field.type)}
                                        className={`
                                          px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border
                                          ${isSelected 
                                            ? 'bg-blue-500 border-blue-500 text-white shadow-sm' 
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'}
                                        `}
                                      >
                                        {option.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              });
              })()}
            </Accordion>
          </div>
        )}

        {surveyType === 'targeted' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
             <label className="text-sm font-medium text-gray-700 mb-2 block">
               타겟 페르소나 (선택)
             </label>
             <Textarea
               value={formData.타겟페르소나}
               onChange={(e) => setFormData({...formData, 타겟페르소나: e.target.value})}
               placeholder="예: 건강기능식품에 관심이 많고 가성비를 중요시함. 인스타그램을 주로 사용."
               className="bg-white border-blue-200 focus:border-blue-500 rounded-xl min-h-24 resize-none"
             />
             <p className="text-xs text-blue-600 mt-2">
               💡 상세 페르소나를 입력하면 AI가 더 정교한 질문을 설계합니다.
             </p>
           </div>
        )}
      </div>
      </div>
      );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">어떤 내용을 물어볼까요?</h2>
              <p className="text-gray-500">궁금한 점이나 꼭 포함해야 할 질문 내용을 적어주세요.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                주요 조사 영역 <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.조사영역}
                onChange={(e) => setFormData({...formData, 조사영역: e.target.value})}
                placeholder="예: 
      - 제품의 맛, 디자인, 가격 만족도
      - 재구매 의향 및 추천 의향
      - 경쟁사 제품과의 비교
      - 개선이 필요한 부분"
                className="bg-white border-gray-200 focus:border-blue-500 rounded-xl min-h-48 resize-none text-base p-4 shadow-sm"
                autoFocus
                />
              <p className="text-xs text-gray-500 mt-2 text-right">
                자세히 적을수록 AI가 더 좋은 질문을 만듭니다
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">어떤 분위기로 질문할까요?</h2>
              <p className="text-gray-500">브랜드 이미지에 맞는 어조와 형식을 선택해주세요.</p>
            </div>

            <div className="grid gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  문항 형식 구성
                </label>
                <Select
                  value={formData.문항형식}
                  onValueChange={(value) => setFormData({...formData, 문항형식: value})}
                >
                  <SelectTrigger className="h-12 bg-white border-gray-200 rounded-xl shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="다양한 형식 혼합">다양한 형식 혼합 (추천)</SelectItem>
                    <SelectItem value="객관식 위주">객관식 위주 (응답 편의성 ↑)</SelectItem>
                    <SelectItem value="리커트척도 위주">점수 평가 위주 (만족도 조사)</SelectItem>
                    <SelectItem value="순위형 + 객관식">선호도/순위 파악 위주</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  톤앤매너 (말투)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: '친근하고 부드럽게', label: '친근하게', desc: '부드러운 해요체' },
                    { value: '격식있고 전문적으로', label: '전문적으로', desc: '신뢰감 있는 하십시오체' },
                    { value: '캐주얼하고 재미있게', label: '재미있게', desc: '위트있는 표현' },
                    { value: '간결하고 명확하게', label: '명확하게', desc: '군더더기 없는 스타일' }
                  ].map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setFormData({...formData, 톤앤매너: tone.value})}
                      className={`p-4 rounded-xl border-2 text-left transition-all shadow-sm ${
                        formData.톤앤매너 === tone.value
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`font-bold mb-1 ${formData.톤앤매너 === tone.value ? 'text-blue-700' : 'text-gray-700'}`}>
                        {tone.label}
                      </div>
                      <div className="text-xs text-gray-500">{tone.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        // Determine Target Display String for Review
        let reviewTargetDesc = "불특정 다수 (전체)";
        if (surveyType === 'basic') {
           reviewTargetDesc = "전체 (타겟팅 없음)";
        } else if (Object.keys(targetSettings).length > 0) {
           reviewTargetDesc = "상세 타겟 설정됨 (" + Object.keys(targetSettings).length + "개 조건)";
        } else {
           reviewTargetDesc = "전체 (미설정)";
        }

        return (
          <div className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">설문 생성 준비 완료!</h2>
              <p className="text-gray-500">입력하신 정보를 바탕으로 AI가 설문을 설계합니다.</p>
            </div>

            <Card className="bg-gray-50 border-gray-100 rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-gray-500">목적</span>
                  <span className="font-medium text-gray-900">{formData.목적}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-gray-500">대상</span>
                  <span className="font-medium text-gray-900">{reviewTargetDesc}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-gray-500">내용</span>
                  <span className="font-medium text-gray-900 whitespace-pre-wrap line-clamp-3">{formData.조사영역}</span>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-gray-500">스타일</span>
                  <span className="font-medium text-gray-900">{formData.톤앤매너}, {formData.문항형식}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                생성 후에도 자유롭게 수정할 수 있습니다.<br/>
                마음에 들지 않으면 '다시 생성하기'를 누르세요.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Survey Type Modal Component
  if (showSurveyTypeModal && !surveyType) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 space-y-6">
            <div className="relative">
              <button
                onClick={() => navigate(createPageUrl('ClientHome'))}
                className="absolute -top-2 -right-2 w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-gray-600 text-xl">×</span>
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">설문조사 타입 선택</h2>
                <p className="text-sm text-gray-500">AI가 생성할 설문 타입을 선택하세요</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* 기본 설문조사 */}
              <button
                onClick={() => {
                  setSurveyType('basic');
                  setShowSurveyTypeModal(false);
                }}
                className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-400 rounded-2xl p-6 text-left transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">기본 설문조사</h3>
                    <p className="text-sm text-gray-600 mb-3">타겟팅 없이 기본 설문조사</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-blue-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>객관식, 다중선택, 리커트척도 등</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>주관식 포함 가능</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* 타겟 설문조사 */}
              <button
                onClick={() => {
                  setSurveyType('targeted');
                  setShowSurveyTypeModal(false);
                }}
                className="w-full bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 hover:border-indigo-400 rounded-2xl p-6 text-left transition-all hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">타겟 설문조사</h3>
                    <p className="text-sm text-gray-600 mb-3">SKP 고객DB를 활용한 타겟팅 설문</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-indigo-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>모든 기본 질문 타입 포함</span>
                      </div>
                      <div className="flex items-center gap-2 text-indigo-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>주관식 수집 가능</span>
                      </div>
                      <div className="flex items-center gap-2 text-indigo-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>페르소나 기반 질문 생성</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-24 px-4">
      {/* Header */}
      <div className="py-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-lg">AI 설문 생성</h1>
          <span className="text-xs text-gray-500">
            Step {currentStep} / {totalSteps}
          </span>
        </div>
        <button onClick={() => navigate(createPageUrl('ClientHome'))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Home className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-1.5 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="min-h-[400px]"
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 px-6">
        <div className="max-w-xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1 || isGenerating}
            className="flex-1 h-14 text-base font-bold rounded-xl border-gray-200"
          >
            이전
          </Button>
          
          {currentStep === totalSteps ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-[2] h-14 text-base font-bold rounded-xl bg-[#3182F6] hover:bg-[#1B64DA] text-white shadow-lg shadow-blue-100"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI로 생성하기
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isCurrentStepValid()}
              className="flex-[2] h-14 text-base font-bold rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
            >
              다음
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}