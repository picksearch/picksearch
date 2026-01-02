import React, { useState } from "react";
import { auth } from "@/api/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, BarChart3, Coins, ChevronDown, Folder, Target, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

import ClientHomeFooter from "@/components/ClientHomeFooter";

export default function ClientHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();


  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await auth.me();
      } catch (error) {
        return null;
      }
    },
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });



  if (userLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-white/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-20">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Login Button - Top Right */}
        {!user && (
          <div className="flex justify-end -mb-2">
            <Link
              to={createPageUrl("Login")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#4B5563] hover:text-[#3182F6] bg-white hover:bg-blue-50 rounded-full border border-gray-200 shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인/회원가입</span>
            </Link>
          </div>
        )}

        {/* Hero Section - Create Survey & Credit Display */}
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-0 shadow-sm relative overflow-hidden flex flex-col h-[480px]"
      >


        {/* Motion Graphic Area (Top) */}
        <div className="relative flex-1 w-full bg-gradient-to-b from-blue-50/50 to-white overflow-hidden">
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {/* Background Crowd Passing By - Always moving to simulate busy environment */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`crowd-${i}`}
                className="absolute rounded-full bg-gray-200/50 backdrop-blur-[1px]"
                style={{
                  width: 20 + Math.random() * 30,
                  height: 20 + Math.random() * 30,
                  top: `${Math.random() * 100}%`,
                  zIndex: 0,
                }}
                initial={{ x: -100, opacity: 0 }}
                animate={{
                  x: ['-10vw', '110vw'],
                  opacity: [0, 0.4, 0.4, 0],
                }}
                transition={{
                  duration: 5 + Math.random() * 10,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 5,
                }}
              />
            ))}

             {/* Zoom Effect Container */}
             <motion.div 
                className="absolute inset-0 flex items-center justify-center z-10"
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
             >
               {/* Target Person - Center */}
               <motion.div
                 className="relative flex items-center justify-center"
                 initial={{ width: "12px", height: "12px", backgroundColor: "#9CA3AF", borderRadius: "50%" }}
                 animate={{ 
                   width: "96px", 
                   height: "96px", 
                   backgroundColor: "#3182F6",
                   boxShadow: "0 20px 40px -10px rgba(49, 130, 246, 0.5)",
                   y: [0, -8, 0]
                 }}
                 transition={{ 
                   width: { duration: 1.2, ease: "backOut", delay: 0.5 },
                   height: { duration: 1.2, ease: "backOut", delay: 0.5 },
                   backgroundColor: { duration: 1.2, delay: 0.5 },
                   boxShadow: { duration: 1.2, delay: 0.5 },
                   y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }
                 }}
               >
                  <motion.span 
                     className="text-5xl"
                     initial={{ opacity: 0, scale: 0 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ duration: 0.5, delay: 1.5 }}
                  >
                    🙋‍♂️
                  </motion.span>

                  {/* Ripple Effect to show "Selected" */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-blue-400"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 2 }}
                  />
               </motion.div>
             </motion.div>
          </div>

          {/* Bubbles - Positioned further away to avoid overlap */}
          <div className="absolute inset-0 pointer-events-none z-20">
             {/* 1. Survey? (Left Top) */}
             <motion.div
               className="absolute top-[20%] left-[10%] md:left-[25%] bg-white px-5 py-2.5 rounded-2xl rounded-br-none shadow-xl border border-blue-100 text-sm font-bold text-gray-800"
               initial={{ opacity: 0, scale: 0, x: -20 }}
               animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], x: 0 }}
               transition={{ duration: 3, times: [0, 0.1, 0.8, 1], delay: 2.0, repeat: Infinity, repeatDelay: 5 }}
             >
               설문 참여?
             </motion.div>

             {/* 2. OK! (Right Top) */}
             <motion.div
               className="absolute top-[25%] right-[10%] md:right-[25%] bg-[#3182F6] px-5 py-2.5 rounded-2xl rounded-bl-none shadow-xl text-sm font-bold text-white"
               initial={{ opacity: 0, scale: 0, x: 20 }}
               animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], x: 0 }}
               transition={{ duration: 2.5, times: [0, 0.1, 0.8, 1], delay: 2.8, repeat: Infinity, repeatDelay: 5.5 }}
             >
               OK! 👌
             </motion.div>

             {/* 3. Event? (Left Bottom) */}
             <motion.div
               className="absolute bottom-[25%] left-[5%] md:left-[20%] bg-white px-5 py-2.5 rounded-2xl rounded-tr-none shadow-xl border border-pink-100 text-sm font-bold text-gray-800"
               initial={{ opacity: 0, scale: 0, x: -20 }}
               animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], x: 0 }}
               transition={{ duration: 3, times: [0, 0.1, 0.8, 1], delay: 4.5, repeat: Infinity, repeatDelay: 5 }}
             >
               이벤트도 참여? 🎉
             </motion.div>

             {/* 4. OK! (Right Bottom) */}
             <motion.div
               className="absolute bottom-[20%] right-[5%] md:right-[20%] bg-pink-500 px-5 py-2.5 rounded-2xl rounded-tl-none shadow-xl text-sm font-bold text-white"
               initial={{ opacity: 0, scale: 0, x: 20 }}
               animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], x: 0 }}
               transition={{ duration: 2.5, times: [0, 0.1, 0.8, 1], delay: 5.3, repeat: Infinity, repeatDelay: 5.5 }}
             >
               완전 OK! 😍
             </motion.div>
          </div>
        </div>

        {/* Text Area (Bottom) */}
        <div className="relative z-10 flex flex-col items-center justify-end h-auto text-center px-10 pb-8 pt-4 bg-white">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#191F28] mb-2 tracking-tight whitespace-nowrap">
              설문이, <span className="text-[#3182F6]">고객이 되는 순간</span>
            </h2>
            <p className="text-base text-[#8B95A1] mb-8 font-medium">
              초정밀 타겟 DATA수집 플랫폼
            </p>
          </motion.div>

          <Link to={`${createPageUrl("CreateSurvey")}?start=1`} className="w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#3182F6] hover:bg-[#1B64DA] text-white font-bold text-xl py-5 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all"
            >
              <PlusCircle className="w-6 h-6" />
              <span>AI 초정밀 타겟 설문 생성</span>
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Guide & Use Cases - 3D Buttons Compact Style */}
      <div className="grid grid-cols-2 gap-3">
        <Link to={createPageUrl("Guide")} className="block">
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ y: 2, boxShadow: "0 0px 0 0 #E5E7EB" }}
            className="bg-white rounded-2xl p-4 border border-gray-100 border-b-[4px] border-b-gray-200 active:border-b-0 active:mt-[4px] h-full flex items-center gap-3 transition-all"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
              <Folder className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#333D4B] text-sm leading-tight">이용방법</h3>
              <p className="text-[11px] text-[#8B95A1] mt-0.5 truncate">설문조사 가이드</p>
            </div>
          </motion.div>
        </Link>

        <Link to={createPageUrl("UseCases")} className="block">
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ y: 2, boxShadow: "0 0px 0 0 #E5E7EB" }}
            className="bg-white rounded-2xl p-4 border border-gray-100 border-b-[4px] border-b-gray-200 active:border-b-0 active:mt-[4px] h-full flex items-center gap-3 transition-all"
          >
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
              <Target className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#333D4B] text-sm leading-tight">활용 사례</h3>
              <p className="text-[11px] text-[#8B95A1] mt-0.5 truncate">성공 사례 보기</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {user && (
        <Link to={createPageUrl("MySurveys")} className="block">
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ y: 0, scale: 0.99 }}
            className="bg-white rounded-2xl p-4 border border-gray-100 border-b-[4px] border-b-gray-200 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shadow-inner">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#333D4B] text-sm">내 설문 관리</h3>
                <p className="text-[11px] text-[#8B95A1]">내가 만든 설문 확인 및 관리</p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400 -rotate-90" />
          </motion.div>
        </Link>
      )}

      {/* Free Survey */}
      <Link to={createPageUrl("CreateFreeSurvey")} className="block">
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ y: 0, scale: 0.99 }}
          className="bg-white rounded-2xl p-4 border border-gray-100 border-b-[4px] border-b-gray-200 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shadow-inner">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#333D4B] text-sm">무료 설문 만들기</h3>
              <p className="text-[11px] text-[#8B95A1]">간편하게 무료 설문 생성</p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400 -rotate-90" />
        </motion.div>
      </Link>

        <ClientHomeFooter />
      </div>
    </div>
  );
}