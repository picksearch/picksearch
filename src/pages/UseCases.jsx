import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, TrendingUp, Users, ShoppingBag, Search, Lightbulb, Check, Target, PlayCircle, BarChart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
export default function UseCases() {
  const navigate = useNavigate();

  const handleTrySurvey = (surveyData) => {
    navigate(`${createPageUrl('TakeSurvey')}?preview=true`, { 
      state: { previewData: surveyData } 
    });
  };

  const cases = [
    {
      category: "신제품 출시",
      icon: <ShoppingBag className="w-5 h-5 text-pink-500" />,
      color: "bg-pink-100 text-pink-700",
      gradient: "from-pink-500 to-pink-300",
      title: "2030 여성 타겟 뷰티 브랜드 A사",
      problem: "신제품 패키지 소재 결정의 어려움",
      solution: "타겟 설문으로 20-30대 여성 500명 대상 A/B 테스트 진행",
      result: "선호도 70% 이상의 소재 선정 후 출시 → 초기 판매량 목표 150% 달성",
      surveyData: {
        title: "신제품 뷰티 패키지 선호도 조사",
        description: "친환경 패키지와 고급 패키지 중 2030 여성들이 선호하는 디자인을 찾습니다.",
        questions: [
          {
            id: 1,
            question_type: "multiple_choice",
            question_text: "색조 화장품 구매 시 환경 친화성(친환경 패키지 등)을 고려하시나요?",
            options: ["매우 고려한다", "어느 정도 고려한다", "보통이다", "별로 고려하지 않는다", "전혀 고려하지 않는다"]
          },
          {
            id: 2,
            question_type: "image_choice",
            question_text: "다음 두 가지 패키지 중 어느 쪽을 더 선호하시나요?",
            image_urls: [
              "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=500&auto=format&fit=crop", // Kraft/Eco
              "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=500&auto=format&fit=crop"  // Black/Luxury
            ],
            image_descriptions: [
              "친환경 크라프트 패키지 (Eco-friendly)",
              "블랙 종이 패키지 (모던하고 고급스러운 느낌)"
            ]
          },
          {
            id: 3,
            question_type: "multiple_choice",
            question_text: "해당 패키지를 선택한 이유는 무엇인가요?",
            options: [
              "제품과 잘 어울린다고 느껴서",
              "디자인이 마음에 들어서",
              "브랜드 이미지와 잘 맞는다고 느껴서",
              "환경 친화성을 고려해서",
              "기타"
            ]
          },
          {
            id: 4,
            question_type: "ranking",
            question_text: "화장품 패키지에서 가장 중요한 요소는 무엇이라고 생각하시나요?",
            options: [
              "디자인",
              "재활용 가능성",
              "내용물의 안전성",
              "사용의 편리함"
            ]
          },
          {
            id: 5,
            question_type: "short_answer",
            question_text: "선호하는 패키지 색상 또는 요소가 있다면 자유롭게 작성해주세요."
          }
        ]
      }
    },
    {
      category: "트렌드 조사",
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      color: "bg-purple-100 text-purple-700",
      gradient: "from-purple-500 to-purple-300",
      title: "패션 브랜드 E사",
      problem: "다음 시즌 스타일 라인 판단 어려움",
      solution: "10-40대 남여 500명 타겟으로 선호하는 스타일 조사",
      result: "미니멀, 스트릿 선호도 확인 → 봄 시즌 불필요한 재고 줄어듦",
      surveyData: {
        title: "SPA 브랜드 트렌드 조사",
        description: "다음 시즌 패션 트렌드를 파악하기 위한 설문입니다.",
        questions: [
          {
            id: 1,
            question_type: "likert_scale",
            question_text: "최근 3개월간 SPA 브랜드 제품 구매 빈도는 증가했나요?"
          },
          {
            id: 2,
            question_type: "multiple_select",
            question_text: "최근 SPA 브랜드에서 주로 구매한 제품은 무엇인가요?",
            options: ["상의(티셔츠/셔츠/니트)", "하의(바지/스커트)", "아우터", "원피스", "기타"]
          },
          {
            id: 3,
            question_type: "multiple_choice",
            question_text: "SPA 브랜드를 선택하는 주요 이유는 무엇인가요?",
            options: ["트렌드 반영이 빠름", "합리적인 가격", "제품 종류가 다양함", "접근성이 좋음(매장 많음)", "기타"]
          },
          {
            id: 4,
            question_type: "multiple_choice",
            question_text: "최근 가장 선호하는 패션 스타일은 무엇인가요?",
            options: ["미니멀/캐주얼", "스트리트", "포멀/클래식", "스포티/애슬레저", "기타"]
          },
          {
            id: 5,
            question_type: "multiple_choice",
            question_text: "옷을 구매할 때, 가장 중요하게 고려하는 요소는 무엇인가요?",
            options: ["트렌디한 디자인/스타일", "가격/가성비", "착용감/핏", "소재/품질", "지속가능성(친환경성)"]
          }
        ]
      }
    },
    {
      category: "시장 조사",
      icon: <Search className="w-5 h-5 text-blue-500" />,
      color: "bg-blue-100 text-blue-700",
      gradient: "from-blue-500 to-blue-300",
      title: "건강기능식품 스타트업 B사",
      problem: "직장인들의 영양제 섭취 습관 파악 필요",
      solution: "직장인 타겟 상세 설정(3040/사무직) 후 생활 패턴 조사",
      result: "점심 식후 섭취가 가장 많다는 데이터 확보 → 점심 시간대 마케팅 집중",
      surveyData: {
        title: "직장인 영양제 섭취 습관 조사",
        description: "직장인들의 건강 관리 및 영양제 섭취 패턴을 알아봅니다.",
        questions: [
          {
            id: 1,
            question_type: "multiple_choice",
            question_text: "평일 아침 기상 시간은 몇 시인가요?",
            options: ["6시 이전", "6시~7시", "7시~8시", "8시 이후"]
          },
          {
            id: 2,
            question_type: "multiple_choice",
            question_text: "하루 중 피로를 가장 많이 느끼는 시간대는 언제인가요?",
            options: ["오전", "오후", "저녁", "종일 피로함", "거의 피로하지 않음"]
          },
          {
            id: 3,
            question_type: "multiple_select",
            question_text: "일과 후 주요 활동은 무엇인가요?",
            options: ["운동(헬스/런닝 등)", "휴식(누워있기, TV 등)", "자기계발/공부", "육아", "외식/친목", "기타"]
          },
          {
            id: 4,
            question_type: "likert_scale",
            question_text: "평소 스트레스를 받고 있나요?"
          },
          {
            id: 5,
            question_type: "numeric_rating",
            question_text: "현재 먹고 있는 영양제 종류의 수를 선택해주세요 (0~10개)"
          },
          {
            id: 6,
            question_type: "multiple_select",
            question_text: "현재 섭취 중이거나 향후 섭취를 고려하고 있는 영양제는 무엇인가요?",
            options: ["면역력/비타민(멀티비타민·C·D 등)", "피로·간 건강(밀크씨슬 등)", "눈 건강(루테인 등)", "장 건강(유산균)", "기타"]
          },
          {
            id: 7,
            question_type: "multiple_choice",
            question_text: "영양제를 언제 섭취하는 게 적절하다고 생각하십니까?",
            options: ["기상 직후", "아침 식사 후", "점심 식사 후", "저녁 식사 후", "취침 전"]
          },
          {
            id: 8,
            question_type: "multiple_select",
            question_text: "영양제를 섭취하는 가장 큰 이유는 무엇이라고 생각하십니까?",
            options: ["건강 유지", "피로 회복", "면역력 증진", "다이어트 보조"]
          },
          {
            id: 9,
            question_type: "ranking",
            question_text: "영양제 구매 시 가장 고려하는 요소는 무엇인가요?",
            options: ["성분/효능", "브랜드 신뢰도", "가격", "리뷰/추천", "편리한 복용법(스틱·젤리 등)"]
          },
          {
            id: 10,
            question_type: "ranking",
            question_text: "앞으로 가장 필요하다고 생각하는 건강 관리 영역은 무엇인가요?",
            options: ["면역력·체력 관리", "스트레스·수면 관리", "장 건강", "눈 건강", "체중·대사 관리"]
          }
        ]
      }
    },
    {
      category: "만족도 조사",
      icon: <Users className="w-5 h-5 text-green-500" />,
      color: "bg-green-100 text-green-700",
      gradient: "from-green-500 to-green-300",
      title: "O2O 서비스 플랫폼 C사",
      problem: "앱 이탈률 증가 원인 불명",
      solution: "최근 3개월 내 접속 이력이 있는 고객 대상 심층 설문",
      result: "결제 과정의 복잡성 발견 및 UX 개선 → 이탈률 20% 감소",
      surveyData: {
        title: "앱 서비스 이용 만족도 조사",
        description: "서비스 품질 향상을 위한 고객 만족도 조사입니다.",
        questions: [
          {
            id: 1,
            question_type: "likert_scale",
            question_text: "전반적인 서비스 이용에 만족하시나요?"
          },
          {
            id: 2,
            question_type: "likert_scale",
            question_text: "앱 사용이 전반적으로 쉽고 직관적이라고 느끼시나요?"
          },
          {
            id: 3,
            question_type: "multiple_select",
            question_text: "서비스 이용 중 가장 불편했던 점은 무엇인가요?",
            options: ["앱 로딩 속도", "복잡한 결제 과정", "원하는 정보 찾기 어려움", "고객센터 연결 지연"]
          },
          {
            id: 4,
            question_type: "likert_scale",
            question_text: "향후에도 이 앱을 계속 사용할 의향이 있으신가요?"
          },
          {
            id: 5,
            question_type: "numeric_rating",
            question_text: "이 서비스를 주변에 추천할 의향이 있으신가요? (0점=절대 추천하지 않음, 10점=매우 추천함)"
          }
        ]
      }
    },
    {
      category: "아이디어 검증",
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      color: "bg-amber-100 text-amber-700",
      gradient: "from-amber-500 to-amber-300",
      title: "예비 창업자 D님",
      problem: "반려동물 수제 간식 사업성 검증",
      solution: "반려동물 보유 가구 타겟으로 구매 의향 및 적정 가격 조사",
      result: "월 평균 지출액 및 선호 간식 타입 데이터 확보로 사업 계획 구체화",
      surveyData: {
        title: "반려동물 수제 간식 사업성 검증",
        description: "반려동물 수제 간식 창업을 위한 사전 설문조사입니다.",
        questions: [
          {
            id: 1,
            question_type: "multiple_choice",
            question_text: "키우고 계신 반려동물은 무엇인가요?",
            options: ["강아지", "고양이", "설치류", "기타", "없음"]
          },
          {
            id: 2,
            question_type: "multiple_choice",
            question_text: "반려동물 간식 구매 시 월 평균 지출액은 얼마인가요?",
            options: ["1만원 미만", "1~3만원", "3~5만원", "5~10만원", "10만원 이상"]
          },
          {
            id: 3,
            question_type: "image_choice",
            question_text: "두 가지 유형의 간식 중 선호하는 간식 형태는 어떤가요?",
            image_urls: [
              "https://images.unsplash.com/photo-1628254747021-5963267901d1?q=80&w=500&auto=format&fit=crop", // Jerky
              "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=500&auto=format&fit=crop"  // Cookie/Bakery
            ],
            image_descriptions: [
              "건조 육포형",
              "베이커리/쿠키형"
            ]
          },
          {
            id: 4,
            question_type: "multiple_select",
            question_text: "당신의 반려동물은 어떤 맛의 간식을 좋아하나요?",
            options: ["닭고기", "소고기", "생선", "채소/과일", "기타"]
          },
          {
            id: 5,
            question_type: "ranking",
            question_text: "수제 간식에 있어서 중요하다고 생각하는 순으로 선택해주세요.",
            options: ["맛", "가격", "재료의 신선함", "브랜드 신뢰도"]
          }
        ]
      }
    },
    {
      category: "서비스 기획",
      icon: <BarChart className="w-5 h-5 text-cyan-500" />,
      color: "bg-cyan-100 text-cyan-700",
      gradient: "from-cyan-500 to-cyan-300",
      title: "생산성 앱 F사",
      problem: "유료 기능 개발 우선순위 결정",
      solution: "기존 무료 사용자 대상 '가장 필요한 기능' 투표 진행",
      result: "PC 연동 기능 요청 1위 → 개발 로드맵 수정하여 사용자 락인 효과 증대",
      surveyData: {
        title: "생산성 앱 신규 기능 투표",
        description: "사용자 여러분의 의견을 반영하여 더 나은 앱을 만듭니다.",
        questions: [
          {
            id: 1,
            question_type: "multiple_select",
            question_text: "현재 앱 사용 시 가장 불편하거나 부족하다고 느끼는 점은 무엇인가요?",
            options: ["복잡한 화면 구성과 사용법 (UI/UX)", "기기 간 동기화 속도 및 오류", "타 서비스(캘린더, 메일 등)와의 연동 부족", "데이터 로딩 및 앱 구동 속도 저하", "기타"]
          },
          {
            id: 2,
            question_type: "ranking",
            question_text: "가장 필요하다고 생각하는 기능을 순서대로 선택해주세요.",
            options: ["PC버전 연동", "위젯 기능", "다크 모드", "친구와 공유하기", "백업/복원"]
          },
          {
            id: 3,
            question_type: "multiple_choice",
            question_text: "새로운 기능이 추가된다면, 주로 어떤 상황이나 기기에서 활용하실 예정인가요?",
            options: ["이동 중이나 외부에서 (모바일 중심)", "사무실이나 집에서 집중 업무 시 (데스크톱/노트북 중심)", "회의나 미팅 시 가볍게 기록 (태블릿 중심)", "모든 기기에서 고르게 활용"]
          },
          {
            id: 4,
            question_type: "likert_scale",
            question_text: "해당 기능이 유료로 제공된다면 구독할 의향이 있으신가요?"
          },
          {
            id: 5,
            question_type: "short_answer",
            question_text: "이 외에 \"이런 기능이 있으면 정말 편리하겠다\"라고 생각해보신 아이디어가 있다면 자유롭게 말씀해 주세요."
          }
        ]
      }
    }
  ];

  return (
    <div className="min-h-screen bg-[#F2F4F6]">
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24 space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-b-3xl p-6 pt-10 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">픽서치 활용 사례</h1>
        </div>
        <p className="text-blue-100 opacity-90">
          다른 사람들은 어떻게 쓰고 있을까?<br/>
          성공적인 설문 활용 비법 💡
        </p>
      </div>

      {/* Intro Text */}
      <div className="px-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          <h3 className="font-bold text-gray-800 mb-2">🎯 목표에 딱 맞는 설문 설계</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            실제 성공 사례를 참고하여 더 효과적인 설문을 만들어보세요.
          </p>
        </div>
      </div>

      {/* Case Studies */}
      <div className="px-4 space-y-6">
        {cases.map((item, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-1.5 bg-gradient-to-r ${item.gradient}`} />
              <CardContent className="p-5">
                <div className="flex items-center mb-3">
                  <Badge className={`${item.color} border-0 flex items-center gap-1 px-2 py-1`}>
                    {item.icon}
                    {item.category}
                  </Badge>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-4">{item.title}</h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <span className="text-xs font-bold text-gray-500 block mb-1">Problem</span>
                    <p className="text-sm text-gray-700">{item.problem}</p>
                  </div>
                  
                  <div className="flex justify-center">
                    <TrendingUp className="w-5 h-5 text-gray-300" />
                  </div>

                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <span className="text-xs font-bold text-blue-500 block mb-1">Solution</span>
                    <p className="text-sm text-blue-800">{item.solution}</p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-bold text-green-600">Result</span>
                    </div>
                    <p className="text-sm text-green-800 font-medium">{item.result}</p>
                  </div>

                  <Button 
                    onClick={() => handleTrySurvey(item.surveyData)}
                    className="w-full mt-2 bg-gray-900 text-white hover:bg-gray-800 rounded-xl h-10 text-sm font-bold"
                  >
                    예시 설문 체험해보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>


    </div>
    </div>
  );
}