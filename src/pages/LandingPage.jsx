import React, { useState, useEffect } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle, X, Target, TrendingUp, Users, Sparkles, ArrowRight, Zap, Shield, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LandingPage() {
  const [typedText, setTypedText] = useState("");
  const [showTargetOptions, setShowTargetOptions] = useState(false);
  const [showAISearching, setShowAISearching] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);

  const surveyExamples = [
    {
      input: "20대 여성 립스틱 선호도 조사해줘",
      title: "20대 여성 립스틱 선호도 조사",
      questions: "5개 질문 • 예상 소요시간 3분",
      badges: [
        { text: "객관식 3개", color: "blue" },
        { text: "이미지 2개", color: "purple" }
      ]
    },
    {
      input: "30대 남성 자동차 구매 의향 분석",
      title: "30대 남성 자동차 구매 의향 분석",
      questions: "7개 질문 • 예상 소요시간 5분",
      badges: [
        { text: "객관식 4개", color: "blue" },
        { text: "순위형 2개", color: "amber" },
        { text: "주관식 1개", color: "gray" }
      ]
    },
    {
      input: "40대 부모 교육 서비스 니즈 파악",
      title: "40대 부모 교육 서비스 니즈 파악",
      questions: "6개 질문 • 예상 소요시간 4분",
      badges: [
        { text: "객관식 3개", color: "blue" },
        { text: "다중선택 2개", color: "violet" },
        { text: "리커트 1개", color: "indigo" }
      ]
    },
    {
      input: "Z세대 패션 트렌드 조사하기",
      title: "Z세대 패션 트렌드 조사",
      questions: "8개 질문 • 예상 소요시간 5분",
      badges: [
        { text: "이미지선택 3개", color: "purple" },
        { text: "객관식 4개", color: "blue" },
        { text: "수치평정 1개", color: "teal" }
      ]
    },
    {
      input: "50대 건강식품 구매 패턴 분석해줘",
      title: "50대 건강식품 구매 패턴 분석",
      questions: "6개 질문 • 예상 소요시간 4분",
      badges: [
        { text: "객관식 4개", color: "blue" },
        { text: "순위형 1개", color: "amber" },
        { text: "주관식 1개", color: "gray" }
      ]
    }
  ];

  const targetExamples = [
    { keyword: "최근 30일 PS5 검색", count: 38492, message: "최근 PS5 게임 검색했어요" },
    { keyword: "어제 스킨케어 구매", count: 24891, message: "어제 스킨케어 구매했어요" },
    { keyword: "이번 주 자동차 관심", count: 15672, message: "이번주 자동차 앱 봤어요" },
    { keyword: "최근 부동산 앱 실행", count: 42183, message: "최근 부동산 앱 켰어요" },
    { keyword: "지난달 육아용품 검색", count: 31204, message: "지난달 육아용품 샀어요" }
  ];

  const currentExample = surveyExamples[currentExampleIndex];
  const currentTarget = targetExamples[currentTargetIndex];

  const [selectedTargetIndices, setSelectedTargetIndices] = useState([]);
  const [showCursor, setShowCursor] = useState(false);

  const getTargetOptionsForExample = (index) => {
    const options = [
      // 0. 20대 여성 립스틱
      [
        { label: "20대 여성", icon: "👩", correct: true },
        { label: "뷰티 관심", icon: "💄", correct: true },
        { label: "쇼핑앱 이용", icon: "🛍️", correct: false },
        { label: "고소비층", icon: "💳", correct: false },
        { label: "명품 선호", icon: "💎", correct: false },
        { label: "강남권", icon: "📍", correct: false }
      ],
      // 1. 30대 남성 자동차
      [
        { label: "30대 남성", icon: "👨", correct: true },
        { label: "자동차 관심", icon: "🚗", correct: true },
        { label: "금융앱 이용", icon: "💰", correct: false },
        { label: "골프", icon: "⛳", correct: false },
        { label: "고소비층", icon: "💳", correct: false },
        { label: "서울/경기", icon: "📍", correct: false }
      ],
      // 2. 40대 부모 교육
      [
        { label: "40대 부모", icon: "👨‍👩‍👦", correct: true },
        { label: "교육 관심", icon: "📚", correct: true },
        { label: "육아앱 이용", icon: "👶", correct: false },
        { label: "학원 탐색", icon: "🎓", correct: false },
        { label: "중산층", icon: "💳", correct: false },
        { label: "전국", icon: "🗺️", correct: false }
      ],
      // 3. Z세대 패션
      [
        { label: "Z세대", icon: "🎮", correct: true },
        { label: "패션 관심", icon: "👗", correct: true },
        { label: "SNS 활동", icon: "📱", correct: false },
        { label: "온라인쇼핑", icon: "🛍️", correct: false },
        { label: "20대", icon: "👥", correct: false },
        { label: "학생", icon: "🎓", correct: false }
      ],
      // 4. 50대 건강식품
      [
        { label: "50대", icon: "👴", correct: true },
        { label: "건강 관심", icon: "💪", correct: true },
        { label: "운동 관심", icon: "🏃", correct: false },
        { label: "배달앱 이용", icon: "🍔", correct: false },
        { label: "골프", icon: "⛳", correct: false },
        { label: "고소비층", icon: "💳", correct: false }
      ]
    ];
    return options[index % options.length];
  };

  const targetOptions = getTargetOptionsForExample(currentExampleIndex);

  // Survey typing animation with cycling through steps
  useEffect(() => {
    let index = 0;
    let isDeleting = false;
    let timeoutIds = [];
    
    const timer = setInterval(() => {
      if (!isDeleting && index <= currentExample.input.length) {
        setTypedText(currentExample.input.slice(0, index));
        index++;
        if (index === currentExample.input.length + 1) {
          // Step 1: Show target options
          const t1 = setTimeout(() => {
            setShowTargetOptions(true);
            setSelectedTargetIndices([]);
          }, 500);
          timeoutIds.push(t1);
          
          // Step 2: Show cursor and select first target
          const t2 = setTimeout(() => {
            setShowCursor(true);
          }, 1200);
          timeoutIds.push(t2);
          
          const t3 = setTimeout(() => {
            const opts = getTargetOptionsForExample(currentExampleIndex);
            const correctIndices = opts.map((opt, idx) => opt.correct ? idx : -1).filter(idx => idx !== -1);
            if (correctIndices[0] !== undefined) {
              setSelectedTargetIndices([correctIndices[0]]);
            }
          }, 2300);
          timeoutIds.push(t3);
          
          // Step 2.5: Select second target
          const t3_5 = setTimeout(() => {
            const opts = getTargetOptionsForExample(currentExampleIndex);
            const correctIndices = opts.map((opt, idx) => opt.correct ? idx : -1).filter(idx => idx !== -1);
            setSelectedTargetIndices(correctIndices);
          }, 3200);
          timeoutIds.push(t3_5);
          
          // Step 3: Hide cursor and show AI searching
          const t4 = setTimeout(() => {
            setShowCursor(false);
            setShowAISearching(true);
          }, 3700);
          timeoutIds.push(t4);
          
          // Step 4: Show final survey
          const t5 = setTimeout(() => {
            setShowSurvey(true);
          }, 5200);
          timeoutIds.push(t5);
          
          // Step 5: Start deleting
          const t6 = setTimeout(() => {
            isDeleting = true;
          }, 7500);
          timeoutIds.push(t6);
        }
      } else if (isDeleting && index >= 0) {
        setTypedText(currentExample.input.slice(0, index));
        index--;
        if (index === 0) {
          setShowSurvey(false);
          setShowTargetOptions(false);
          setShowAISearching(false);
          setSelectedTargetIndices([]);
          setShowCursor(false);
          isDeleting = false;
          clearInterval(timer);
          setTimeout(() => {
            setCurrentExampleIndex((prev) => (prev + 1) % surveyExamples.length);
          }, 500);
        }
      }
    }, isDeleting ? 20 : 50);
    
    return () => {
      clearInterval(timer);
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [currentExampleIndex]);

  // Target example cycling
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTargetIndex((prev) => (prev + 1) % targetExamples.length);
    }, 4000);
    
    return () => clearInterval(timer);
  }, []);

  // Static number display - no animation
  const AnimatedNumber = ({ target, suffix = "" }) => {
    return (
      <span>
        {target.toLocaleString()}{suffix}
      </span>
    );
  };

  // Static count display - no animation
  const CountUpOnce = ({ target }) => {
    return (
      <span className="font-bold text-[#3182F6] text-lg">
        {target.toLocaleString()}명
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F2F4F6] relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl"
          animate={{
            y: [0, 50, 0],
            x: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-40 right-10 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl"
          animate={{
            y: [0, -40, 0],
            x: [0, -20, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-200/20 rounded-full blur-3xl"
          animate={{
            y: [0, 60, 0],
            x: [0, -40, 0],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Mobile Container */}
      <div className="max-w-[440px] mx-auto bg-white min-h-screen shadow-2xl relative z-10">
        
        {/* 1. Hero Section */}
        <section className="px-6 pt-16 pb-12 bg-gradient-to-b from-blue-50 to-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-[#191F28] leading-tight mb-4">
              불특정 다수는 <br/>끝났습니다.
            </h1>
            <h2 className="text-3xl font-bold text-[#3182F6] leading-tight mb-6">
              이제 AI와 <br/>정밀 데이터입니다.
            </h2>
            <p className="text-lg text-[#8B95A1] mb-8">
              30초 만에 설문 생성부터 타겟팅까지.
            </p>

            {/* AI Demo Animation - Vertical Flow */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-8 relative overflow-hidden">
              {/* Background Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-100/30 to-orange-100/30 rounded-full blur-3xl" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3182F6] to-[#4294FF] rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-semibold text-[#191F28]">AI 설문 생성</span>
                </div>

                {/* Step 1: Prompt Input */}
                <div className="bg-gray-50 rounded-2xl p-4 h-[60px] flex items-center relative overflow-hidden">
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                  <p className="text-[#191F28] font-medium relative z-10">
                    {typedText}
                    <span className="inline-block w-0.5 h-5 bg-[#3182F6] ml-1 animate-pulse" />
                  </p>
                </div>

                {/* Step 2: Target Selection - Always visible with fixed height */}
                <div className="relative h-[160px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      showTargetOptions ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <span className={`text-xs font-bold ${showTargetOptions ? 'text-[#3182F6]' : 'text-gray-400'}`}>1</span>
                    </div>
                    <p className={`text-sm font-medium ${showTargetOptions ? 'text-[#191F28]' : 'text-gray-400'}`}>타겟 선택</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 relative">
                    {targetOptions.map((option, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: showTargetOptions ? 1 : 0.3, 
                          scale: selectedTargetIndices.includes(idx) ? 1.05 : 1,
                        }}
                        transition={{ delay: idx * 0.05 }}
                        className={`bg-gradient-to-br ${
                          selectedTargetIndices.includes(idx)
                            ? 'from-blue-100 to-blue-200 border-blue-400 shadow-lg'
                            : 'from-blue-50 to-blue-100 border-blue-200'
                        } border-2 rounded-xl p-2 text-center transition-all relative ${
                          !showTargetOptions && 'grayscale'
                        }`}
                      >
                        <div className="text-xl mb-0.5">{option.icon}</div>
                        <div className="text-[10px] font-bold text-[#191F28] leading-tight">{option.label}</div>
                        
                        {selectedTargetIndices.includes(idx) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#3182F6] rounded-full flex items-center justify-center shadow-md"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                    
                    {/* Animated Cursor */}
                    {showCursor && (() => {
                      const correctIndices = targetOptions.map((opt, idx) => opt.correct ? idx : -1).filter(idx => idx !== -1);
                      const firstIdx = correctIndices[0] ?? 0;
                      const secondIdx = correctIndices[1] ?? firstIdx;
                      
                      // Calculate exact positions in a 3-column grid
                      // Each cell is approximately 100% / 3 = 33.33% wide
                      // Gap-2 = 0.5rem = 8px between cells
                      // Assuming container width ~360px, each cell ~112px, gap 8px
                      const getCellPosition = (idx) => {
                        const col = idx % 3;
                        const row = Math.floor(idx / 3);
                        // Center of each cell: (cellWidth + gap) * col + cellWidth/2
                        // Approximate: 120px per cell including gap, centered
                        return {
                          x: col * 120 + 56,  // 56 is approx half cell width
                          y: row * 68 + 34     // 68 is cell height + gap, 34 is half
                        };
                      };
                      
                      const firstPos = getCellPosition(firstIdx);
                      const secondPos = getCellPosition(secondIdx);
                      
                      return (
                        <motion.div
                          className="absolute pointer-events-none z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            animate={{
                              x: [-20, firstPos.x, secondPos.x],
                              y: [-20, firstPos.y, secondPos.y]
                            }}
                            transition={{ duration: 2, times: [0, 0.45, 1], ease: "easeInOut" }}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#3182F6" stroke="white" strokeWidth="2"/>
                            </svg>
                          </motion.div>
                        </motion.div>
                      );
                    })()}
                  </div>
                </div>

                {/* Step 3: AI Searching - Always visible with fixed height */}
                <div className="relative h-[220px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      showAISearching ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <span className={`text-xs font-bold ${showAISearching ? 'text-[#3182F6]' : 'text-gray-400'}`}>2</span>
                    </div>
                    <p className={`text-sm font-medium ${showAISearching ? 'text-[#191F28]' : 'text-gray-400'}`}>AI 분석</p>
                  </div>
                  <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border transition-all ${
                    showAISearching ? 'border-blue-200 opacity-100' : 'border-gray-200 opacity-30 grayscale'
                  }`}>
                    <div className="flex flex-col items-center justify-center gap-4">
                      <motion.div
                        animate={showAISearching ? { 
                          rotate: 360,
                          scale: [1, 1.1, 1]
                        } : {}}
                        transition={showAISearching ? { 
                          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                          scale: { duration: 1, repeat: Infinity }
                        } : {}}
                        className="w-16 h-16 bg-gradient-to-br from-[#3182F6] to-[#4294FF] rounded-2xl flex items-center justify-center"
                      >
                        <Sparkles className="w-8 h-8 text-white" />
                      </motion.div>
                      <div className="text-center">
                        <p className="font-bold text-[#191F28] mb-1">
                          {showAISearching ? 'AI가 최적의 설문을 생성중...' : 'AI 분석 대기중...'}
                        </p>
                        <p className="text-xs text-[#8B95A1]">타겟에 맞는 질문을 분석하고 있어요</p>
                      </div>
                      {showAISearching && (
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-[#3182F6] rounded-full"
                              animate={{ y: [0, -10, 0] }}
                              transition={{ 
                                duration: 0.6, 
                                repeat: Infinity,
                                delay: i * 0.2
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 4: Final Survey Result - Always visible with fixed height */}
                <div className="relative h-[180px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      showSurvey ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {showSurvey ? (
                        <CheckCircle className="w-4 h-4 text-[#3182F6]" />
                      ) : (
                        <span className="text-xs font-bold text-gray-400">3</span>
                      )}
                    </div>
                    <p className={`text-sm font-medium ${showSurvey ? 'text-[#191F28]' : 'text-gray-400'}`}>
                      {showSurvey ? '완성!' : '완성 대기중...'}
                    </p>
                  </div>
                  <div
                    className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 relative overflow-hidden transition-all ${
                      showSurvey ? 'border-[#3182F6]' : 'border-gray-200 grayscale'
                    }`}
                  >
                    {showSurvey && (
                      <motion.div
                        className="absolute top-2 right-2"
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-[#3182F6]" />
                      </motion.div>
                    )}

                    <div className="flex items-start gap-3 mb-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: showSurvey ? 1 : 0 }}
                        transition={{ delay: 0.2, type: "spring" }}
                      >
                        <CheckCircle className="w-5 h-5 text-[#3182F6] flex-shrink-0 mt-0.5" />
                      </motion.div>
                      <div>
                        <p className="font-bold text-[#191F28] mb-1">{currentExample.title}</p>
                        <p className="text-sm text-[#8B95A1]">{currentExample.questions}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {currentExample.badges.map((badge, idx) => (
                        <Badge 
                          key={idx}
                          className={`bg-${badge.color}-100 text-${badge.color}-700 border-0 text-xs`}
                        >
                          {badge.text}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 2. Problem vs Solution */}
        <section className="px-6 py-12 bg-white relative overflow-hidden">
          {/* Background Animation */}
          <motion.div
            className="absolute top-0 right-0 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-20"
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 20, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-20"
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, -20, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />

          <motion.h3 
            className="text-2xl font-bold text-[#191F28] mb-8 text-center relative z-10"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            기존 설문조사의 한계를 <br/>픽서치가 해결합니다
          </motion.h3>

          <div className="space-y-4 relative z-10">
            {/* Problem Card */}
            <motion.div
              initial={{ opacity: 0, x: -40, rotateY: -15 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.03,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-6 border-2 border-red-200 shadow-lg hover:shadow-2xl transition-all cursor-pointer"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="flex items-start gap-4">
                <motion.div 
                  className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <X className="w-7 h-7 text-white" strokeWidth={3} />
                </motion.div>
                <div className="flex-1">
                  <p className="font-extrabold text-red-900 mb-3 text-lg">기존 방식</p>
                  <ul className="space-y-2">
                    {[
                      { text: "비싼 비용 (응답당 5,000원~)", delay: 0.1 },
                      { text: "허수 응답 많음", delay: 0.2 },
                      { text: "타겟팅 불가능", delay: 0.3 },
                      { text: "설문 제작 어려움", delay: 0.4 }
                    ].map((item, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: item.delay }}
                        whileHover={{ x: 5, transition: { duration: 0.2 } }}
                        className="flex items-center gap-2 text-sm text-red-800 font-medium"
                      >
                        <motion.span 
                          className="w-1.5 h-1.5 bg-red-500 rounded-full"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                        />
                        {item.text}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* VS Badge */}
            <motion.div 
              className="flex justify-center -my-2 relative z-20"
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            >
              <motion.div 
                className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-2 rounded-full font-black text-sm shadow-xl"
                animate={{ 
                  boxShadow: [
                    "0 10px 30px rgba(0,0,0,0.3)",
                    "0 15px 40px rgba(0,0,0,0.5)",
                    "0 10px 30px rgba(0,0,0,0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                VS
              </motion.div>
            </motion.div>

            {/* Solution Card */}
            <motion.div
              initial={{ opacity: 0, x: 40, rotateY: 15 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.03,
                rotateY: -5,
                boxShadow: "0 20px 60px rgba(49, 130, 246, 0.3)",
                transition: { duration: 0.3 }
              }}
              className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-6 border-2 border-[#3182F6] shadow-xl hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Animated Background Sparkles */}
              <motion.div
                className="absolute top-0 right-0 w-20 h-20"
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Sparkles className="w-full h-full text-blue-200 opacity-30" />
              </motion.div>

              <div className="flex items-start gap-4 relative z-10">
                <motion.div
                  className="w-14 h-14 bg-gradient-to-br from-[#3182F6] to-[#4294FF] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  whileHover={{ rotate: [0, 10, -10, 10, 0], scale: 1.1, transition: { duration: 0.5 } }}
                  animate={{
                    boxShadow: [
                      "0 5px 20px rgba(49, 130, 246, 0.4)",
                      "0 8px 30px rgba(49, 130, 246, 0.6)",
                      "0 5px 20px rgba(49, 130, 246, 0.4)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircle className="w-7 h-7 text-white" strokeWidth={3} />
                </motion.div>
                <div className="flex-1">
                  <p className="font-extrabold text-[#191F28] mb-3 text-lg">픽서치</p>
                  <ul className="space-y-2">
                    {[
                      { text: "SKP 비실명 1.3억 ID", delay: 0.1, icon: "🎯" },
                      { text: "1/10 비용", delay: 0.2, icon: "💰" },
                      { text: "초정밀 타겟팅", delay: 0.3, icon: "🔍" },
                      { text: "AI 자동 생성", delay: 0.4, icon: "✨" },
                      { text: "이벤트 페이지 랜딩", delay: 0.5, icon: "🎉" }
                    ].map((item, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: item.delay }}
                        whileHover={{ 
                          x: 8, 
                          backgroundColor: "rgba(49, 130, 246, 0.1)",
                          borderRadius: "12px",
                          paddingLeft: "8px",
                          transition: { duration: 0.2 }
                        }}
                        className="flex items-center gap-2.5 text-sm text-[#191F28] font-semibold py-1 -ml-2"
                      >
                        <motion.span 
                          className="text-lg"
                          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                        >
                          {item.icon}
                        </motion.span>
                        <span>{item.text}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pulse Effect on Hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#3182F6]/10 to-[#4294FF]/10 rounded-3xl"
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </div>
        </section>

        {/* 3. SKP DMP Targeting */}
        <section className="px-6 py-12 bg-gradient-to-b from-white to-blue-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <Badge className="bg-[#3182F6] text-white border-0 mb-4">SKP DMP 연동</Badge>
              <h3 className="text-2xl font-bold text-[#191F28] mb-3">
                SKP 비실명 1.3억 ID의 <br/>행동 데이터 기반
              </h3>
              <p className="text-[#8B95A1]">
                '특정 행동을 한 사람'을 정확히 타게팅 합니다.
              </p>
            </div>

            {/* Visual Animation */}
            <div className="relative h-[336px] bg-white rounded-3xl p-6 shadow-xl border border-gray-100 overflow-hidden">
              {/* Animated Background Gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-purple-100/30 to-pink-100/30"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />

              {/* Animation Container - Full height but elements positioned in top area */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Many Dots - Converging to Center */}
                {[...Array(80)].map((_, i) => {
                  const angle = (i / 80) * Math.PI * 2;
                  const radius = 100 + Math.random() * 50;
                  const startX = Math.cos(angle) * radius;
                  const startY = Math.sin(angle) * radius;

                  return (
                    <motion.div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-2 h-2 bg-gray-300 rounded-full"
                      initial={{ x: startX, y: startY, opacity: 0.6, scale: 1 }}
                      animate={{
                        x: [startX, 0],
                        y: [startY, 0],
                        opacity: [0.6, 0],
                        scale: [1, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.008,
                        ease: "easeInOut"
                      }}
                    />
                  );
                })}

                {/* Background Moving Crowd */}
                {[...Array(15)].map((_, i) => {
                  const randomX = (Math.random() - 0.5) * 50;
                  const randomY = (Math.random() - 0.5) * 30;
                  return (
                    <motion.div
                      key={`bg-${i}`}
                      className="absolute top-1/2 w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center"
                      style={{
                        left: `${(i % 5) * 25}%`,
                        top: `${Math.floor(i / 5) * 35}%`
                      }}
                      animate={{
                        x: [0, randomX, 0],
                        y: [0, randomY, 0],
                        opacity: [0.3, 0.5, 0.3]
                      }}
                      transition={{
                        duration: 8 + Math.random() * 4,
                        repeat: Infinity,
                        delay: Math.random() * 4,
                        ease: "easeInOut"
                      }}
                    >
                      <span className="text-sm">🧑</span>
                    </motion.div>
                  );
                })}

                {/* Target Person - Forming from dots */}
                <motion.div
                  className="absolute top-[28%] left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.8, ease: "backOut" }}
                >
                  {/* Speech Bubble - Left Side */}
                  <motion.div
                    key={currentTargetIndex}
                    className="absolute -left-40 top-[-20px] bg-white rounded-2xl px-4 py-2.5 shadow-lg border border-blue-100 whitespace-nowrap"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      y: [0, -5, 0]
                    }}
                    transition={{
                      opacity: { delay: 0.2, duration: 0.5 },
                      x: { delay: 0.2, duration: 0.5 },
                      y: { delay: 0.7, duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <div className="text-xs font-bold text-gray-700">{currentTarget.message}</div>
                    {/* Speech Bubble Arrow */}
                    <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-l-[8px] border-l-white border-b-[8px] border-b-transparent"></div>
                  </motion.div>

                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-[#3182F6] to-[#4294FF] rounded-full flex items-center justify-center shadow-2xl"
                    animate={{ 
                      boxShadow: [
                        "0 10px 30px rgba(49, 130, 246, 0.3)",
                        "0 15px 40px rgba(49, 130, 246, 0.5)",
                        "0 10px 30px rgba(49, 130, 246, 0.3)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.span 
                      className="text-4xl"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.8, duration: 0.5 }}
                    >
                      🙋‍♂️
                    </motion.span>
                  </motion.div>
                </motion.div>
                </div>

              <motion.div
                key={currentTargetIndex}
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute top-[58%] left-6 right-6 z-10"
              >
                <motion.div 
                  className="bg-gradient-to-r from-[#3182F6] to-[#4294FF] rounded-2xl p-4 shadow-2xl"
                  animate={{ 
                    boxShadow: [
                      "0 10px 40px rgba(49, 130, 246, 0.3)",
                      "0 15px 50px rgba(49, 130, 246, 0.5)",
                      "0 10px 40px rgba(49, 130, 246, 0.3)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3 text-white">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Target className="w-5 h-5" />
                    </motion.div>
                    <span className="font-bold text-sm">{currentTarget.keyword}</span>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                key={`count-${currentTargetIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-6 left-6 right-6 z-10"
              >
                <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-[#3182F6]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#8B95A1]">타겟 모수</span>
                    <CountUpOnce target={currentTarget.count} />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100"
              >
                <p className="text-2xl font-bold text-[#3182F6] mb-1">
                  <AnimatedNumber target={300} suffix="+" />
                </p>
                <p className="text-xs text-[#8B95A1]">타겟 옵션</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100"
              >
                <p className="text-2xl font-bold text-[#3182F6] mb-1">
                  1.3억
                </p>
                <p className="text-xs text-[#8B95A1]">비실명 ID</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100"
              >
                <p className="text-2xl font-bold text-[#3182F6] mb-1">실시간</p>
                <p className="text-xs text-[#8B95A1]">행동 추적</p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* 4. Survey to Conversion */}
        <section className="px-6 py-12 bg-blue-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <Badge className="bg-gradient-to-r from-[#3182F6] to-[#4294FF] text-white border-0 mb-4">
                🚀 평균 전환율 3.9배 상승
              </Badge>
              <h3 className="text-2xl font-bold text-[#191F28] mb-3">
                설문이 끝이 아닙니다
              </h3>
              <p className="text-[#8B95A1]">
                응답자를 구매 페이지로 즉시 이동
              </p>
            </div>

            {/* Conversion Flow */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-[#3182F6]">
                    1
                  </div>
                  <p className="font-bold text-[#191F28]">설문 완료</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-[#3182F6] text-center font-medium">✓ 응답 제출 완료</p>
                </div>
              </motion.div>

              <div className="flex justify-center">
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight className="w-6 h-6 text-[#3182F6] transform rotate-90" />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-[#3182F6]">
                    2
                  </div>
                  <p className="font-bold text-[#191F28]">랜딩페이지 이동</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#191F28] font-medium">즉시 이동</span>
                    <TrendingUp className="w-5 h-5 text-[#3182F6]" />
                  </div>
                </div>
              </motion.div>

              <div className="flex justify-center">
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <ArrowRight className="w-6 h-6 text-[#3182F6] transform rotate-90" />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-[#3182F6]">
                    3
                  </div>
                  <p className="font-bold text-[#191F28]">쿠폰 제공 (이벤트 제공)</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-dashed border-blue-300">
                  <p className="text-lg font-bold text-[#3182F6] text-center">50% 할인 쿠폰</p>
                </div>
              </motion.div>
              </div>
              </motion.div>
              </section>

              {/* 5. Social Proof */}
              <section className="px-6 py-12 bg-white">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-2xl font-bold text-[#191F28] mb-8 text-center">
                    검증된 성과
                  </h3>

                  <div className="space-y-4 mb-8">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Award className="w-6 h-6 text-[#3182F6]" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-[#3182F6] mb-1">
                            CPA <AnimatedNumber target={45} suffix="%" /> 절감
                          </p>
                          <p className="text-sm text-[#4294FF] mb-2">금융 브랜드 A사</p>
                          <p className="text-xs text-[#6B7280]">정밀 타겟팅으로 불필요한 노출 최소화</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                      className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-[#3182F6]" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-[#3182F6] mb-1">
                            구매전환 <span className="text-[#4294FF]">3.9</span>배
                          </p>
                          <p className="text-sm text-[#4294FF] mb-2">뷰티 브랜드 B사</p>
                          <p className="text-xs text-[#6B7280]">설문 후 랜딩페이지 연결로 즉시 구매 유도</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                      className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl p-6 border border-blue-200 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-[#3182F6]" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-[#3182F6] mb-1">
                            만족도 <AnimatedNumber target={28} suffix="%" /> 상승
                          </p>
                          <p className="text-sm text-[#4294FF] mb-2">공공기관 C</p>
                          <p className="text-xs text-[#6B7280]">정확한 타겟 설문으로 응답 품질 향상</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

            {/* Trust Badges - Partner Logos */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-100 shadow-lg">
              <div className="text-center mb-6">
                <h4 className="text-lg font-bold text-[#191F28] mb-2">파트너사</h4>
                <div className="w-16 h-1 bg-gradient-to-r from-[#3182F6] to-[#4294FF] rounded-full mx-auto"></div>
              </div>

              {/* Logo Slider */}
              <div className="relative h-32 overflow-hidden mb-8">
                <motion.div
                  className="flex gap-4 absolute"
                  animate={{ x: [0, -1400] }}
                  transition={{ 
                    duration: 35, 
                    repeat: Infinity, 
                    ease: "linear",
                    repeatType: "loop"
                  }}
                >
                  {/* First set */}
                  {[
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/d6e017d22_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/52658532b_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/ea2b39ecc_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/a82dc1a03_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/c57ecb9f9_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/808a1f123_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/d4da65185_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/ca70770a6_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/1b81d255f_image.png" },
                  ].map((brand, idx) => (
                    <div 
                      key={`first-${idx}`}
                      className="w-28 h-28 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md border border-gray-100 bg-white overflow-hidden"
                    >
                      <img 
                        src={brand.img} 
                        alt="Partner Logo"
                        className="w-full h-full object-contain p-3"
                      />
                    </div>
                  ))}
                  {/* Duplicate set for seamless loop */}
                  {[
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/d6e017d22_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/52658532b_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/ea2b39ecc_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/a82dc1a03_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/c57ecb9f9_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/808a1f123_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/d4da65185_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/ca70770a6_image.png" },
                    { img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/1b81d255f_image.png" },
                  ].map((brand, idx) => (
                    <div 
                      key={`second-${idx}`}
                      className="w-28 h-28 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md border border-gray-100 bg-white overflow-hidden"
                    >
                      <img 
                        src={brand.img} 
                        alt="Partner Logo"
                        className="w-full h-full object-contain p-3"
                      />
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-6 border border-blue-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3182F6] to-[#4294FF] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-[#191F28] leading-relaxed">
                      <span className="font-bold text-[#3182F6]">픽서치는 SK 그룹 94% 이상의 회사들</span>로부터 비식별 데이터를 공급 받고 있습니다.
                      <br />
                      커머스부터 모바일 방송까지 다양한 서비스의 이용 행태를 DMP에 담아
                      <br />
                      <span className="font-bold text-[#3182F6]">1.3억개의 ADID와 쿠키 ID</span>를 보유하고 있습니다.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* 6. Pricing */}
        <section className="px-6 py-12 bg-gradient-to-b from-white to-gray-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-[#191F28] mb-3 text-center">
              투명한 가격
            </h3>
            <p className="text-[#8B95A1] text-center mb-8">
              숨은 비용 없이 명확하게
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 25px 50px rgba(49, 130, 246, 0.2)",
              }}
              className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden transition-all"
            >
              {/* Blue Header */}
              <div className="bg-gradient-to-r from-[#3182F6] to-[#4294FF] px-6 py-4">
                <h4 className="text-white text-2xl font-bold text-center">1-Day 배너</h4>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Price Section */}
                <div className="text-center">
                  <p className="text-4xl font-bold text-[#191F28] mb-2">
                    330,000 <span className="text-2xl text-[#8B95A1]">원</span>
                  </p>
                  <p className="text-sm text-[#8B95A1]">(부가세 10% 별도)</p>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200"></div>

                {/* Included Features */}
                <div className="space-y-3">
                  <p className="font-bold text-[#191F28] text-base">최대 20문항 제공</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-[#3182F6] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-[#191F28]">
                        기본 타겟 무료 제공 <span className="text-[#8B95A1]">(성별, 연령대)</span>
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-[#3182F6] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-[#191F28]">RAW 데이터 무료 제공</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200"></div>

                {/* Additional Options */}
                <div className="space-y-3">
                  <p className="font-bold text-[#191F28] text-base">추가 옵션</p>
                  <div className="space-y-2">
                    {[
                      '추가 타겟 설정',
                      '커스텀 타겟 설정',
                      '데이터 시각화 대시보드',
                      '데이터 기반 초정밀 분석',
                      '이벤트 페이지 랜딩'
                    ].map((option, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-2 text-sm text-[#191F28]"
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-[#3182F6] flex items-center justify-center flex-shrink-0">
                          <span className="text-[#3182F6] text-xs font-bold">+</span>
                        </div>
                        <span>{option}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>


          </motion.div>
        </section>



        {/* 7. Footer */}
        <footer className="px-6 py-12 pb-28 bg-gray-50 border-t border-gray-200">
          <div className="space-y-2 text-left text-xs text-[#8B95A1] leading-relaxed">
            <p><span className="font-medium text-[#191F28]">대표자</span> 이시우</p>
            <p><span className="font-medium text-[#191F28]">상호</span> 주식회사 픽켓팅</p>
            <p><span className="font-medium text-[#191F28]">주소</span> 서울시 서울특별시 금천구 가산디지털2로 143 508호</p>
            <p><span className="font-medium text-[#191F28]">사업자번호</span> 165-88-03767</p>
            <p><span className="font-medium text-[#191F28]">통신판매업 신고번호</span> 2024-서울강남-07205호</p>
            <p><span className="font-medium text-[#191F28]">개인정보 보호책임자</span> 심민우</p>
            <p><span className="font-medium text-[#191F28]">제휴문의</span> biz@picketing.ai</p>
            <p><span className="font-medium text-[#191F28]">대표번호</span> 070-4300-0829</p>
            <p className="text-xs pt-3">© 2025 Pick Search. All rights reserved.</p>
          </div>
        </footer>

        {/* Floating CTA Button */}
        <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none px-4">
          <div className="max-w-[440px] mx-auto pointer-events-auto flex justify-center">
            <Link to={createPageUrl('ClientHome')} className="w-[70%]">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, type: "spring", stiffness: 100 }}
                whileHover={{ 
                  scale: 1.05,
                  y: -4,
                  boxShadow: "0 20px 40px -10px rgba(49, 130, 246, 0.4)"
                }}
                whileTap={{ scale: 0.95, y: 0 }}
              >
                <Button className="w-full h-14 bg-gradient-to-r from-[#3182F6] to-[#4294FF] hover:from-[#2868d8] hover:to-[#3182F6] text-white font-bold rounded-full shadow-[0_10px_30px_-5px_rgba(49,130,246,0.3)] text-base transition-all duration-300">
                  무료로 픽서치 시작하기
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}