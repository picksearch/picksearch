import React from "react";
import { auth } from "@/api/auth";
import { Survey, Question, Response } from "@/api/entities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl, formatKST } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, CheckCircle, Clock, BarChart3, MessageSquare, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function SurveyDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get('id');

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => auth.me(),
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Redirect logic removed to allow public access
  /* 
  React.useEffect(() => {
    if (!userLoading && (userError || !user)) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
    }
  }, [user, userLoading, userError]);
  */

  const { data: survey, isLoading: surveyLoading, error: surveyError } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const surveys = await Survey.filter({ id: surveyId });
      return surveys[0] || null;
    },
    enabled: !!surveyId,
    staleTime: 60000,
    cacheTime: Infinity,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    keepPreviousData: true,
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['questions', surveyId],
    queryFn: async () => {
      const qs = await Question.filter({ survey_id: surveyId }, 'order');
      return qs;
    },
    enabled: !!surveyId,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const { data: allResponses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ['responses', surveyId],
    queryFn: async () => {
      // Fetch with high limit to ensure we get all responses (including completed ones buried in abandoned ones)
      const rs = await Response.filter({ survey_id: surveyId }, 'created_at', false);
      return rs;
    },
    enabled: !!surveyId,
    staleTime: 60000,
    cacheTime: Infinity,
    refetchOnWindowFocus: true,
    refetchInterval: false,
    keepPreviousData: true,
  });

  const responses = allResponses.filter(r => r.status === 'completed');

  // Survey의 completed_responses를 실제 응답 수와 동기화 (데이터 정합성 보장 - Self-healing)
  React.useEffect(() => {
    if (survey && responses.length > 0 && survey.completed_responses !== responses.length) {
      console.log(`[Self-Healing] Syncing count: ${survey.completed_responses} -> ${responses.length}`);
      
      Survey.update(survey.id, {
        completed_responses: responses.length
      }).then(() => {
        // 업데이트 후 캐시 무효화로 즉시 UI 반영 및 다른 페이지(ClientHome) 싱크 맞춤
        queryClient.invalidateQueries(['survey', surveyId]);
        queryClient.invalidateQueries(['mySurveys']); 
        queryClient.invalidateQueries(['userSurveys']);
      }).catch(err => console.error('Survey update failed:', err));
    }
  }, [survey, responses.length]);

  React.useEffect(() => {
    console.log('=== 🔍 SurveyDetail Debug Info ===');
    console.log('Survey ID:', surveyId);
    console.log('Survey:', survey);
    console.log('All Responses:', allResponses);
    console.log('Completed Responses (filtered):', responses);
    console.log('Questions:', questions);
    console.log('Loading states:', { userLoading, surveyLoading, questionsLoading, responsesLoading });
    
    if (responses.length > 0) {
      console.log('📋 첫 번째 응답 상세:');
      console.log('  - ID:', responses[0].id);
      console.log('  - Status:', responses[0].status);
      console.log('  - Answers:', responses[0].answers);
      console.log('  - Answers 타입:', typeof responses[0].answers, Array.isArray(responses[0].answers));
      
      if (questions.length > 0) {
        console.log('📝 모든 질문과 답변 매칭:');
        questions.forEach((q, idx) => {
          console.log(`  질문 ${idx + 1}: ${q.question_text} (ID: ${q.id})`);
          const answersForQ = responses[0].answers?.filter(a => String(a.question_id) === String(q.id));
          console.log(`    이 질문의 답변:`, answersForQ);
        });
      }
    }
    console.log('==================================');
  }, [surveyId, survey, questions, allResponses, responses, userLoading, surveyLoading, questionsLoading, responsesLoading]);

  if (!surveyId) {
    return (
      <div className="space-y-4">
        <Card className="p-8 text-center">
          <p className="text-gray-700">설문 ID가 없습니다</p>
          <Button onClick={() => navigate(createPageUrl('ClientHome'))} className="mt-4">
            홈으로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  if (userLoading || surveyLoading || questionsLoading || responsesLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-white/50 rounded-2xl animate-pulse" />
        <div className="h-64 bg-white/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // User check removed to allow public access
  /*
  if (!user) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-white/50 rounded-2xl animate-pulse" />
      </div>
    );
  }
  */

  if (surveyError || !survey) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-700">설문조사를 찾을 수 없습니다</p>
        <Button onClick={() => navigate(createPageUrl('ClientHome'))} className="mt-4">
          홈으로 돌아가기
        </Button>
      </Card>
    );
  }

  const actualCompletedCount = responses.length;
  const progressPercentage = survey.target_participants 
    ? (actualCompletedCount / survey.target_participants) * 100 
    : 0;

  const getAnswersByQuestion = (questionId) => {
    const answers = responses.map(r => {
      if (!r.answers || !Array.isArray(r.answers)) {
        console.warn('응답의 answers가 배열이 아님:', r);
        return '';
      }
      
      const answer = r.answers.find(a => String(a.question_id) === String(questionId));
      return answer?.answer || '';
    }).filter(a => a);
    
    return answers;
  };

  const getMultipleChoiceStats = (questionId, options) => {
    const answers = getAnswersByQuestion(questionId);
    return options.map(option => ({
      option,
      count: answers.filter(a => a === option).length,
      percentage: answers.length > 0 ? (answers.filter(a => a === option).length / answers.length) * 100 : 0
    }));
  };

  const getMultipleSelectStats = (questionId, options) => {
    const answers = getAnswersByQuestion(questionId);
    console.log(`다중선택 ${questionId} 답변:`, answers);
    return options.map(option => {
      const count = answers.filter(a => {
        const selectedOptions = a.split(', ').map(s => s.trim());
        return selectedOptions.includes(option);
      }).length;
      return {
        option,
        count,
        percentage: answers.length > 0 ? (count / answers.length) * 100 : 0
      };
    });
  };

  const getRankingAnalysis = (questionId, options) => {
    const answers = getAnswersByQuestion(questionId);
    
    // 1. 항목별 1위/꼴찌 통계
    const stats = options.map(option => {
      let firstCount = 0;
      let lastCount = 0;
      
      answers.forEach(a => {
        try {
          const rankings = JSON.parse(a); // {"A":1, "B":2} 형태
          // 현재 옵션의 순위 찾기
          const myRank = rankings[option];
          
          // 전체 순위 개수 (꼴찌 찾기용)
          const totalRanks = Object.keys(rankings).length;
          
          if (myRank === 1) firstCount++;
          if (myRank === totalRanks) lastCount++;
        } catch (e) {
          console.error('Ranking parse error', e);
        }
      });

      return {
        option,
        firstCount,
        firstPercentage: answers.length > 0 ? (firstCount / answers.length) * 100 : 0,
        lastCount,
        lastPercentage: answers.length > 0 ? (lastCount / answers.length) * 100 : 0
      };
    });

    // 2. 개별 응답 포맷팅 (A > B > C 형태)
    const individualResponses = answers.map(a => {
      try {
        const rankings = JSON.parse(a);
        // 순위(value)로 정렬하여 항목명(key) 추출
        return Object.entries(rankings)
          .sort(([, rankA], [, rankB]) => rankA - rankB)
          .map(([option]) => option)
          .join(' > ');
      } catch (e) {
        return a;
      }
    });

    return { stats, individualResponses };
  };

  const getNumericDistribution = (questionId) => {
    const answers = getAnswersByQuestion(questionId);
    const total = answers.length;
    const distribution = Array(11).fill(0); // 0~10점

    answers.forEach(a => {
      const val = parseInt(a);
      if (!isNaN(val) && val >= 0 && val <= 10) {
        distribution[val]++;
      }
    });

    return distribution.map((count, score) => ({
      score,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  };

  const getLikertDistribution = (questionId) => {
    const answers = getAnswersByQuestion(questionId);
    const total = answers.length;
    const distribution = Array(6).fill(0); // 1~5점 (인덱스 1~5 사용)

    answers.forEach(a => {
      const val = parseInt(a);
      if (!isNaN(val) && val >= 1 && val <= 5) {
        distribution[val]++;
      }
    });

    // 1~5만 반환
    return [1, 2, 3, 4, 5].map(score => ({
      score,
      label: score === 1 ? '전혀 그렇지 않다' : score === 2 ? '그렇지 않다' : score === 3 ? '보통이다' : score === 4 ? '그렇다' : '매우 그렇다',
      count: distribution[score],
      percentage: total > 0 ? (distribution[score] / total) * 100 : 0
    }));
  };

  const getImageChoiceStats = (questionId, imageUrls) => {
    const answers = getAnswersByQuestion(questionId);
    console.log(`이미지선택 ${questionId} 답변:`, answers);
    console.log('첫 번째 답변 타입:', typeof answers[0], '값:', answers[0]);
    return imageUrls.map((imageUrl, index) => {
      const count = answers.filter(a => {
        console.log(`비교: "${a}" === "${String(index)}" ?`, a === String(index));
        return a === String(index);
      }).length;
      return {
        imageUrl,
        label: `선택지 ${index + 1}`,
        count,
        percentage: answers.length > 0 ? (count / answers.length) * 100 : 0
      };
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('MySurveys'))}
          className="mb-4 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>

        <Card className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl shadow-xl border-0 text-white">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-2">{survey.title}</h1>
            <p className="text-orange-50 mb-4">{survey.description}</p>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-0">
                {survey.status === 'live' ? '진행중' : survey.status === 'pending' ? '대기중' : '종료'}
              </Badge>
              <span className="text-sm text-orange-50">
                {formatKST(survey.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{allResponses.length}</div>
              <div className="text-xs text-gray-500">접속자 수</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{actualCompletedCount}</div>
              <div className="text-xs text-gray-500">응답완료</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{survey.target_participants}</div>
              <div className="text-xs text-gray-500">목표</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{progressPercentage.toFixed(0)}%</div>
              <div className="text-xs text-gray-500">진행률</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardContent className="p-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">전체 진행률</span>
            <span className="font-bold text-orange-600">{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-orange-500 to-pink-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Responses */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800 px-1 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-500" />
          질문별 응답 현황
          <Badge className="bg-gray-100 text-gray-700 border-0 text-xs">
            총 {responses.length}개 응답
          </Badge>
        </h3>

        {questions.length === 0 ? (
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardContent className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>질문이 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          questions.map((question, qIndex) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qIndex * 0.1 }}
            >
              <Card className="bg-white rounded-2xl shadow-sm border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-purple-100 text-purple-700 border-0">
                      Q{qIndex + 1}
                    </Badge>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-2">{question.question_text}</CardTitle>
                      <Badge className={
                        question.question_type === 'multiple_choice' ? 'bg-blue-100 text-blue-700 border-0' :
                        question.question_type === 'multiple_select' ? 'bg-violet-100 text-violet-700 border-0' :
                        question.question_type === 'short_answer' ? 'bg-gray-100 text-gray-700 border-0' :
                        question.question_type === 'image_choice' ? 'bg-purple-100 text-purple-700 border-0' :
                        question.question_type === 'numeric_rating' ? 'bg-teal-100 text-teal-700 border-0' :
                        question.question_type === 'likert_scale' ? 'bg-indigo-100 text-indigo-700 border-0' :
                        question.question_type === 'ranking' ? 'bg-amber-100 text-amber-700 border-0' :
                        'bg-gray-100 text-gray-700 border-0'
                      }>
                        {question.question_type === 'multiple_choice' ? '객관식' :
                         question.question_type === 'multiple_select' ? '다중선택' :
                         question.question_type === 'short_answer' ? '주관식' :
                         question.question_type === 'image_choice' ? '이미지선택' :
                         question.question_type === 'numeric_rating' ? '수치평정' :
                         question.question_type === 'likert_scale' ? '리커트척도' :
                         question.question_type === 'ranking' ? '순위형' : question.question_type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {question.question_type === 'multiple_choice' ? (
                    <div className="space-y-3">
                      {getMultipleChoiceStats(question.id, question.options).map((stat, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{stat.option}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-orange-600">{stat.count}명</span>
                              <span className="text-gray-500">({stat.percentage.toFixed(0)}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-orange-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${stat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : question.question_type === 'multiple_select' ? (
                    <div className="space-y-3">
                      {getMultipleSelectStats(question.id, question.options).map((stat, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{stat.option}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-violet-600">{stat.count}명</span>
                              <span className="text-gray-500">({stat.percentage.toFixed(0)}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-violet-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${stat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : question.question_type === 'ranking' ? (
                    <div className="space-y-6">
                      {(() => {
                        const { stats, individualResponses } = getRankingAnalysis(question.id, question.options);
                        return (
                          <>
                            {/* 1. 항목별 1위/꼴찌 그래프 */}
                            <div className="space-y-4">
                              <p className="text-xs font-bold text-gray-500 mb-2">항목별 선호도 분석</p>
                              {stats.map((stat, idx) => (
                                <div key={idx} className="space-y-1 bg-gray-50 p-3 rounded-xl">
                                  <div className="text-sm font-bold text-gray-800 mb-2">{stat.option}</div>
                                  
                                  {/* 1위 비율 */}
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="w-12 text-blue-600 font-medium">1위 선택</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${stat.firstPercentage}%` }}
                                      />
                                    </div>
                                    <span className="w-16 text-right text-gray-600">{stat.firstCount}명({stat.firstPercentage.toFixed(0)}%)</span>
                                  </div>

                                  {/* 꼴찌 비율 */}
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="w-12 text-red-600 font-medium">마지막 선택</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-red-500 h-2 rounded-full"
                                        style={{ width: `${stat.lastPercentage}%` }}
                                      />
                                    </div>
                                    <span className="w-16 text-right text-gray-600">{stat.lastCount}명({stat.lastPercentage.toFixed(0)}%)</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* 2. 개별 응답 화살표 표시 */}
                            <div>
                              <p className="text-xs font-bold text-gray-500 mb-2">개별 응답 내역 (최근 10건)</p>
                              <div className="space-y-2 max-h-60 overflow-y-auto bg-amber-50 p-3 rounded-xl border border-amber-100">
                                {individualResponses.slice(0, 10).map((resp, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-amber-100 shadow-sm">
                                    <Badge className="bg-amber-500 text-white border-0 text-xs shrink-0">
                                      #{idx + 1}
                                    </Badge>
                                    <span className="text-sm text-gray-700 font-medium break-all">
                                      {resp.split(' > ').map((item, i, arr) => (
                                        <span key={i}>
                                          {item}
                                          {i < arr.length - 1 && <span className="text-amber-400 mx-1">▶</span>}
                                        </span>
                                      ))}
                                    </span>
                                  </div>
                                ))}
                                {individualResponses.length === 0 && <p className="text-sm text-gray-400 text-center">응답이 없습니다</p>}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : question.question_type === 'image_choice' ? (
                    <div className="space-y-3">
                      {getImageChoiceStats(question.id, question.image_urls || []).map((stat, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="relative w-20 h-20 flex-shrink-0">
                              <img 
                                src={stat.imageUrl} 
                                alt={stat.label}
                                className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-full bg-gray-100 hidden items-center justify-center rounded-lg border-2 border-gray-200 absolute top-0 left-0">
                                <span className="text-gray-400 text-[10px]">No Image</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-gray-700 font-medium">{stat.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-purple-600">{stat.count}명</span>
                                  <span className="text-gray-500">({stat.percentage.toFixed(0)}%)</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${stat.percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : question.question_type === 'numeric_rating' ? (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 text-center font-medium">점수별 응답 분포 (0~10점)</div>
                      <div className="flex items-end justify-between gap-1 h-48 bg-teal-50 rounded-xl p-4 border border-teal-100">
                        {getNumericDistribution(question.id).map((dist, idx) => {
                           // 최대값 구해서 높이 비율 계산
                           const maxCount = Math.max(...getNumericDistribution(question.id).map(d => d.count));
                           const heightPercent = maxCount > 0 ? (dist.count / maxCount) * 100 : 0;
                           
                           return (
                             <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                               {/* 툴팁 역할 */}
                               <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                                 {dist.count}명 ({dist.percentage.toFixed(0)}%)
                               </div>
                               
                               <div className="w-full bg-white rounded-t-md relative flex items-end justify-center" style={{ height: '140px' }}>
                                 {dist.count > 0 && (
                                   <div 
                                     className="w-full bg-teal-400 rounded-t-md transition-all duration-500 group-hover:bg-teal-500"
                                     style={{ height: `${heightPercent}%` }}
                                   />
                                 )}
                               </div>
                               <span className="text-xs font-bold text-teal-800">{dist.score}</span>
                             </div>
                           );
                        })}
                      </div>
                    </div>
                  ) : question.question_type === 'likert_scale' ? (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 text-center font-medium">응답 분포 (1~5)</div>
                      <div className="space-y-2">
                        {getLikertDistribution(question.id).map((dist, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-xs text-gray-700">
                              <span>{dist.score}. {dist.label}</span>
                              <span className="font-bold text-indigo-600">{dist.count}명 ({dist.percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3">
                              <div 
                                className="bg-indigo-400 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${dist.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 text-center mb-2">전체 응답</div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {getAnswersByQuestion(question.id).length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">아직 응답이 없습니다</p>
                        ) : (
                          getAnswersByQuestion(question.id).map((answer, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-xl p-3">
                              <div className="flex items-start gap-2">
                                <Badge className="bg-gray-500 text-white border-0 text-xs">
                                  #{idx + 1}
                                </Badge>
                                <p className="text-sm text-gray-800 flex-1">{answer}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* All Responses List Removed */}
    </div>
  );
}