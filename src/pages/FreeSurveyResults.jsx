import React, { useState, useMemo } from "react";
import { auth } from "@/api/auth";
import { Survey, Question, Response } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl, formatKST } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft, Loader2, BarChart3, Download, Copy, Check, RefreshCw, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];

export default function FreeSurveyResults() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get('id');

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

  const { data: survey, isLoading: surveyLoading, refetch: refetchSurvey } = useQuery({
    queryKey: ['freeSurvey', surveyId],
    queryFn: () => Survey.get(surveyId),
    enabled: !!surveyId
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['freeSurveyQuestions', surveyId],
    queryFn: () => Question.filter({ survey_id: surveyId }, 'order'),
    enabled: !!surveyId
  });

  const { data: responses = [], isLoading: responsesLoading, refetch: refetchResponses } = useQuery({
    queryKey: ['freeSurveyResponses', surveyId],
    queryFn: () => Response.filter({ survey_id: surveyId }),
    enabled: !!surveyId,
    refetchInterval: 30000 // Auto refresh every 30 seconds
  });

  const completedResponses = useMemo(() => {
    return responses.filter(r => r.status === 'completed');
  }, [responses]);

  const getSurveyUrl = () => {
    if (!survey?.secret_key) return '';
    return `${window.location.origin}/TakeSurvey?key=${survey.secret_key}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getSurveyUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('URL이 복사되었습니다.');
    }
  };

  // 질문별 응답 가져오기
  const getAnswersByQuestion = (questionId) => {
    return completedResponses
      .map(r => r.answers?.find(a => a.question_id === questionId)?.answer)
      .filter(Boolean);
  };

  // 객관식 통계
  const getMultipleChoiceStats = (questionId, options) => {
    const answers = getAnswersByQuestion(questionId);
    return (options || []).map(option => ({
      option,
      count: answers.filter(a => a === option).length,
      percentage: answers.length > 0 ? (answers.filter(a => a === option).length / answers.length) * 100 : 0
    }));
  };

  // 다중선택 통계
  const getMultipleSelectStats = (questionId, options) => {
    const answers = getAnswersByQuestion(questionId);
    return (options || []).map(option => {
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

  // 순위형 분석
  const getRankingAnalysis = (questionId, options) => {
    const answers = getAnswersByQuestion(questionId);

    const stats = (options || []).map(option => {
      let firstCount = 0;
      let lastCount = 0;

      answers.forEach(a => {
        try {
          const rankings = JSON.parse(a);
          const myRank = rankings[option];
          const totalRanks = Object.keys(rankings).length;

          if (myRank === 1) firstCount++;
          if (myRank === totalRanks) lastCount++;
        } catch (e) { }
      });

      return {
        option,
        firstCount,
        firstPercentage: answers.length > 0 ? (firstCount / answers.length) * 100 : 0,
        lastCount,
        lastPercentage: answers.length > 0 ? (lastCount / answers.length) * 100 : 0
      };
    });

    const individualResponses = answers.map(a => {
      try {
        const rankings = JSON.parse(a);
        const sorted = Object.entries(rankings).sort((x, y) => x[1] - y[1]);
        return sorted.map(([opt]) => opt).join(' > ');
      } catch (e) {
        return a;
      }
    });

    return { stats, individualResponses };
  };

  // 이미지선택 통계
  const getImageChoiceStats = (questionId, imageUrls) => {
    const answers = getAnswersByQuestion(questionId);
    return (imageUrls || []).map((imageUrl, index) => {
      const count = answers.filter(a => a === String(index)).length;
      return {
        imageUrl,
        label: `선택지 ${index + 1}`,
        count,
        percentage: answers.length > 0 ? (count / answers.length) * 100 : 0
      };
    });
  };

  // 수치평정 분포
  const getNumericDistribution = (questionId) => {
    const answers = getAnswersByQuestion(questionId);
    const total = answers.length;
    const distribution = Array(11).fill(0);

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

  // 리커트척도 분포
  const getLikertDistribution = (questionId) => {
    const answers = getAnswersByQuestion(questionId);
    const total = answers.length;
    const distribution = Array(6).fill(0);

    answers.forEach(a => {
      const val = parseInt(a);
      if (!isNaN(val) && val >= 1 && val <= 5) {
        distribution[val]++;
      }
    });

    return [1, 2, 3, 4, 5].map(score => ({
      score,
      label: score === 1 ? '전혀 그렇지 않다' : score === 2 ? '그렇지 않다' : score === 3 ? '보통이다' : score === 4 ? '그렇다' : '매우 그렇다',
      count: distribution[score],
      percentage: total > 0 ? (distribution[score] / total) * 100 : 0
    }));
  };

  // 기타입력(choice_with_other) 통계
  const getChoiceWithOtherStats = (questionId, options) => {
    const answers = getAnswersByQuestion(questionId);

    return (options || []).map((option, idx) => {
      const isLastOption = idx === options.length - 1;
      let count;

      if (isLastOption) {
        // 마지막 선택지는 "선택지: 입력값" 형태도 집계
        // 정확히 "선택지" 이거나 "선택지: "로 시작하는 경우
        count = answers.filter(a => a === option || a.startsWith(`${option}: `)).length;
      } else {
        count = answers.filter(a => a === option).length;
      }

      return {
        option,
        count,
        percentage: answers.length > 0 ? (count / answers.length) * 100 : 0,
        isLastOption
      };
    });
  };

  // 기타입력의 직접 입력 응답만 추출
  const getOtherTextAnswers = (questionId, options) => {
    const answers = getAnswersByQuestion(questionId);
    const lastOption = options?.[options.length - 1];

    if (!lastOption) return [];

    return answers
      .filter(a => a.startsWith(`${lastOption}: `))
      .map(a => a.replace(`${lastOption}: `, ''));
  };

  // 기존 함수 (호환성 유지)
  const getQuestionStats = (questionId) => {
    const questionResponses = completedResponses
      .map(r => r.answers?.find(a => a.question_id === questionId))
      .filter(Boolean);

    const distribution = {};
    questionResponses.forEach(ans => {
      const answer = ans.answer;
      if (answer) {
        distribution[answer] = (distribution[answer] || 0) + 1;
      }
    });

    return {
      total: questionResponses.length,
      distribution: Object.entries(distribution).map(([name, value]) => ({
        name,
        value,
        percentage: questionResponses.length > 0 ? ((value / questionResponses.length) * 100).toFixed(1) : 0
      }))
    };
  };

  const downloadCSV = () => {
    if (!survey || questions.length === 0) return;

    let csvContent = '\uFEFF'; // BOM for Korean support

    // Header row
    const headers = ['응답 번호', '응답 시간', ...questions.map((q, i) => `Q${i + 1}: ${q.question_text}`)];
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';

    // Data rows
    completedResponses.forEach((response, idx) => {
      const row = [
        idx + 1,
        formatKST(response.completed_at || response.created_at, 'yyyy-MM-dd HH:mm'),
        ...questions.map(q => {
          const answer = response.answers?.find(a => a.question_id === q.id);
          return answer?.answer || '';
        })
      ];
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${survey.title}_응답_${formatKST(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };

  const isLoading = userLoading || surveyLoading || questionsLoading || responsesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">설문을 찾을 수 없습니다</h2>
            <Button onClick={() => navigate(createPageUrl('MySurveys'))}>
              내 설문으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-100 z-40 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('MySurveys'))}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 truncate mx-4">{survey.title}</h1>
          <button
            onClick={() => {
              refetchSurvey();
              refetchResponses();
            }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Survey Info Card */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <Badge className={`${survey.status === 'live' ? 'bg-emerald-100 text-emerald-700' :
                survey.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                  'bg-yellow-100 text-yellow-700'
                } border-0`}>
                {survey.status === 'live' ? '진행중' :
                  survey.status === 'closed' ? '종료됨' : '대기중'}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatKST(survey.created_at, 'yyyy.MM.dd')} 생성
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <Users className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-700">{completedResponses.length}</div>
                <div className="text-sm text-emerald-600">완료된 응답</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{questions.length}</div>
                <div className="text-sm text-blue-600">질문 수</div>
              </div>
            </div>

            {/* Survey URL */}
            {survey.status === 'live' && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">설문 링크</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={getSurveyUrl()}
                    readOnly
                    className="flex-1 bg-white rounded-lg px-3 py-2 text-sm border border-gray-200 truncate"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="rounded-lg"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Stats */}
        {completedResponses.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">응답 통계</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCSV}
                className="rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV 다운로드
              </Button>
            </div>

            {questions.map((question, qIndex) => {
              const stats = getQuestionStats(question.id);

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qIndex * 0.1 }}
                >
                  <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b border-gray-100 py-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">
                          Q{qIndex + 1}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {{
                            'multiple_choice': '객관식',
                            'short_answer': '주관식',
                            'multiple_select': '복수선택',
                            'ranking': '순위형',
                            'choice_with_other': '객관+주관',
                            'numeric_rating': '점수형',
                            'likert_scale': '리커트척도',
                            'image_choice': '이미지선택',
                            'image_banner': '이미지배너'
                          }[question.question_type] || question.question_type}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold text-gray-800 mt-2">
                        {question.question_text}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      {question.question_type === 'multiple_choice' ? (
                        <div className="space-y-3">
                          {getMultipleChoiceStats(question.id, question.options).map((stat, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">{stat.option}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-emerald-600">{stat.count}명</span>
                                  <span className="text-gray-500">({stat.percentage.toFixed(0)}%)</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-emerald-400 to-teal-400 h-2 rounded-full transition-all duration-300"
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
                            const { stats: rankingStats, individualResponses } = getRankingAnalysis(question.id, question.options);
                            return (
                              <>
                                <div className="space-y-4">
                                  <p className="text-xs font-bold text-gray-500 mb-2">항목별 선호도 분석</p>
                                  {rankingStats.map((stat, idx) => (
                                    <div key={idx} className="space-y-1 bg-gray-50 p-3 rounded-xl">
                                      <div className="text-sm font-bold text-gray-800 mb-2">{stat.option}</div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="w-12 text-blue-600 font-medium">1위 선택</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stat.firstPercentage}%` }} />
                                        </div>
                                        <span className="w-16 text-right text-gray-600">{stat.firstCount}명({stat.firstPercentage.toFixed(0)}%)</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="w-12 text-red-600 font-medium">마지막 선택</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${stat.lastPercentage}%` }} />
                                        </div>
                                        <span className="w-16 text-right text-gray-600">{stat.lastCount}명({stat.lastPercentage.toFixed(0)}%)</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-500 mb-2">개별 응답 내역 (최근 10건)</p>
                                  <div className="space-y-2 max-h-60 overflow-y-auto bg-amber-50 p-3 rounded-xl border border-amber-100">
                                    {individualResponses.slice(0, 10).map((resp, idx) => (
                                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-amber-100 shadow-sm">
                                        <Badge className="bg-amber-500 text-white border-0 text-xs shrink-0">#{idx + 1}</Badge>
                                        <span className="text-sm text-gray-700 font-medium break-all">
                                          {resp.split(' > ').map((item, i, arr) => (
                                            <span key={i}>{item}{i < arr.length - 1 && <span className="text-amber-400 mx-1">▶</span>}</span>
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
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
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
                                    <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300" style={{ width: `${stat.percentage}%` }} />
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
                              const numericData = getNumericDistribution(question.id);
                              const maxCount = Math.max(...numericData.map(d => d.count));
                              const heightPercent = maxCount > 0 ? (dist.count / maxCount) * 100 : 0;
                              return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                                    {dist.count}명 ({dist.percentage.toFixed(0)}%)
                                  </div>
                                  <div className="w-full bg-white rounded-t-md relative flex items-end justify-center" style={{ height: '140px' }}>
                                    {dist.count > 0 && (
                                      <div className="w-full bg-teal-400 rounded-t-md transition-all duration-500 group-hover:bg-teal-500" style={{ height: `${heightPercent}%` }} />
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
                                  <div className="bg-indigo-400 h-3 rounded-full transition-all duration-500" style={{ width: `${dist.percentage}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : question.question_type === 'choice_with_other' ? (
                        <div className="space-y-3">
                          {getChoiceWithOtherStats(question.id, question.options).map((stat, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">
                                  {stat.option}
                                  {stat.isLastOption && <span className="ml-1 text-xs text-cyan-500">(직접입력)</span>}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-cyan-600">{stat.count}명</span>
                                  <span className="text-gray-500">({stat.percentage.toFixed(0)}%)</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-gradient-to-r from-cyan-400 to-blue-400 h-2 rounded-full transition-all duration-300" style={{ width: `${stat.percentage}%` }} />
                              </div>
                            </div>
                          ))}
                          {/* 기타 응답 (직접 입력된 텍스트만 표시) */}
                          {(() => {
                            const otherTextAnswers = getOtherTextAnswers(question.id, question.options);
                            if (otherTextAnswers.length === 0) return null;
                            return (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-500 mb-2">직접 입력 응답 내용</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {otherTextAnswers.slice(0, 10).map((ans, idx) => (
                                    <div key={idx} className="bg-cyan-50 rounded-lg p-2 text-sm text-gray-700 border border-cyan-100">{ans}</div>
                                  ))}
                                  {otherTextAnswers.length > 10 && (
                                    <p className="text-xs text-gray-400 text-center">외 {otherTextAnswers.length - 10}개...</p>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : question.question_type === 'short_answer' ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {getAnswersByQuestion(question.id).length > 0 ? (
                            getAnswersByQuestion(question.id).slice(0, 20).map((answer, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 flex items-start gap-2">
                                <Badge className="bg-gray-500 text-white border-0 text-xs shrink-0">#{idx + 1}</Badge>
                                <span>{answer}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-4">응답이 없습니다</p>
                          )}
                          {getAnswersByQuestion(question.id).length > 20 && (
                            <p className="text-sm text-gray-400 text-center">외 {getAnswersByQuestion(question.id).length - 20}개의 응답...</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {getAnswersByQuestion(question.id).length > 0 ? (
                            getAnswersByQuestion(question.id).slice(0, 20).map((answer, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{answer}</div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-4">응답이 없습니다</p>
                          )}
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                        <span className="text-sm text-gray-500">총 {stats.total}개의 응답</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </>
        )}

        {/* No responses yet */}
        {completedResponses.length === 0 && (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">아직 응답이 없습니다</h3>
              <p className="text-gray-500 mb-4">설문 링크를 공유하여 응답을 받아보세요</p>
              {survey.status === 'live' && (
                <Button onClick={copyToClipboard} className="bg-emerald-500 hover:bg-emerald-600">
                  <Copy className="w-4 h-4 mr-2" />
                  설문 링크 복사
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
