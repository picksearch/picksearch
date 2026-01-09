import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointerClick, Bot, Target, CreditCard, BarChart3, Play, RotateCcw } from "lucide-react";

const scenes = [
  {
    id: 0,
    title: "1. AI 질문 생성",
    subtitle: "주제만 입력하면 AI가 질문을 자동으로 만들어줍니다",
    icon: <Bot className="w-16 h-16 text-purple-500" />,
    color: "bg-purple-50",
    elements: (
      <div className="relative">
        <motion.div 
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative z-10"
        >
          <Bot className="w-20 h-20 text-purple-500" />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: -20, y: 20 }}
          animate={{ opacity: [0, 1, 1, 0], x: 20, y: -20 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute top-0 right-0"
        >
          <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-purple-100 text-xs font-bold text-purple-600">
            질문 생성 중...
          </div>
        </motion.div>
      </div>
    )
  },
  {
    id: 1,
    title: "2. 타겟 설정",
    subtitle: "성별, 연령부터 상세 관심사까지 정교하게",
    icon: <Target className="w-16 h-16 text-red-500" />,
    color: "bg-red-50",
    elements: (
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-red-100 rounded-full animate-ping" />
        <div className="absolute inset-4 border-2 border-red-200 rounded-full" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Target className="w-16 h-16 text-red-500" />
        </motion.div>
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={i}
            className="absolute w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-lg"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, x: Math.cos(i * 1.57) * 40, y: Math.sin(i * 1.57) * 40 }}
            transition={{ delay: i * 0.1 }}
          >
            {['👩', '👨', '🎓', '💼'][i]}
          </motion.div>
        ))}
      </div>
    )
  },
  {
    id: 2,
    title: "3. 결제 및 심사",
    subtitle: "투명한 정찰제로 결제 후 빠른 심사가 진행됩니다",
    icon: <CreditCard className="w-16 h-16 text-orange-500" />,
    color: "bg-orange-50",
    elements: (
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-24 h-16 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-4 left-0 w-full h-2 bg-black/20" />
          <div className="absolute bottom-4 left-4 w-8 h-4 bg-white/30 rounded" />
        </motion.div>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: 100 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-1 bg-green-500 rounded-full"
        />
        <div className="text-xs font-bold text-green-600">심사 승인 완료!</div>
      </div>
    )
  },
  {
    id: 3,
    title: "4. 결과 분석",
    subtitle: "AI가 분석해주는 실시간 리포트로 인사이트 확보",
    icon: <BarChart3 className="w-16 h-16 text-green-500" />,
    color: "bg-green-50",
    elements: (
      <div className="flex items-end gap-2 h-24">
        {[30, 50, 40, 80, 60].map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="w-8 bg-green-500 rounded-t-md relative group"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-green-700"
            >
              {h}%
            </motion.div>
          </motion.div>
        ))}
      </div>
    )
  }
];

export default function GuideAnimation() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setCurrentScene(prev => {
              if (prev >= scenes.length - 1) {
                setIsPlaying(false);
                return 0;
              }
              return prev + 1;
            });
            return 0;
          }
          return p + 1; // Progress speed
        });
      }, 30); // ~3 seconds per scene
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlay = () => {
    setIsPlaying(true);
    setCurrentScene(0);
    setProgress(0);
  };

  const handleReplay = () => {
    setIsPlaying(true);
    setCurrentScene(0);
    setProgress(0);
  };

  return (
    <div className="w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden relative shadow-lg border border-gray-100">
      <AnimatePresence mode="wait">
        {!isPlaying ? (
          <motion.div 
            key="cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 cursor-pointer group"
            onClick={handlePlay}
          >
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center z-10"
            >
              {progress > 0 ? (
                <RotateCcw className="w-8 h-8 text-blue-500 ml-1" />
              ) : (
                <Play className="w-8 h-8 text-blue-500 ml-1" fill="currentColor" />
              )}
            </motion.div>
            <p className="mt-6 text-gray-600 font-bold z-10">
              1분 만에 마스터하기 (클릭하여 재생)
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="player"
            className={`absolute inset-0 flex flex-col ${scenes[currentScene].color}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Scene Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 pb-12 relative overflow-hidden">
              <motion.div
                key={currentScene}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-4"
              >
                {scenes[currentScene].elements}
                <h3 className="text-2xl font-black text-gray-800 mt-2">
                  {scenes[currentScene].title}
                </h3>
              </motion.div>
            </div>

            {/* Subtitle Bar */}
            <div className="bg-black/80 p-3 pb-4 backdrop-blur-sm z-20">
               <motion.p 
                 key={currentScene}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-white text-center font-medium text-sm md:text-base"
               >
                 {scenes[currentScene].subtitle}
               </motion.p>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-800 w-full absolute bottom-0 left-0">
              <motion.div 
                className="h-full bg-orange-500"
                style={{ width: `${((currentScene * 100) + progress) / scenes.length}%` }}
              />
            </div>
            
            {/* Skip Button */}
            <button 
              onClick={() => setIsPlaying(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-white/50 hover:bg-white/80 px-3 py-1 rounded-full text-xs font-bold transition-all"
            >
              SKIP
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}