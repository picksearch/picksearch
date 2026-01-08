import React, { useState, useEffect, useRef, useMemo } from "react";
import { Survey, Question, Response } from "@/api/entities";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Copy, ArrowLeft } from "lucide-react";
import LogoImage from "@/assets/Logo_2.png";

export default function TakeSurvey() {
  const location = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const secretKey = urlParams.get('key');
  const isPreviewParam = urlParams.get('preview') === 'true';

  // localStorage에서 미리보기 데이터 읽기 (preview=true 파라미터가 있을 때)
  const previewData = location.state?.previewData || (isPreviewParam ? (() => {
    try {
      const stored = localStorage.getItem('survey_preview_data');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })() : null);
  const isPreviewMode = !!previewData;

  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [branchPath, setBranchPath] = useState([]);
  const [skipQuestions, setSkipQuestions] = useState(new Set()); // 분기로 인해 건너뛸 문항 인덱스들
  const [answers, setAnswers] = useState({});
  const [shortAnswerText, setShortAnswerText] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [responseId, setResponseId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedMultiple, setSelectedMultiple] = useState([]);
  const [rankings, setRankings] = useState({});
  const [hasStarted, setHasStarted] = useState(false);
  const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [thirdPartyAgreed, setThirdPartyAgreed] = useState(false);
  const [showPrivacyConsent, setShowPrivacyConsent] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [otherText, setOtherText] = useState('');
  const hasInitialized = useRef(false);
  const isCompletingRef = useRef(false);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);
  const [loadedImages, setLoadedImages] = useState(new Set());

  // 로컬 스토리지 키 생성 헬퍼
  const getStorageKey = (sId) => `survey_completed_${sId}`;

  // Define helper functions early to avoid ReferenceErrors
  const resetQuestionStates = () => {
    setShortAnswerText('');
    setSelectedRating(5);
    setHasInteracted(false);
    setSelectedMultiple([]);
    setRankings({});
    setSelectedImageIndex(null);
    setSelectedAnswer('');
    setOtherText('');
  };

  const getGradientColorForNumber = (num) => {
    const colors = [
      { bg: 'from-cyan-300 to-cyan-400', text: 'text-white' },
      { bg: 'from-cyan-400 to-cyan-500', text: 'text-white' },
      { bg: 'from-cyan-400 to-teal-400', text: 'text-white' },
      { bg: 'from-cyan-500 to-teal-500', text: 'text-white' },
      { bg: 'from-teal-400 to-teal-500', text: 'text-white' },
      { bg: 'from-teal-500 to-teal-600', text: 'text-white' },
      { bg: 'from-teal-500 to-emerald-600', text: 'text-white' },
      { bg: 'from-teal-600 to-emerald-600', text: 'text-white' },
      { bg: 'from-emerald-500 to-emerald-700', text: 'text-white' },
      { bg: 'from-emerald-600 to-green-700', text: 'text-white' },
      { bg: 'from-emerald-700 to-green-800', text: 'text-white' },
    ];
    const index = Math.max(0, Math.min(10, num));
    return colors[index];
  };

  const getLikertColor = (value) => {
    const colors = {
      1: 'bg-rose-400',
      2: 'bg-orange-400',
      3: 'bg-amber-400',
      4: 'bg-emerald-500',
      5: 'bg-sky-500'
    };
    return colors[value] || 'bg-gray-400';
  };

  const getLikertLabel = (value, question) => {
    // 사용자가 설정한 라벨이 있으면 사용, 없으면 기본값
    if (question?.options && question.options[value - 1]) {
      return question.options[value - 1];
    }
    const defaultLabels = {
      1: '전혀 그렇지 않다',
      2: '그렇지 않다',
      3: '보통이다',
      4: '그렇다',
      5: '매우 그렇다'
    };
    return defaultLabels[value] || '';
  };

  const getRankingColor = (rank) => {
    const colors = {
      1: 'from-amber-500 to-orange-600',
      2: 'from-slate-400 to-slate-500',
      3: 'from-orange-400 to-orange-500',
      4: 'from-zinc-400 to-zinc-500',
      5: 'from-stone-400 to-stone-500'
    };
    return colors[rank] || 'from-gray-400 to-gray-500';
  };

  const getRankingBadge = (rank) => {
    const badges = {
      1: '🥇',
      2: '🥈',
      3: '🥉',
      4: '4️⃣',
      5: '5️⃣'
    };
    return badges[rank] || rank;
  };

  const { data: survey, isLoading: surveyLoading, error: surveyError } = useQuery({
    queryKey: ['survey', secretKey, isPreviewMode, previewData?.title],
    queryFn: async () => {
      if (isPreviewMode) {
        return {
          id: 'preview',
          title: previewData.title,
          description: previewData.description,
          status: 'preview',
          survey_type: 'free',
          completion_secret_code: 'PREVIEW_CODE'
        };
      }
      if (!secretKey) throw new Error('No secret key');
      const surveys = await Survey.filter({ secret_key: secretKey });
      if (!surveys || surveys.length === 0) throw new Error('Survey not found');
      return surveys[0];
    },
    enabled: !!secretKey || isPreviewMode,
    retry: false,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
  });

  const { data: allQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['questions', survey?.id, isPreviewMode, previewData?.title],
    queryFn: () => {
      if (isPreviewMode) {
        return previewData.questions.map((q, idx) => ({
          ...q,
          id: q.id || idx + 1,
          survey_id: 'preview',
          order: q.order || idx
        }));
      }
      return Question.filter({ survey_id: survey.id }, 'order');
    },
    enabled: !!survey?.id || isPreviewMode,
    retry: false,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
  });

  const rootQuestions = allQuestions.filter(q => !q.parent_question_id).sort((a, b) => a.order - b.order);

  // 이미지 최적화 URL 생성 (Supabase Storage 변환)
  const getOptimizedImageUrl = (url) => {
    if (!url) return url;
    if (url.includes('supabase.co/storage')) {
      return url.includes('?') 
        ? `${url}&width=1200&quality=80` 
        : `${url}?width=1200&quality=80`;
    }
    return url;
  };

  // 이미지 Preloading: 현재 + 다음 2개 질문의 이미지 미리 로드
  useEffect(() => {
    if (!allQuestions || allQuestions.length === 0) return;

    const preloadImages = [];
    const currentList = branchPath.length > 0 
      ? branchPath[branchPath.length - 1].childQuestions 
      : rootQuestions;

    for (let i = currentQuestionIndex; i < Math.min(currentQuestionIndex + 3, currentList.length); i++) {
      const q = currentList[i];
      if (q && q.image_urls && q.image_urls.length > 0) {
        q.image_urls.forEach(url => {
          if (url && !loadedImages.has(url)) {
            preloadImages.push(url);
          }
        });
      }
    }

    preloadImages.forEach(url => {
      const img = new Image();
      img.src = getOptimizedImageUrl(url);
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, url]));
      };
    });
  }, [currentQuestionIndex, allQuestions, branchPath, rootQuestions]);

  // 이미 참여했는지 확인하는 효과
  useEffect(() => {
    if (survey?.id && survey.status !== 'preview') {
      try {
        const storageKey = getStorageKey(survey.id);
        const isLocalCompleted = localStorage.getItem(storageKey);
        
        if (isLocalCompleted) {
          setIsCompleted(true);
          setSecretCode(survey.completion_secret_code); 
        }
      } catch (e) {
        console.warn('[Storage] localStorage access denied:', e);
        // localStorage 접근 불가 시 무시 (IP 기반 체크에 의존)
      }
    }
  }, [survey?.id, survey?.status]);

  const getCurrentQuestion = () => {
    if (branchPath.length === 0) {
      return rootQuestions[currentQuestionIndex];
    }
    
    const lastBranch = branchPath[branchPath.length - 1];
    return lastBranch.childQuestions[currentQuestionIndex];
  };

  const currentQuestion = getCurrentQuestion();

  useEffect(() => {
    if (!currentQuestion) return;

    const savedAnswer = answers[currentQuestion.id];
    if (savedAnswer) {
      if (currentQuestion.question_type === 'short_answer') {
        setShortAnswerText(savedAnswer);
      } else if (currentQuestion.question_type === 'numeric_rating') {
        const val = parseInt(savedAnswer);
        if (!isNaN(val)) {
          setSelectedRating(val);
          setHasInteracted(true);
        }
      } else if (currentQuestion.question_type === 'multiple_select') {
        setSelectedMultiple(savedAnswer.split(', '));
      } else if (currentQuestion.question_type === 'ranking') {
        try {
          setRankings(JSON.parse(savedAnswer));
        } catch (e) {}
      } else if (currentQuestion.question_type === 'image_choice') {
        setSelectedImageIndex(parseInt(savedAnswer));
      } else if (currentQuestion.question_type === 'choice_with_other') {
        if (savedAnswer.includes(': ')) {
          const [option, text] = savedAnswer.split(': ');
          setSelectedAnswer(option);
          setOtherText(text);
        } else {
          setSelectedAnswer(savedAnswer);
        }
      } else {
        setSelectedAnswer(savedAnswer);
      }
    }
  }, [currentQuestion?.id, answers]);

  const handlePrevious = () => {
    if (isProcessing) return;

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      resetQuestionStates();
    } else if (branchPath.length > 0) {
      const lastBranch = branchPath[branchPath.length - 1];
      const parentId = lastBranch.parentQuestionId;

      const newBranchPath = branchPath.slice(0, -1);
      setBranchPath(newBranchPath);

      const parentList = newBranchPath.length > 0 
        ? newBranchPath[newBranchPath.length - 1].childQuestions 
        : rootQuestions;

      const parentIndex = parentList.findIndex(q => q.id === parentId);
      if (parentIndex !== -1) {
        setCurrentQuestionIndex(parentIndex);
        resetQuestionStates();
      }
    }
  };

  const updateResponseMutation = useMutation({
    mutationFn: async ({ answers, status, secretCode }) => {
      if (survey?.status === 'preview') return;
      await Response.update(responseId, {
        answers,
        status,
        secret_code: secretCode,
        last_activity: new Date().toISOString()
      });
    },
  });

  const completeSurvey = async (finalAnswers) => {
    if (survey?.status === 'preview' || isPreviewMode) {
      setIsCompleted(true);
      setSecretCode(isPreviewMode ? '예시 설문 체험 완료' : '미리보기 완료');
      return;
    }

    if (isCompletingRef.current) return;
    if (!survey || !survey.id) {
      alert('설문 정보를 불러오지 못했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
      return;
    }

    isCompletingRef.current = true;
    setIsProcessing(true); // UI 중복 클릭 방지
    const code = survey.completion_secret_code;

    try {
      // [데이터 유실 방지 핵심 로직]
      // 1. 무조건 저장 시도. 실패하면 절대 완료 화면으로 넘어가지 않음.
      // 2. responseId가 있어도 update가 실패할 수 있으므로, 실패 시 create로 재시도하는 로직 강화.
      
      let finalResponseId = responseId;
      let saveSuccess = false;

      // CASE 1: 기존 ID가 있는 경우 업데이트 시도
      if (finalResponseId) {
        try {
          await Response.update(finalResponseId, { 
            answers: finalAnswers, 
            status: 'completed',
            secret_code: code,
            last_activity: new Date().toISOString()
          });
          saveSuccess = true;
        } catch (updateError) {
          console.warn('Response update failed, falling back to create', updateError);
          saveSuccess = false;
          // 여기서 실패하면 아래 else 블록(혹은 다음 단계)에서 Create 시도
        }
      }

      // CASE 2: ID가 없거나 업데이트 실패 시 신규 생성 (비상 저장)
      if (!saveSuccess) {
        try {
          const newResponse = await Response.create({
            survey_id: survey.id,
            session_id: sessionId,
            ip_address: 'unknown_fallback', 
            status: 'completed',
            answers: finalAnswers,
            secret_code: code,
            last_activity: new Date().toISOString()
          });
          finalResponseId = newResponse.id;
          setResponseId(newResponse.id);
          saveSuccess = true;
        } catch (createError) {
          console.error('CRITICAL: Data save failed', createError);
          throw new Error('데이터 저장에 실패했습니다.'); // 메인 catch 블록으로 이동
        }
      }

      // 저장 성공 확인 후에만 완료 처리
      if (saveSuccess) {
        // 로컬 스토리지에 완료 상태 저장
        if (survey.status !== 'preview') {
          try {
            localStorage.setItem(getStorageKey(survey.id), 'true');
          } catch (e) {
            console.warn('[Storage] Failed to save completion status:', e);
          }
        }

        setIsCompleted(true);
        setSecretCode(code);

        // 통계 업데이트 (비동기 처리 - 실패해도 사용자 경험에 영향 없음)
        Survey.filter({ id: survey.id }).then(latestSurveys => {
          if (latestSurveys.length > 0) {
            const latestSurvey = latestSurveys[0];
            // 서버 부하를 줄이기 위해 단순 증감 대신 리스트 카운트 수행 (정합성 우선)
            Response.filter({ survey_id: survey.id, status: 'completed' }).then(completedList => {
              const updateData = { completed_responses: completedList.length };
              
              const targetParticipants = latestSurvey.target_participants ? Number(latestSurvey.target_participants) : Infinity;
              if (targetParticipants !== Infinity) {
                updateData.in_progress_count = Math.max((latestSurvey.in_progress_count || 0) - 1, 0);
              }

              // 무료설문 목표 인원 도달 시 자동 종료
              const freeSurveyMaxParticipants = latestSurvey.target_participants || 1000;
              if (latestSurvey.survey_type === 'free' && completedList.length >= freeSurveyMaxParticipants) {
                updateData.status = 'closed';
              }
              
              Survey.update(latestSurvey.id, updateData).catch(e => console.warn('Stats update warn', e));
            }).catch(e => console.warn('Count fetch warn', e));
          }
        }).catch(e => console.warn('Survey fetch warn', e));

        try {
          await navigator.clipboard.writeText(code);
        } catch (e) {}
      }

    } catch (error) {
      console.error('Survey completion error:', error);
      isCompletingRef.current = false;
      setIsProcessing(false);
      alert('죄송합니다. 응답 제출 중 문제가 발생했습니다.\n인터넷 연결을 확인하고 "완료" 버튼을 다시 눌러주세요.');
    }
  };

  const initResponseMutation = useMutation({
    mutationFn: async () => {
      let ipAddress = 'unknown';
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const ipResponse = await fetch('https://api.ipify.org?format=json', { 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        const ipData = await ipResponse.json();
        ipAddress = ipData.ip;
      } catch (e) {}

      // 1. 로컬 스토리지 체크 (가장 빠르고 정확)
      try {
        const storageKey = getStorageKey(survey.id);
        if (localStorage.getItem(storageKey)) {
          throw new Error('이미 참여한 설문입니다 (기기 기록)');
        }
      } catch (storageError) {
        console.warn('[Storage] localStorage check failed:', storageError);
        // localStorage 접근 불가 시 IP 체크로 진행
      }

      // 2. IP 기반 체크 (보조 수단)
      const existingResponses = await Response.filter({ 
        survey_id: survey.id,
        ip_address: ipAddress,
        status: 'completed'
      });
      
      if (existingResponses.length > 0) {
        throw new Error('이미 참여한 설문입니다 (IP 기록)');
      }

      const latestSurveys = await Survey.filter({ id: survey.id });
      const latestSurvey = latestSurveys[0];
      
      const targetParticipants = latestSurvey.target_participants ? Number(latestSurvey.target_participants) : Infinity;

      if (targetParticipants !== Infinity) {
        try {
          await Survey.update(latestSurvey.id, {
            in_progress_count: (latestSurvey.in_progress_count || 0) + 1
          });
        } catch (e) {}
      }

      const response = await Response.create({
        survey_id: latestSurvey.id,
        session_id: sessionId,
        ip_address: ipAddress,
        status: 'in_progress',
        answers: [],
        last_activity: new Date().toISOString()
      });
      return response;
    },
    onSuccess: (response) => {
      setResponseId(response.id);
    },
    onError: (error) => {
      setErrorMessage(error.message);
    }
  });

  useEffect(() => {
    if (survey?.status === 'preview') return;
    if (!responseId || !survey || isCompleted) return;

    return () => {
      if (!isCompleted && responseId && survey && !isCompletingRef.current) {
        const cleanupAsync = async () => {
          try {
            await Response.update(responseId, {
              status: 'abandoned'
            });

            try {
              const targetParticipants = survey.target_participants ? Number(survey.target_participants) : Infinity;
              if (targetParticipants !== Infinity) {
                const latestSurveys = await Survey.filter({ id: survey.id });
                if (latestSurveys.length > 0) {
                  await Survey.update(survey.id, {
                    in_progress_count: Math.max((latestSurveys[0].in_progress_count || 0) - 1, 0)
                  });
                }
              }
            } catch (statsError) {}
          } catch (error) {}
        };
        cleanupAsync();
      }
    };
  }, [responseId, survey, isCompleted]);

  const handleBranchEnd = async (lastQuestionInBranch) => {
    if (lastQuestionInBranch?.branch_end_type === 'end_survey') {
      setIsReadyToSubmit(true);
      return;
    }

    let tempBranchPath = [...branchPath];
    const lastBranchEntry = tempBranchPath.pop();
    setBranchPath(tempBranchPath);

    if (tempBranchPath.length > 0) {
      const parentBranchEntry = tempBranchPath[tempBranchPath.length - 1];
      const questionThatStartedThisBranch = allQuestions.find(q => q.id === lastBranchEntry.parentQuestionId);
      const indexInParentBranch = parentBranchEntry.childQuestions.findIndex(q => q.id === questionThatStartedThisBranch.id);

      if (indexInParentBranch !== -1 && indexInParentBranch < parentBranchEntry.childQuestions.length - 1) {
        setCurrentQuestionIndex(indexInParentBranch + 1);
        resetQuestionStates();
      } else {
        const parentOfLastBranchOrigin = parentBranchEntry.childQuestions[indexInParentBranch]; 
        handleBranchEnd(parentOfLastBranchOrigin);
      }
    } else {
      const questionThatStartedThisBranch = allQuestions.find(q => q.id === lastBranchEntry.parentQuestionId);
      const indexInRoot = rootQuestions.findIndex(q => q.id === questionThatStartedThisBranch.id);

      if (indexInRoot !== -1 && indexInRoot < rootQuestions.length - 1) {
        setCurrentQuestionIndex(indexInRoot + 1);
        resetQuestionStates();
      } else {
        setIsReadyToSubmit(true);
      }
    }
  };

  const advanceQuestion = async (currentQ, currentAnswers = null) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const answersToUse = currentAnswers || answers;
      const answerArray = Object.entries(answersToUse).map(([qId, ans]) => ({
        question_id: qId,
        answer: ans
      }));

      if (responseId && !isCompletingRef.current) {
        updateResponseMutation.mutate({ 
          answers: answerArray, 
          status: 'in_progress' 
        });
      }
      
      const currentQuestionList = branchPath.length > 0
        ? branchPath[branchPath.length - 1].childQuestions
        : rootQuestions;

      await new Promise(resolve => setTimeout(resolve, 50));

      // 다음 문항 찾기 (skipQuestions에 있는 문항은 건너뜀)
      let nextIndex = currentQuestionIndex + 1;
      while (nextIndex < currentQuestionList.length && skipQuestions.has(nextIndex)) {
        nextIndex++;
      }

      if (nextIndex < currentQuestionList.length) {
        setCurrentQuestionIndex(nextIndex);
        resetQuestionStates();
      } else {
        if (branchPath.length > 0) {
          await handleBranchEnd(currentQ);
        } else {
          setIsReadyToSubmit(true);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalCopyAndSubmit = async () => {
    try {
      // 1. 클립보드 복사 시도
      if (survey?.completion_secret_code) {
        await navigator.clipboard.writeText(survey.completion_secret_code);
      }
    } catch (e) {
      console.warn('Clipboard copy failed', e);
      // 복사 실패해도 저장은 진행 (사용자가 수동 복사할 수 있도록 결과 화면에서 다시 보여줌)
    }

    // 2. 최종 저장 실행
    const finalAnswers = Object.entries(answers).map(([qId, ans]) => ({ question_id: qId, answer: ans }));
    await completeSurvey(finalAnswers);
  };

  const handleMultipleChoiceAnswer = async (questionId, answer) => {
    const newAnswers = {
      ...answers,
      [questionId]: answer
    };
    setAnswers(newAnswers);

    await advanceQuestion(currentQuestion, newAnswers);
  };

  const handleBranchingChoiceAnswer = async (questionId, answer) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const newAnswers = {
        ...answers,
        [questionId]: answer
      };
      setAnswers(newAnswers);

      // 응답 저장
      const answerArray = Object.entries(newAnswers).map(([qId, ans]) => ({
        question_id: qId,
        answer: ans
      }));

      if (responseId && !isCompletingRef.current) {
        updateResponseMutation.mutate({
          answers: answerArray,
          status: 'in_progress'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      // branch_targets에서 이동할 문항 확인
      const branchTargets = currentQuestion.branch_targets || {};
      const targetQuestionNumber = branchTargets[answer];

      // 선택하지 않은 다른 분기 경로의 문항들을 스킵 목록에 추가
      const allTargets = Object.entries(branchTargets)
        .filter(([opt, target]) => opt !== answer && target > 0)
        .map(([opt, target]) => target - 1); // 인덱스로 변환

      if (allTargets.length > 0) {
        const newSkipQuestions = new Set(skipQuestions);

        // 현재 선택한 target과 다른 target들 사이의 문항들 계산
        const selectedTargetIndex = targetQuestionNumber > 0 ? targetQuestionNumber - 1 : currentQuestionIndex + 1;
        const maxOtherTarget = Math.max(...allTargets);

        // 다른 분기 경로의 시작점부터 해당 경로 범위의 문항들을 스킵
        allTargets.forEach(otherTargetIndex => {
          // 다른 분기의 시작 문항을 스킵 목록에 추가
          // 그리고 그 문항부터 다음 분기점 또는 선택한 경로까지의 문항들도 스킵
          for (let i = otherTargetIndex; i < maxOtherTarget + 1 && i !== selectedTargetIndex; i++) {
            if (i !== selectedTargetIndex) {
              newSkipQuestions.add(i);
            }
          }
        });

        setSkipQuestions(newSkipQuestions);
      }

      if (targetQuestionNumber === 0) {
        // 0 = 설문 종료
        setIsReadyToSubmit(true);
      } else if (targetQuestionNumber && targetQuestionNumber > 0) {
        // 특정 문항으로 이동 (문항 번호는 1부터 시작, 인덱스는 0부터)
        const targetIndex = targetQuestionNumber - 1;
        if (targetIndex >= 0 && targetIndex < rootQuestions.length) {
          setCurrentQuestionIndex(targetIndex);
          resetQuestionStates();
        } else {
          // 유효하지 않은 문항 번호면 다음 문항으로
          if (currentQuestionIndex < rootQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            resetQuestionStates();
          } else {
            setIsReadyToSubmit(true);
          }
        }
      } else {
        // 비어있으면 다음 문항으로
        if (currentQuestionIndex < rootQuestions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          resetQuestionStates();
        } else {
          setIsReadyToSubmit(true);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMultipleSelectToggle = (option) => {
    const maxSelections = currentQuestion.max_selections ? parseInt(currentQuestion.max_selections) : null;

    if (selectedMultiple.includes(option)) {
      setSelectedMultiple(selectedMultiple.filter(o => o !== option));
    } else {
      // 최대 선택 개수 체크 - 초과 시 선택 불가
      if (maxSelections && maxSelections > 0 && selectedMultiple.length >= maxSelections) {
        return;
      }
      setSelectedMultiple([...selectedMultiple, option]);
    }
  };

  const handleMultipleSelectSubmit = async () => {
    if (selectedMultiple.length === 0) return;

    const answer = selectedMultiple.join(', ');
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: answer
    };
    setAnswers(newAnswers);

    await advanceQuestion(currentQuestion, newAnswers);
  };

  const handleRankingToggle = (option) => {
    const currentRankings = rankings[currentQuestion.id] || {};
    const questionOptions = currentQuestion.options || [];
    const maxSelections = currentQuestion.max_selections ? parseInt(currentQuestion.max_selections) : questionOptions.length;

    if (currentRankings[option]) {
      const removedRank = currentRankings[option];
      const newRankings = { ...currentRankings };
      delete newRankings[option];
      
      Object.keys(newRankings).forEach(key => {
        if (newRankings[key] > removedRank) {
          newRankings[key] -= 1;
        }
      });
      
      setRankings({ ...rankings, [currentQuestion.id]: newRankings });
    } else {
      // 최대 순위 개수 체크
      if (Object.keys(currentRankings).length < maxSelections) {
        const nextRank = Object.keys(currentRankings).length + 1;
        setRankings({
          ...rankings,
          [currentQuestion.id]: { ...currentRankings, [option]: nextRank }
        });
      }
    }
  };

  const handleRankingSubmit = async () => {
    const currentRankings = rankings[currentQuestion.id] || {};
    const maxSelections = currentQuestion.max_selections || currentQuestion.options.length;
    
    if (Object.keys(currentRankings).length !== maxSelections) return;

    const rankingsJSON = JSON.stringify(currentRankings);
    
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: rankingsJSON
    };
    setAnswers(newAnswers);

    await advanceQuestion(currentQuestion, newAnswers);
  };

  const handleImageChoiceAnswer = async (questionId, imageUrl, imageIndex) => {
    setSelectedImageIndex(imageIndex);
    
    const newAnswers = {
      ...answers,
      [questionId]: String(imageIndex)
    };
    setAnswers(newAnswers);
    
    await advanceQuestion(currentQuestion, newAnswers);
  };

  const handleShortAnswer = async () => {
    if (!shortAnswerText.trim() || shortAnswerText.length > 300) return;

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: shortAnswerText
    };
    setAnswers(newAnswers);

    await advanceQuestion(currentQuestion, newAnswers);
  };

  const handleNumericRatingSubmit = async () => {
    if (selectedRating === null || !hasInteracted) return;

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: String(selectedRating)
    };
    setAnswers(newAnswers);

    await advanceQuestion(currentQuestion, newAnswers);
  };

  const handleRatingClick = (rating) => {
    setSelectedRating(rating);
    setHasInteracted(true);
  };

  const handleSliderMove = (clientX) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const value = Math.round(percentage * 10);
    setSelectedRating(value);
    setHasInteracted(true);
  };

  const handleTouchStart = (e) => {
    isDragging.current = true;
    handleSliderMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (isDragging.current) {
      e.preventDefault();
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    handleSliderMove(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isDragging.current) {
      handleSliderMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 로고 컴포넌트 (카드 위에 배치)
  const Logo = () => (
    <Link to="/" className="mb-4 block">
      <img src={LogoImage} alt="픽서치" className="h-10 object-contain hover:opacity-80 transition-opacity mx-auto" />
    </Link>
  );

  if (surveyLoading || questionsLoading || !currentQuestion) {
    return (
      <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Logo />
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm w-full">
          <Logo />
          <Card className="p-6 text-center w-full rounded-2xl">
            <div className="text-4xl mb-3">🚫</div>
            <p className="text-lg font-bold text-gray-800 mb-2">{errorMessage}</p>
            <p className="text-sm text-gray-500">다른 설문조사를 찾아보세요</p>
          </Card>
        </div>
      </div>
    );
  }

  if ((!secretKey && !isPreviewMode) || surveyError || !survey) {
    return (
      <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm w-full">
          <Logo />
          <Card className="p-6 text-center w-full rounded-2xl">
            <div className="text-4xl mb-3">❌</div>
            <p className="text-lg font-bold text-gray-800 mb-2">설문을 찾을 수 없습니다</p>
            <p className="text-sm text-gray-500">링크를 다시 확인해주세요</p>
          </Card>
        </div>
      </div>
    );
  }

  // 무료설문 여부 확인 (다른 곳에서도 사용하므로 여기서 먼저 선언)
  const isFreeSurvey = survey?.survey_type === 'free';

  // 무료설문 참여자 제한 체크 (설정된 target_participants 또는 기본 1000명)
  const freeSurveyLimit = isFreeSurvey ? (survey.target_participants || 1000) : Infinity;
  const isFreeSurveyFull = isFreeSurvey && (survey.completed_responses || 0) >= freeSurveyLimit;

  if ((survey.status !== 'live' && survey.status !== 'preview') || isFreeSurveyFull) {
    return (
      <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm w-full">
          <Logo />
          <Card className="p-6 text-center w-full rounded-2xl">
            <div className="text-4xl mb-3">⏸️</div>
            <p className="text-lg font-bold text-gray-800 mb-2">
              {isFreeSurveyFull && '참여 인원 마감'}
              {survey.status === 'pending' && '승인 대기중'}
              {survey.status === 'draft' && '준비중'}
              {survey.status === 'closed' && '종료된 설문'}
            </p>
            <p className="text-sm text-gray-500">
              {isFreeSurveyFull ? `최대 참여 인원(${freeSurveyLimit}명)에 도달했습니다` : '현재 참여할 수 없습니다'}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (isReadyToSubmit && !isCompleted) {
    return (
      <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm w-full">
          <Logo />
          <Card className="p-8 text-center bg-white rounded-3xl shadow-xl w-full border-0">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-orange-500" />
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">설문 완료 전 마지막 단계!</h2>

            <div className="bg-gray-50 p-4 rounded-2xl mb-6 text-left">
              <p className="text-sm font-bold text-gray-800 mb-1">📢 안내사항</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                아래 버튼을 눌러 <span className="text-orange-600 font-bold">시크릿 코드를 복사</span>해야 설문이 최종 저장되고 완료됩니다.
                <br/><br/>
                복사된 코드를 리워드 앱에 붙여넣으세요.
              </p>
            </div>

            {survey?.completion_secret_code && (
              <div className="mb-6 opacity-50 blur-[2px] select-none pointer-events-none" aria-hidden="true">
                <div className="bg-gray-100 rounded-xl p-3 text-xs text-gray-400 font-mono text-center">
                  {survey.completion_secret_code.substring(0, 10)}...
                </div>
              </div>
            )}

            <Button
              onClick={handleFinalCopyAndSubmit}
              disabled={isCompletingRef.current}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg shadow-orange-200 rounded-xl h-14 text-base font-bold animate-pulse"
            >
              {isCompletingRef.current ? '저장 중...' : '코드 복사하고 설문 완료하기'}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm w-full">
          <Logo />
          <Card className="p-6 text-center bg-white rounded-3xl shadow-lg w-full">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">참여 완료!</h2>
            <p className="text-gray-600 mb-2">코드가 클립보드에 복사되었습니다</p>
            <p className="text-xs text-gray-400 mb-5">이 설문은 '픽서치'를 통해 제작되었습니다.</p>

            <div className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-100">
              <p className="text-xs text-green-600 font-bold mb-2">발급된 시크릿 코드</p>
              <div className="bg-white rounded-xl p-3 font-mono text-sm break-all text-gray-800 border border-gray-200 shadow-sm">
                {secretCode}
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              혹시 복사가 안되었다면 위 코드를 직접 복사해주세요
            </p>

            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(secretCode);
                  alert('다시 복사되었습니다!');
                } catch (e) {
                  console.error("Failed to copy text: ", e);
                  alert('클립보드 복사에 실패했습니다. 코드를 길게 눌러 복사해주세요.');
                }
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl h-11"
            >
              <Copy className="w-4 h-4 mr-2" />
              코드 다시 복사하기
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestionList = branchPath.length > 0 
    ? branchPath[branchPath.length - 1].childQuestions 
    : rootQuestions;

  if (!currentQuestionList || currentQuestionList.length === 0) {
    return (
      <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center max-w-sm w-full">
          <Logo />
          <Card className="p-6 text-center w-full rounded-2xl">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-lg font-bold text-gray-800 mb-2">질문이 없습니다</p>
          </Card>
        </div>
      </div>
    );
  }

  // 무료설문 개인정보 동의 화면
  const creatorDisplayName = survey?.creator_name || '설문 생성자';
  const thirdPartyDisplayName = survey?.target_persona || ''; // 제3자 정보

  if (!hasStarted) {
    // 무료설문이고 개인정보 동의가 완료되지 않은 경우
    if (isFreeSurvey && showPrivacyConsent && !isPreviewMode) {
      return (
        <div className="h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
          {survey?.status === 'preview' && (
            <div className="fixed top-0 left-0 right-0 bg-emerald-600 text-white text-center py-2 px-4 z-50 font-bold shadow-md">
              🚧 설문조사 미리보기 모드입니다
            </div>
          )}
          <div className="flex flex-col items-center w-full max-w-md">
            <Logo />
            <Card className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔒</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">개인정보 처리 동의</h2>
                <p className="text-sm text-gray-500">설문 참여를 위해 아래 항목에 동의해주세요</p>
              </div>
              
              <div className="space-y-3 mb-6">
                {/* 체크박스 1: 개인정보 수집·이용 동의 */}
                <label 
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
                    privacyAgreed 
                      ? 'bg-emerald-50 border-emerald-400' 
                      : 'bg-gray-50 border-gray-200 hover:border-emerald-300'
                  }`}
                  onClick={() => setPrivacyAgreed(!privacyAgreed)}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    privacyAgreed 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-white border-2 border-gray-300'
                  }`}>
                    {privacyAgreed && <CheckCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm mb-1">
                      <span className="text-emerald-600">(필수)</span> 개인정보 수집·이용 동의
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      본 설문에서 수집되는 개인정보의 처리 책임은 설문 생성자에게 있으며, 픽서치는 개인정보 처리자가 아닙니다.
                    </p>
                  </div>
                </label>

                {/* 체크박스 2: 개인정보 제3자 제공 동의 */}
                <label 
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
                    thirdPartyAgreed 
                      ? 'bg-blue-50 border-blue-400' 
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setThirdPartyAgreed(!thirdPartyAgreed)}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    thirdPartyAgreed 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border-2 border-gray-300'
                  }`}>
                    {thirdPartyAgreed && <CheckCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm mb-1">
                      <span className="text-blue-600">(필수)</span> 개인정보 제3자 제공 동의
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      설문 참여자가 입력한 개인정보는 시스템 운영을 위해 픽서치(picksearch.ai) 서버에 저장됩니다.
                    </p>
                  </div>
                </label>

                {/* 고지 문구 */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    ※ 민감정보 또는 타인의 개인정보를 입력하지 마십시오.<br/>
                    해당 정보 입력에 대한 책임은 설문 생성자에게 있습니다.
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => setShowPrivacyConsent(false)}
                disabled={!privacyAgreed || !thirdPartyAgreed}
                className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-xl shadow-lg text-base transition-all"
              >
                동의하고 시작하기
              </Button>
            </div>
          </Card>
          </div>
        </div>
      );
    }

    // 일반 설문 또는 동의 완료 후 시작 화면
    return (
      <div className={`h-screen ${isFreeSurvey ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50' : 'bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50'} flex items-center justify-center p-4`}>
        {(survey?.status === 'preview' || isPreviewMode) && (
          <div className={`fixed top-0 left-0 right-0 ${isFreeSurvey ? 'bg-emerald-600' : 'bg-orange-600'} text-white text-center py-2 px-4 z-50 font-bold shadow-md`}>
            {isPreviewMode ? '📋 예시 설문 체험 모드입니다' : '🚧 설문조사 미리보기 모드입니다'}
          </div>
        )}
        <div className="flex flex-col items-center w-full max-w-md">
          <Logo />
          <Card className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className={`h-2 ${isFreeSurvey ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-orange-500 to-pink-500'}`}></div>
          <Card className="p-8 border-0 shadow-none">
            <div className="mb-8">
              <div className={`w-16 h-16 ${isFreeSurvey ? 'bg-gradient-to-tr from-emerald-100 to-teal-100' : 'bg-gradient-to-tr from-orange-100 to-pink-100'} rounded-2xl flex items-center justify-center mb-4 shadow-inner`}>
                <span className="text-3xl">📝</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3 break-keep">{survey.title}</h1>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap break-words w-full">
                {survey.description}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>총 문항수</span>
                  <span className="font-bold text-gray-900">{rootQuestions.length}문항</span>
                </div>
                <div className="flex justify-between">
                  <span>소요 시간</span>
                  <span className="font-bold text-gray-900">약 {rootQuestions.reduce((acc, q) => acc + (q.question_type === 'short_answer' ? 7 : 3), 0)}초</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setHasStarted(true);
                  if (survey?.status !== 'preview' && !isPreviewMode && !hasInitialized.current) {
                    hasInitialized.current = true;
                    initResponseMutation.mutate();
                  }
                }}
                className={`w-full h-12 ${isFreeSurvey ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600' : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600'} text-white font-bold rounded-xl shadow-lg text-base`}
              >
                설문 시작하기
              </Button>
            </div>
          </Card>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      {(survey?.status === 'preview' || isPreviewMode) && (
        <div className="fixed top-0 left-0 right-0 bg-orange-600 text-white text-center py-2 px-4 z-50 font-bold shadow-md">
          {isPreviewMode ? '📋 예시 설문 체험 모드입니다' : '🚧 설문조사 미리보기 모드입니다'}
        </div>
      )}
      <div className="flex flex-col items-center max-w-md w-full">
        <Logo />
        <div className="w-full" key={currentQuestion?.id || 'loading'}>
          <Card className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="text-center">
                  <span className="text-sm font-bold text-orange-600">
                    {currentQuestionIndex + 1} / {currentQuestionList.length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col max-h-[calc(100vh-200px)]">
                <div className="sticky top-0 bg-white z-10 p-5 pb-3 border-b border-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md text-sm">
                      {currentQuestionIndex + 1}
                    </div>
                    <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {currentQuestion.question_type === 'multiple_choice' ? '객관식' :
                     currentQuestion.question_type === 'choice_with_other' ? '객관+주관' :
                     currentQuestion.question_type === 'multiple_select' ? '다중선택' :
                     currentQuestion.question_type === 'ranking' ? '순위형' :
                     currentQuestion.question_type === 'short_answer' ? '주관식' :
                     currentQuestion.question_type === 'numeric_rating' ? '수치평정' :
                     currentQuestion.question_type === 'likert_scale' ? '리커트 척도' :
                     currentQuestion.question_type === 'branching_choice' ? '분기형' :
                     currentQuestion.question_type === 'image_banner' ? '이벤트' : '이미지선택'}
                     </div>
                     {currentQuestion.question_type === 'multiple_select' && (
                     <span className="text-xs text-violet-600 font-medium">✓ 복수선택</span>
                     )}
                     {currentQuestion.question_type === 'ranking' && (
                     <span className="text-xs text-amber-600 font-medium">🏆 순위 매기기</span>
                     )}
                     {currentQuestion.question_type === 'image_choice' && (
                     <span className="text-xs text-purple-600 font-medium">👇 이미지 중 하나를 선택하세요</span>
                     )}
                     {currentQuestion.question_type === 'numeric_rating' && (
                     <span className="text-xs text-teal-600 font-medium">👇 아래 바를 움직이세요</span>
                     )}
                     {currentQuestion.question_type === 'likert_scale' && (
                      <span className="text-xs text-blue-600 font-medium">👇 적절한 응답을 선택하세요</span>
                     )}
                     {currentQuestion.question_type === 'image_banner' && (
                      <span className="text-xs text-pink-600 font-medium">📢 이벤트 안내</span>
                     )}
                     </div>

                     {currentQuestion.question_type !== 'image_banner' && (
                       <h2 className="text-lg font-bold text-gray-800 leading-relaxed">
                       {currentQuestion.question_text}
                       </h2>
                     )}
                     </div>

                     <div className="flex-1 overflow-y-auto p-5 pt-3">

                {currentQuestion.question_type === 'multiple_choice' ? (
                  <div className="space-y-2.5">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = answers[currentQuestion.id] === option;
                      return (
                        <button
                          key={index}
                          onClick={() => handleMultipleChoiceAnswer(currentQuestion.id, option)}
                          className={`w-full p-3.5 rounded-xl text-left font-medium transition-all shadow-sm hover:shadow-md border-2 flex items-center active:scale-98 ${
                            isSelected
                              ? 'bg-orange-500 text-white border-orange-600'
                              : 'bg-gradient-to-r from-orange-50 to-pink-50 hover:from-orange-100 hover:to-pink-100 text-gray-800 border-transparent hover:border-orange-300'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 font-bold shadow-sm text-xs ${
                            isSelected ? 'bg-white text-orange-600' : 'bg-white text-orange-600'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="flex-1 text-sm">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : currentQuestion.question_type === 'branching_choice' ? (
                  <div className="space-y-2.5">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = answers[currentQuestion.id] === option;
                      return (
                        <button
                          key={index}
                          onClick={() => handleBranchingChoiceAnswer(currentQuestion.id, option)}
                          disabled={isProcessing}
                          className={`w-full p-3.5 rounded-xl text-left font-medium transition-all shadow-sm hover:shadow-md border-2 flex items-center active:scale-98 disabled:opacity-50 ${
                            isSelected
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : 'bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-gray-800 border-transparent hover:border-emerald-300'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 font-bold shadow-sm text-xs ${
                            isSelected ? 'bg-white text-emerald-600' : 'bg-white text-emerald-600'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="flex-1 text-sm">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : currentQuestion.question_type === 'choice_with_other' ? (
                  <div className="space-y-3">
                    <div className="space-y-2.5">
                      {currentQuestion.options.map((option, index) => {
                        const isLastOption = index === currentQuestion.options.length - 1;
                        const isSelected = selectedAnswer === option;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedAnswer(option);
                              if (!isLastOption) {
                                setOtherText('');
                                // 마지막 항목이 아니면 바로 진행
                                setTimeout(async () => {
                                  const newAnswers = {
                                    ...answers,
                                    [currentQuestion.id]: option
                                  };
                                  setAnswers(newAnswers);
                                  await advanceQuestion(currentQuestion, newAnswers);
                                }, 100);
                              }
                            }}
                            disabled={isProcessing}
                            className={`w-full p-3.5 rounded-xl text-left font-medium transition-all shadow-sm hover:shadow-md border-2 flex items-center active:scale-98 ${
                              isSelected
                                ? 'bg-cyan-500 text-white border-cyan-600'
                                : 'bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 text-gray-800 border-transparent hover:border-cyan-300'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 font-bold shadow-sm text-xs ${
                              isSelected ? 'bg-white text-cyan-600' : 'bg-white text-cyan-600'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="flex-1 text-sm">{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedAnswer && selectedAnswer === currentQuestion.options[currentQuestion.options.length - 1] && (
                      <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                        <label className="text-xs font-medium text-cyan-700 mb-2 block">직접 입력해주세요</label>
                        <Input
                          value={otherText}
                          onChange={(e) => setOtherText(e.target.value.slice(0, 300))}
                          placeholder="답변을 입력하세요 (최대 300자)"
                          className="border-cyan-300 focus:border-cyan-500 rounded-lg h-10 text-sm"
                          autoFocus
                        />
                        <div className="text-xs text-cyan-600 mt-1 text-right">{otherText.length}/300</div>
                      </div>
                    )}

                    {selectedAnswer && selectedAnswer === currentQuestion.options[currentQuestion.options.length - 1] && (
                      <Button
                        onClick={async () => {
                          const finalAnswer = `${selectedAnswer}: ${otherText}`;
                          
                          const newAnswers = {
                            ...answers,
                            [currentQuestion.id]: finalAnswer
                          };
                          setAnswers(newAnswers);
                          await advanceQuestion(currentQuestion, newAnswers);
                        }}
                        disabled={!otherText.trim() || isProcessing}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg rounded-xl h-11 text-sm font-bold disabled:opacity-50"
                      >
                        {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                        {(currentQuestionIndex === currentQuestionList.length - 1 && branchPath.length === 0) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            완료
                          </>
                        ) : (
                          <>
                            다음
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : currentQuestion.question_type === 'multiple_select' ? (
                  <div className="space-y-3">
                    {currentQuestion.max_selections && (
                      <div className="bg-violet-50 rounded-lg p-2 border border-violet-200">
                        <p className="text-xs text-violet-700 font-medium">
                          📌 최대 {currentQuestion.max_selections}개까지 선택 가능
                        </p>
                      </div>
                    )}
                    <div className="space-y-2.5">
                     {currentQuestion.options.map((option, index) => {
                       const isSelected = selectedMultiple.includes(option);
                       const maxSelections = currentQuestion.max_selections ? parseInt(currentQuestion.max_selections) : null;
                       const isMaxReached = maxSelections && maxSelections > 0 && selectedMultiple.length >= maxSelections && !isSelected;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleMultipleSelectToggle(option)}
                            disabled={isMaxReached}
                            className={`w-full p-3.5 rounded-xl text-left font-medium transition-all shadow-sm hover:shadow-md border-2 flex items-center active:scale-98 ${
                              isSelected 
                                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-violet-600' 
                                : isMaxReached
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 text-gray-800 border-transparent hover:border-violet-300'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center mr-3 font-bold shadow-sm text-xs border-2 ${
                              isSelected 
                                ? 'bg-white text-violet-600 border-white' 
                                : isMaxReached
                                ? 'bg-gray-200 text-gray-300 border-gray-300'
                                : 'bg-white text-violet-400 border-violet-200'
                            }`}>
                              {isSelected ? '✓' : index + 1}
                            </span>
                            <span className="flex-1 text-sm">{option}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedMultiple.length > 0 && (
                      <div className="bg-violet-50 rounded-xl p-3 border border-violet-200">
                       <p className="text-xs text-violet-700 font-medium mb-1">
                         선택된 항목: {selectedMultiple.length}{currentQuestion.max_selections ? `/${currentQuestion.max_selections}` : ''}개
                       </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedMultiple.map((item, idx) => (
                            <span key={idx} className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={handleMultipleSelectSubmit}
                      disabled={selectedMultiple.length === 0 || isProcessing}
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg rounded-xl h-11 text-sm font-bold disabled:opacity-50"
                    >
                      {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                      {(currentQuestionIndex === currentQuestionList.length - 1 && branchPath.length === 0) ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          완료
                        </>
                      ) : (
                        <>
                          다음
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : currentQuestion.question_type === 'ranking' ? (
                <div className="space-y-3">
                 {currentQuestion.max_selections && (
                   <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
                     <p className="text-xs text-amber-700 font-medium">
                       📌 상위 {currentQuestion.max_selections}개까지만 순위를 매겨주세요
                     </p>
                   </div>
                 )}
                 <div className="space-y-2.5">
                    {currentQuestion.options.map((option, index) => {
                      const rank = rankings[currentQuestion.id]?.[option];
                      const maxSelections = currentQuestion.max_selections ? parseInt(currentQuestion.max_selections) : currentQuestion.options.length;
                      const currentRankCount = Object.keys(rankings[currentQuestion.id] || {}).length;
                      const isMaxReached = maxSelections > 0 && currentRankCount >= maxSelections && !rank;

                      return (
                        <button
                          key={index}
                          onClick={() => handleRankingToggle(option)}
                          disabled={isMaxReached}
                          className={`w-full p-3 rounded-xl text-left font-bold transition-all shadow-sm hover:shadow-md border-2 flex items-center active:scale-98 relative ${
                            rank
                              ? `bg-gradient-to-r ${getRankingColor(rank)} text-white border-amber-500` 
                              : isMaxReached
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                              : 'bg-white hover:bg-amber-50 text-gray-700 border-gray-200 hover:border-amber-300'
                          }`}
                        >
                          <span className={`w-9 h-9 rounded-full flex items-center justify-center mr-2.5 font-bold shadow-md text-base flex-shrink-0 ${
                            rank 
                              ? 'bg-white text-amber-600' 
                              : isMaxReached
                              ? 'bg-gray-200 text-gray-300 border-2 border-gray-300'
                              : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                          }`}>
                            {rank ? getRankingBadge(rank) : index + 1}
                          </span>
                          <span className="flex-1 text-sm break-words leading-snug">{option}</span>
                        </button>
                      );
                    })}
                   </div>
                    
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 h-[120px] flex flex-col">
                      <p className="text-xs text-amber-700 font-medium mb-2">
                        📊 선택된 순위: {Object.keys(rankings[currentQuestion.id] || {}).length}/{currentQuestion.max_selections || currentQuestion.options.length}개
                      </p>
                      <div className="flex-1 overflow-y-auto">
                        {Object.keys(rankings[currentQuestion.id] || {}).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(rankings[currentQuestion.id] || {})
                              .sort(([, a], [, b]) => a - b)
                              .map(([option, rank], idx) => (
                                <div key={idx} className="text-xs text-amber-800 flex items-center gap-2 font-medium">
                                  <span className="text-base">{getRankingBadge(rank)}</span>
                                  <span>{option}</span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-xs text-amber-600">👆 항목을 클릭하여 순위를 매겨주세요</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleRankingSubmit}
                      disabled={Object.keys(rankings[currentQuestion.id] || {}).length !== (currentQuestion.max_selections || currentQuestion.options.length) || isProcessing}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg rounded-xl h-12 text-base font-bold disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-400"
                    >
                      {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                      {(currentQuestionIndex === currentQuestionList.length - 1 && branchPath.length === 0) ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          완료
                        </>
                      ) : (
                        <>
                          다음
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : currentQuestion.question_type === 'numeric_rating' ? (
                  <div className="space-y-6">
                    <div className="space-y-3 px-2">
                      <div className="relative pt-2 pb-1">
                        <div className="grid grid-cols-11 gap-0 relative">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const colorScheme = getGradientColorForNumber(num);
                            const isSelected = selectedRating !== null && num <= selectedRating;
                            
                            return (
                              <button
                                key={num}
                                onClick={() => handleRatingClick(num)}
                                className="flex flex-col items-center relative z-20 cursor-pointer touch-manipulation"
                              >
                                <div 
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-lg ${
                                    isSelected
                                      ? `bg-gradient-to-br ${colorScheme.bg} ${colorScheme.text} scale-125` 
                                      : 'bg-gray-200 text-gray-400'
                                  }`}
                                >
                                  {num}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 px-1">
                        <span>최저</span>
                        <span className="font-bold text-teal-600 text-base">
                          {selectedRating !== null ? `${selectedRating}점` : '-'}
                        </span>
                        <span>최고</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleNumericRatingSubmit}
                      disabled={selectedRating === null || !hasInteracted || isProcessing}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg rounded-xl h-12 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                      {(currentQuestionIndex === currentQuestionList.length - 1 && branchPath.length === 0) ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          완료
                        </>
                      ) : (
                        <>
                          다음
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : currentQuestion.question_type === 'likert_scale' ? (
                  <div className="space-y-0.5">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const isSelected = answers[currentQuestion.id] === String(value);
                      return (
                        <button
                          key={value}
                          onClick={() => handleMultipleChoiceAnswer(currentQuestion.id, String(value))}
                          className={`w-full p-5 ${getLikertColor(value)} text-white font-bold text-base transition-all shadow-sm hover:shadow-lg active:scale-[0.98] hover:brightness-110 ${
                            value === 1 ? 'rounded-t-2xl' : value === 5 ? 'rounded-b-2xl' : ''
                          } ${isSelected ? 'ring-4 ring-offset-2 ring-orange-400 z-10' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{value}</span>
                            <span className="flex-1 text-center">{getLikertLabel(value, currentQuestion)}</span>
                            <div className="w-8 text-center">{isSelected && <CheckCircle className="w-6 h-6" />}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : currentQuestion.question_type === 'image_choice' ? (
                  <div className="space-y-3">
                    {currentQuestion.image_urls.map((imageUrl, index) => {
                      const isLoaded = loadedImages.has(imageUrl);
                      return (
                        <button
                          key={index}
                          onClick={() => handleImageChoiceAnswer(currentQuestion.id, imageUrl, index)}
                          className={`w-full aspect-square rounded-2xl overflow-hidden border-4 transition-all shadow-lg relative hover:scale-[1.02] active:scale-95 hover:shadow-2xl cursor-pointer bg-gray-50 ${
                            selectedImageIndex === index
                              ? 'border-purple-500 ring-4 ring-purple-200'
                              : 'border-transparent hover:border-purple-500'
                          }`}
                        >
                          {!isLoaded && (
                            <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center z-10">
                              <div className="w-10 h-10 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                            </div>
                          )}
                          <img
                            src={getOptimizedImageUrl(imageUrl)}
                            alt={`선택지 ${index + 1}`}
                            className={`w-full h-full object-contain transition-opacity duration-500 ${
                              isLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoad={() => setLoadedImages(prev => new Set([...prev, imageUrl]))}
                          />
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg">
                            선택지 {index + 1}
                          </div>
                          {selectedImageIndex === index && (
                            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                              <div className="bg-white rounded-full p-3 shadow-xl">
                                <CheckCircle className="w-8 h-8 text-purple-600" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : currentQuestion.question_type === 'image_banner' ? (
                  <div className="space-y-4">
                    {currentQuestion.image_urls && currentQuestion.image_urls.length > 0 && (
                      <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100 relative">
                        {!loadedImages.has(currentQuestion.image_urls[0]) && (
                          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center z-10">
                            <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin"></div>
                          </div>
                        )}
                        <img 
                          src={getOptimizedImageUrl(currentQuestion.image_urls[0])}
                          alt="이벤트 배너" 
                          className={`w-full h-full object-cover transition-opacity duration-500 ${
                            loadedImages.has(currentQuestion.image_urls[0]) ? 'opacity-100' : 'opacity-0'
                          }`}
                          onLoad={() => setLoadedImages(prev => new Set([...prev, currentQuestion.image_urls[0]]))}
                        />
                      </div>
                    )}
                    
                    {currentQuestion.question_text && (
                      <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                          {currentQuestion.question_text}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={async () => {
                        const newAnswers = {
                          ...answers,
                          [currentQuestion.id]: '조회'
                        };
                        setAnswers(newAnswers);
                        await advanceQuestion(currentQuestion, newAnswers);
                      }}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg rounded-xl h-12 text-base font-bold"
                    >
                      {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                      {(currentQuestionIndex === currentQuestionList.length - 1 && branchPath.length === 0) ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          완료
                        </>
                      ) : (
                        <>
                          다음
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Input
                        value={shortAnswerText}
                        onChange={(e) => setShortAnswerText(e.target.value.slice(0, 300))}
                        placeholder="답변 입력 (최대 300자)"
                        className="border-2 border-gray-200 focus:border-orange-500 rounded-xl h-11 text-sm px-4 pr-14"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && shortAnswerText.trim()) {
                            handleShortAnswer();
                          }
                        }}
                        autoFocus
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {shortAnswerText.length}/300
                      </div>
                    </div>
                    <Button
                      onClick={handleShortAnswer}
                      disabled={!shortAnswerText.trim() || isProcessing}
                      className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg rounded-xl h-11 text-sm font-bold disabled:opacity-50"
                    >
                      {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                      {(currentQuestionIndex === currentQuestionList.length - 1 && branchPath.length === 0) ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          완료
                        </>
                      ) : (
                        <>
                          다음
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Previous Button */}
                {(currentQuestionIndex > 0 || branchPath.length > 0) && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={isProcessing}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      이전 질문
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}