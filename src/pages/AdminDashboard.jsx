
import React, { useState } from "react";
import { auth } from "@/api/auth";
import { Survey, Question, Payment } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Download, CheckCircle, XCircle, Clock, Calendar, FileSpreadsheet, ExternalLink, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { formatKST } from "@/utils";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [scheduleTimes, setScheduleTimes] = useState({});
  const [expandedSurvey, setExpandedSurvey] = useState(null);
  const [surveyQuestions, setSurveyQuestions] = useState({});
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState([]);

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

  const { data: pendingCredits = [] } = useQuery({
    queryKey: ['pendingCredits'],
    queryFn: () => Payment.filter({ status: 'pending' }, 'created_at', false),
    refetchInterval: false,
    staleTime: 60000,
    cacheTime: Infinity,
    refetchOnWindowFocus: true,
    keepPreviousData: true,
  });

  const approveCreditMutation = useMutation({
    mutationFn: async (transaction) => {
      // 거래 상태 업데이트
      await Payment.update(transaction.id, {
        status: 'confirmed'
      });

      // 사용자 크레딧 증가
      const users = await User.filter({ email: transaction.user_email });
      if (users.length > 0) {
        const currentUser = users[0];
        await User.update(currentUser.id, {
          credits: (currentUser.credits || 0) + transaction.amount
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingCredits']);
      alert('크레딧 충전이 승인되었습니다.');
    },
    onError: (error) => {
      alert('승인 중 오류가 발생했습니다: ' + error.message);
    }
  });

  const rejectCreditMutation = useMutation({
    mutationFn: async (transactionId) => {
      await Payment.update(transactionId, {
        status: 'rejected'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingCredits']);
      alert('크레딧 충전이 거절되었습니다.');
    }
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

  const toggleSurveyExpand = (surveyId) => {
    if (expandedSurvey === surveyId) {
      setExpandedSurvey(null);
    } else {
      setExpandedSurvey(surveyId);
      loadSurveyQuestions(surveyId);
    }
  };

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
              imageNumber: imgIdx + 1
            });
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
      csvContent += '설문조사 제목,설문조사 URL,시크릿 코드,질문번호,질문유형,질문내용,선택지/이미지URL\n';

      surveysWithQuestions.forEach(survey => {
        const surveyUrl = `${window.location.origin}/TakeSurvey?key=${survey.secret_key}`;
        survey.questions.forEach((question, qIdx) => {
          const questionType = question.question_type === 'multiple_choice' ? '객관식' :
            question.question_type === 'short_answer' ? '주관식' : '이미지선택';

          let options = '';
          if (question.question_type === 'image_choice') {
            options = question.image_urls?.map((url, idx) => `이미지${idx + 1}: ${url}`).join(' | ') || '없음';
          } else {
            options = question.options?.join(' | ') || '없음';
          }

          csvContent += `"${survey.title}","${surveyUrl}","${survey.completion_secret_code}",${qIdx + 1},"${questionType}","${question.question_text}","${options}"\n`;
        });
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `설문조사_목록_${formatKST(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
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
      alert('엑셀 다운로드가 완료되었습니다. 설문이 검토 대기 상태로 변경되었습니다.');
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
            status: 'live',
            scheduled_start: new Date().toISOString()
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
          activeTab === 'closed' ? closedSurveys :
            null; // For 'credit' tab, currentSurveys will be null

  const currentImage = allImages[currentImageIndex];

  return (
    <div className="space-y-6 pb-20">
      {/* Image Gallery Modal */}
      {imageGalleryOpen && allImages.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setImageGalleryOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            ×
          </button>

          {/* 좌측 화살표 */}
          <button
            onClick={() => setCurrentImageIndex(prev => (prev - 1 + allImages.length) % allImages.length)}
            className="absolute left-4 text-white text-4xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            ‹
          </button>

          {/* 이미지 및 정보 */}
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
                  <Badge className="bg-orange-100 text-orange-700 border-0">
                    선택지 {currentImage.imageNumber}
                  </Badge>
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

          {/* 우측 화살표 */}
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
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        </div>
        <p className="text-indigo-50">설문조사 및 크레딧 관리</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2">
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-800">{pendingSurveys.length}</div>
            <div className="text-xs text-gray-500">설문대기</div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardContent className="p-3 text-center">
            <FileSpreadsheet className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-800">{reviewSurveys.length}</div>
            <div className="text-xs text-gray-500">검토중</div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardContent className="p-3 text-center">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-800">{liveSurveys.length}</div>
            <div className="text-xs text-gray-500">진행중</div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardContent className="p-3 text-center">
            <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-800">{closedSurveys.length}</div>
            <div className="text-xs text-gray-500">종료</div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardContent className="p-3 text-center">
            <Coins className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-800">{pendingCredits.length}</div>
            <div className="text-xs text-gray-500">충전대기</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pending')}
          className={`rounded-xl whitespace-nowrap ${activeTab === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}
        >
          설문대기 ({pendingSurveys.length})
        </Button>
        <Button
          variant={activeTab === 'review' ? 'default' : 'outline'}
          onClick={() => setActiveTab('review')}
          className={`rounded-xl whitespace-nowrap ${activeTab === 'review' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
        >
          검토중 ({reviewSurveys.length})
        </Button>
        <Button
          variant={activeTab === 'live' ? 'default' : 'outline'}
          onClick={() => setActiveTab('live')}
          className={`rounded-xl whitespace-nowrap ${activeTab === 'live' ? 'bg-green-500 hover:bg-green-600' : ''}`}
        >
          진행중 ({liveSurveys.length})
        </Button>
        <Button
          variant={activeTab === 'closed' ? 'default' : 'outline'}
          onClick={() => setActiveTab('closed')}
          className={`rounded-xl whitespace-nowrap ${activeTab === 'closed' ? 'bg-red-500 hover:bg-red-600' : ''}`}
        >
          종료 ({closedSurveys.length})
        </Button>
        <Button
          variant={activeTab === 'credit' ? 'default' : 'outline'}
          onClick={() => setActiveTab('credit')}
          className={`rounded-xl whitespace-nowrap ${activeTab === 'credit' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
        >
          <Coins className="w-4 h-4 mr-1" />
          충전관리 ({pendingCredits.length})
        </Button>
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

      {/* Credit Management */}
      {activeTab === 'credit' && (
        <div className="space-y-3">
          {pendingCredits.length === 0 ? (
            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardContent className="p-8 text-center text-gray-500">
                <Coins className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>대기중인 충전 요청이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            pendingCredits.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white rounded-2xl shadow-sm border-0">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-800 mb-1">
                          {transaction.amount.toLocaleString()}원 충전 요청
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {transaction.user_email}
                        </div>
                        <div className="text-xs text-gray-500">
                          요청일: {formatKST(transaction.created_at)}
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700 border-0">
                        <Clock className="w-3 h-3 mr-1" />
                        대기중
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (confirm(`${transaction.user_email}님의 ${transaction.amount.toLocaleString()}원 충전을 승인하시겠습니까?`)) {
                            approveCreditMutation.mutate(transaction);
                          }
                        }}
                        disabled={approveCreditMutation.isPending}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        승인
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm('정말 이 충전 요청을 거절하시겠습니까?')) {
                            rejectCreditMutation.mutate(transaction.id);
                          }
                        }}
                        disabled={rejectCreditMutation.isPending}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        거절
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Survey List */}
      {activeTab !== 'credit' && (
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
                          <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                            목표: {survey.target_participants}명
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                            완료: {survey.completed_responses || 0}명
                          </Badge>
                          <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                            {survey.total_cost?.toLocaleString()}원
                          </Badge>
                        </div>
                      </div>
                      <Badge className={
                        survey.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-0' :
                          survey.status === 'review' ? 'bg-orange-100 text-orange-700 border-0' :
                            survey.status === 'scheduled' ? 'bg-blue-100 text-blue-700 border-0' :
                              survey.status === 'live' ? 'bg-green-100 text-green-700 border-0' :
                                'bg-red-100 text-red-700 border-0'
                      }>
                        {survey.status === 'pending' ? '설문대기' :
                          survey.status === 'review' ? '검토중' :
                            survey.status === 'scheduled' ? '예약됨' :
                              survey.status === 'live' ? '진행중' : '종료'}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-500">
                      생성일: {formatKST(survey.created_at)}
                    </div>

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
                                      'bg-purple-50 text-purple-600 border-0 text-xs'
                                }>
                                  {question.question_type === 'multiple_choice' ? '객관식' :
                                    question.question_type === 'short_answer' ? '주관식' : '이미지선택'}
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
                          </div>
                        ))}
                      </div>
                    )}

                    {survey.scheduled_start && (
                      <div className="bg-blue-50 rounded-lg p-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          예약 시작: {formatKST(survey.scheduled_start)}
                        </span>
                      </div>
                    )}

                    {activeTab === 'review' && (
                      <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                          <Input
                            type="datetime-local"
                            value={scheduleTimes[survey.id] || ''}
                            onChange={(e) => setScheduleTimes({ ...scheduleTimes, [survey.id]: e.target.value })}
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
                              if (confirm('정말 이 설문을 종료하시겠습니까?')) {
                                closeSurveyMutation.mutate(survey.id);
                              }
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

                    <div className="flex gap-2 text-xs">
                      <a
                        href={`${window.location.origin}/TakeSurvey?key=${survey.secret_key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        설문 링크
                      </a>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">코드: {survey.completion_secret_code}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
