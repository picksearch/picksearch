import React, { useState } from "react";
import { auth } from "@/api/auth";
import { Survey, Question, Response, Payment, User } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Download, CheckCircle, XCircle, Clock, Calendar, FileSpreadsheet, ExternalLink, Trash2, Edit, Copy, Search, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { formatKST } from "@/utils";

export default function OrderManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [scheduleTimes, setScheduleTimes] = useState({});
  const [expandedSurvey, setExpandedSurvey] = useState(null);
  const [surveyQuestions, setSurveyQuestions] = useState({});
  const [surveyDepositors, setSurveyDepositors] = useState({});
  const [surveyPaymentConfirmed, setSurveyPaymentConfirmed] = useState({});
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [surveyReviewCompleted, setSurveyReviewCompleted] = useState({}); // 개별 설문 검수 완료 상태
  const [currentReviewingSurveyId, setCurrentReviewingSurveyId] = useState(null); // 현재 검수 중인 설문 ID

  // 입금 확인 팝업 상태
  const [confirmingPayment, setConfirmingPayment] = useState(null);

  const [editingSurvey, setEditingSurvey] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    target_participants: 0,
    total_cost: 0
  });

  // 거절 모달 상태
  const [rejectingSurvey, setRejectingSurvey] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => auth.me(),
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  React.useEffect(() => {
    if (!userLoading && (userError || !user)) {
      auth.redirectToLogin(window.location.pathname);
    }
  }, [user, userLoading, userError]);

  const { data: pendingSurveys = [] } = useQuery({
    queryKey: ['pendingSurveys'],
    queryFn: () => Survey.filter({ status: 'pending' }, 'created_at', false),
    refetchInterval: false,
    staleTime: 60000,
    cacheTime: Infinity,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

  const { data: reviewSurveys = [] } = useQuery({
    queryKey: ['reviewSurveys'],
    queryFn: () => Survey.filter({ status: 'review' }, 'created_at', false),
    refetchInterval: false,
    staleTime: 60000,
    cacheTime: Infinity,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

  const { data: liveSurveys = [] } = useQuery({
    queryKey: ['liveSurveys'],
    queryFn: async () => {
      const live = await Survey.filter({ status: 'live' }, 'created_at', false);
      const scheduled = await Survey.filter({ status: 'scheduled' }, 'created_at', false);
      return [...live, ...scheduled];
    },
    refetchInterval: false,
    staleTime: 60000,
    cacheTime: Infinity,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

  const { data: closedSurveys = [] } = useQuery({
    queryKey: ['closedSurveys'],
    queryFn: () => Survey.filter({ status: 'closed' }, 'created_at', false),
    refetchInterval: false,
    staleTime: 60000,
    cacheTime: Infinity,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

  const { data: rejectedSurveys = [] } = useQuery({
    queryKey: ['rejectedSurveys'],
    queryFn: () => Survey.filter({ status: 'rejected' }, 'created_at', false),
    refetchInterval: false,
    staleTime: 60000,
    cacheTime: Infinity,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

  const loadSurveyQuestions = async (surveyId) => {
    if (surveyQuestions[surveyId]) return;

    try {
      const questions = await Question.filter({ survey_id: surveyId }, 'order');
      setSurveyQuestions(prev => ({ ...prev, [surveyId]: questions }));
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const loadDepositorName = async (surveyId) => {
    if (surveyDepositors[surveyId]) return;

    try {
      const transactions = await Payment.filter({ survey_id: surveyId, type: 'deposit' }, 'created_at', false);
      if (transactions.length > 0) {
        setSurveyDepositors(prev => ({ ...prev, [surveyId]: transactions[0].depositor_name }));
      }
    } catch (error) {
      console.error('Failed to load depositor:', error);
    }
  };

  const toggleSurveyExpand = (surveyId) => {
    if (expandedSurvey === surveyId) {
      setExpandedSurvey(null);
    } else {
      setExpandedSurvey(surveyId);
      loadSurveyQuestions(surveyId);
    }
  };

  // Load depositor name for all surveys on mount
  React.useEffect(() => {
    const loadAllDepositors = async () => {
      const allSurveys = [...pendingSurveys, ...reviewSurveys, ...liveSurveys, ...closedSurveys, ...rejectedSurveys];
      for (const survey of allSurveys) {
        if (!surveyDepositors[survey.id]) {
          try {
            const transactions = await Payment.filter({ survey_id: survey.id, type: 'deposit' }, 'created_at', false);
            if (transactions.length > 0) {
              setSurveyDepositors(prev => ({ ...prev, [survey.id]: transactions[0].depositor_name }));
            }
          } catch (error) {
            console.error('Failed to load depositor:', error);
          }
        }
      }
    };
    loadAllDepositors();
  }, [pendingSurveys, reviewSurveys, liveSurveys, closedSurveys, rejectedSurveys]);

  // 설문 일괄 검수하기: JSON 다운로드 + 이미지 검수 모달 열기
  const handleBulkReview = async () => {
    if (!reviewSurveys || reviewSurveys.length === 0) {
      alert('검토할 설문이 없습니다.');
      return;
    }

    // 1. JSON 다운로드 실행
    downloadJsonMutation.mutate(reviewSurveys);

    // 2. 이미지 검수 모달 열기
    const imagesData = [];

    for (const survey of reviewSurveys) {
      const questions = await Question.filter({ survey_id: survey.id }, 'order');

      questions.forEach((question, qIdx) => {
        if (question.question_type === 'image_choice' && question.image_urls) {
          question.image_urls.forEach((url, imgIdx) => {
            imagesData.push({
              url,
              surveyTitle: survey.title,
              questionText: question.question_text,
              questionNumber: qIdx + 1,
              imageNumber: imgIdx + 1,
              questionType: 'image_choice'
            });
          });
        }

        if (question.question_type === 'image_banner' && question.image_urls && question.image_urls.length > 0) {
          imagesData.push({
            url: question.image_urls[0],
            surveyTitle: survey.title,
            questionText: question.question_text,
            questionNumber: qIdx + 1,
            imageNumber: 1,
            questionType: 'image_banner'
          });
        }
      });
    }

    if (imagesData.length === 0) {
      // 이미지가 없으면 바로 검수 완료 처리
      setReviewCompleted(true);
      alert('검토할 이미지가 없습니다. 검수가 완료되었습니다.');
      return;
    }

    setAllImages(imagesData);
    setCurrentImageIndex(0);
    setImageGalleryOpen(true);
  };

  // 이미지 검수 완료 처리
  const handleReviewComplete = () => {
    if (confirm('검수를 완료하시겠습니까?')) {
      setImageGalleryOpen(false);

      // 개별 설문 검수인 경우
      if (currentReviewingSurveyId) {
        setSurveyReviewCompleted(prev => ({ ...prev, [currentReviewingSurveyId]: true }));
        setCurrentReviewingSurveyId(null);
      } else {
        // 일괄 검수인 경우
        setReviewCompleted(true);
      }
    }
  };

  // 개별 설문 검수하기: 해당 설문만 JSON 다운로드 + 이미지 검수 모달 열기
  const handleSingleSurveyReview = async (survey) => {
    // 1. 해당 설문 JSON 다운로드
    downloadJsonMutation.mutate([survey]);

    // 2. 현재 검수 중인 설문 ID 저장
    setCurrentReviewingSurveyId(survey.id);

    // 3. 해당 설문의 이미지만 검수 모달 열기
    const imagesData = [];
    const questions = await Question.filter({ survey_id: survey.id }, 'order');

    questions.forEach((question, qIdx) => {
      if (question.question_type === 'image_choice' && question.image_urls) {
        question.image_urls.forEach((url, imgIdx) => {
          imagesData.push({
            url,
            surveyTitle: survey.title,
            questionText: question.question_text,
            questionNumber: qIdx + 1,
            imageNumber: imgIdx + 1,
            questionType: 'image_choice'
          });
        });
      }

      if (question.question_type === 'image_banner' && question.image_urls && question.image_urls.length > 0) {
        imagesData.push({
          url: question.image_urls[0],
          surveyTitle: survey.title,
          questionText: question.question_text,
          questionNumber: qIdx + 1,
          imageNumber: 1,
          questionType: 'image_banner'
        });
      }
    });

    if (imagesData.length === 0) {
      // 이미지가 없으면 바로 검수 완료 처리
      setSurveyReviewCompleted(prev => ({ ...prev, [survey.id]: true }));
      alert('검토할 이미지가 없습니다. 검수가 완료되었습니다.');
      return;
    }

    setAllImages(imagesData);
    setCurrentImageIndex(0);
    setImageGalleryOpen(true);
  };

  React.useEffect(() => {
    if (!imageGalleryOpen) return;

    const handleKeyDown = (e) => {
      if (allImages.length === 0) return;
      if (e.key === 'ArrowRight') {
        setCurrentImageIndex(prev => (prev + 1) % allImages.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);
      } else if (e.key === 'Escape') {
        setImageGalleryOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageGalleryOpen, allImages.length]);

  const downloadJsonMutation = useMutation({
    mutationFn: async (surveys) => {
      const surveysWithQuestions = await Promise.all(
        surveys.map(async (survey) => {
          const questions = await Question.filter({ survey_id: survey.id }, 'order');
          return { ...survey, questions };
        })
      );

      // Build JSON structure
      const jsonData = {
        exportDate: new Date().toISOString(),
        totalSurveys: surveysWithQuestions.length,
        surveys: surveysWithQuestions.map(survey => {
          const surveyUrl = `${window.location.origin}/TakeSurvey?key=${survey.secret_key}`;
          const landingUrl = survey.landing_enabled ? (survey.landing_page_url || '') : '';
          const creatorName = survey.creator_name || survey.created_by || 'Unknown';

          // Format Target
          let targetInfo = survey.target_persona || '';
          if (survey.target_options) {
            try {
              const settings = typeof survey.target_options === 'string' ? JSON.parse(survey.target_options) : survey.target_options;
              if (Array.isArray(settings)) {
                targetInfo = settings.map(cell => {
                  return Object.entries(cell.targets || {}).map(([cat, fields]) => {
                    return `${cat}: ${Object.entries(fields).map(([k, v]) => `${k}=${v}`).join(', ')}`;
                  }).join(' | ');
                }).join(' || ');
              } else {
                targetInfo = JSON.stringify(settings);
              }
            } catch (e) {
              targetInfo = '타겟 데이터 오류';
            }
          }

          return {
            surveyType: survey.survey_type || '',
            title: survey.title || '',
            description: survey.description || '',
            surveyPurpose: survey.survey_purpose || '',
            creatorName: creatorName,
            targetInfo: targetInfo,
            landingPageUrl: landingUrl,
            surveyUrl: surveyUrl,
            secretCode: survey.completion_secret_code || '',
            scheduledStart: survey.scheduled_start || '',
            scheduledEnd: survey.scheduled_end || '',
            questions: survey.questions.map((question, qIdx) => {
              const questionType = question.question_type === 'multiple_choice' ? '객관식' :
                question.question_type === 'short_answer' ? '주관식' :
                  question.question_type === 'numeric_rating' ? '수치평정' :
                    question.question_type === 'likert_scale' ? '리커트척도' :
                      question.question_type === 'ranking' ? '순위형' :
                        question.question_type === 'image_choice' ? '이미지선택' :
                          question.question_type === 'image_banner' ? '이미지배너' : '기타';

              const isImageType = question.question_type === 'image_choice' || question.question_type === 'image_banner';

              return {
                questionNumber: qIdx + 1,
                questionType: questionType,
                questionText: question.question_text || '',
                ...(isImageType
                  ? { imageUrls: question.image_urls || [] }
                  : { options: question.options || null })
              };
            })
          };
        })
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `설문조사_목록_${formatKST(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      link.click();

      await Promise.all(
        surveys.map(survey =>
          Survey.update(survey.id, {
            status: 'review'
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingSurveys']);
      queryClient.invalidateQueries(['reviewSurveys']);
      alert('JSON 파일 다운로드가 완료되었습니다. 이미지 검수를 끝까지 진행 후 이미지 검수 완료 버튼을 눌러주세요.');
    },
  });

  const startSurveyMutation = useMutation({
    mutationFn: async ({ surveyId, startTime }) => {
      await Survey.update(surveyId, {
        status: startTime ? 'scheduled' : 'live',
        scheduled_start: startTime || new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviewSurveys']);
      queryClient.invalidateQueries(['liveSurveys']);
      alert('설문이 시작되었습니다!');
    },
  });

  const startAllReviewMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        reviewSurveys.map(survey =>
          Survey.update(survey.id, {
            status: 'scheduled'
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviewSurveys']);
      queryClient.invalidateQueries(['liveSurveys']);
      alert(`${reviewSurveys.length}개의 설문이 일괄 예약되었습니다!`);
    },
  });

  const closeSurveyMutation = useMutation({
    mutationFn: async (surveyId) => {
      await Survey.update(surveyId, {
        status: 'closed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['liveSurveys']);
      queryClient.invalidateQueries(['closedSurveys']);
      alert('설문이 종료되었습니다.');
    },
  });

  // 거절 뮤테이션 - 크레딧 환불 포함
  const rejectSurveyMutation = useMutation({
    mutationFn: async ({ surveyId, reason }) => {
      // 1. 설문 정보 가져오기
      const surveys = await Survey.filter({ id: surveyId });
      if (surveys.length === 0) throw new Error('설문을 찾을 수 없습니다.');
      const survey = surveys[0];

      // 2. 유저 정보 가져와서 크레딧 환불
      const users = await User.filter({ email: survey.created_by });
      if (users.length > 0) {
        const surveyOwner = users[0];
        const refundAmount = survey.total_cost || 0;

        if (refundAmount > 0) {
          // 크레딧 환불
          await User.update(surveyOwner.id, {
            credits: (surveyOwner.credits || 0) + refundAmount
          });

          // 환불 트랜잭션 기록
          await Payment.create({
            user_email: survey.created_by,
            amount: refundAmount,
            type: 'refund',
            status: 'confirmed',
            survey_id: surveyId
          });
        }
      }

      // 3. 설문 상태 업데이트
      await Survey.update(surveyId, {
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingSurveys']);
      queryClient.invalidateQueries(['reviewSurveys']);
      queryClient.invalidateQueries(['rejectedSurveys']);
      setRejectingSurvey(null);
      setRejectionReason("");
      alert('설문이 거절되었으며, 크레딧이 환불되었습니다.');
    },
    onError: (error) => {
      alert('거절 처리 중 오류가 발생했습니다: ' + error.message);
    }
  });

  // 입금 확인 mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async (surveyId) => {
      // 1. 해당 설문의 Payment 레코드 찾아서 상태 업데이트
      const payments = await Payment.filter({ survey_id: surveyId, type: 'deposit' });
      if (payments.length > 0) {
        await Payment.update(payments[0].id, { status: 'confirmed' });
      }

      // 2. Survey 테이블 업데이트 (pending일 때만 review로 변경)
      const surveys = await Survey.filter({ id: surveyId });
      if (surveys.length > 0 && surveys[0].status === 'pending') {
        await Survey.update(surveyId, {
          status: 'review',
          payment_status: 'paid'
        });
      } else {
        // pending이 아닌 경우 payment_status만 업데이트
        await Survey.update(surveyId, {
          payment_status: 'paid'
        });
      }
    },
    onSuccess: (_, surveyId) => {
      setSurveyPaymentConfirmed(prev => ({ ...prev, [surveyId]: true }));
      queryClient.invalidateQueries(['pendingSurveys']);
      queryClient.invalidateQueries(['reviewSurveys']);
      queryClient.invalidateQueries(['allCredits']); // AdminSettings 입금 관리 데이터 갱신
      setConfirmingPayment(null);
      alert('입금이 확인되었습니다. 설문이 검토중 상태로 변경되었습니다.');
    },
  });

  const deleteSurveyMutation = useMutation({
    mutationFn: async (surveyId) => {
      // Delete related payments first
      const payments = await Payment.filter({ survey_id: surveyId });
      await Promise.all(payments.map(p => Payment.delete(p.id)));

      // Delete related questions
      const questions = await Question.filter({ survey_id: surveyId });
      await Promise.all(questions.map(q => Question.delete(q.id)));

      // Delete related responses
      const responses = await Response.filter({ survey_id: surveyId });
      await Promise.all(responses.map(r => Response.delete(r.id)));

      // Finally delete the survey
      await Survey.delete(surveyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingSurveys']);
      queryClient.invalidateQueries(['reviewSurveys']);
      queryClient.invalidateQueries(['liveSurveys']);
      queryClient.invalidateQueries(['closedSurveys']);
      queryClient.invalidateQueries(['rejectedSurveys']);
      alert('설문조사가 삭제되었습니다.');
    },
    onError: (error) => {
      console.error('Delete failed:', error);
      alert('설문 삭제에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    },
  });

  const updateSurveyDetailsMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await Survey.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingSurveys']);
      queryClient.invalidateQueries(['reviewSurveys']);
      queryClient.invalidateQueries(['liveSurveys']);
      queryClient.invalidateQueries(['closedSurveys']);
      setEditingSurvey(null);
      alert('설문 정보가 수정되었습니다.');
    },
  });

  const openEditModal = (survey) => {
    setEditingSurvey(survey);
    setEditFormData({
      title: survey.title,
      description: survey.description,
      target_participants: survey.target_participants,
      total_cost: survey.total_cost
    });
  };

  if (userLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-white/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-white/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <Card className="p-8 text-center">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-lg text-gray-700">관리자 권한이 필요합니다</p>
      </Card>
    );
  }

  // scheduled 설문 분리
  const scheduledSurveys = liveSurveys.filter(s => s.status === 'scheduled');
  const activeLiveSurveys = liveSurveys.filter(s => s.status === 'live');

  // 검색 함수
  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 전체 설문 목록
  const allSurveys = [...pendingSurveys, ...reviewSurveys, ...scheduledSurveys, ...activeLiveSurveys, ...closedSurveys, ...rejectedSurveys];

  // 현재 탭에 따른 설문 목록
  const getBaseSurveys = () => {
    switch (activeTab) {
      case 'all': return allSurveys;
      case 'pending': return pendingSurveys;
      case 'review': return reviewSurveys;
      case 'scheduled': return scheduledSurveys;
      case 'live': return activeLiveSurveys;
      case 'closed': return closedSurveys;
      case 'rejected': return rejectedSurveys;
      default: return allSurveys;
    }
  };

  // 검색어로 필터링된 설문 목록
  const currentSurveys = getBaseSurveys().filter(survey =>
    !searchQuery || survey.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentImage = allImages[currentImageIndex];

  return (
    <div className="space-y-6 pb-20">
      {/* Reject Survey Modal */}
      {rejectingSurvey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
              <XCircle className="w-6 h-6" />
              설문 거절
            </h2>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="font-bold text-gray-800 mb-1">{rejectingSurvey.title}</div>
              <div className="text-sm text-gray-500">{rejectingSurvey.description}</div>
              <div className="mt-2 flex gap-2">
                <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                  {rejectingSurvey.total_cost?.toLocaleString()}원 환불 예정
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">
                거절 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="거절 사유를 입력해주세요. (고객에게 표시됩니다)"
                className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingSurvey(null);
                  setRejectionReason("");
                }}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    alert('거절 사유를 입력해주세요.');
                    return;
                  }
                  rejectSurveyMutation.mutate({
                    surveyId: rejectingSurvey.id,
                    reason: rejectionReason
                  });
                }}
                disabled={rejectSurveyMutation.isPending || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                {rejectSurveyMutation.isPending ? '처리중...' : '거절 및 환불'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Survey Modal */}
      {editingSurvey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800">설문 정보 수정</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">설문 제목</label>
                <Input
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">설문 설명</label>
                <Input
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">목표 참여자 수</label>
                  <Input
                    type="number"
                    value={editFormData.target_participants}
                    onChange={(e) => setEditFormData({ ...editFormData, target_participants: parseInt(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">총 비용 (크레딧)</label>
                  <Input
                    type="number"
                    value={editFormData.total_cost}
                    onChange={(e) => setEditFormData({ ...editFormData, total_cost: parseInt(e.target.value) || 0 })}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditingSurvey(null)}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                onClick={() => updateSurveyDetailsMutation.mutate({
                  id: editingSurvey.id,
                  data: editFormData
                })}
                disabled={updateSurveyDetailsMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                수정 완료
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {imageGalleryOpen && allImages.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 pb-24">
          <button
            onClick={() => setImageGalleryOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            ×
          </button>

          {currentImageIndex > 0 && (
            <button
              onClick={() => setCurrentImageIndex(prev => prev - 1)}
              className="absolute left-4 text-purple-400 text-4xl w-12 h-12 flex items-center justify-center rounded-full bg-purple-500/30 hover:bg-purple-500/50"
            >
              ‹
            </button>
          )}

          <div className="max-w-4xl w-full">
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={currentImage.url}
                alt={`이미지 ${currentImageIndex + 1}`}
                className="w-full h-[60vh] object-contain bg-gray-100"
              />
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-100 text-purple-700 border-0">
                    {currentImageIndex + 1} / {allImages.length}
                  </Badge>
                  <div className="flex gap-2">
                    <Badge className={currentImage.questionType === 'image_banner' ? 'bg-pink-100 text-pink-700 border-0' : 'bg-orange-100 text-orange-700 border-0'}>
                      {currentImage.questionType === 'image_banner' ? '이벤트배너' : `선택지 ${currentImage.imageNumber}`}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">설문조사</div>
                  <div className="font-bold text-lg text-gray-800">{currentImage.surveyTitle}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">질문 {currentImage.questionNumber}</div>
                  <div className="text-gray-700">{currentImage.questionText}</div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-gray-400">
                    ← → 키로 이동 | ESC로 닫기
                  </div>
                  {currentImageIndex === allImages.length - 1 && (
                    <Button
                      onClick={handleReviewComplete}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl px-4 py-2"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      이미지 검수 완료
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {currentImageIndex < allImages.length - 1 && (
            <button
              onClick={() => setCurrentImageIndex(prev => prev + 1)}
              className="absolute right-4 text-purple-400 text-4xl w-12 h-12 flex items-center justify-center rounded-full bg-purple-500/30 hover:bg-purple-500/50"
            >
              ›
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8" />
          <h1 className="text-2xl font-bold">주문 관리</h1>
        </div>
        <p className="text-indigo-50">설문조사 주문 관리 및 승인</p>
      </motion.div>

      {/* Filter and Search */}
      <div className="flex gap-3 items-center">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-40 rounded-xl bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 ({allSurveys.length})</SelectItem>
            <SelectItem value="pending">입금대기 ({pendingSurveys.length})</SelectItem>
            <SelectItem value="review">검토중 ({reviewSurveys.length})</SelectItem>
            <SelectItem value="scheduled">진행예정 ({scheduledSurveys.length})</SelectItem>
            <SelectItem value="live">진행중 ({activeLiveSurveys.length})</SelectItem>
            <SelectItem value="closed">종료 ({closedSurveys.length})</SelectItem>
            <SelectItem value="rejected">거절됨 ({rejectedSurveys.length})</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 flex gap-2">
          <Input
            placeholder="설문 제목 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="rounded-xl bg-white border-gray-200"
          />
          <Button
            onClick={handleSearch}
            variant="outline"
            className="rounded-xl border-gray-200 px-4"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Action Buttons - review 상태 설문이 있을 때 표시 */}
      {reviewSurveys.length > 0 && (
        <div className="flex gap-2 w-full">
          <Button
            onClick={handleBulkReview}
            disabled={downloadJsonMutation.isPending || reviewCompleted}
            className={`flex-1 min-w-0 ${reviewCompleted ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-500 to-pink-500'} text-white shadow-lg rounded-xl py-2 h-auto text-center flex-col`}
          >
            <FileSpreadsheet className="w-4 h-4 mb-1 flex-shrink-0" />
            <span>{downloadJsonMutation.isPending ? '처리 중...' : reviewCompleted ? <>검수 완료됨</> : <>설문 일괄<br />검수하기</>}</span>
          </Button>
          <Button
            onClick={() => {
              if (confirm(`${reviewSurveys.length}개의 설문을 모두 예약하시겠습니까?`)) {
                startAllReviewMutation.mutate();
              }
            }}
            disabled={startAllReviewMutation.isPending || !reviewCompleted}
            className={`flex-1 min-w-0 ${!reviewCompleted ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-indigo-500'} text-white shadow-lg rounded-xl py-2 h-auto text-center flex-col`}
          >
            <CheckCircle className="w-4 h-4 mb-1 flex-shrink-0" />
            <span>{startAllReviewMutation.isPending ? '예약 중...' : <>설문 일괄<br />예약하기</>}</span>
          </Button>
        </div>
      )}

      {/* Survey List */}
      <div className="space-y-3">
        {currentSurveys.length === 0 ? (
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardContent className="p-8 text-center text-gray-500">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>설문조사가 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          currentSurveys.map((survey, index) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white rounded-2xl shadow-sm border-0">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-800 mb-1">
                        {survey.title}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">{survey.description}</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={
                          survey.survey_type === 'free'
                            ? 'bg-emerald-100 text-emerald-700 border-0'
                            : 'bg-purple-100 text-purple-700 border-0'
                        }>
                          {survey.survey_type === 'free' ? '무료설문' : '타겟설문'}
                        </Badge>
                        <Badge className={
                          survey.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-0' :
                            survey.status === 'review' ? 'bg-orange-100 text-orange-700 border-0' :
                              survey.status === 'scheduled' ? 'bg-blue-100 text-blue-700 border-0' :
                                survey.status === 'live' ? 'bg-green-100 text-green-700 border-0' :
                                  survey.status === 'rejected' ? 'bg-red-100 text-red-700 border-0' :
                                    'bg-gray-100 text-gray-700 border-0'
                        }>
                          {survey.status === 'pending' ? '입금대기' :
                            survey.status === 'review' ? '검토중' :
                              survey.status === 'scheduled' ? '예약됨' :
                                survey.status === 'live' ? '진행중' :
                                  survey.status === 'rejected' ? '거절됨' : '종료'}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                          완료: {survey.completed_responses || 0}명
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-800 font-bold mb-1">
                    {survey.total_cost?.toLocaleString()}원
                  </div>
                  <div className="text-xs text-gray-500">
                    생성자: {survey.creator_name || 'Unknown'} ({survey.created_by || '-'})
                  </div>

                  <div className="text-xs text-gray-500">
                    생성일: {formatKST(survey.created_at)}
                  </div>
                  {survey.scheduled_start && (
                    <div className="text-xs text-gray-500">
                      설문 시작일: {formatKST(survey.scheduled_start)}
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700">
                      입금자명: <span className="font-bold">{surveyDepositors[survey.id] || '-'}</span>
                    </span>
                    <Button
                      onClick={() => {
                        if (confirm('입금을 확인하시겠습니까?')) {
                          confirmPaymentMutation.mutate(survey.id);
                        }
                      }}
                      disabled={confirmPaymentMutation.isPending || survey.payment_status === 'paid'}
                      size="sm"
                      className={`text-xs h-6 px-3 rounded-lg ${
                        survey.payment_status === 'paid'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {survey.payment_status === 'paid' ? '입금 완료' : '입금 확인'}
                    </Button>
                  </div>

                  {/* 거절 사유 표시 */}
                  {survey.status === 'rejected' && survey.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
                      <div className="text-xs font-bold text-red-700 mb-1">거절 사유</div>
                      <div className="text-sm text-red-600">{survey.rejection_reason}</div>
                      {survey.rejected_at && (
                        <div className="text-xs text-red-400 mt-1">
                          거절일시: {formatKST(survey.rejected_at)}
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSurveyExpand(survey.id)}
                    className="w-full text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    {expandedSurvey === survey.id ? '▲ 질문 숨기기' : '▼ 질문 및 이미지 보기'}
                  </Button>

                  {survey.status === 'review' && (
                    <Button
                      onClick={() => handleSingleSurveyReview(survey)}
                      disabled={downloadJsonMutation.isPending || surveyReviewCompleted[survey.id]}
                      className={`w-full ${surveyReviewCompleted[survey.id] ? 'bg-gray-400' : 'bg-gradient-to-r from-purple-500 to-pink-500'} text-white rounded-lg text-xs`}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-1" />
                      {downloadJsonMutation.isPending ? '처리 중...' : surveyReviewCompleted[survey.id] ? '검수 완료됨' : '설문 검수하기'}
                    </Button>
                  )}

                  {expandedSurvey === survey.id && surveyQuestions[survey.id] && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-96 overflow-y-auto">
                      {surveyQuestions[survey.id].map((question, qIdx) => (
                        <div key={question.id} className="bg-white rounded-lg p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                              Q{qIdx + 1}
                            </Badge>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-800 mb-1">
                                {question.question_text}
                              </div>
                              <Badge className={
                                question.question_type === 'multiple_choice' ? 'bg-blue-50 text-blue-600 border-0 text-xs' :
                                  question.question_type === 'multiple_select' ? 'bg-blue-50 text-blue-600 border-0 text-xs' :
                                    question.question_type === 'short_answer' ? 'bg-green-50 text-green-600 border-0 text-xs' :
                                      question.question_type === 'likert_scale' ? 'bg-indigo-50 text-indigo-600 border-0 text-xs' :
                                        question.question_type === 'numeric_rating' ? 'bg-yellow-50 text-yellow-600 border-0 text-xs' :
                                          question.question_type === 'ranking' ? 'bg-orange-50 text-orange-600 border-0 text-xs' :
                                            question.question_type === 'image_banner' ? 'bg-pink-50 text-pink-600 border-0 text-xs' :
                                              question.question_type === 'image_choice' ? 'bg-purple-50 text-purple-600 border-0 text-xs' :
                                                'bg-gray-50 text-gray-600 border-0 text-xs'
                              }>
                                {question.question_type === 'multiple_choice' ? '객관식' :
                                  question.question_type === 'multiple_select' ? '다중선택' :
                                    question.question_type === 'short_answer' ? '주관식' :
                                      question.question_type === 'likert_scale' ? '리커트척도' :
                                        question.question_type === 'numeric_rating' ? '수치평정' :
                                          question.question_type === 'ranking' ? '순위형' :
                                            question.question_type === 'image_banner' ? '이벤트배너' :
                                              question.question_type === 'image_choice' ? '이미지선택' : '기타'}
                              </Badge>
                            </div>
                          </div>

                          {(question.question_type === 'multiple_choice' ||
                            question.question_type === 'multiple_select' ||
                            question.question_type === 'ranking') && question.options && (
                              <div className="pl-8 space-y-1">
                                {question.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="text-xs text-gray-600">
                                    {optIdx + 1}. {typeof opt === 'string' ? opt : opt?.label || opt?.value || ''}
                                  </div>
                                ))}
                              </div>
                            )}

                          {question.question_type === 'likert_scale' && question.options && (
                            <div className="pl-8 flex flex-wrap gap-2">
                              {question.options.map((opt, optIdx) => (
                                <div key={optIdx} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">
                                  {optIdx + 1}: {typeof opt === 'string' ? opt : opt?.label || opt?.value || ''}
                                </div>
                              ))}
                            </div>
                          )}

                          {question.question_type === 'image_choice' && question.image_urls && (
                            <div className="pl-8 grid grid-cols-2 gap-2">
                              {question.image_urls.map((url, imgIdx) => (
                                <div key={imgIdx} className="relative">
                                  <img
                                    src={url}
                                    alt={`선택지 ${imgIdx + 1}`}
                                    className="w-full aspect-square object-cover rounded-lg border-2 border-purple-200"
                                  />
                                  <div className="absolute top-1 left-1 bg-purple-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                                    선택지 {imgIdx + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.question_type === 'image_banner' && question.image_urls && question.image_urls.length > 0 && (
                            <div className="pl-8">
                              <div className="relative w-full max-w-xs">
                                <img
                                  src={question.image_urls[0]}
                                  alt="이벤트 배너"
                                  className="w-full aspect-square object-cover rounded-lg border-2 border-pink-200"
                                />
                                <div className="absolute top-1 left-1 bg-pink-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                                  이벤트배너
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}


                  {survey.status === 'review' && (
                    <div className="flex gap-2">
                      {survey.scheduled_start && (
                        <Button
                          onClick={() => {
                            if (confirm(`${formatKST(survey.scheduled_start)}에 설문을 시작 예약하시겠습니까?`)) {
                              startSurveyMutation.mutate({
                                surveyId: survey.id,
                                startTime: survey.scheduled_start
                              });
                            }
                          }}
                          disabled={startSurveyMutation.isPending || !surveyReviewCompleted[survey.id]}
                          className={`flex-1 ${!surveyReviewCompleted[survey.id] ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-xl text-sm`}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          시작 예약
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          if (confirm('설문을 즉시 시작하시겠습니까?')) {
                            startSurveyMutation.mutate({
                              surveyId: survey.id,
                              startTime: null
                            });
                          }
                        }}
                        disabled={startSurveyMutation.isPending || !surveyReviewCompleted[survey.id]}
                        className={`flex-1 ${!surveyReviewCompleted[survey.id] ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white rounded-xl text-sm`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        즉시 시작
                      </Button>
                      <Button
                        onClick={() => {
                          setRejectingSurvey(survey);
                          setRejectionReason("");
                        }}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        거절
                      </Button>
                    </div>
                  )}

                  {activeTab === 'live' && survey.status === 'live' && (
                    <Button
                      onClick={() => {
                        if (confirm('정말 이 설문을 종료하시겠습니까?')) {
                          closeSurveyMutation.mutate(survey.id);
                        }
                      }}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      설문 종료
                    </Button>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1 text-xs">
                      <a
                        href={`${window.location.origin}/TakeSurvey?key=${survey.secret_key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        설문 링크
                      </a>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">코드: {survey.completion_secret_code}</span>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(survey.completion_secret_code);
                              alert('시크릿 코드가 복사되었습니다.');
                            } catch (err) {
                              alert('시크릿 코드가 복사되었습니다.');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => openEditModal(survey)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm('정말 이 설문조사를 삭제하시겠습니까?\n질문, 응답 등 모든 데이터가 삭제됩니다.')) {
                            deleteSurveyMutation.mutate(survey.id);
                          }
                        }}
                        disabled={deleteSurveyMutation.isPending}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}