import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle, MousePointerClick, Edit3, Rocket, BarChart3, Target, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GuideAnimation from "@/components/guide/GuideAnimation";

export default function Guide() {
  const navigate = useNavigate();

  const steps = [
  {
    title: "질문 작성 및 AI 생성",
    icon: <Edit3 className="w-6 h-6 text-purple-500" />,
    description: "AI가 도와주는 쉽고 빠른 질문 작성.",
    details: [
    { label: "AI 자동 생성", desc: "주제만 입력하면 AI가 최적화된 질문 세트를 만들어드려요" },
    { label: "다양한 문항", desc: "객관식, 순위형, 이미지 투표, 주관식 등 지원" }]

  },
  {
    title: "정교한 타겟팅 (옵션)",
    icon: <Target className="w-6 h-6 text-red-500" />,
    description: "원하는 응답자에게만 질문하세요.",
    details: [
    { label: "인구통계", desc: "성별, 연령 설정" },
    { label: "상세 타겟", desc: "직업, 관심사, 소비패턴, 거주지 등" }]

  },
  {
    title: "결제 및 심사",
    icon: <Coins className="w-6 h-6 text-orange-500" />,
    description: "무통장 입금 결제 후 매체사 검수가 진행됩니다.",
    details: [
    { label: "투명한 정찰제", desc: "선택한 타겟팅 옵션에 따른 할증 부과" },
    { label: "빠른 심사", desc: "영업일 기준 24시간 내 가이드라인 준수 여부 확인" }]

  },
  {
    title: "결과 확인 및 분석",
    icon: <BarChart3 className="w-6 h-6 text-green-500" />,
    description: "데이터가 인사이트가 되는 순간.",
    details: [
    { label: "실시간 리포트", desc: "응답 현황을 실시간으로 확인" },
    { label: "AI 초정밀 리포트 제공", desc: "복잡한 데이터도 AI가 분석하고 인사이트를 제공" }]

  }];


  const importantNote = {
    title: "⚠️ 개인정보 수집 안내",
    description: "픽서치는 타겟팅을 통해 원하는 페르소나를 찾아드리는 서비스입니다.",
    details: [
    {
      label: "설문 내 개인정보 수집 금지",
      desc: "설문 문항에서 이름, 전화번호, 이메일 등 개인정보를 직접 수집하면 안 됩니다."
    },
    {
      label: "랜딩페이지 활용",
      desc: "고객정보가 필요한 경우, 설문 종료 후 이동하는 랜딩페이지에서 별도로 수집하세요."
    }]

  };

  const landingPageTip = {
    title: "💡 랜딩페이지 활용 TIP",
    description: "설문 종료 후 자사 이벤트 페이지로 연결하여 추가 마케팅 효과를 극대화하세요!",
    details: [
    {
      label: "고객 DB 확보",
      desc: "설문 완료 후 이벤트 참여 페이지로 이동시켜 이름, 연락처 등 고객정보를 자연스럽게 수집할 수 있습니다."
    },
    {
      label: "추가 이벤트 진행",
      desc: "경품 추첨, 할인 쿠폰 발급, 뉴스레터 구독 등 다양한 이벤트를 연계하여 전환율을 높이세요."
    },
    {
      label: "브랜드 경험 강화",
      desc: "설문 참여자에게 브랜드 소개, 신제품 안내, SNS 팔로우 유도 등 추가 접점을 만들 수 있습니다."
    },
    {
      label: "설정 방법",
      desc: "설문 생성 시 '이벤트 페이지 연결' 옵션을 켜고 자사 랜딩페이지 URL을 입력하면 됩니다."
    }]

  };

  return (
    <div className="min-h-screen bg-[#F2F4F6]">
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24 space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-b-3xl p-6 pt-10 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">

            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">픽서치 이용방법</h1>
        </div>
        <p className="text-[#FFFFFF] text-base font-medium opacity-90">누구나 쉽게 시작하는
초간단 픽서치 가이드

          </p>
      </div>

      {/* Video Section */}
      <div className="mb-8">
        <Card className="overflow-hidden border-gray-100 shadow-sm">
          <GuideAnimation />
          <div className="p-4 bg-white">
             <h3 className="font-bold text-gray-800 text-sm mb-1">🎥 1분 만에 마스터하기</h3>
             <p className="text-xs text-gray-500">영상을 통해 픽서치 사용법을 쉽고 빠르게 익혀보세요.</p>
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {steps.map((step, index) =>
          <div key={index} className="relative pl-4">
            {/* Connecting Line */}
            {index !== steps.length - 1 &&
            <div className="absolute left-[27px] top-12 bottom-[-20px] w-0.5 bg-gray-100" />
            }

            <div className="flex gap-4">
              <div className="relative z-10 w-14 h-14 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center flex-shrink-0">
                {step.icon}
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
              </div>

              <div className="flex-1 pt-2">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{step.description}</p>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {step.details.map((detail, idx) =>
                  <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-bold text-gray-700 block">{detail.label}</span>
                        <span className="text-xs text-gray-500">{detail.desc}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* 개인정보 수집 안내 */}
        <div className="mt-10 bg-red-50 border-2 border-red-200 rounded-2xl p-5">
        <h3 className="text-lg font-bold text-red-700 mb-2">{importantNote.title}</h3>
        <p className="text-sm text-red-600 mb-4">{importantNote.description}</p>
        <div className="bg-white rounded-xl p-4 space-y-3">
          {importantNote.details.map((detail, idx) =>
            <div key={idx} className="flex items-start gap-2">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-xs font-bold">{idx + 1}</span>
              </div>
              <div>
                <span className="text-sm font-bold text-gray-800 block">{detail.label}</span>
                <span className="text-xs text-gray-600">{detail.desc}</span>
              </div>
            </div>
            )}
        </div>
        </div>

        {/* 랜딩페이지 활용 TIP */}
        <div className="mt-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-5">
        <h3 className="text-lg font-bold text-purple-700 mb-2">{landingPageTip.title}</h3>
        <p className="text-sm text-purple-600 mb-4">{landingPageTip.description}</p>
        <div className="bg-white rounded-xl p-4 space-y-3">
          {landingPageTip.details.map((detail, idx) =>
            <div key={idx} className="flex items-start gap-2">
              <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 text-xs font-bold">{idx + 1}</span>
              </div>
              <div>
                <span className="text-sm font-bold text-gray-800 block">{detail.label}</span>
                <span className="text-xs text-gray-600">{detail.desc}</span>
              </div>
            </div>
            )}
        </div>
        </div>


    </div>
    </div>);

}