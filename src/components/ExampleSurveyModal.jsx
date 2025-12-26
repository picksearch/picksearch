import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ExampleSurveyModal({ survey, onClose }) {
  const [currentStep, setCurrentStep] = useState("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // Reset state when survey changes
  React.useEffect(() => {
    setCurrentStep("intro");
    setCurrentQuestionIndex(0);
    setAnswers({});
  }, [survey]);

  if (!survey) return null;

  const questions = survey.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleStart = () => {
    setCurrentStep("question");
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentStep("end");
    }
  };

  const handleAnswer = (value) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
    
    // Auto-advance for single choice questions after a short delay
    if (currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'image_choice') {
      setTimeout(handleNext, 300);
    }
  };

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  answers[currentQuestion.id] === option
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                    : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );
      
      case 'image_choice':
        return (
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option.label)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all group ${
                  answers[currentQuestion.id] === option.label
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-transparent hover:border-blue-300'
                }`}
              >
                <div className="aspect-[4/3] bg-gray-100">
                  <img 
                    src={option.image} 
                    alt={option.label} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className={`p-3 text-center font-medium ${
                  answers[currentQuestion.id] === option.label 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700'
                }`}>
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        );

      case 'likert_scale':
        return (
          <div className="space-y-2">
            {[
              { val: 1, label: "전혀 그렇지 않다" },
              { val: 2, label: "그렇지 않다" },
              { val: 3, label: "보통이다" },
              { val: 4, label: "그렇다" },
              { val: 5, label: "매우 그렇다" }
            ].map((item) => (
              <button
                key={item.val}
                onClick={() => handleAnswer(item.val)}
                className={`w-full p-4 flex items-center gap-4 rounded-xl border-2 transition-all ${
                  answers[currentQuestion.id] === item.val
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-100 hover:border-blue-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  answers[currentQuestion.id] === item.val ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {item.val}
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        );

        case 'ranking':
            // Simplified ranking for preview
            return (
                <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-2">* 순서대로 선택해주세요 (체험판에서는 단순 선택)</p>
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(option)}
                            className="w-full p-4 text-left rounded-xl border border-gray-200 hover:bg-gray-50"
                        >
                            {option}
                        </button>
                    ))}
                </div>
            );

      default:
        return (
          <div className="p-4 bg-gray-50 rounded-xl text-gray-500 text-center">
             이 유형은 체험판에서 지원되지 않습니다.
          </div>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <span className="text-xs font-bold text-gray-400">CASE STUDY PREVIEW</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {currentStep === 'intro' && (
              <motion.div 
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📝</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{survey.title}</h2>
                  <p className="text-gray-600">{survey.description}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">문항 수</span>
                    <span className="font-bold text-gray-900">{questions.length}문항</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">소요 시간</span>
                    <span className="font-bold text-gray-900">약 1분</span>
                  </div>
                </div>
                <Button onClick={handleStart} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  설문 시작하기
                </Button>
              </motion.div>
            )}

            {currentStep === 'question' && (
              <motion.div 
                key={`q-${currentQuestionIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
                      Q{currentQuestionIndex + 1}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {currentQuestionIndex + 1} / {questions.length}
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5 bg-gray-100" indicatorClassName="bg-blue-500" />
                  <h3 className="text-xl font-bold text-gray-900 mt-4 leading-snug">
                    {currentQuestion.text}
                  </h3>
                  {currentQuestion.subText && (
                    <p className="text-sm text-gray-500 mt-2">{currentQuestion.subText}</p>
                  )}
                </div>

                {renderQuestionContent()}

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-end">
                  {(currentQuestion.type !== 'multiple_choice' && currentQuestion.type !== 'image_choice') && (
                    <Button onClick={handleNext} className="bg-gray-900 text-white rounded-xl">
                      다음 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 'end' && (
              <motion.div 
                key="end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">참여해주셔서 감사합니다!</h2>
                <p className="text-gray-600 mb-8">
                  실제 설문조사에서는<br/>
                  이런 방식으로 고객의 의견을 수집하게 됩니다.
                </p>
                <Button onClick={onClose} variant="outline" className="w-full h-12 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl">
                  닫기
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}