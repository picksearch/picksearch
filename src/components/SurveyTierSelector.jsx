import React, { useState, useRef } from "react";
import { CheckCircle, Star, Crown, Zap, BarChart3, Users, X, ChevronLeft, ChevronRight, Cloud, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function SurveyTierSelector({ onSelect, onClose }) {
  const [activeTierId, setActiveTierId] = useState('premium');
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

  const tiers = [
    {
      id: 'basic',
      name: 'Basic',
      price: '240,000',
      originalPrice: '400,000',
      description: '최대한 많은 모수를 저렴한 가격으로 빠르게 확보할 수 있는 플랜',
      expectedParticipants: '1,000 ~ 1,600명',
      icon: BarChart3,
      headerColor: 'bg-[#3B82F6]', // Blue-500
      features: [
        '전체 유저 타겟',
        '문항수 10개 고정',
        '불특정 다수의 대량 응답 확보용',
        'AI 응답 분석/요약',
        '응답 로우데이터 무료 제공'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '300,000',
      originalPrice: '500,000',
      description: '성별, 연령대 등의 기본 타겟을 설정할 수 있는 플랜',
      expectedParticipants: '800 ~ 1,300명',
      icon: Zap,
      headerColor: 'bg-[#2563EB]', // Blue-600
      features: [
        '기본 타겟 (성별/나이)',
        <span>문항수 10개 + <span className="text-blue-600 font-bold">3개 추가 증정</span></span>,
        '적정 규모의 필터링 응답 확보용',
        'AI 응답 분석/요약',
        '응답 로우데이터 무료 제공'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '350,000',
      originalPrice: '580,000',
      description: '정밀한 타겟을 대상으로 정확한 의사 결정 및 마케팅이 필요한 브랜드에게 적합한 플랜',
      expectedParticipants: '500 ~ 1,000명',
      icon: Star,
      headerColor: 'bg-[#1D4ED8]', // Blue-700
      features: [
        '정밀 타겟 (관심사/소비패턴/지역 등)',
        <span>문항수 10개 + <span className="text-blue-700 font-bold">5개 추가 증정</span></span>,
        '이벤트 배너 삽입, 페이지 랜딩 가능',
        '특정 패턴을 가진 그룹 응답 확보용'
      ]
    },
    {
      id: 'vip',
      name: 'VIP',
      price: '500,000',
      originalPrice: '830,000',
      description: '세분화 조건에 부합하는 초정밀 타겟을 대상으로 전문 리서치급 결과가 필요한 기업에게 적합한 플랜',
      expectedParticipants: '추측 불가능',
      icon: Crown,
      headerColor: 'bg-[#1E40AF]', // Blue-800
      features: [
        '초정밀 타겟팅 (소득/직업/앱사용 등)',
        <span>문항수 10개 + <span className="text-blue-800 font-bold">10개 추가 증정</span></span>,
        '이벤트 배너 삽입, 페이지 랜딩 가능',
        '고부가가치 상품, 정교한 페르소나',
        'AI 응답 분석/요약',
        '응답 로우데이터 무료 제공'
      ]
    }
  ];

  const activeIndex = tiers.findIndex(t => t.id === activeTierId);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && activeIndex < tiers.length - 1) {
      setActiveTierId(tiers[activeIndex + 1].id);
    }

    if (isRightSwipe && activeIndex > 0) {
      setActiveTierId(tiers[activeIndex - 1].id);
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const TierCard = ({ tier, isActive }) => {
    const discountRate = Math.round((1 - parseInt(tier.price.replace(/,/g, '')) / parseInt(tier.originalPrice.replace(/,/g, ''))) * 100);
    
    return (
      <Card 
        className={`relative transition-all duration-200 cursor-pointer h-full overflow-hidden flex flex-col rounded-2xl ${
          tier.id === 'premium' 
            ? 'border-2 border-indigo-500 shadow-2xl scale-[1.05] z-20 ring-4 ring-indigo-500/30' 
            : 'border-0 shadow-lg hover:shadow-xl scale-100'
        } ${isActive ? 'opacity-100' : 'opacity-50 scale-95'}`}
        onClick={() => onSelect(tier.id)}
      >
        <div className={`${tier.headerColor} p-5 text-white ${tier.id === 'premium' ? 'rounded-t-xl' : 'rounded-t-2xl'} flex items-center gap-3`}>
          <h3 className="text-xl font-bold">{tier.name}</h3>
          {tier.id === 'premium' && (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="bg-gradient-to-r from-indigo-400 to-purple-400 text-white px-3 py-1 rounded-full font-black text-xs shadow-lg border border-white/30 tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                BEST
              </div>
            </motion.div>
          )}
        </div>
        
        <CardContent className="p-6 flex flex-col h-full bg-white">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-red-500">{discountRate}%</span>
              <span className="text-sm text-gray-300 line-through">{tier.originalPrice}</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
              <span className="text-xs text-gray-400">크레딧 / 일</span>
            </div>
            <div className="text-[10px] text-gray-400">(부가세 10% 별도)</div>
          </div>

          <div className="h-px bg-gray-100 w-full mb-6"></div>

          <div className="flex items-center gap-2 text-blue-600 font-bold mb-3">
            <Users className="w-4 h-4" />
            <span className="text-sm">예상 참가 인원</span>
            <span className="text-sm">{tier.expectedParticipants}</span>
          </div>
          
          <p className="text-sm text-gray-600 mb-6 min-h-[40px] leading-relaxed break-keep">
            {tier.description}
          </p>

          <div className="h-px bg-gray-100 w-full mb-6"></div>
          
          <div className="space-y-3 flex-1">
            {tier.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <Cloud className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                {/* Use cloud icon or simple bullet as per image, image has cloud-like icons? 
                    Actually the image has Cloud icons for features. Let's use Cloud icon or keep it simple.
                    The user prompt says "image like tone and manner". 
                    Let's use a simple icon. Cloud icon isn't standard in lucide imported. 
                    Let's check imports. 
                */}
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6">
      <div className="bg-gray-50 md:rounded-3xl shadow-2xl w-full max-w-7xl h-full md:h-auto md:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 pb-2 flex-shrink-0 bg-white md:bg-transparent">
          <div className="w-10" />
          <div className="text-center">
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">설문조사 티어 선택</h2>
            <p className="text-xs md:text-base text-gray-500">목적과 예산에 맞는 최적의 플랜을 선택하세요</p>
            <Link to={createPageUrl('CreateFreeSurvey')} onClick={onClose}>
              <button className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-full text-sm font-bold transition-colors">
                <PlusCircle className="w-4 h-4" />
                무료 설문 만들기
              </button>
            </Link>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2">
          <div className="flex justify-between gap-2">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setActiveTierId(tier.id)}
                className={`relative pb-3 flex-1 text-sm font-bold transition-colors ${
                  activeTierId === tier.id ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {tier.name}
                {tier.isPopular && (
                  <span className="absolute -top-1 right-0 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
                {activeTierId === tier.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" 
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 min-h-0 bg-gray-50">
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
            {tiers.map((tier) => (
              <TierCard key={tier.id} tier={tier} isActive={true} />
            ))}
          </div>

          {/* Mobile Swipe View */}
          <div 
            className="md:hidden h-full flex flex-col"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex-1 p-4 flex items-stretch relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTierId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  <TierCard tier={tiers[activeIndex]} isActive={true} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 pb-6">
              {tiers.map((tier) => (
                <div 
                  key={tier.id}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeTierId === tier.id ? 'bg-gray-800 w-4' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}