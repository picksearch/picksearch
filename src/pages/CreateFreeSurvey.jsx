import React, { useState } from "react";
import { auth } from "@/api/auth";
import { Survey, Question } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, GripVertical, CheckCircle, Upload, Image as ImageIcon, Loader2, BarChart2, ListChecks, Coins, Home, MessageSquare, X, Eye, Save, ArrowLeft, GitBranch } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Link } from "react-router-dom";

const FREE_SURVEY_COST = 2; // 2 서치코인

export default function CreateFreeSurvey() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [uploadingImages, setUploadingImages] = useState({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [targetParticipants, setTargetParticipants] = useState(100); // 목표 참여자 수 (최대 1000명)
  const [draftSurveyId, setDraftSurveyId] = useState(null);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const draftId = urlParams.get('draft');
    const copied = urlParams.get('copy');

    if (draftId) {
      loadDraft(draftId);
    } else if (copied === 'true') {
      const stored = localStorage.getItem('copied_survey');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setTitle(data.title || "");
          setDescription(data.description || "");
          setQuestions(data.questions || []);
          setTargetParticipants(data.target_participants || 100);
          localStorage.removeItem('copied_survey');
          setTimeout(() => {
            alert('📋 설문이 복사되었습니다!');
          }, 500);
        } catch (error) {
          console.error('Failed to load copied survey:', error);
        }
      }
    }
  }, []);

  const loadDraft = async (surveyId) => {
    try {
      const surveys = await Survey.filter({ id: surveyId });
      if (surveys.length > 0) {
        const survey = surveys[0];
        setTitle(survey.title || "");
        setDescription(survey.description || "");
        setTargetParticipants(survey.target_participants || 100);
        setDraftSurveyId(survey.id);

        const loadedQuestions = await Question.filter({ survey_id: survey.id }, 'order');
        const reconstructedQuestions = loadedQuestions.map(q => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          image_urls: q.image_urls || [],
          image_descriptions: q.image_descriptions || [],
          max_selections: q.max_selections,
          order: q.order,
          cost: q.cost
        }));

        setQuestions(reconstructedQuestions);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await auth.me();
      } catch (error) {
        return null;
      }
    },
    retry: false,
  });

  const generateSecretKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now(),
      question_text: '',
      question_type: type,
      options: (type === 'multiple_choice' || type === 'multiple_select' || type === 'ranking' || type === 'choice_with_other' || type === 'branching_choice') ? ['', ''] :
        (type === 'likert_scale') ? ['', '', '', '', ''] : [],
      image_urls: (type === 'image_choice' || type === 'image_banner') ? [] : [],
      image_descriptions: type === 'image_choice' ? [] : [],
      max_selections: (type === 'multiple_select' || type === 'ranking') ? null : undefined,
      has_other_option: type === 'choice_with_other' ? true : undefined,
      branch_targets: type === 'branching_choice' ? {} : undefined,
      order: questions.length,
      cost: 0
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id, updatedQuestion) => {
    setQuestions(questions.map(q => q.id === id ? updatedQuestion : q));
  };

  const updateOption = (questionId, index, value) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[index] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options.length < 10) {
        return { ...q, options: [...q.options, ''] };
      }
      return q;
    }));
  };

  const removeOption = (questionId, index) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options.length > 2) {
        return { ...q, options: q.options.filter((_, i) => i !== index) };
      }
      return q;
    }));
  };

  const handleImageUpload = async (questionId, file) => {
    if (!file) return;

    // 이미지 파일 형식 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert('이미지 파일만 업로드 가능합니다.\n(허용 형식: JPG, JPEG, PNG, GIF, WEBP)');
      return;
    }

    // 5MB 용량 제한
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('이미지 용량은 5MB 이하만 가능합니다.');
      return;
    }

    setUploadingImages(prev => ({ ...prev, [questionId]: true }));
    try {
      const file_url = await UploadFile(file);
      setQuestions(questions.map(q => {
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
      setUploadingImages(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const updateImageDescription = (questionId, imageIndex, description) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const newDescriptions = [...(q.image_descriptions || [])];
        newDescriptions[imageIndex] = description;
        return { ...q, image_descriptions: newDescriptions };
      }
      return q;
    }));
  };

  const removeImage = (questionId, imageIndex) => {
    setQuestions(questions.map(q => {
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
    setQuestions(questions.filter(q => q.id !== id));
  };

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        alert('로그인이 필요합니다.');
        auth.redirectToLogin(window.location.pathname);
        throw new Error('로그인이 필요합니다');
      }

      let surveyId = draftSurveyId;

      if (!surveyId) {
        const secretKey = generateSecretKey();
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
        const newSurvey = await Survey.create({
          title: title || '제목 없음',
          description,
          survey_type: 'free',
          secret_key: secretKey,
          completion_secret_code: generateSecretKey(),
          target_participants: targetParticipants,
          status: 'draft',
          payment_status: 'paid',
          scheduled_start: today.toISOString(),
          scheduled_end: endDate.toISOString(),
          creator_name: user?.custom_name || user?.full_name || user?.email || 'Unknown'
        });
        surveyId = newSurvey.id;
        setDraftSurveyId(surveyId);
      } else {
        await Survey.update(surveyId, {
          title: title || '제목 없음',
          description,
          target_participants: targetParticipants,
          status: 'draft'
        });

        const existingQuestions = await Question.filter({ survey_id: surveyId });
        await Promise.all(existingQuestions.map(q => Question.delete(q.id)));
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
          max_selections: q.max_selections,
          order: i
        });
      }

      return surveyId;
    },
    onSuccess: (savedSurveyId) => {
      if (!draftSurveyId) {
        window.history.replaceState(null, '', `${window.location.pathname}?draft=${savedSurveyId}`);
      }
      alert('임시 저장되었습니다.');
    },
    onError: (error) => {
      console.error('임시저장 에러:', error);
      alert('임시 저장 실패: ' + (error.message || '알 수 없는 오류'));
    }
  });

  const createSurveyMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        alert('로그인이 필요합니다.');
        auth.redirectToLogin(window.location.pathname);
        throw new Error('로그인이 필요합니다');
      }

      // 서치코인 차감 로직 제거 - 회원이면 무료로 생성 가능

      let surveyId = draftSurveyId;

      if (surveyId) {
        await Survey.update(surveyId, {
          status: 'live',
          scheduled_start: new Date().toISOString()
        });

        const existingQuestions = await Question.filter({ survey_id: surveyId });
        await Promise.all(existingQuestions.map(q => Question.delete(q.id)));
      } else {
        const secretKey = generateSecretKey();
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 30);
        const newSurvey = await Survey.create({
          title,
          description,
          survey_type: 'free',
          secret_key: secretKey,
          completion_secret_code: generateSecretKey(),
          target_participants: targetParticipants,
          status: 'live',
          payment_status: 'paid',
          scheduled_start: today.toISOString(),
          scheduled_end: endDate.toISOString(),
          creator_name: user?.custom_name || user?.full_name || user?.email || 'Unknown'
        });
        surveyId = newSurvey.id;
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
          max_selections: q.max_selections,
          order: i
        });
      }

      return surveyId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mySurveys']);
      queryClient.invalidateQueries(['currentUser']);
      alert('무료설문이 생성되었습니다! 🎉');
      navigate(createPageUrl('ClientHome'));
    },
    onError: (error) => {
      alert(error.message || '설문 생성에 실패했습니다');
    }
  });

  const canSubmit = title && questions.length > 0 && questions.every(q => {
    if (!q.question_text?.trim()) return false;
    if (q.question_type === 'multiple_choice' || q.question_type === 'multiple_select' || q.question_type === 'ranking' || q.question_type === 'choice_with_other' || q.question_type === 'branching_choice') {
      return q.options?.length >= 2 && q.options.every(o => o?.trim());
    }
    if (q.question_type === 'image_choice') return q.image_urls.length === 2;
    if (q.question_type === 'image_banner') return q.image_urls.length === 1;
    return true;
  });

  if (userLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <Link to={createPageUrl('CreateSurvey')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Badge className="bg-white/20 text-white border-0 px-3 py-1">무료설문</Badge>
        </div>
        <div className="px-6 pt-4 pb-6">
          <h1 className="text-2xl font-bold text-white">무료설문 만들기</h1>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📢</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-amber-800 font-medium leading-relaxed">
              무료설문은 <span className="font-bold">주변인에게 직접 설문 링크를 전달</span>해서 데이터를 수집하는 설문입니다.
            </p>
            <p className="text-xs text-amber-600">
              1.3억 DB 기반의 정밀 타겟팅이 필요하다면 <Link to={createPageUrl('CreateSurvey')} className="underline font-bold text-amber-700 hover:text-amber-800">초정밀 타겟 설문</Link>을 이용해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">제목 *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="설문 제목을 입력하세요"
              className="h-11 rounded-xl border-gray-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">설명</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설문에 대한 간단한 설명을 입력하세요"
              className="rounded-xl border-gray-200 min-h-[80px] resize-none"
            />
          </div>

          {/* 목표 참여자 수 설정 */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">목표 참여자 수</label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={10}
                max={1000}
                value={targetParticipants}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 10;
                  setTargetParticipants(Math.min(1000, Math.max(10, val)));
                }}
                className="h-11 w-32 text-center rounded-xl border-gray-200 font-bold"
              />
              <span className="text-sm text-gray-600">명</span>
              <div className="flex gap-1.5 ml-auto">
                {[100, 300, 500, 1000].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTargetParticipants(num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${targetParticipants === num
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 ml-1">해당 인원이 차면 자동으로 마감됩니다 (최대 1,000명)</p>
          </div>



        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-bold text-gray-800">질문 목록</h3>
          <Badge className="bg-emerald-100 text-emerald-700 border-0">{questions.length}개</Badge>
        </div>

        <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-3">
          {questions.map((question, index) => (
            <Reorder.Item
              key={question.id}
              value={question}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileDrag={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0,0,0,0.12)", zIndex: 50 }}
              className="list-none"
            >
              <Card className="bg-white rounded-2xl shadow-sm border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 mt-1">
                      <div className="cursor-grab active:cursor-grabbing p-1 -m-1 hover:bg-gray-100 rounded touch-none">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">Q{index + 1}</Badge>
                    </div>
                    <div className="flex-1">
                      {question.question_type === 'image_banner' ? (
                        <Textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(question.id, { ...question, question_text: e.target.value.slice(0, 50) })}
                          placeholder="이미지 설명 (최대 50자)"
                          className="border-gray-200 rounded-xl mb-2 resize-none min-h-[80px]"
                          maxLength={50}
                        />
                      ) : (
                        <Textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(question.id, { ...question, question_text: e.target.value })}
                          placeholder="질문을 입력하세요"
                          className="border-gray-200 rounded-xl mb-2 min-h-[44px] resize-none"
                          rows={1}
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <Badge className={
                          question.question_type === 'multiple_choice' ? 'bg-blue-100 text-blue-700 border-0' :
                            question.question_type === 'multiple_select' ? 'bg-violet-100 text-violet-700 border-0' :
                              question.question_type === 'ranking' ? 'bg-amber-100 text-amber-700 border-0' :
                                question.question_type === 'numeric_rating' ? 'bg-teal-100 text-teal-700 border-0' :
                                  question.question_type === 'likert_scale' ? 'bg-indigo-100 text-indigo-700 border-0' :
                                    question.question_type === 'image_banner' ? 'bg-pink-100 text-pink-700 border-0' :
                                      question.question_type === 'short_answer' ? 'bg-gray-100 text-gray-700 border-0' :
                                        question.question_type === 'choice_with_other' ? 'bg-cyan-100 text-cyan-700 border-0' :
                                          question.question_type === 'branching_choice' ? 'bg-emerald-100 text-emerald-700 border-0' :
                                            'bg-purple-100 text-purple-700 border-0'
                        }>
                          {question.question_type === 'multiple_choice' ? '객관식' :
                            question.question_type === 'multiple_select' ? '다중선택' :
                              question.question_type === 'ranking' ? '순위형' :
                                question.question_type === 'numeric_rating' ? '수치평정' :
                                  question.question_type === 'likert_scale' ? '리커트척도' :
                                    question.question_type === 'image_banner' ? '이벤트배너' :
                                      question.question_type === 'short_answer' ? '주관식' :
                                        question.question_type === 'choice_with_other' ? '객관+주관' :
                                          question.question_type === 'branching_choice' ? '분기형' : '이미지선택'}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)} className="text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                {(question.question_type === 'multiple_choice' || question.question_type === 'multiple_select' || question.question_type === 'ranking' || question.question_type === 'choice_with_other') && (
                  <CardContent className="pt-0 space-y-2">
                    {question.question_type === 'multiple_select' && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-xs font-medium text-gray-600">최대 선택 개수:</label>
                          <Input
                            type="number"
                            min="2"
                            value={question.max_selections || ''}
                            onChange={(e) => {
                              const val = e.target.value ? parseInt(e.target.value) : null;
                              updateQuestion(question.id, { ...question, max_selections: val });
                            }}
                            placeholder="제한 없음"
                            className={`w-32 h-9 rounded-lg text-sm ${question.max_selections && (question.max_selections < 2 || question.max_selections > question.options.length) ? 'border-red-500' : ''}`}
                          />
                          <span className="text-xs text-gray-500">(비워두면 제한 없음)</span>
                        </div>
                        {question.max_selections && (question.max_selections < 2 || question.max_selections > question.options.length) && (
                          <p className="text-xs text-red-500">2 이상, 선택지 개수({question.options.length}개) 이하로 입력해주세요</p>
                        )}
                      </div>
                    )}
                    {question.question_type === 'ranking' && (
                      <div className="mb-3">
                        <div className="bg-amber-50 rounded-lg p-2 mb-2 border border-amber-200">
                          <p className="text-xs text-amber-700 font-medium">
                            🏆 참여자가 항목을 클릭하여 순위를 매깁니다
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-medium text-gray-600">최대 순위 개수:</label>
                          <Input
                            type="number"
                            min="2"
                            value={question.max_selections || ''}
                            onChange={(e) => {
                              const val = e.target.value ? parseInt(e.target.value) : null;
                              updateQuestion(question.id, { ...question, max_selections: val });
                            }}
                            placeholder="제한 없음"
                            className={`w-32 h-9 rounded-lg text-sm ${question.max_selections && (question.max_selections < 2 || question.max_selections > question.options.length) ? 'border-red-500' : ''}`}
                          />
                          <span className="text-xs text-gray-500">(비워두면 전체 순위)</span>
                        </div>
                        {question.max_selections && (question.max_selections < 2 || question.max_selections > question.options.length) && (
                          <p className="text-xs text-red-500">2 이상, 선택지 개수({question.options.length}개) 이하로 입력해주세요</p>
                        )}
                      </div>
                    )}
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                          placeholder={`선택지 ${optIndex + 1}`}
                          className="border-gray-200 rounded-xl"
                        />
                        {question.options.length > 2 && (
                          <Button variant="ghost" size="icon" onClick={() => removeOption(question.id, optIndex)} className="text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {question.options.length < 10 && (
                      <Button variant="outline" size="sm" onClick={() => addOption(question.id)} className="w-full border-dashed rounded-xl">
                        <PlusCircle className="w-4 h-4 mr-2" /> 선택지 추가 ({question.options.length}/10)
                      </Button>
                    )}
                    {question.question_type === 'choice_with_other' && (
                      <div className="bg-cyan-50 rounded-xl p-3 border border-cyan-200 mt-3">
                        <p className="text-xs text-cyan-700 font-medium flex items-center gap-2">
                          <span>📝</span>
                          <span>마지막 선택지 선택 시 텍스트 입력창이 표시됩니다</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                )}

                {question.question_type === 'branching_choice' && (
                  <CardContent className="pt-0 space-y-2">
                    <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-200 mb-2">
                      <p className="text-xs text-emerald-700 font-medium">
                        🔀 선택지별로 이동할 문항 번호를 지정합니다 (0 = 설문 종료, 비워두면 다음 문항, 이동 후 순차 진행)
                      </p>
                    </div>
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="space-y-1">
                        <div className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const oldOption = question.options[optIndex];
                              const newOptions = [...question.options];
                              newOptions[optIndex] = e.target.value;
                              const newBranchTargets = { ...question.branch_targets };
                              if (oldOption && newBranchTargets[oldOption] !== undefined) {
                                newBranchTargets[e.target.value] = newBranchTargets[oldOption];
                                delete newBranchTargets[oldOption];
                              }
                              updateQuestion(question.id, { ...question, options: newOptions, branch_targets: newBranchTargets });
                            }}
                            placeholder={`선택지 ${optIndex + 1}`}
                            className="border-gray-200 rounded-xl"
                          />
                          {question.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newOptions = question.options.filter((_, i) => i !== optIndex);
                                const newBranchTargets = { ...question.branch_targets };
                                delete newBranchTargets[option];
                                updateQuestion(question.id, { ...question, options: newOptions, branch_targets: newBranchTargets });
                              }}
                              className="text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-emerald-600 font-medium">→ 이동할 문항:</span>
                          <Input
                            type="number"
                            min="0"
                            max={questions.length}
                            value={option ? (question.branch_targets?.[option] ?? '') : ''}
                            onChange={(e) => {
                              if (!option) return;
                              const value = e.target.value === '' ? null : parseInt(e.target.value);
                              const newBranchTargets = { ...question.branch_targets };
                              if (value === null) {
                                delete newBranchTargets[option];
                              } else {
                                newBranchTargets[option] = value;
                              }
                              updateQuestion(question.id, { ...question, branch_targets: newBranchTargets });
                            }}
                            placeholder="숫자"
                            disabled={!option}
                            className="w-20 h-8 text-xs border-emerald-200 rounded-lg disabled:bg-gray-100"
                          />
                          <span className="text-xs text-gray-400">
                            {!option ? '(선택지 입력 필요)' :
                              question.branch_targets?.[option] === 0 ? '(설문 종료)' :
                                question.branch_targets?.[option] ? `(Q${question.branch_targets[option]}로 이동)` : '(다음 문항)'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {question.options.length < 10 && (
                      <Button
                        variant="outline"
                        onClick={() => updateQuestion(question.id, { ...question, options: [...question.options, ''] })}
                        className="w-full border-dashed rounded-xl"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        선택지 추가 ({question.options.length}/10)
                      </Button>
                    )}
                  </CardContent>
                )}

                {question.question_type === 'numeric_rating' && (
                  <CardContent className="pt-0">
                    <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                      <p className="text-sm text-teal-700 mb-3 font-medium">👆 참여자는 0~10점 중 선택합니다</p>
                      <div className="grid grid-cols-11 gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <div key={num} className="aspect-square bg-white rounded-lg border-2 border-teal-300 flex items-center justify-center text-sm font-bold text-teal-700">{num}</div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}

                {question.question_type === 'likert_scale' && (
                  <CardContent className="pt-0 space-y-2">
                    <div className="bg-indigo-50 rounded-lg p-2 mb-2 border border-indigo-200">
                      <p className="text-xs text-indigo-700 font-medium">
                        👆 참여자는 5개 척도 중 하나를 선택합니다. 각 척도 라벨을 입력하세요.
                      </p>
                    </div>
                    {[
                      { value: 1, placeholder: '예: 전혀 그렇지 않다', color: 'border-l-red-400' },
                      { value: 2, placeholder: '예: 그렇지 않다', color: 'border-l-orange-400' },
                      { value: 3, placeholder: '예: 보통이다', color: 'border-l-yellow-400' },
                      { value: 4, placeholder: '예: 그렇다', color: 'border-l-emerald-400' },
                      { value: 5, placeholder: '예: 매우 그렇다', color: 'border-l-green-500' },
                    ].map((item, idx) => (
                      <div key={item.value} className="flex gap-2 items-center">
                        <span className="text-xs font-bold text-indigo-600 w-4">{item.value}</span>
                        <Input
                          value={question.options?.[idx] || ''}
                          onChange={(e) => {
                            const newOptions = [...(question.options || ['', '', '', '', ''])];
                            newOptions[idx] = e.target.value;
                            updateQuestion(question.id, { ...question, options: newOptions });
                          }}
                          placeholder={item.placeholder}
                          className={`border-gray-200 rounded-xl border-l-4 ${item.color}`}
                        />
                      </div>
                    ))}
                  </CardContent>
                )}

                {question.question_type === 'image_choice' && (
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-xs text-purple-600 font-medium">※ 이미지 용량: 최대 5MB</p>
                    <div className="space-y-2">
                      {question.image_urls.map((url, imgIndex) => (
                        <div key={imgIndex} className="space-y-2">
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50 border-2 border-gray-200 flex items-center justify-center">
                            <img src={url} alt={`이미지 ${imgIndex + 1}`} className="max-w-full max-h-full object-contain" />
                            <button onClick={() => removeImage(question.id, imgIndex)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow-lg">×</button>
                            <div className="absolute bottom-2 left-2 bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md">선택지 {imgIndex + 1}</div>
                          </div>
                          <Input
                            value={(question.image_descriptions || [])[imgIndex] || ''}
                            onChange={(e) => updateImageDescription(question.id, imgIndex, e.target.value)}
                            placeholder="이미지 설명"
                            className="border-purple-200 rounded-xl text-sm"
                          />
                        </div>
                      ))}
                      {question.image_urls.length < 2 && (
                        <label className="w-full aspect-square rounded-xl border-2 border-dashed border-purple-300 cursor-pointer flex flex-col items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 transition-all">
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(question.id, e.target.files[0])} className="hidden" disabled={uploadingImages[question.id]} />
                          {uploadingImages[question.id] ? <Loader2 className="w-10 h-10 text-purple-500 animate-spin" /> : (
                            <>
                              <Upload className="w-10 h-10 text-purple-500" />
                              <span className="text-base text-purple-600 font-medium">이미지 업로드 ({question.image_urls.length}/2)</span>
                              <span className="text-xs text-purple-400">최대 5MB</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  </CardContent>
                )}

                {question.question_type === 'image_banner' && (
                  <CardContent className="pt-0 space-y-3">
                    <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 text-sm text-pink-700">
                      📢 이벤트/홍보용 1:1 이미지 (최대 5MB)
                    </div>
                    {question.image_urls.length > 0 ? (
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50 border-2 border-gray-200 flex items-center justify-center">
                        <img src={question.image_urls[0]} alt="배너" className="max-w-full max-h-full object-contain" />
                        <button onClick={() => removeImage(question.id, 0)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors">×</button>
                      </div>
                    ) : (
                      <label className="w-full aspect-square rounded-xl border-2 border-dashed border-pink-300 hover:border-pink-500 cursor-pointer flex flex-col items-center justify-center gap-2 bg-pink-50 hover:bg-pink-100 transition-all">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(question.id, e.target.files[0])} className="hidden" disabled={uploadingImages[question.id]} />
                        {uploadingImages[question.id] ? <Loader2 className="w-10 h-10 text-pink-500 animate-spin" /> : (
                          <>
                            <Upload className="w-10 h-10 text-pink-500" />
                            <span className="text-base text-pink-600 font-medium">1:1 이미지 업로드</span>
                            <span className="text-xs text-pink-400">최대 5MB</span>
                          </>
                        )}
                      </label>
                    )}
                  </CardContent>
                )}
              </Card>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Add Question Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { type: 'multiple_choice', label: '객관식', icon: PlusCircle, color: 'blue' },
            { type: 'short_answer', label: '주관식', icon: MessageSquare, color: 'gray' },
            { type: 'multiple_select', label: '다중선택', icon: ListChecks, color: 'violet' },
            { type: 'ranking', label: '순위형', icon: BarChart2, color: 'amber' },
            { type: 'numeric_rating', label: '수치평정', icon: BarChart2, color: 'teal' },
            { type: 'likert_scale', label: '리커트척도', icon: ListChecks, color: 'indigo' },
            { type: 'image_choice', label: '이미지선택', icon: ImageIcon, color: 'purple' },
            { type: 'image_banner', label: '이벤트배너', icon: ImageIcon, color: 'pink' },
            { type: 'choice_with_other', label: '객관+주관', icon: MessageSquare, color: 'cyan' },
            { type: 'branching_choice', label: '분기형', icon: GitBranch, color: 'emerald' },
          ].map(({ type, label, icon: Icon, color }) => (
            <button
              key={type}
              onClick={() => addQuestion(type)}
              className={`group relative flex flex-col items-center justify-center p-4 h-24 rounded-2xl bg-white border-2 border-${color}-100 hover:border-${color}-400 hover:bg-${color}-50 transition-all duration-200 hover:shadow-md`}
            >
              <div className={`mb-2 p-2 rounded-full bg-${color}-50 group-hover:bg-white transition-colors`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <div className={`font-bold text-${color}-900 text-sm`}>{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => {
                if (questions.length === 0) {
                  alert('미리보기할 질문이 없습니다.');
                  return;
                }

                // iOS Safari에서 팝업 차단 방지: 먼저 창을 열고 URL 설정
                const newWindow = window.open('', '_blank');

                const previewData = {
                  title,
                  description,
                  questions: questions.map((q, idx) => ({
                    ...q,
                    id: `preview_${idx}`,
                    order: idx
                  })),
                  survey_type: 'free'
                };
                localStorage.setItem('survey_preview_data', JSON.stringify(previewData));

                if (newWindow) {
                  newWindow.location.href = `${window.location.origin}${createPageUrl('TakeSurvey')}?preview=true`;
                } else {
                  alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
                }
              }}
              variant="outline"
              className="h-11 rounded-xl border-gray-300 text-gray-700 font-bold text-sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              미리보기
            </Button>

            <Button
              onClick={async () => {
                if (!title || questions.length === 0) {
                  alert('제목과 최소 1개의 질문이 필요합니다.');
                  return;
                }
                try {
                  await saveDraftMutation.mutateAsync();
                } catch (error) {
                  alert('임시 저장에 실패했습니다.');
                }
              }}
              disabled={saveDraftMutation.isPending}
              variant="outline"
              className="h-11 rounded-xl border-gray-300 text-gray-700 font-bold text-sm"
            >
              {saveDraftMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  임시저장
                </>
              )}
            </Button>
          </div>

          <Button
            onClick={() => {
              if (canSubmit) {
                setShowTermsModal(true);
              } else {
                alert('제목과 질문을 모두 입력해주세요.');
              }
            }}
            disabled={!canSubmit || createSurveyMutation.isPending}
            className={`w-full h-14 text-base font-bold rounded-xl ${canSubmit ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600' : 'bg-gray-300'} text-white`}
          >
            {createSurveyMutation.isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />생성중...</>
            ) : (
              <><CheckCircle className="w-5 h-5 mr-2" />무료설문 생성하기</>
            )}
          </Button>
        </div>
      </div>

      {/* 무료설문 약관 동의 토스트 모달 */}
      <AnimatePresence>
        {showTermsModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="fixed inset-0 bg-black/50 z-[60]"
            />

            {/* Toast Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
            >
              <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-900">무료설문 이용약관 동의</h2>
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 overflow-y-auto max-h-[50vh] text-sm text-gray-700 space-y-5">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">1. 개인정보 수집의 주체 및 책임</h3>
                    <p className="text-gray-600 leading-relaxed">
                      무료 설문에서 개인정보(이름, 전화번호, 이메일, 주소 등)를 수집하는 경우, 개인정보 처리의 주체는 설문 생성자(사용자)이며 픽서치는 개인정보 처리자가 아니다.<br /><br />
                      사용자는 개인정보보호법, 정보통신망법 등 관련 법령에 따라 개인정보의 수집·이용·보관·파기 등 모든 절차를 스스로 책임진다.<br /><br />
                      사용자가 개인정보를 부적절하게 수집·보관·유출한 경우 발생하는 모든 민형사상 책임은 전적으로 사용자에게 있으며, 픽서치는 어떠한 법적 책임도 지지 않는다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-red-600 mb-2">2. 개인정보 수집 동의의 의무 (중요)</h3>
                    <p className="text-gray-600 leading-relaxed">
                      사용자는 개인정보를 수집할 때 개인정보 수집·이용 동의 문구를 반드시 고지하고 획득해야 한다.<br /><br />
                      동의 문구 미고지로 발생하는 신고, 소송, 분쟁 등 모든 문제는 사용자 책임이다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">3. 민감정보·미성년자 정보 수집 금지</h3>
                    <p className="text-gray-600 leading-relaxed">
                      • 종교, 건강, 정치성향 등 민감정보 수집 금지<br />
                      • 14세 미만 아동의 개인정보 수집 금지<br /><br />
                      위반 시 설문 삭제 및 계정 제한 가능하며, 법령 위반에 따른 책임은 사용자에게 귀속된다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">4. 무료 설문 콘텐츠 및 배포 책임</h3>
                    <p className="text-gray-600 leading-relaxed">
                      무료 설문은 사용자가 직접 생성 및 배포하는 콘텐츠이며 설문 내용의 적법성·정확성·저작권 준수 여부는 모두 사용자 책임이다.<br /><br />
                      사용자가 생성한 설문의 배포로 인해 발생하는 모든 민원, 분쟁, 피해, 제3자 문제는 전적으로 사용자에게 책임이 있다.<br /><br />
                      픽서치는 설문 내용 및 배포에 대해 사전 검증·감독·승인 의무가 없다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-red-600 mb-2">5. 불법·위해·부적절 콘텐츠 금지</h3>
                    <p className="text-gray-600 leading-relaxed">
                      다음 내용이 포함된 설문은 즉시 삭제된다:<br /><br />
                      • 타인의 개인정보·연락처·이미지·계정 무단 수집<br />
                      • 명예훼손·비방·허위사실 유포<br />
                      • 음란·폭력·차별·혐오·불법 정보<br />
                      • 정치적 선동, 여론조작 목적<br />
                      • 의료·금융·투자·건강 관련 허위 정보<br />
                      • 불법 행위 유도 또는 사기성 설문<br /><br />
                      → 발견 즉시 삭제·차단되고, 관련 법적 책임은 사용자에게 귀속됨.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">6. 저작권 및 제3자 권리 관련</h3>
                    <p className="text-gray-600 leading-relaxed">
                      설문 제작 시 삽입되는 텍스트, 이미지, 자료 등에 대한 저작권·초상권·상표권 문제는 모두 사용자 책임이다.<br /><br />
                      권리침해 신고가 접수되면 픽서치는 해당 설문을 사전 통보 없이 즉시 비공개 또는 삭제할 수 있다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">7. 플랫폼 면책 조항</h3>
                    <p className="text-gray-600 leading-relaxed">
                      픽서치는 다음 사항에 대해 책임을 지지 않는다:<br /><br />
                      • 사용자 설문으로 인해 발생한 모든 법적 분쟁·피해<br />
                      • 무료 설문 배포로 인한 제3자 분쟁<br />
                      • 개인정보 오·남용, 유출로 인한 피해<br />
                      • 설문 응답 데이터의 오류, 누락, 변동<br />
                      • 시스템 장애나 네트워크 문제로 인한 서비스 중단<br />
                      • 설문 내용에 대한 검증·보증·승인 의무 없음
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">8. 서비스 이용 제한</h3>
                    <p className="text-gray-600 leading-relaxed">
                      픽서치는 다음 경우 사전 통보 없이 서비스 이용을 제한할 수 있다:<br /><br />
                      • 법령 위반 또는 위반 가능성이 큰 설문<br />
                      • 반복적인 신고가 접수된 설문<br />
                      • 불법·유해 콘텐츠 생성<br />
                      • 개인정보 부적절 수집<br />
                      • 서비스 악용, 스팸 추정 활동 등
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">9. 데이터 처리 및 보관</h3>
                    <p className="text-gray-600 leading-relaxed">
                      무료 설문 응답 데이터는 사용자가 직접 관리해야 하며, 픽서치가 이를 대신 보관·관리할 의무는 없다.<br /><br />
                      사용자가 요청한 데이터 삭제는 사용자 본인의 책임 영역이다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">10. 약관 변경 및 효력</h3>
                    <p className="text-gray-600 leading-relaxed">
                      본 약관은 서비스 정책에 따라 수정될 수 있으며, 사용자에게 사전 공지 후 변경 효력이 발생한다.<br /><br />
                      변경 이후 서비스 이용 시 변경된 약관에 동의한 것으로 간주한다.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="w-5 h-5 rounded border-emerald-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-bold text-emerald-800">
                      위 약관을 모두 읽었으며, 이에 동의합니다.
                    </span>
                  </label>

                  <Button
                    onClick={() => {
                      if (termsAgreed) {
                        setShowTermsModal(false);
                        createSurveyMutation.mutate();
                      }
                    }}
                    disabled={!termsAgreed || createSurveyMutation.isPending}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold rounded-xl h-14 text-base"
                  >
                    {createSurveyMutation.isPending ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />생성중...</>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        동의하고 무료설문 생성하기
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}