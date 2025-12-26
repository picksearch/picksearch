import React, { useState } from "react";
import { auth } from "@/api/auth";
import { Survey, Question, Response, CreditTransaction, User } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Download, CheckCircle, XCircle, Clock, Calendar, FileSpreadsheet, ExternalLink, Trash2, Edit, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function OrderManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [scheduleTimes, setScheduleTimes] = useState({});
  const [expandedSurvey, setExpandedSurvey] = useState(null);
  const [surveyQuestions, setSurveyQuestions] = useState({});
  const [surveyDepositors, setSurveyDepositors] = useState({});
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);

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
    queryFn: () => Survey.filter({ status: 'pending_media' }, '-created_date'),
    refetchInterval: false,
    staleTime: 60000,
    cacheTime: Infinity,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

  const { data: reviewSurveys = [] } = useQuery({
    queryKey: ['reviewSurveys'],
    queryFn: () => Survey.filter({ status: 'media_review' }, '-created_date'),
    refetchInterval: false,
    staleTime: 60000,
    cacheTime: Infinity,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

  const { data: liveSurveys = [] } = useQuery({
    queryKey: ['liveSurveys'],
    queryFn: async () => {
      const live = await Survey.filter({ status: 'live' }, '-created_date');
      const scheduled = await Survey.filter({ status: 'scheduled' }, '-created_date');
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
    queryFn: () => Survey.filter({ status: 'closed' }, '-created_date'),
    refetchInterval: false,
    staleTime: 60000,
    cacheTime: Infinity,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

  const { data: rejectedSurveys = [] } = useQuery({
    queryKey: ['rejectedSurveys'],
    queryFn: () => Survey.filter({ status: 'rejected' }, '-created_date'),
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
      const transactions = await CreditTransaction.filter({ survey_id: surveyId, type: 'deposit' }, '-created_date');
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
            const transactions = await CreditTransaction.filter({ survey_id: survey.id, type: 'deposit' }, '-created_date');
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

  const openImageGallery = async () => {
    const imagesData = [];
    
    if (!reviewSurveys || reviewSurveys.length === 0) {
      alert('검토할 이미지가 없습니다.');
      return;
    }

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

  const downloadExcelMutation = useMutation({
    mutationFn: async (surveys) => {
      const surveysWithQuestions = await Promise.all(
        surveys.map(async (survey) => {
          const questions = await Question.filter({ survey_id: survey.id }, 'order');
          return { ...survey, questions };
        })
      );

      let csvContent = '\uFEFF';
      // Updated Header with all required fields
      csvContent += '티어,제목,설명,설문목적,질문만든사람,타겟/상세타겟,이벤트페이지,설문URL,시크릿코드,시작일,종료일,질문번호,질문유형,질문내용,선택지/이미지URL\n';
      
      surveysWithQuestions.forEach(survey => {
        const surveyUrl = `${window.location.origin}/TakeSurvey?key=${survey.secret_key}`;
        const landingUrl = survey.use_landing_page ? (survey.landing_page_url || '') : '';
        const creatorName = survey.creator_name || survey.created_by || 'Unknown';
        
        // Format Target
        let targetInfo = survey.target_persona || '';
        if (survey.target_settings) {
          try {
            const settings = typeof survey.target_settings === 'string' ? JSON.parse(survey.target_settings) : survey.target_settings;
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

        const startDate = survey.start_date || '';
        const endDate = survey.end_date || '';
        
        survey.questions.forEach((question, qIdx) => {
          const questionType = question.question_type === 'multiple_choice' ? '객관식' : 
                              question.question_type === 'short_answer' ? '주관식' : 
                              question.question_type === 'numeric_rating' ? '수치평정' :
                              question.question_type === 'likert_scale' ? '리커트척도' :
                              question.question_type === 'ranking' ? '순위형' :
                              question.question_type === 'image_choice' ? '이미지선택' :
                              question.question_type === 'image_banner' ? '이미지배너' : '기타';
          
          let options = '';
          if (question.question_type === 'image_choice' || question.question_type === 'image_banner') {
            options = question.image_urls?.map((url, idx) => `이미지${idx + 1}: ${url}`).join(' | ') || '없음';
          } else {
            options = question.options?.join(' | ') || '없음';
          }
          
          // Escape quotes in text fields
          const safeTitle = (survey.title || '').replace(/"/g, '""');
          const safeDesc = (survey.description || '').replace(/"/g, '""');
          const safePurpose = (survey.purpose || '').replace(/"/g, '""');
          const safeCreator = creatorName.replace(/"/g, '""');
          const safeTarget = targetInfo.replace(/"/g, '""');
          const safeQText = (question.question_text || '').replace(/"/g, '""');
          const safeOptions = options.replace(/"/g, '""');

          csvContent += `"${survey.survey_type}","${safeTitle}","${safeDesc}","${safePurpose}","${safeCreator}","${safeTarget}","${landingUrl}","${surveyUrl}","${survey.completion_secret_code}","${startDate}","${endDate}",${qIdx + 1},"${questionType}","${safeQText}","${safeOptions}"\n`;
        });
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `설문조사_목록_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      link.click();

      await Promise.all(
        surveys.map(survey =>
          Survey.update(survey.id, {
            status: 'media_review',
            exported_at: new Date().toISOString()
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingSurveys']);
      queryClient.invalidateQueries(['reviewSurveys']);
      alert('엑셀 다운로드가 완료되었습니다. 설문이 검토 대기 상태로 변경되었습니다.');
    },
  });

  const startSurveyMutation = useMutation({
    mutationFn: async ({ surveyId, startTime }) => {
      await Survey.update(surveyId, {
        status: startTime ? 'scheduled' : 'live',
        scheduled_start_time: startTime || null
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
            status: 'live'
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviewSurveys']);
      queryClient.invalidateQueries(['liveSurveys']);
      alert(`${reviewSurveys.length}개의 설문이 일괄 시작되었습니다!`);
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
          await CreditTransaction.create({
            user_email: survey.created_by,
            amount: refundAmount,
            type: 'refund',
            status: 'confirmed',
            survey_id: surveyId,
            description: `설문 거절 환불: ${survey.title} (사유: ${reason})`
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

  const deleteSurveyMutation = useMutation({
    mutationFn: async (surveyId) => {
      const questions = await Question.filter({ survey_id: surveyId });
      await Promise.all(questions.map(q => Question.delete(q.id)));

      const responses = await Response.filter({ survey_id: surveyId });
      await Promise.all(responses.map(r => Response.delete(r.id)));

      await Survey.delete(surveyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingSurveys']);
      queryClient.invalidateQueries(['reviewSurveys']);
      queryClient.invalidateQueries(['liveSurveys']);
      queryClient.invalidateQueries(['closedSurveys']);
      alert('설문조사가 삭제되었습니다.');
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

  const currentSurveys = 
    activeTab === 'pending' ? pendingSurveys :
    activeTab === 'review' ? reviewSurveys :
    activeTab === 'live' ? liveSurveys :
    activeTab === 'rejected' ? rejectedSurveys :
    closedSurveys;

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
                  onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">설문 설명</label>
                <Input 
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">목표 참여자 수</label>
                  <Input 
                    type="number"
                    value={editFormData.target_participants}
                    onChange={(e) => setEditFormData({...editFormData, target_participants: parseInt(e.target.value) || 0})}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">총 비용 (크레딧)</label>
                  <Input 
                    type="number"
                    value={editFormData.total_cost}
                    onChange={(e) => setEditFormData({...editFormData, total_cost: parseInt(e.target.value) || 0})}
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
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setImageGalleryOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            ×
          </button>

          <button
            onClick={() => setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length)}
            className="absolute left-4 text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            ‹
          </button>

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
                <div className="text-xs text-gray-400 pt-2 border-t">
                  ← → 키로 이동 | ESC로 닫기
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCurrentImageIndex(prev => (prev + 1) % allImages.length)}
            className="absolute right-4 text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            ›
          </button>
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

      {/* Stats - Now clickable */}
      <div className="grid grid-cols-5 gap-2">
        <Card 
          onClick={() => setActiveTab('pending')}
          className={`bg-white rounded-2xl shadow-sm border-2 cursor-pointer transition-all ${
            activeTab === 'pending' ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-transparent hover:border-yellow-200'
          }`}
        >
          <CardContent className="p-3 text-center">
            <Clock className={`w-5 h-5 mx-auto mb-1 ${activeTab === 'pending' ? 'text-yellow-600' : 'text-yellow-500'}`} />
            <div className="text-xl font-bold text-gray-800">{pendingSurveys.length}</div>
            <div className="text-xs text-gray-500">설문대기</div>
          </CardContent>
        </Card>
        <Card 
          onClick={() => setActiveTab('review')}
          className={`bg-white rounded-2xl shadow-sm border-2 cursor-pointer transition-all ${
            activeTab === 'review' ? 'border-orange-400 ring-2 ring-orange-100' : 'border-transparent hover:border-orange-200'
          }`}
        >
          <CardContent className="p-3 text-center">
            <FileSpreadsheet className={`w-5 h-5 mx-auto mb-1 ${activeTab === 'review' ? 'text-orange-600' : 'text-orange-500'}`} />
            <div className="text-xl font-bold text-gray-800">{reviewSurveys.length}</div>
            <div className="text-xs text-gray-500">검토중</div>
          </CardContent>
        </Card>
        <Card 
          onClick={() => setActiveTab('live')}
          className={`bg-white rounded-2xl shadow-sm border-2 cursor-pointer transition-all ${
            activeTab === 'live' ? 'border-green-400 ring-2 ring-green-100' : 'border-transparent hover:border-green-200'
          }`}
        >
          <CardContent className="p-3 text-center">
            <CheckCircle className={`w-5 h-5 mx-auto mb-1 ${activeTab === 'live' ? 'text-green-600' : 'text-green-500'}`} />
            <div className="text-xl font-bold text-gray-800">{liveSurveys.length}</div>
            <div className="text-xs text-gray-500">진행중</div>
          </CardContent>
        </Card>
        <Card 
          onClick={() => setActiveTab('closed')}
          className={`bg-white rounded-2xl shadow-sm border-2 cursor-pointer transition-all ${
            activeTab === 'closed' ? 'border-gray-400 ring-2 ring-gray-100' : 'border-transparent hover:border-gray-200'
          }`}
        >
          <CardContent className="p-3 text-center">
            <CheckCircle className={`w-5 h-5 mx-auto mb-1 ${activeTab === 'closed' ? 'text-gray-600' : 'text-gray-500'}`} />
            <div className="text-xl font-bold text-gray-800">{closedSurveys.length}</div>
            <div className="text-xs text-gray-500">종료</div>
          </CardContent>
        </Card>
        <Card 
          onClick={() => setActiveTab('rejected')}
          className={`bg-white rounded-2xl shadow-sm border-2 cursor-pointer transition-all ${
            activeTab === 'rejected' ? 'border-red-400 ring-2 ring-red-100' : 'border-transparent hover:border-red-200'
          }`}
        >
          <CardContent className="p-3 text-center">
            <XCircle className={`w-5 h-5 mx-auto mb-1 ${activeTab === 'rejected' ? 'text-red-600' : 'text-red-500'}`} />
            <div className="text-xl font-bold text-gray-800">{rejectedSurveys.length}</div>
            <div className="text-xs text-gray-500">거절</div>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'pending' && pendingSurveys.length > 0 && (
        <Button
          onClick={() => downloadExcelMutation.mutate(pendingSurveys)}
          disabled={downloadExcelMutation.isPending}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg rounded-xl h-12"
        >
          <Download className="w-5 h-5 mr-2" />
          {downloadExcelMutation.isPending ? '다운로드 중...' : `전체 엑셀 다운로드 (${pendingSurveys.length}건)`}
        </Button>
      )}

      {activeTab === 'review' && reviewSurveys.length > 0 && (
        <div className="space-y-2">
          <Button
            onClick={openImageGallery}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg rounded-xl h-12"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            이미지 검수하기
          </Button>
          <Button
            onClick={() => {
              if (confirm(`${reviewSurveys.length}개의 설문을 모두 시작하시겠습니까?`)) {
                startAllReviewMutation.mutate();
              }
            }}
            disabled={startAllReviewMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg rounded-xl h-12"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {startAllReviewMutation.isPending ? '시작 중...' : `검토중인 설문 전체 시작 (${reviewSurveys.length}건)`}
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
                          survey.status === 'pending_media' ? 'bg-yellow-100 text-yellow-700 border-0' :
                          survey.status === 'media_review' ? 'bg-orange-100 text-orange-700 border-0' :
                          survey.status === 'scheduled' ? 'bg-blue-100 text-blue-700 border-0' :
                          survey.status === 'live' ? 'bg-green-100 text-green-700 border-0' :
                          survey.status === 'rejected' ? 'bg-red-100 text-red-700 border-0' :
                          'bg-gray-100 text-gray-700 border-0'
                        }>
                          {survey.status === 'pending_media' ? '설문대기' :
                          survey.status === 'media_review' ? '검토중' :
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
                    생성일: {format(new Date(survey.created_date), 'yyyy.MM.dd HH:mm')}
                  </div>

                  {surveyDepositors[survey.id] && (
                    <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                      <span className="text-xs font-medium text-blue-700">
                        입금자명: <span className="font-bold">{surveyDepositors[survey.id]}</span>
                      </span>
                    </div>
                  )}

                  {/* 거절 사유 표시 */}
                  {survey.status === 'rejected' && survey.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
                      <div className="text-xs font-bold text-red-700 mb-1">거절 사유</div>
                      <div className="text-sm text-red-600">{survey.rejection_reason}</div>
                      {survey.rejected_at && (
                        <div className="text-xs text-red-400 mt-1">
                          거절일시: {format(new Date(survey.rejected_at), 'yyyy.MM.dd HH:mm')}
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
                                question.question_type === 'short_answer' ? 'bg-green-50 text-green-600 border-0 text-xs' :
                                question.question_type === 'image_banner' ? 'bg-pink-50 text-pink-600 border-0 text-xs' :
                                'bg-purple-50 text-purple-600 border-0 text-xs'
                              }>
                                {question.question_type === 'multiple_choice' ? '객관식' :
                                question.question_type === 'short_answer' ? '주관식' :
                                question.question_type === 'image_banner' ? '이벤트배너' : '이미지선택'}
                              </Badge>
                            </div>
                          </div>
                          
                          {question.question_type === 'multiple_choice' && question.options && (
                            <div className="pl-8 space-y-1">
                              {question.options.map((opt, optIdx) => (
                                <div key={optIdx} className="text-xs text-gray-600">
                                  {optIdx + 1}. {opt}
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

                  {survey.scheduled_start_time && (
                    <div className="bg-blue-50 rounded-lg p-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        예약 시작: {format(new Date(survey.scheduled_start_time), 'yyyy.MM.dd HH:mm')}
                      </span>
                    </div>
                  )}

                  {activeTab === 'review' && (
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <Input
                          type="datetime-local"
                          value={scheduleTimes[survey.id] || ''}
                          onChange={(e) => setScheduleTimes({...scheduleTimes, [survey.id]: e.target.value})}
                          className="flex-1 text-sm rounded-xl"
                          placeholder="시작 시간 (선택)"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => startSurveyMutation.mutate({ 
                            surveyId: survey.id, 
                            startTime: scheduleTimes[survey.id] ? new Date(scheduleTimes[survey.id]).toISOString() : null 
                          })}
                          disabled={startSurveyMutation.isPending}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {scheduleTimes[survey.id] ? '예약 시작' : '즉시 시작'}
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