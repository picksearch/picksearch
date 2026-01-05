import React, { useState, useEffect } from "react";
import { auth } from "@/api/auth";
import { Survey, Question, Response } from "@/api/entities";
import { InvokeLLM, UploadFile } from "@/api/integrations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, GripVertical, CheckCircle, ArrowRight, Users, Upload, Image as ImageIcon, Loader2, BarChart2, ListChecks, Coins, Home, Sparkles, MessageSquare, Target, X, Eye, ArrowUp, ArrowDown, Megaphone, Calendar as CalendarIcon, ArrowLeft, Smartphone, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TARGET_OPTIONS } from "@/components/targetOptions";
import { format, addDays, isBefore, startOfDay, differenceInDays } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function CreateSurvey() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const urlParams = new URLSearchParams(window.location.search);
  const draftId = urlParams.get('draft');

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem('survey_current_step');
    return saved ? parseInt(saved) : 0;
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [usagePurpose, setUsagePurpose] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [targetSettings, setTargetSettings] = useState(null);
  const [enableAdditionalTargets, setEnableAdditionalTargets] = useState(false);
  const [enableAppTargets, setEnableAppTargets] = useState(false);
  const [enableLocationTargets, setEnableLocationTargets] = useState(false);
  const [customAppText, setCustomAppText] = useState("");
  const [customLocationText, setCustomLocationText] = useState("");
  const [tempAppInput, setTempAppInput] = useState("");
  const [tempLocationInput, setTempLocationInput] = useState("");
  const [isComposingApp, setIsComposingApp] = useState(false);
  const [isComposingLocation, setIsComposingLocation] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [uploadingImages, setUploadingImages] = useState({});
  const [slotCount, setSlotCount] = useState(1);
  const [useLandingPage, setUseLandingPage] = useState(false);
  const [landingPageUrl, setLandingPageUrl] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [draftSurveyId, setDraftSurveyId] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [highlightedQuestionId, setHighlightedQuestionId] = useState(null);
  const [selectedSurveyType, setSelectedSurveyType] = useState(null);
  const [proceedingToPayment, setProceedingToPayment] = useState(false);

  const dateRange = { from: startDate, to: endDate };
  const BASE_PRICE = 330000;

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await auth.me();
      } catch (error) {
        return null;
      }
    },
    retry: false
  });

  useEffect(() => {
    if (location.state?.targets) {
      setTargetSettings(location.state.targets);
    }
    if (location.state?.draftId) {
      setDraftSurveyId(location.state.draftId);
    }
  }, [location.state]);

  const saveTempState = () => {
    const state = {
      title,
      description,
      purpose,
      usagePurpose,
      questions,
      targetSettings,
      customAppText,
      customLocationText,
      useLandingPage,
      landingPageUrl,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      slotCount,
      draftSurveyId,
      enableAdditionalTargets,
      enableAppTargets,
      enableLocationTargets,
      currentStep
    };
    localStorage.setItem('temp_survey_state', JSON.stringify(state));
  };

  useEffect(() => {
    const aiGenerated = urlParams.get('ai');
    const copied = urlParams.get('copy');
    const startStep = urlParams.get('start');

    // draftId가 있으면 temp state 무시하고 직접 draft 로드
    if (draftId) {
      localStorage.removeItem('temp_survey_state'); // 이전 temp state 제거
      loadDraft(draftId);
      return;
    }

    const tempState = localStorage.getItem('temp_survey_state');
    if (tempState) {
      try {
        const data = JSON.parse(tempState);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setPurpose(data.purpose || "");
        setUsagePurpose(data.usagePurpose || "");
        setQuestions(data.questions || []);
        if (data.targetSettings && !location.state?.targets) {
          setTargetSettings(data.targetSettings);
        }
        setCustomAppText(data.customAppText || "");
        setCustomLocationText(data.customLocationText || "");
        setUseLandingPage(data.useLandingPage || false);
        setLandingPageUrl(data.landingPageUrl || "");
        if (data.startDate) setStartDate(new Date(data.startDate));
        if (data.endDate) setEndDate(new Date(data.endDate));
        setSlotCount(data.slotCount || 1);
        setEnableAdditionalTargets(data.enableAdditionalTargets || false);
        setEnableAppTargets(data.enableAppTargets || false);
        setEnableLocationTargets(data.enableLocationTargets || false);
        setCurrentStep(data.currentStep || 1);
        if (data.draftSurveyId) setDraftSurveyId(data.draftSurveyId);

        localStorage.removeItem('temp_survey_state');
        return;
      } catch (e) {
        console.error("Failed to load temp state", e);
      }
    }

    if (aiGenerated === 'true') {
      loadAIGeneratedSurvey();
    } else if (copied === 'true') {
      loadCopiedSurvey();
    } else if (startStep === '1') {
      // ClientHome에서 바로 step 1로 이동
      setCurrentStep(1);
    } else {
      setCurrentStep(0);
    }
  }, []);

  const loadAIGeneratedSurvey = () => {
    try {
      const stored = localStorage.getItem('ai_generated_survey');
      if (stored) {
        const data = JSON.parse(stored);
        setTitle(data.title || "");
        setDescription(data.description || "");

        const combinedPurpose = [
          data.survey_purpose ? `[설문 목적]\n${data.survey_purpose}` : '',
          data.target_audience ? `[조사 대상]\n${data.target_audience}` : '',
          data.target_persona ? `[타겟 페르소나]\n${data.target_persona}` : '',
          data.survey_area ? `[조사 영역]\n${data.survey_area}` : ''].
          filter(Boolean).join('\n\n');

        setPurpose(combinedPurpose || data.survey_purpose || "");
        setUsagePurpose(data.usage_purpose || "");
        setQuestions(data.questions || []);

        if (data.startDate && data.endDate) {
          setStartDate(new Date(data.startDate));
          setEndDate(new Date(data.endDate));
        }

        if (data.target_options) {
          try {
            if (Array.isArray(data.target_options)) {
              setTargetSettings(data.target_options);
            }
          } catch (e) {
            console.error('Failed to parse target_options:', e);
          }
        }

        localStorage.removeItem('ai_generated_survey');
        setCurrentStep(0);
        setTimeout(() => {
          alert('🎉 AI가 생성한 설문이 적용되었습니다!');
        }, 500);
      }
    } catch (error) {
      console.error('Failed to load AI generated survey:', error);
    }
  };

  const loadCopiedSurvey = () => {
    try {
      const stored = localStorage.getItem('copied_survey');
      if (stored) {
        const data = JSON.parse(stored);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setPurpose(data.survey_purpose || "");
        setUsagePurpose(data.usage_purpose || "");
        setQuestions(data.questions || []);

        if (data.target_options) {
          setTargetSettings(Array.isArray(data.target_options) ? data.target_options : data.target_options.cells || null);
        }

        if (data.scheduled_start && data.scheduled_end) {
          setStartDate(new Date(data.scheduled_start));
          setEndDate(new Date(data.scheduled_end));
        } else {
          const minStart = calculateMinStartDate();
          setStartDate(minStart);
          setEndDate(addDays(minStart, 3));
        }

        setSlotCount(data.slot_count || 1);
        setUseLandingPage(data.landing_enabled || false);
        setLandingPageUrl(data.landing_page_url || "");

        localStorage.removeItem('copied_survey');
        setCurrentStep(0);
        setTimeout(() => {
          alert('📋 설문이 복사되었습니다!');
        }, 500);
      }
    } catch (error) {
      console.error('Failed to load copied survey:', error);
    }
  };

  const loadDraft = async (surveyId) => {
    try {
      const surveys = await Survey.filter({ id: surveyId });
      if (surveys.length > 0) {
        const survey = surveys[0];
        setTitle(survey.title || "");
        setDescription(survey.description || "");

        // 별도 컬럼에서 로드
        setPurpose(survey.survey_purpose || "");
        setUsagePurpose(survey.usage_purpose || "");

        setDraftSurveyId(survey.id);
        setUseLandingPage(survey.landing_enabled || false);
        setLandingPageUrl(survey.landing_page_url || "");
        setSlotCount(survey.slot_count || 1);

        if (survey.scheduled_start) {
          const savedStart = new Date(survey.scheduled_start);
          const minStart = calculateMinStartDate();
          if (isBefore(startOfDay(savedStart), startOfDay(minStart))) {
            setStartDate(null);
            setEndDate(null);
          } else {
            setStartDate(savedStart);
            if (survey.scheduled_end) setEndDate(new Date(survey.scheduled_end));
          }
        }

        if (survey.target_options) {
          const loadedTargets = Array.isArray(survey.target_options) ?
            survey.target_options :
            survey.target_options?.cells || null;

          if (loadedTargets) {
            setTargetSettings(loadedTargets);

            // 타겟 설정이 있으면 enableAdditionalTargets 체크
            const hasNonDemoTargets = loadedTargets.some((cell) => {
              const targets = cell.targets || {};
              return Object.keys(targets).some((key) => {
                if (key !== 'DEMO') return true;
                // DEMO 내에서도 성별/연령 외 다른 설정이 있는지 확인
                const demoFields = targets[key];
                return Object.keys(demoFields).some((field) => field !== 'gender' && field !== 'age_10s');
              });
            });
            if (hasNonDemoTargets) {
              setEnableAdditionalTargets(true);
            }
          }
        }

        // customAppText, customLocationText 복원
        if (survey.target_options?.customAppText) {
          setCustomAppText(survey.target_options.customAppText);
          setEnableAppTargets(true);
        }
        if (survey.target_options?.customLocationText) {
          setCustomLocationText(survey.target_options.customLocationText);
          setEnableLocationTargets(true);
        }

        const loadedQuestions = await Question.filter({ survey_id: survey.id }, 'order');
        const rootQuestions = loadedQuestions.filter((q) => !q.parent_question_id).sort((a, b) => a.order - b.order);
        const reconstructedQuestions = rootQuestions.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          image_urls: q.image_urls || [],
          image_descriptions: q.image_descriptions || [],
          max_selections: q.max_selections,
          branch_targets: q.branch_targets,
          order: q.order,
          cost: q.cost
        }));

        setQuestions(reconstructedQuestions);
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const generateSecretKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateCompletionSecretCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let code = '';
    for (let i = 0; i < 30; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const calculateTargetingSurcharge = () => {
    const surcharges = [];

    if (targetSettings && Array.isArray(targetSettings)) {
      targetSettings.forEach((cell) => {
        if (!cell.targets) return;

        Object.entries(cell.targets).forEach(([categoryKey, fields]) => {
          Object.entries(fields).forEach(([fieldKey, value]) => {
            // 성별과 연령대는 할증 계산에서 제외
            if (categoryKey === 'DEMO' && (fieldKey === 'gender' || fieldKey === 'age_10s')) {
              return;
            }

            const categoryConfig = TARGET_OPTIONS[categoryKey];
            const fieldConfig = categoryConfig?.fields.find((f) => f.key === fieldKey);
            const categoryLabel = categoryConfig?.label || categoryKey;
            const fieldLabel = fieldConfig?.label || fieldKey;

            if (Array.isArray(value)) {
              value.forEach((v) => {
                const option = fieldConfig?.options?.find((o) => o.value === v);
                const displayValue = option?.label || v;
                surcharges.push({
                  label: `${categoryLabel} 타겟`,
                  rate: 0.03,
                  detail: displayValue
                });
              });
            } else {
              const option = fieldConfig?.options?.find((o) => o.value === value);
              const displayValue = option?.label || value;
              surcharges.push({
                label: `${categoryLabel} 타겟`,
                rate: 0.03,
                detail: displayValue
              });
            }
          });
        });
      });
    }

    if (customAppText && customAppText.trim()) {
      const apps = customAppText.split(',').filter((a) => a.trim());
      apps.forEach((app) => {
        surcharges.push({
          label: '특정 앱 설치 타겟',
          rate: 0.05,
          detail: app.trim()
        });
      });
    }
    if (customLocationText && customLocationText.trim()) {
      const locations = customLocationText.split(',').filter((l) => l.trim());
      locations.forEach((loc) => {
        surcharges.push({
          label: 'T-map 위치 검색 타겟',
          rate: 0.05,
          detail: loc.trim()
        });
      });
    }

    return surcharges;
  };

  const calculateFinalUnitPrice = () => {
    const surcharges = calculateTargetingSurcharge();
    let finalPrice = BASE_PRICE;
    surcharges.forEach((s) => {
      finalPrice *= 1 + s.rate;
    });
    // 백원 단위 아래로 버림
    return Math.floor(finalPrice / 100) * 100;
  };

  const calculateTotalCost = () => {
    if (!startDate || !endDate || slotCount < 1) return BASE_PRICE;

    const duration = differenceInDays(endDate, startDate) + 1;
    // 할증 적용하지 않은 기본 가격 사용
    const baseCost = slotCount * (duration > 0 ? duration : 1) * BASE_PRICE;
    // 이벤트 페이지 연결 비용도 무료 이벤트로 제외

    // 백원 단위 아래로 버림
    return Math.floor(baseCost / 100) * 100;
  };

  const calculateMinStartDate = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    let minDate = addDays(now, 1);

    if (hour >= 14) {
      minDate = addDays(now, 2);
    }

    if (day === 5) {
      if (hour >= 14) {
        minDate = addDays(now, 4);
      } else {
        minDate = addDays(now, 1);
      }
    }

    return startOfDay(minDate);
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now(),
      question_text: '',
      question_type: type,
      options: type === 'multiple_choice' || type === 'multiple_select' || type === 'ranking' || type === 'choice_with_other' ? ['', ''] :
        type === 'likert_scale' ? ['', '', '', '', ''] : [],
      image_urls: type === 'image_choice' || type === 'image_banner' ? [] : [],
      image_descriptions: type === 'image_choice' ? [] : [],
      max_selections: type === 'multiple_select' || type === 'ranking' ? null : undefined,
      has_other_option: type === 'choice_with_other' ? true : undefined,
      order: questions.length,
      cost: 0
    };

    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id, updatedQuestion) => {
    setQuestions(questions.map((q) => q.id === id ? updatedQuestion : q));
  };

  const updateOption = (questionId, index, value) => {
    setQuestions(questions.map((q) => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[index] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map((q) => {
      if (q.id === questionId && q.options.length < 10) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const removeOption = (questionId, index) => {
    setQuestions(questions.map((q) => {
      if (q.id === questionId && q.options.length > 2) {
        return { ...q, options: q.options.filter((_, i) => i !== index) };
      }
      return q;
    }));
  };

  const handleImageUpload = async (questionId, file) => {
    if (!file) return;

    setUploadingImages((prev) => ({ ...prev, [questionId]: true }));

    try {
      const file_url = await UploadFile(file);

      setQuestions(questions.map((q) => {
        if (q.id === questionId && q.image_urls.length < 2) {
          return {
            ...q,
            image_urls: [...q.image_urls, file_url],
            image_descriptions: [...(q.image_descriptions || []), '']
          };
        }
        return q;
      }));
    } catch (error) {
      alert('이미지 업로드에 실패했습니다');
    } finally {
      setUploadingImages((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const updateImageDescription = (questionId, imageIndex, description) => {
    setQuestions(questions.map((q) => {
      if (q.id === questionId) {
        const newDescriptions = [...(q.image_descriptions || [])];
        newDescriptions[imageIndex] = description;
        return { ...q, image_descriptions: newDescriptions };
      }
      return q;
    }));
  };

  const removeImage = (questionId, imageIndex) => {
    setQuestions(questions.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          image_urls: q.image_urls.filter((_, i) => i !== imageIndex),
          image_descriptions: (q.image_descriptions || []).filter((_, i) => i !== imageIndex)
        };
      }
      return q;
    }));
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const moveQuestion = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const movedQuestionId = newQuestions[index].id;

    console.log('🔄 질문 이동:', { movedQuestionId, from: index, to: targetIndex, direction });

    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

    newQuestions.forEach((q, idx) => {
      q.order = idx;
    });

    setQuestions(newQuestions);
    setHighlightedQuestionId(movedQuestionId);
    console.log('✅ 하이라이트 설정:', movedQuestionId);
  };

  const saveDraftMutation = useMutation({
    mutationFn: async (options = {}) => {
      let surveyId = draftSurveyId;
      const statusToSave = options.status || 'draft';

      if (!surveyId) {
        const secretKey = generateSecretKey();
        const completionSecretCode = generateCompletionSecretCode();

        const survey = await Survey.create({
          title: title || '제목 없음',
          description: description || '',
          survey_type: 'paid',
          secret_key: secretKey,
          completion_secret_code: completionSecretCode,
          target_participants: 0,
          status: statusToSave,
          payment_status: 'unpaid',
          landing_enabled: useLandingPage,
          scheduled_start: startDate ? format(startDate, 'yyyy-MM-dd') : null,
          scheduled_end: endDate ? format(endDate, 'yyyy-MM-dd') : null,
          target_options: targetSettings ? {
            cells: targetSettings,
            customAppText: customAppText || undefined,
            customLocationText: customLocationText || undefined
          } : {},
          creator_name: user?.custom_name || user?.full_name || user?.email || 'Unknown',
          survey_purpose: purpose || '',
          usage_purpose: usagePurpose || ''
        });

        surveyId = survey.id;
        setDraftSurveyId(surveyId);
      } else {
        const updateData = {
          title: title || '제목 없음',
          description: description || '',
          target_participants: 0,
          landing_enabled: useLandingPage,
          scheduled_start: startDate ? format(startDate, 'yyyy-MM-dd') : null,
          scheduled_end: endDate ? format(endDate, 'yyyy-MM-dd') : null,
          target_options: targetSettings ? {
            cells: targetSettings,
            customAppText: customAppText || undefined,
            customLocationText: customLocationText || undefined
          } : {},
          creator_name: user?.custom_name || user?.full_name || user?.email || 'Unknown',
          survey_purpose: purpose || '',
          usage_purpose: usagePurpose || ''
        };

        if (statusToSave === 'draft') {
          updateData.status = 'draft';
        }

        await Survey.update(surveyId, updateData);

        const existingQuestions = await Question.filter({ survey_id: surveyId });
        await Promise.all(existingQuestions.map((q) => Question.delete(q.id)));
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await Question.create({
          survey_id: surveyId,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          image_urls: q.image_urls || [],
          image_descriptions: q.image_descriptions || [],
          order: i
        });
      }

      return surveyId;
    },
    onSuccess: (savedSurveyId) => {
      if (!draftSurveyId) {
        window.history.replaceState(null, '', `${window.location.pathname}?draft=${savedSurveyId}`);
      }
    }
  });

  const createSurveyMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        alert('설문조사를 생성하려면 가입이 필요합니다.');
        saveTempState();
        if (draftSurveyId) {
          await saveDraftMutation.mutateAsync();
        }
        auth.redirectToLogin(window.location.pathname + (draftSurveyId ? `?draft=${draftSurveyId}` : ''));
        throw new Error('로그인이 필요합니다');
      }

      // 필수 정보 재확인 (스텝 건너뛰기 방지)
      if (!title || !description) {
        alert('제목과 설명이 누락되었습니다. 1단계로 돌아가주세요.');
        setCurrentStep(1);
        throw new Error('필수 정보 누락');
      }
      if (!purpose) {
        alert('설문 목적이 누락되었습니다. 3단계로 돌아가주세요.');
        setCurrentStep(2);
        throw new Error('필수 정보 누락');
      }
      if (!startDate || !endDate) {
        alert('설문 기간이 누락되었습니다. 4단계로 돌아가주세요.');
        setCurrentStep(3);
        throw new Error('필수 정보 누락');
      }

      const totalCost = calculateTotalCost();

      let surveyId = draftSurveyId;

      if (surveyId) {
        await Survey.update(surveyId, {
          status: 'draft',
          survey_type: 'paid',
          landing_enabled: useLandingPage,
          scheduled_start: startDate ? format(startDate, 'yyyy-MM-dd') : null,
          scheduled_end: endDate ? format(endDate, 'yyyy-MM-dd') : null,
          total_cost: totalCost,
          target_options: targetSettings ? {
            cells: targetSettings,
            customAppText: customAppText || undefined,
            customLocationText: customLocationText || undefined
          } : {}
        });

        const existingQuestions = await Question.filter({ survey_id: surveyId });
        await Promise.all(existingQuestions.map((q) => Question.delete(q.id)));
      } else {
        const secretKey = generateSecretKey();
        const completionSecretCode = generateCompletionSecretCode();

        const newSurvey = await Survey.create({
          title,
          description,
          survey_type: 'paid',
          secret_key: secretKey,
          completion_secret_code: completionSecretCode,
          target_participants: 0,
          status: 'draft',
          payment_status: 'unpaid',
          landing_enabled: useLandingPage,
          scheduled_start: startDate ? format(startDate, 'yyyy-MM-dd') : null,
          scheduled_end: endDate ? format(endDate, 'yyyy-MM-dd') : null,
          total_cost: totalCost,
          target_options: targetSettings ? {
            cells: targetSettings,
            customAppText: customAppText || undefined,
            customLocationText: customLocationText || undefined
          } : {},
          creator_name: user?.custom_name || user?.full_name || user?.email || 'Unknown'
        });
        surveyId = newSurvey.id;
      }

      // 리커트척도 기본값
      const likertDefaults = ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        // 리커트척도일 경우 빈 선택지를 기본값으로 채움
        let finalOptions = q.options || [];
        if (q.question_type === 'likert_scale') {
          finalOptions = (q.options || ['', '', '', '', '']).map((opt, idx) =>
            (opt && opt.trim()) ? opt : likertDefaults[idx]
          );
        }

        await Question.create({
          survey_id: surveyId,
          question_text: q.question_text,
          question_type: q.question_type,
          options: finalOptions,
          image_urls: q.image_urls || [],
          image_descriptions: q.image_descriptions || [],
          order: i
        });
      }

      return surveyId;
    },
    onSuccess: (surveyId) => {
      queryClient.invalidateQueries(['mySurveys']);
      sessionStorage.removeItem('survey_current_step');
      navigate(`${createPageUrl('PaymentPage')}?id=${surveyId}`);
    },
    onError: (error) => {
      alert(error.message || '설문조사 생성에 실패했습니다');
    }
  });

  const handleNext = () => {
    if (currentStep === 0 && !selectedSurveyType) {
      alert('설문 타입을 선택해주세요.');
      return;
    }
    if (currentStep === 1 && (!title || !description)) {
      alert('제목과 설명을 입력해주세요.');
      return;
    }
    if (currentStep === 2 && !purpose) {
      alert('설문 목적을 입력해주세요.');
      return;
    }
    if (currentStep === 2 && !usagePurpose) {
      alert('결과 활용 목적을 입력해주세요.');
      return;
    }
    if (currentStep === 3 && (!startDate || !endDate)) {
      alert('설문 기간을 선택해주세요.');
      return;
    }
    if (currentStep === 6 && questions.length === 0) {
      alert('최소 1개의 질문을 추가해주세요.');
      return;
    }
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    sessionStorage.setItem('survey_current_step', nextStep.toString());
  };

  const handlePrev = () => {
    if (currentStep === 7) {
      if (!confirm('이 페이지를 벗어나면 작성된 설문은 임시저장됩니다. 입금 정보를 제출하지 않으면 설문이 시작되지 않습니다.')) {
        return;
      }
      saveDraftMutation.mutate();
    }

    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      sessionStorage.setItem('survey_current_step', prevStep.toString());
    }
  };

  const generateAIQuestions = async () => {
    if (!title || !purpose) {
      alert('제목과 설문 목적을 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingAI(true);

    const getTierLimit = () => 10;

    let targetAudienceDesc = "불특정 다수 (전체)";
    if (targetSettings && Array.isArray(targetSettings) && targetSettings.length > 0) {
      const targetDetails = Object.entries(targetSettings[0].targets || {}).map(([cat, fields]) => {
        const fieldStrs = Object.entries(fields).map(([field, val]) => {
          return `${field}: ${Array.isArray(val) ? val.join(', ') : val}`;
        });
        return `${cat} [${fieldStrs.join(' | ')}]`;
      }).join('\n      ');

      if (targetDetails) {
        targetAudienceDesc = "아래 상세 타겟 설정 참조\n" + targetDetails;
      }
    }

    try {
      const prompt = `
당신은 '픽서치(PickSearch)'의 전용 AI 설문 설계 엔진입니다.

당신의 역할은:
사용자가 입력한 정보를 기반으로, 
픽서치에서 제공하는 질문 타입들
[객관식(multiple_choice), 주관식(short_answer), 다중선택(multiple_select), 순위형(ranking), 수치평정(numeric_rating), 리커트척도(likert_scale), 이미지선택(image_choice), 이미지배너(image_banner)]
만을 사용하여 **해당 비즈니스 목적에 최적화된 설문지**를 자동으로 설계하는 것입니다.

**중요 제한 사항:**
1. **개인정보 수집 금지:** 이름, 전화번호, 이메일, 상세주소, 나이, 성별, 거주지역 등 개인 식별 가능 정보(PII)를 묻는 질문은 절대 포함하지 마십시오.
2. **문항 수 최대화:** 제공된 '목표 총 포인트'(${getTierLimit()}점)를 **최대한 꽉 채워서** 문항을 생성하십시오.

────────────────────
[입력으로 제공되는 정보]
────────────────────
- 설문 제목: ${title}
- 설문 설명: ${description}
- 설문 목적: ${purpose}
${usagePurpose ? `- 결과 활용 목적: ${usagePurpose}` : ''}
- 조사 대상: ${targetAudienceDesc}
- 목표 총 포인트(문항 가중치 합): 정확히 ${getTierLimit()}점 (최대한 채울 것)

────────────────────
[문항 설계 공통 규칙]
────────────────────
1. 모든 질문은 설문 목적과 직접적으로 연결되도록 작성합니다.
2. 질문 타입 선택 규칙:
   - 만족도/태도/호감 → 리커트척도 (likert_scale) - 5점 척도 라벨 필수
   - 0~10점 정량 평가 → 수치평정 (numeric_rating)
   - 선택 요인·이유, 복수 행동 → 다중선택 (multiple_select)
   - 우선순위 → 순위형 (ranking)
   - 단순 여부/경험 → 객관식 (multiple_choice)
   - 깊은 의견·아이디어 → 주관식 (short_answer) (최대 2문항)
   - 디자인/광고 비교 → 이미지선택 (image_choice)

3. 리커트 척도 추가 규칙:
   - options 배열에는 반드시 5개의 라벨이 포함되어야 합니다.
   - 예시: ["전혀 동의하지 않는다", "동의하지 않는다", "보통이다", "동의한다", "매우 동의한다"]

4. 이미지 관련 규칙:
   - 시각적 요소를 평가하는 질문에는 'image_choice'를 사용
   - 질문 텍스트 끝에 **(이미지를 첨부해주세요)** 추가

5. 문항 수 계산:
   - 주관식(short_answer)은 1문항당 2점
   - 나머지 모든 유형은 1문항당 1점
   - 생성된 문항들의 점수 총합이 정확히 ${getTierLimit()}점이 되도록 맞춰주세요.

이제 위 규칙을 따르며, 입력된 정보에 가장 잘 맞는 설문지를 설계하여 JSON으로 반환해.
`;

      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
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

      // Handle various response structures from AI
      const questionsData = result.questions || result.survey?.questions || [];
      if (questionsData.length === 0) {
        throw new Error('AI가 질문을 생성하지 못했습니다.');
      }

      const parsed = questionsData.map((q, idx) => ({
        id: Date.now() + idx,
        question_text: q.question_text || q.question || q.text || '',
        question_type: q.question_type || q.type || 'multiple_choice',
        options: q.options || q.choices || [],
        image_urls: [],
        image_descriptions: [],
        order: idx,
        cost: 0
      }));

      setQuestions(parsed);
      alert('✨ AI가 질문을 생성했습니다!');
    } catch (error) {
      console.error('AI 생성 실패:', error);
      alert('AI 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem('survey_current_step', currentStep.toString());
  }, [currentStep]);

  // Step 7 이탈 방지 로직
  useEffect(() => {
    if (currentStep !== 7) return;

    const handleBeforeUnload = (e) => {
      if (!proceedingToPayment) {
        e.preventDefault();
        e.returnValue = '이 페이지를 벗어나면 작성된 설문은 임시저장됩니다. 입금 정보를 제출하지 않으면 설문이 시작되지 않습니다.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep, proceedingToPayment]);

  const canProceedFromStep6 = questions.length > 0 && questions.every((q) => {
    if (!q.question_text || !q.question_text.trim()) return false;

    // 다중선택 및 순위형 유효성 검사
    if (q.question_type === 'multiple_select' && q.max_selections) {
      if (q.max_selections < 2 || q.max_selections > q.options.length) return false;
    }
    if (q.question_type === 'ranking' && q.max_selections) {
      if (q.max_selections < 2 || q.max_selections > q.options.length) return false;
    }

    if (q.question_type === 'multiple_choice' || q.question_type === 'multiple_select' || q.question_type === 'ranking' || q.question_type === 'choice_with_other') {
      return q.options && q.options.length >= 2 && q.options.every((o) => {
        if (typeof o === 'string') return o.trim();
        if (typeof o === 'object' && o !== null) return o.label?.trim() || o.value;
        return false;
      });
    }
    if (q.question_type === 'likert_scale') {
      // 리커트척도는 선택지가 비어있어도 기본값으로 생성 가능
      return true;
    }
    if (q.question_type === 'image_choice') return q.image_urls && q.image_urls.length === 2;
    if (q.question_type === 'image_banner') return q.image_urls && q.image_urls.length === 1;
    return true;
  });

  const canSubmit = title && startDate && endDate && slotCount >= 1 &&
    canProceedFromStep6 && (!useLandingPage || useLandingPage && landingPageUrl && landingPageUrl.trim());

  const purposeOptions = [
    "신제품/서비스 출시 전 반응 조사",
    "브랜드 인지도 및 이미지 조사",
    "기존 제품/서비스 만족도 조사",
    "시장 트렌드 및 소비자 라이프스타일 파악",
    "이벤트/프로모션 기획을 위한 사전 조사"];


  const usageOptions = [
    "내부 분석용 (솔직한 피드백 위주)",
    "마케팅 전략 수립 (구체적 데이터 위주)",
    "제품/서비스 개선 (불편사항/Pain Point 발굴)",
    "투자자/제안서/보고서 제출용 (객관적 신뢰도 중요)",
    "학술/연구 논문용 (통계적 유의성 중요)",
    "콘텐츠/보도자료 배포용 (흥미로운 결과 위주)"];


  const renderStepContent = () => {
    // Step 0: 설문 타입 선택
    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          <Card className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100 p-8">
              <CardTitle className="text-2xl font-bold text-center text-gray-900">
                어떤 설문을 만드시겠어요?
              </CardTitle>
              <p className="text-center text-gray-600 text-sm mt-2">
                목적에 맞는 설문 타입을 선택해주세요
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedSurveyType('target');
                  setCurrentStep(1);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-6 shadow-lg transition-all">

                <div className="flex items-center gap-4">
                  <div className="bg-white/20 pt-3 pr-3 pb-2 pl-3 rounded-xl backdrop-blur-sm">
                    <Sparkles className="mb-1 text-base font-bold" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-bold text-lg mb-1">AI 초정밀 타겟 설문 생성</h3>
                    <p className="text-xs text-blue-100">SKP DMP 기반 정밀 타겟팅으로
                      설문 만들기
                    </p>
                  </div>
                  <ArrowRight className="w-6 h-6" />
                </div>
              </motion.button>

              <Link to={createPageUrl("CreateFreeSurvey")} className="block">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl p-6 shadow-lg transition-all">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 pt-3 pr-3 pb-2 pl-3 rounded-xl backdrop-blur-sm">
                      <PlusCircle className="mb-1 text-base font-bold" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-lg mb-1">무료 설문 만들기</h3>
                      <p className="text-xs text-emerald-100">간편하게 무료 설문 생성</p>
                    </div>
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </motion.button>
              </Link>
            </CardContent>
          </Card>
        </div>);

    }

    // Step 1: 제목과 설명
    if (currentStep === 1) {
      return (
        <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg">제목과 설명</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="설문조사 제목을 입력하세요"
                className="h-11 rounded-xl border-gray-200 focus:border-blue-500" />

            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">설명</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="설문조사에 대한 간단한 설명을 입력하세요"
                className="rounded-xl border-gray-200 focus:border-blue-500 min-h-[100px] resize-none" />

            </div>
          </CardContent>
        </Card>);

    }

    // Step 2: 설문 목적 & 활용 목적
    if (currentStep === 2) {
      return (
        <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg">설문 목적</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                설문 목적 <span className="text-xs text-blue-500 font-normal">(AI 분석에 활용됩니다)</span>
              </label>
              <div className="relative">
                <select
                  value={purpose && purposeOptions.includes(purpose) ? purpose : 'custom'}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setPurpose('');
                    } else {
                      setPurpose(e.target.value);
                    }
                  }}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none pl-4 pr-10 bg-white text-sm transition-all appearance-none shadow-sm"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.75rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.25em 1.25em" }}>

                  <option value="">목적을 선택하세요</option>
                  {purposeOptions.map((opt) =>
                    <option key={opt} value={opt}>{opt}</option>
                  )}
                  <option value="custom">✏️ 직접 입력</option>
                </select>
              </div>
              {(purpose === '' || !purposeOptions.includes(purpose)) &&
                <Textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="이 설문조사를 진행하는 구체적인 목적을 입력하세요. (예: 20대 여성의 화장품 구매 패턴 파악)"
                  className="rounded-xl border-2 border-gray-200 focus:border-blue-500 min-h-[100px] resize-none mt-2" />

              }
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                결과 활용 목적
              </label>
              <div className="relative">
                <select
                  value={usagePurpose && usageOptions.includes(usagePurpose) ? usagePurpose : 'custom'}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setUsagePurpose('');
                    } else {
                      setUsagePurpose(e.target.value);
                    }
                  }}
                  className="w-full h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none pl-4 pr-10 bg-white text-sm transition-all appearance-none shadow-sm"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.75rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.25em 1.25em" }}>

                  <option value="">활용 목적을 선택하세요</option>
                  {usageOptions.map((opt) =>
                    <option key={opt} value={opt}>{opt}</option>
                  )}
                  <option value="custom">✏️ 직접 입력</option>
                </select>
              </div>
              {(usagePurpose === '' || !usageOptions.includes(usagePurpose)) &&
                <Input
                  value={usagePurpose}
                  onChange={(e) => setUsagePurpose(e.target.value)}
                  placeholder="활용 목적을 직접 입력하세요"
                  className="rounded-xl border-2 border-gray-200 focus:border-blue-500 h-12 mt-2" />

              }
            </div>
          </CardContent>
        </Card>);

    }

    // Step 3: 설문 기간
    if (currentStep === 3) {
      return (
        <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg">설문 기간 설정</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal rounded-xl h-14 text-base border-2 ${!startDate && "text-muted-foreground"}`}>

                  <CalendarIcon className="mr-3 h-5 w-5 text-blue-500" />
                  {startDate ?
                    endDate ?
                      <>
                        {format(startDate, "yyyy.MM.dd")} - {format(endDate, "yyyy.MM.dd")}
                        <Badge className="ml-auto bg-blue-100 text-blue-700 border-0 px-3 py-1">
                          {differenceInDays(endDate, startDate) + 1}일간
                        </Badge>
                      </> :

                      format(startDate, "yyyy.MM.dd") :


                    <span>시작일과 종료일을 선택하세요</span>
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)]" align="center" side="bottom" sideOffset={8}>
                <div className="p-3 border-b border-gray-100 text-center">
                  <p className="text-sm text-gray-600">
                    {!startDate ?
                      <>
                        <span className="text-blue-600 font-bold">시작일</span>을 선택해주세요
                      </> :
                      !endDate ?
                        <>
                          <span className="text-blue-600 font-bold">종료일</span>을 선택해주세요
                        </> :

                        '날짜 범위가 선택되었습니다'
                    }
                  </p>
                </div>
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={startDate || calculateMinStartDate()}
                  selected={dateRange}
                  onSelect={(range) => {
                    setStartDate(range?.from);
                    setEndDate(range?.to);
                    if (range?.from && range?.to) {
                      setIsCalendarOpen(false);
                    }
                  }}
                  numberOfMonths={1}
                  disabled={(date) => isBefore(date, calculateMinStartDate())}
                  locale={ko}
                  className="rounded-xl shadow-xl"
                  classNames={{
                    months: "p-3",
                    month: "space-y-3",
                    caption: "flex justify-center pt-1 relative items-center px-1",
                    caption_label: "text-base font-bold text-gray-900",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-8 w-8 bg-transparent p-0 hover:bg-gray-100 rounded-lg",
                    table: "w-full border-collapse",
                    head_row: "flex w-full",
                    head_cell: "text-gray-500 rounded-md w-9 font-medium text-sm flex-1 text-center",
                    row: "flex w-full mt-1",
                    cell: "text-center text-sm p-0 relative flex-1 [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg",
                    day: "h-9 w-9 p-0 font-medium hover:bg-gray-100 rounded-lg transition-colors",
                    day_selected: "bg-blue-500 text-white hover:bg-blue-600 font-bold rounded-lg",
                    day_today: "bg-blue-50 text-blue-900 font-bold",
                    day_range_middle: "aria-selected:bg-blue-50 aria-selected:text-blue-900 rounded-none",
                    day_range_start: "rounded-l-lg",
                    day_range_end: "rounded-r-lg",
                    day_outside: "text-gray-300",
                    day_disabled: "text-gray-300"
                  }} />

              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>);

    }

    // Step 4: 기본 타겟 설정
    if (currentStep === 4) {
      return (
        <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg">기본 타겟 설정 (성별/연령)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-2 block">성별</label>
              <div className="flex flex-wrap gap-2">
                {['전체', '남성', '여성'].map((gender) => {
                  const currentGender = Array.isArray(targetSettings) && targetSettings[0]?.targets?.DEMO?.gender;
                  const isSelected = !currentGender ?
                    gender === '전체' :
                    currentGender === (gender === '남성' ? 'M' : gender === '여성' ? 'F' : undefined);

                  return (
                    <button
                      key={gender}
                      onClick={() => {
                        const newGender = gender === '남성' ? 'M' : gender === '여성' ? 'F' : undefined;
                        const currentTargets = { ...(Array.isArray(targetSettings) && targetSettings[0]?.targets || {}) };
                        if (!currentTargets.DEMO) currentTargets.DEMO = {};

                        if (newGender) {
                          currentTargets.DEMO.gender = newGender;
                        } else {
                          delete currentTargets.DEMO.gender;
                        }

                        if (Object.keys(currentTargets.DEMO).length === 0) delete currentTargets.DEMO;

                        setTargetSettings([{
                          id: 'CELL_MAIN',
                          name: '설문 타겟',
                          targets: currentTargets
                        }]);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isSelected ?
                          'bg-blue-500 border-blue-500 text-white shadow-md' :
                          'bg-white border-gray-200 text-gray-600 hover:bg-blue-50'}`
                      }>

                      {gender}
                    </button>);

                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 mb-2 block">연령 (중복 가능)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '10대', value: 'AGE_10S' },
                  { label: '20대', value: 'AGE_20S' },
                  { label: '30대', value: 'AGE_30S' },
                  { label: '40대', value: 'AGE_40S' },
                  { label: '50대', value: 'AGE_50S' },
                  { label: '60대 이상', value: 'AGE_60S' }].
                  map((age) => {
                    const currentAges = Array.isArray(targetSettings) && targetSettings[0]?.targets?.DEMO?.age_10s || [];
                    const isSelected = currentAges.includes(age.value);

                    return (
                      <button
                        key={age.value}
                        onClick={() => {
                          const currentTargets = { ...(Array.isArray(targetSettings) && targetSettings[0]?.targets || {}) };
                          if (!currentTargets.DEMO) currentTargets.DEMO = {};

                          let newAges = [...(currentTargets.DEMO.age_10s || [])];
                          if (isSelected) {
                            newAges = newAges.filter((a) => a !== age.value);
                          } else {
                            newAges.push(age.value);
                          }

                          if (newAges.length > 0) {
                            currentTargets.DEMO.age_10s = newAges;
                          } else {
                            delete currentTargets.DEMO.age_10s;
                          }

                          if (Object.keys(currentTargets.DEMO).length === 0) delete currentTargets.DEMO;

                          setTargetSettings([{
                            id: 'CELL_MAIN',
                            name: '설문 타겟',
                            targets: currentTargets
                          }]);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isSelected ?
                            'bg-blue-500 border-blue-500 text-white shadow-md' :
                            'bg-white border-gray-200 text-gray-600 hover:bg-blue-50'}`
                        }>

                        {age.label}
                      </button>);

                  })}
              </div>
            </div>
          </CardContent>
        </Card>);

    }

    // Step 5: 추가 옵션 (타겟팅)
    if (currentStep === 5) {
      // 기본 타겟 (DEMO) 추출
      const demoTargets = targetSettings && Array.isArray(targetSettings) && targetSettings.length > 0 ?
        targetSettings[0]?.targets?.DEMO :
        null;

      const hasGender = demoTargets?.gender !== undefined;
      const hasAges = demoTargets?.age_10s && demoTargets.age_10s.length > 0;

      return (
        <div className="space-y-4">
          {/* 기본 타겟 블록 */}
          {(hasGender || hasAges) &&
            <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  기본 타겟
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {hasGender &&
                    <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1.5 font-medium">
                      {demoTargets.gender === 'M' ? '남성' : demoTargets.gender === 'F' ? '여성' : '전체'}
                    </Badge>
                  }
                  {hasAges && demoTargets.age_10s.map((age) =>
                    <Badge key={age} className="bg-blue-100 text-blue-700 border-0 px-3 py-1.5 font-medium">
                      {age === 'AGE_10S' ? '10대' :
                        age === 'AGE_20S' ? '20대' :
                          age === 'AGE_30S' ? '30대' :
                            age === 'AGE_40S' ? '40대' :
                              age === 'AGE_50S' ? '50대' :
                                age === 'AGE_60S' ? '60대 이상' : age}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          }

          <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  추가 타겟 옵션
                </CardTitle>
                <Badge className="bg-[#FF693C] text-[#FFFFFF] border-0 px-2.5 py-1 text-[10px] font-bold">
                  무료 이벤트
                </Badge>
              </div>
              <p className="text-xs text-red-500 mt-1">타겟은 한 유형만 설정할 수 있습니다.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {(() => {
                const isDisabled = enableAppTargets || enableLocationTargets;
                return (
                  <label className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isDisabled ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50' :
                    enableAdditionalTargets ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer' :
                    'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer'}`
                  }>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enableAdditionalTargets && !isDisabled ? 'bg-blue-100' : 'bg-gray-200'}`}>
                        <Target className={`w-5 h-5 ${enableAdditionalTargets && !isDisabled ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className={`font-bold ${enableAdditionalTargets && !isDisabled ? 'text-gray-900' : 'text-gray-400'}`}>
                          추가 타겟 설정
                        </div>
                        <div className={`text-xs ${enableAdditionalTargets && !isDisabled ? 'text-gray-600' : 'text-gray-400'}`}>
                          관심사, 소득, 직업 등 상세 조건 (조건당 3% 할증)
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableAdditionalTargets}
                      onChange={(e) => !isDisabled && setEnableAdditionalTargets(e.target.checked)}
                      disabled={isDisabled}
                      className="w-5 h-5 rounded border-blue-300 text-blue-500 focus:ring-blue-500 disabled:opacity-50" />
                  </label>
                );
              })()}

              {enableAdditionalTargets &&
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3">

                  {/* 선택된 타겟 조건 태그 표시 (DEMO 제외) */}
                  {targetSettings && Array.isArray(targetSettings) && targetSettings.length > 0 && (() => {
                    const tags = [];
                    targetSettings.forEach((cell) => {
                      if (!cell.targets) return;
                      Object.entries(cell.targets).forEach(([categoryKey, fields]) => {
                        const categoryConfig = TARGET_OPTIONS[categoryKey];
                        if (!categoryConfig) return;

                        Object.entries(fields).forEach(([fieldKey, value]) => {
                          // DEMO 카테고리의 성별과 연령은 제외
                          if (categoryKey === 'DEMO' && (fieldKey === 'gender' || fieldKey === 'age_10s')) {
                            return;
                          }

                          const fieldConfig = categoryConfig.fields.find((f) => f.key === fieldKey);
                          if (!fieldConfig) return;

                          if (fieldConfig.type === 'text') {
                            tags.push({ label: `"${value}"`, category: categoryConfig.label, categoryKey, fieldKey });
                          } else if (Array.isArray(value)) {
                            value.forEach((v) => {
                              const opt = fieldConfig.options?.find((o) => o.value === v);
                              if (opt) tags.push({ label: opt.label, category: categoryConfig.label, categoryKey, fieldKey, value: v });
                            });
                          } else {
                            const opt = fieldConfig.options?.find((o) => o.value === value);
                            if (opt) tags.push({ label: opt.label, category: categoryConfig.label, categoryKey, fieldKey, value });
                          }
                        });
                      });
                    });

                    return tags.length > 0 ?
                      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        {tags.map((tag, idx) =>
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-medium text-xs">

                            <span>{tag.label}</span>
                            <button
                              onClick={() => {
                                // 태그 클릭 시 해당 조건 제거
                                const newTargets = targetSettings.map((cell) => {
                                  const newCellTargets = { ...cell.targets };
                                  if (newCellTargets[tag.categoryKey]) {
                                    const fieldValue = newCellTargets[tag.categoryKey][tag.fieldKey];

                                    if (Array.isArray(fieldValue)) {
                                      const filtered = fieldValue.filter((v) => v !== tag.value);
                                      if (filtered.length > 0) {
                                        newCellTargets[tag.categoryKey][tag.fieldKey] = filtered;
                                      } else {
                                        delete newCellTargets[tag.categoryKey][tag.fieldKey];
                                      }
                                    } else {
                                      delete newCellTargets[tag.categoryKey][tag.fieldKey];
                                    }

                                    if (Object.keys(newCellTargets[tag.categoryKey]).length === 0) {
                                      delete newCellTargets[tag.categoryKey];
                                    }
                                  }
                                  return { ...cell, targets: newCellTargets };
                                });
                                setTargetSettings(newTargets);
                              }}
                              className="hover:bg-blue-100 rounded-full w-4 h-4 flex items-center justify-center transition-colors">

                              ×
                            </button>
                          </div>
                        )}
                      </div> :
                      null;
                  })()}

                  <Button
                    onClick={() => {
                      saveTempState();
                      navigate(createPageUrl('TargetSettings'), {
                        state: {
                          initialTargets: targetSettings,
                          surveyType: 'vip',
                          draftId: draftSurveyId
                        }
                      });
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12 font-bold">

                    추가 타겟 설정하기
                  </Button>
                </motion.div>
              }

              <div className="h-px bg-gray-200 my-4" />

              {(() => {
                const isDisabled = enableAdditionalTargets || enableLocationTargets;
                return (
                  <label className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isDisabled ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50' :
                    enableAppTargets ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer' :
                    'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer'}`
                  }>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enableAppTargets && !isDisabled ? 'bg-blue-100' : 'bg-gray-200'}`}>
                        <Target className={`w-5 h-5 ${enableAppTargets && !isDisabled ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className={`font-bold ${enableAppTargets && !isDisabled ? 'text-gray-900' : 'text-gray-400'}`}>
                          특정 앱 설치 타겟
                        </div>
                        <div className={`text-xs ${enableAppTargets && !isDisabled ? 'text-gray-600' : 'text-gray-400'}`}>
                          특정 앱을 설치한 사용자 (앱당 5% 할증)
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableAppTargets}
                      onChange={(e) => !isDisabled && setEnableAppTargets(e.target.checked)}
                      disabled={isDisabled}
                      className="w-5 h-5 rounded border-blue-300 text-blue-500 focus:ring-blue-500 disabled:opacity-50" />
                  </label>
                );
              })()}

              {enableAppTargets &&
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3">

                  <Input
                    value={tempAppInput}
                    onChange={(e) => setTempAppInput(e.target.value)}
                    onCompositionStart={() => setIsComposingApp(true)}
                    onCompositionEnd={() => setIsComposingApp(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isComposingApp) {
                        e.preventDefault();
                        const input = tempAppInput.trim();
                        if (!input) return;

                        const currentApps = customAppText ? customAppText.split(',').map((a) => a.trim()).filter(Boolean) : [];
                        if (!currentApps.includes(input)) {
                          setCustomAppText([...currentApps, input].join(', '));
                        }
                        setTempAppInput('');
                      }
                    }}
                    placeholder="예시: 올리브영 (입력 후 엔터)"
                    className="rounded-xl border-blue-200 focus:border-blue-500 h-12" />

                  {customAppText && customAppText.split(',').filter((a) => a.trim()).length > 0 &&
                    <div className="flex flex-wrap gap-2">
                      {customAppText.split(',').filter((a) => a.trim()).map((app, idx) =>
                        <Badge key={idx} className="bg-blue-100 text-blue-700 border-0 pl-3 pr-2 py-1.5 flex items-center gap-2">
                          {app.trim()}
                          <button
                            onClick={() => {
                              const apps = customAppText.split(',').filter((a) => a.trim());
                              apps.splice(idx, 1);
                              setCustomAppText(apps.join(', '));
                            }}
                            className="hover:bg-blue-200 rounded-full p-0.5">

                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  }
                  <p className="text-xs text-blue-600 px-1">앱 이름을 입력하고 엔터를 눌러 추가하세요</p>
                </motion.div>
              }

              {(() => {
                const isDisabled = enableAdditionalTargets || enableAppTargets;
                return (
                  <label className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isDisabled ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50' :
                    enableLocationTargets ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer' :
                    'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer'}`
                  }>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enableLocationTargets && !isDisabled ? 'bg-blue-100' : 'bg-gray-200'}`}>
                        <Target className={`w-5 h-5 ${enableLocationTargets && !isDisabled ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className={`font-bold ${enableLocationTargets && !isDisabled ? 'text-gray-900' : 'text-gray-400'}`}>
                          T-map 위치 검색 타겟
                        </div>
                        <div className={`text-xs ${enableLocationTargets && !isDisabled ? 'text-gray-600' : 'text-gray-400'}`}>
                          특정 위치를 검색한 사용자 (위치당 5% 할증)
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableLocationTargets}
                      onChange={(e) => !isDisabled && setEnableLocationTargets(e.target.checked)}
                      disabled={isDisabled}
                      className="w-5 h-5 rounded border-blue-300 text-blue-500 focus:ring-blue-500 disabled:opacity-50" />
                  </label>
                );
              })()}

              {enableLocationTargets &&
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3">

                  <Input
                    value={tempLocationInput}
                    onChange={(e) => setTempLocationInput(e.target.value)}
                    onCompositionStart={() => setIsComposingLocation(true)}
                    onCompositionEnd={() => setIsComposingLocation(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isComposingLocation) {
                        e.preventDefault();
                        const input = tempLocationInput.trim();
                        if (!input) return;

                        const currentLocations = customLocationText ? customLocationText.split(',').map((l) => l.trim()).filter(Boolean) : [];
                        if (!currentLocations.includes(input)) {
                          setCustomLocationText([...currentLocations, input].join(', '));
                        }
                        setTempLocationInput('');
                      }
                    }}
                    placeholder="예시: 아웃백 (입력 후 엔터)"
                    className="rounded-xl border-blue-200 focus:border-blue-500 h-12" />

                  {customLocationText && customLocationText.split(',').filter((l) => l.trim()).length > 0 &&
                    <div className="flex flex-wrap gap-2">
                      {customLocationText.split(',').filter((l) => l.trim()).map((location, idx) =>
                        <Badge key={idx} className="bg-blue-100 text-blue-700 border-0 pl-3 pr-2 py-1.5 flex items-center gap-2">
                          {location.trim()}
                          <button
                            onClick={() => {
                              const locations = customLocationText.split(',').filter((l) => l.trim());
                              locations.splice(idx, 1);
                              setCustomLocationText(locations.join(', '));
                            }}
                            className="hover:bg-blue-200 rounded-full p-0.5">

                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  }
                  <p className="text-xs text-blue-600 px-1">위치 이름을 입력하고 엔터를 눌러 추가하세요</p>
                </motion.div>
              }
            </CardContent>
          </Card>
        </div>);

    }

    // Step 6: 질문 만들기
    if (currentStep === 6) {
      return (
        <div className="space-y-4">
          {/* 상단 액션 버튼 */}
          <div className="space-y-2">
            <button
              onClick={generateAIQuestions}
              disabled={isGeneratingAI}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white shadow-lg rounded-2xl p-4 transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}>

              {isGeneratingAI ?
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-bold">생성중...</span>
                </> :

                <>
                  <Sparkles className="w-5 h-5" />
                  <span className="font-bold">AI로 질문 채우기</span>
                </>
              }
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (questions.length === 0) {
                    alert('미리보기할 질문이 없습니다.');
                    return;
                  }

                  const previewData = {
                    title: title || '미리보기',
                    description: description || '',
                    questions: questions.map((q, idx) => ({
                      ...q,
                      id: `preview_${idx}`,
                      order: idx
                    })),
                    survey_type: 'paid'
                  };
                  localStorage.setItem('survey_preview_data', JSON.stringify(previewData));
                  window.open(`${window.location.origin}${createPageUrl('TakeSurvey')}?preview=true`, '_blank');
                }}
                className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 rounded-2xl py-3 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}>

                <Eye className="w-5 h-5" />
                <span className="font-bold">미리보기</span>
              </button>

              <button
                onClick={async () => {
                  if (!title || questions.length === 0) {
                    alert('제목과 최소 1개의 질문이 필요합니다.');
                    return;
                  }
                  try {
                    await saveDraftMutation.mutateAsync();
                    alert('임시 저장되었습니다.');
                  } catch (error) {
                    alert('임시 저장에 실패했습니다.');
                  }
                }}
                disabled={saveDraftMutation.isPending}
                className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 rounded-2xl py-3 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}>

                {saveDraftMutation.isPending ?
                  <Loader2 className="w-5 h-5 animate-spin" /> :

                  <>
                    <Home className="w-5 h-5" />
                    <span className="font-bold">임시저장</span>
                  </>
                }
              </button>
            </div>
          </div>

          <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">질문 목록</CardTitle>
                <Badge className="bg-blue-100 text-blue-700 border-0">
                  {questions.length}개 문항
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <AnimatePresence>
                {questions.map((question, index) => {
                  const isHighlighted = highlightedQuestionId === question.id;

                  return (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}>

                      <Card
                        className={`bg-white rounded-2xl shadow-sm transition-all cursor-pointer ${isHighlighted ?
                            'border-2 border-blue-400 shadow-lg shadow-blue-100 ring-2 ring-blue-100' :
                            'border border-gray-100'}`
                        }
                        onClick={() => setHighlightedQuestionId(null)}>

                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              <Badge className="bg-purple-100 text-purple-700 border-0 text-sm px-3 py-1">
                                Q{index + 1}
                              </Badge>
                              <Badge className={
                                question.question_type === 'multiple_choice' ? 'bg-blue-100 text-blue-700 border-0' :
                                  question.question_type === 'multiple_select' ? 'bg-violet-100 text-violet-700 border-0' :
                                    question.question_type === 'ranking' ? 'bg-amber-100 text-amber-700 border-0' :
                                      question.question_type === 'numeric_rating' ? 'bg-teal-100 text-teal-700 border-0' :
                                        question.question_type === 'likert_scale' ? 'bg-indigo-100 text-indigo-700 border-0' :
                                          question.question_type === 'image_banner' ? 'bg-pink-100 text-pink-700 border-0' :
                                            question.question_type === 'short_answer' ? 'bg-gray-100 text-gray-700 border-0' :
                                              question.question_type === 'choice_with_other' ? 'bg-cyan-100 text-cyan-700 border-0' :
                                                'bg-purple-100 text-purple-700 border-0'
                              }>
                                {question.question_type === 'multiple_choice' ? '객관식' :
                                  question.question_type === 'multiple_select' ? '다중선택' :
                                    question.question_type === 'ranking' ? '순위형' :
                                      question.question_type === 'numeric_rating' ? '수치평정' :
                                        question.question_type === 'likert_scale' ? '리커트척도' :
                                          question.question_type === 'image_banner' ? '이벤트배너' :
                                            question.question_type === 'short_answer' ? '주관식' :
                                              question.question_type === 'choice_with_other' ? '객관+주관' : '이미지선택'}
                              </Badge>
                              {questions.length > 1 &&
                                <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveQuestion(index, 'up');
                                    }}
                                    disabled={index === 0}
                                    className="h-6 w-6 text-gray-500 disabled:opacity-30">

                                    <ArrowUp className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveQuestion(index, 'down');
                                    }}
                                    disabled={index === questions.length - 1}
                                    className="h-6 w-6 text-gray-500 disabled:opacity-30">

                                    <ArrowDown className="w-3 h-3" />
                                  </Button>
                                </div>
                              }
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQuestion(question.id);
                              }}
                              className="text-red-500 hover:bg-red-50">

                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={question.question_text}
                            onChange={(e) => updateQuestion(question.id, { ...question, question_text: e.target.value })}
                            placeholder={question.question_type === 'image_banner' ? "이미지에 대해 설문참여자들이 알아야할 설명을 적어주세요" : "질문을 입력하세요"}
                            className="w-full border-gray-200 rounded-xl min-h-[80px] resize-y py-3"
                            rows={3} />

                        </CardHeader>

                        {(question.question_type === 'multiple_choice' || question.question_type === 'multiple_select' || question.question_type === 'ranking' || question.question_type === 'choice_with_other') &&
                          <CardContent className="pt-0 space-y-2">
                            {question.question_type === 'multiple_select' &&
                              <>
                                <div className="bg-violet-50 rounded-lg p-2 border border-violet-200 mb-2">
                                  <p className="text-xs text-violet-700 font-medium">
                                    ✓ 참여자가 여러 개 선택할 수 있습니다
                                  </p>
                                </div>
                                <div className="mb-3">
                                  <label className="text-xs font-medium text-gray-600 mb-1 block">최대 선택 가능 문항 수</label>
                                  <Input
                                    type="number"
                                    min="2"
                                    max={question.options.length}
                                    value={question.max_selections || ''}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || null;
                                      updateQuestion(question.id, { ...question, max_selections: value });
                                    }}
                                    placeholder="예: 3 (미입력시 제한없음)"
                                    className="border-gray-200 rounded-xl h-10" />
                                  {question.max_selections && (question.max_selections < 2 || question.max_selections > question.options.length) &&
                                    <p className="text-xs text-red-500 mt-1">올바른 값을 입력해주세요.</p>
                                  }
                                </div>
                              </>
                            }
                            {question.question_type === 'ranking' &&
                              <>
                                <div className="bg-amber-50 rounded-lg p-2 border border-amber-200 mb-2">
                                  <p className="text-xs text-amber-700 font-medium">
                                    🏆 참여자가 항목을 클릭하여 순위를 매깁니다
                                  </p>
                                </div>
                                <div className="mb-3">
                                  <label className="text-xs font-medium text-gray-600 mb-1 block">순위를 매길 문항 수</label>
                                  <Input
                                    type="number"
                                    min="2"
                                    max={question.options.length}
                                    value={question.max_selections || ''}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || null;
                                      updateQuestion(question.id, { ...question, max_selections: value });
                                    }}
                                    placeholder="예: 3 (미입력시 전체)"
                                    className="border-gray-200 rounded-xl h-10" />
                                  {question.max_selections && (question.max_selections < 2 || question.max_selections > question.options.length) &&
                                    <p className="text-xs text-red-500 mt-1">올바른 값을 입력해주세요.</p>
                                  }
                                </div>
                              </>
                            }
                            {question.options.map((option, optIndex) =>
                              <div key={optIndex}>
                                <div className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                    placeholder={`선택지 ${optIndex + 1}`}
                                    className="border-gray-200 rounded-xl" />

                                  {question.options.length > 2 &&
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeOption(question.id, optIndex)}
                                      className="text-red-500">

                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  }
                                </div>
                              </div>
                            )}
                            {question.options.length < 10 &&
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(question.id)}
                                className="w-full border-dashed rounded-xl">

                                <PlusCircle className="w-4 h-4 mr-2" />
                                선택지 추가 ({question.options.length}/10)
                              </Button>
                            }
                          </CardContent>
                        }

                        {question.question_type === 'numeric_rating' &&
                          <CardContent className="pt-0">
                            <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                              <p className="text-sm text-teal-700 mb-3 font-medium">
                                👆 참여자는 0~10점 중 선택합니다
                              </p>
                              <div className="grid grid-cols-11 gap-1">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) =>
                                  <div
                                    key={num}
                                    className="aspect-square bg-white rounded-lg border-2 border-teal-300 flex items-center justify-center text-sm font-bold text-teal-700">

                                    {num}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        }

                        {question.question_type === 'likert_scale' &&
                          <CardContent className="pt-0 space-y-2">
                            <div className="bg-indigo-50 rounded-lg p-2 mb-2 border border-indigo-200">
                              <p className="text-xs text-indigo-700 font-medium">
                                👆 참여자는 5개 척도 중 하나를 선택합니다
                              </p>
                            </div>
                            <p className="text-xs text-red-500 font-medium mb-1">
                              선택지 값을 입력하지 않을 경우, 예시대로 생성됩니다.
                            </p>
                            {[
                              { value: 1, placeholder: '예: 전혀 그렇지 않다' },
                              { value: 2, placeholder: '예: 그렇지 않다' },
                              { value: 3, placeholder: '예: 보통이다' },
                              { value: 4, placeholder: '예: 그렇다' },
                              { value: 5, placeholder: '예: 매우 그렇다' }].
                              map((item, idx) =>
                                <div key={item.value} className="space-y-1">
                                  <div className="flex gap-2 items-center">
                                    <span className="text-xs font-bold text-indigo-600 w-4">{item.value}</span>
                                    <Input
                                      value={question.options?.[idx] || ''}
                                      onChange={(e) => {
                                        const newOptions = [...(question.options || ['', '', '', '', ''])];
                                        newOptions[idx] = e.target.value;
                                        updateQuestion(question.id, { ...question, options: newOptions });
                                      }}
                                      placeholder={item.placeholder}
                                      className="rounded-xl border-gray-200" />
                                  </div>
                                </div>
                              )}
                          </CardContent>
                        }

                        {question.question_type === 'image_choice' &&
                          <CardContent className="pt-0 space-y-3">
                            <div className="space-y-2">
                              {question.image_urls.map((url, imgIndex) =>
                                <div key={imgIndex} className="space-y-2">
                                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                                    <img src={url} alt={`이미지 ${imgIndex + 1}`} className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => removeImage(question.id, imgIndex)}
                                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow-lg">

                                      ×
                                    </button>
                                    <div className="absolute bottom-2 left-2 bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md">
                                      선택지 {imgIndex + 1}
                                    </div>
                                  </div>
                                  <Input
                                    value={(question.image_descriptions || [])[imgIndex] || ''}
                                    onChange={(e) => updateImageDescription(question.id, imgIndex, e.target.value)}
                                    placeholder="이미지 설명"
                                    className="border-purple-200 rounded-xl text-sm" />

                                </div>
                              )}

                              {question.image_urls.length < 2 &&
                                <label className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-purple-300 cursor-pointer flex flex-col items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 transition-all">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(question.id, e.target.files[0])}
                                    className="hidden"
                                    disabled={uploadingImages[question.id]} />

                                  {uploadingImages[question.id] ?
                                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin" /> :

                                    <>
                                      <Upload className="w-10 h-10 text-purple-500" />
                                      <span className="text-base text-purple-600 font-medium">이미지 업로드 ({question.image_urls.length}/2)</span>
                                    </>
                                  }
                                </label>
                              }
                            </div>
                          </CardContent>
                        }

                        {question.question_type === 'image_banner' &&
                          <CardContent className="pt-0 space-y-3">
                            <div className="bg-pink-50 rounded-lg p-2 mb-2 border border-pink-200">
                              <p className="text-xs text-pink-700 font-medium">
                                📢 이벤트/홍보용 1:1 이미지
                              </p>
                            </div>
                            {question.image_urls.length > 0 ?
                              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                                <img src={question.image_urls[0]} alt="배너" className="w-full h-full object-cover" />
                                <button
                                  onClick={() => removeImage(question.id, 0)}
                                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">

                                  ×
                                </button>
                              </div> :

                              <label className="w-full aspect-square rounded-xl border-2 border-dashed border-pink-300 cursor-pointer flex flex-col items-center justify-center gap-2 bg-pink-50">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(question.id, e.target.files[0])}
                                  className="hidden" />

                                {uploadingImages[question.id] ?
                                  <Loader2 className="w-10 h-10 text-pink-500 animate-spin" /> :

                                  <>
                                    <Upload className="w-10 h-10 text-pink-500" />
                                    <span className="text-base text-pink-600 font-medium">이미지 업로드</span>
                                  </>
                                }
                              </label>
                            }
                          </CardContent>
                        }
                      </Card>
                    </motion.div>);
                }
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => addQuestion('multiple_choice')}
                  className="p-4 rounded-xl bg-white border-2 border-blue-100 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}>

                  <div className="text-center">
                    <PlusCircle className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <div className="font-bold text-blue-900 text-sm">객관식</div>
                  </div>
                </button>

                <button
                  onClick={() => addQuestion('short_answer')}
                  className="p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}>

                  <div className="text-center">
                    <MessageSquare className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                    <div className="font-bold text-gray-900 text-sm">주관식</div>
                  </div>
                </button>

                <button
                  onClick={() => addQuestion('multiple_select')}
                  className="p-4 rounded-xl bg-white border-2 border-violet-100 hover:border-violet-400 hover:bg-violet-50 transition-all cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}>

                  <div className="text-center">
                    <ListChecks className="w-5 h-5 text-violet-600 mx-auto mb-1" />
                    <div className="font-bold text-violet-900 text-sm">다중선택</div>
                  </div>
                </button>

                <button
                  onClick={() => addQuestion('ranking')}
                  className="p-4 rounded-xl bg-white border-2 border-amber-100 hover:border-amber-400 hover:bg-amber-50 transition-all cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}>

                  <div className="text-center">
                    <BarChart2 className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <div className="font-bold text-amber-900 text-sm">순위형</div>
                  </div>
                </button>

                <button
                  onClick={() => addQuestion('numeric_rating')}
                  className="p-4 rounded-xl bg-white border-2 border-teal-100 hover:border-teal-400 hover:bg-teal-50 transition-all cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}>

                  <div className="text-center">
                    <BarChart2 className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                    <div className="font-bold text-teal-900 text-sm">수치평정</div>
                  </div>
                </button>

                <button
                  onClick={() => addQuestion('likert_scale')}
                  className="p-4 rounded-xl bg-white border-2 border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}>

                  <div className="text-center">
                    <ListChecks className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                    <div className="font-bold text-indigo-900 text-sm">리커트척도</div>
                  </div>
                </button>

                <button
                  onClick={() => addQuestion('choice_with_other')}
                  className="p-4 rounded-xl bg-white border-2 border-cyan-100 hover:border-cyan-400 hover:bg-cyan-50 transition-all cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}>

                  <div className="text-center">
                    <ListChecks className="w-5 h-5 text-cyan-600 mx-auto mb-1" />
                    <div className="font-bold text-cyan-900 text-sm">객관+주관</div>
                  </div>
                </button>

                <button
                  onClick={() => addQuestion('image_choice')}
                  className="p-4 rounded-xl bg-white border-2 border-purple-100 hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}>

                  <div className="text-center">
                    <ImageIcon className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <div className="font-bold text-purple-900 text-sm">이미지선택</div>
                  </div>
                </button>

                <button
                  onClick={() => addQuestion('image_banner')}
                  className="p-4 rounded-xl bg-white border-2 border-pink-100 hover:border-pink-400 hover:bg-pink-50 transition-all cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}>

                  <div className="text-center">
                    <ImageIcon className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                    <div className="font-bold text-pink-900 text-sm">이벤트배너</div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>);

    }

    // Step 7: 최종 확인 및 결제
    if (currentStep === 7) {
      return (
        <div className="space-y-4">
          <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-lg">최종 확인</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
                  <span className="text-gray-600">제목</span>
                  <span className="font-medium text-gray-900">{title}</span>

                  <span className="text-gray-600">기간</span>
                  <span className="font-medium text-gray-900">
                    {startDate && endDate ? `${format(startDate, "yyyy.MM.dd")} - ${format(endDate, "yyyy.MM.dd")} (${differenceInDays(endDate, startDate) + 1}일)` : '-'}
                  </span>

                  <span className="text-gray-600">질문 수</span>
                  <span className="font-medium text-gray-900">{questions.length}개</span>
                </div>
              </div>

              <div className="bg-gray-50/80 pt-4 pr-5 pl-5 rounded-2xl border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white text-indigo-300 p-2.5 rounded-full shadow-sm border border-gray-100">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <label className="text-base font-bold text-gray-900 block">슬롯 개수</label>
                      <span className="text-xs text-gray-500">09:00~23:00 운영 구좌 수</span>
                    </div>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={slotCount === 0 ? '' : slotCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setSlotCount(0); // 임시로 빈 값 허용
                      } else {
                        setSlotCount(Math.max(1, parseInt(val) || 1));
                      }
                    }}
                    onBlur={() => {
                      if (slotCount < 1) setSlotCount(1); // 포커스 해제 시 최소값 보장
                    }}
                    className="w-full sm:w-24 h-12 text-center text-xl font-bold rounded-xl" />

                </div>
              </div>

              <div className="bg-white border-2 border-blue-100 rounded-2xl p-5">
                <div className="space-y-3">
                  <Badge className="bg-[#FF693C] text-[#FFFFFF] border-0 px-2.5 py-1 text-[10px] font-bold">
                    무료 이벤트
                  </Badge>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-gray-900">이벤트 페이지 연결</div>
                        <div className="text-xs text-gray-500 mt-0.5">설문 종료 후 이동</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={useLandingPage}
                        onChange={(e) => setUseLandingPage(e.target.checked)} />

                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>
                {useLandingPage &&
                  <div className="mt-4">
                    <Input
                      value={landingPageUrl}
                      onChange={(e) => setLandingPageUrl(e.target.value)}
                      placeholder="https://..."
                      className="rounded-xl border-blue-200 focus:border-blue-500" />

                  </div>
                }
              </div>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border-0">
                <CardContent className="p-5">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-blue-600" />
                    가격 계산
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-semibold">기본 단가</span>
                      <span className="font-bold text-gray-800">{BASE_PRICE.toLocaleString()}원</span>
                    </div>
                    {(() => {
                      const surcharges = calculateTargetingSurcharge();
                      if (surcharges.length > 0) {
                        // 카테고리별로 그룹핑
                        const grouped = surcharges.reduce((acc, s) => {
                          if (!acc[s.label]) {
                            acc[s.label] = { rate: s.rate, items: [] };
                          }
                          acc[s.label].items.push({ detail: s.detail, rate: s.rate });
                          return acc;
                        }, {});

                        return (
                          <>
                            <div className="pt-2 pb-2">
                              <span className="text-gray-700 font-semibold">타겟팅 할증</span>
                            </div>
                            <div className="space-y-3">
                              {Object.entries(grouped).map(([label, data]) => {
                                return (
                                  <div key={label}>
                                    <div className="text-xs text-gray-600 font-medium mb-2 px-1">
                                      {label}
                                    </div>
                                    <div className="space-y-2">
                                      {data.items.map((item, idx) => {
                                        const ratePercentage = (item.rate * 100).toFixed(0);
                                        return (
                                          <div
                                            key={idx}
                                            className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-gray-200">

                                            <Badge className="bg-blue-50 text-blue-700 border-0 px-3 py-1 text-xs font-medium">
                                              {item.detail}
                                            </Badge>
                                            <span className="font-bold text-orange-600 text-sm">+{ratePercentage}%</span>
                                          </div>);

                                      })}
                                    </div>
                                  </div>);

                              })}
                            </div>
                          </>);

                      }
                      return null;
                    })()}

                    {/* 할증 적용 가격 (삭선) */}
                    {calculateTargetingSurcharge().length > 0 && (
                      <>
                        <div className="flex justify-between pt-1">
                          <span className="text-gray-600 font-semibold">최종 단가</span>
                          <span className="font-bold text-gray-400 line-through">{calculateFinalUnitPrice().toLocaleString()}원</span>
                        </div>

                        {/* 무료 이벤트 배너 */}
                        <div className="bg-[#FF693C] text-white rounded-xl px-4 py-2.5 text-center font-bold text-sm shadow-lg">
                          추가 타겟 할증 무료 이벤트
                        </div>
                      </>
                    )}

                    <div className="flex justify-between pt-1">
                      <span className="text-gray-600 font-semibold">최종 단가</span>
                      <span className="font-bold text-blue-600">{BASE_PRICE.toLocaleString()}원</span>
                    </div>
                    <div className="h-px bg-gray-300"></div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">슬롯</span>
                      <span className="font-bold">{slotCount}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">진행 일수</span>
                      <span className="font-bold">
                        {startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 1}일
                      </span>
                    </div>
                    {useLandingPage &&
                      <>
                        <div className="h-px bg-gray-300"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">이벤트 페이지 연결</span>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-[#FF693C] text-white border-0 px-2.5 py-1 text-[10px] font-bold shadow-sm">
                              무료 이벤트
                            </Badge>
                            <span className="font-bold text-gray-400 line-through text-sm">50,000원</span>
                          </div>
                        </div>
                      </>
                    }
                    <div className="h-px bg-gray-300"></div>
                    <div className="flex justify-between text-base">
                      <span className="text-blue-600 text-lg font-bold">총 비용</span>
                      <span className="font-bold text-blue-600 text-lg">
                        {calculateTotalCost().toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>);

    }

    return null;
  };

  if (userLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header with Progress */}
      {currentStep >= 0 &&
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={handlePrev} disabled={currentStep === 0} className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-30">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-center">
                <h2 className="font-bold text-gray-900">설문 만들기</h2>
                {currentStep > 0 &&
                  <span className="text-xs text-gray-500">Step {currentStep} / 7</span>
                }
              </div>
              <button
                onClick={() => {
                  if (currentStep === 7) {
                    if (!confirm('이 페이지를 벗어나면 작성된 설문은 임시저장됩니다. 입금 정보를 제출하지 않으면 설문이 시작되지 않습니다.')) {
                      return;
                    }
                    saveDraftMutation.mutate();
                  }
                  navigate(createPageUrl('ClientHome'));
                }}
                className="p-2 hover:bg-gray-100 rounded-full">

                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${currentStep / 7 * 100}%` }}
                transition={{ duration: 0.3 }} />

            </div>
          </div>
        </div>
      }

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}>

            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      {currentStep >= 1 && currentStep <= 6 &&
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1 h-14 text-base rounded-xl">
              이전
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === 6 && !canProceedFromStep6}
              className={`flex-[2] h-14 text-base rounded-xl font-bold ${currentStep === 6 && !canProceedFromStep6 ?
                  'bg-gray-300 text-gray-500 cursor-not-allowed' :
                  'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}`
              }>
              다음
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      }

      {currentStep === 7 &&
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={async () => {
                try {
                  // 먼저 임시저장
                  await saveDraftMutation.mutateAsync();
                  // 정상적으로 결제 페이지로 이동하는 경우 플래그 설정
                  setProceedingToPayment(true);
                  // 결제 페이지로 이동
                  createSurveyMutation.mutate();
                } catch (error) {
                  alert('설문 저장에 실패했습니다.');
                }
              }}
              disabled={!canSubmit || createSurveyMutation.isPending || saveDraftMutation.isPending}
              className="w-full h-14 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold">

              {createSurveyMutation.isPending || saveDraftMutation.isPending ?
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />처리중...</> :

                <><CheckCircle className="w-5 h-5 mr-2" />입금 정보 입력</>
              }
            </Button>
          </div>
        </div>
      }


    </div>);

}