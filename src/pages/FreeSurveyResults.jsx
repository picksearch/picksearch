import React, { useState, useMemo } from "react";
import { Survey, Question, Response } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Share2, Copy, Check, BarChart3, Users, ArrowLeft, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FreeSurveyResults() {
  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get('id');
  const [copied, setCopied] = useState(false);

  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ['freeSurvey', surveyId],
    queryFn: async () => {
      const surveys = await Survey.filter({ id: surveyId });
      return surveys[0];
    },
    enabled: !!surveyId
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['freeSurveyQuestions', surveyId],
    queryFn: () => Question.filter({ survey_id: surveyId }, 'order'),
    enabled: !!surveyId
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['freeSurveyResponses', surveyId],
    queryFn: () => Response.filter({ survey_id: surveyId, status: 'completed' }),
    enabled: !!surveyId
  });

  const shareUrl = `${window.location.origin}${createPageUrl('FreeSurveyResults')}?id=${surveyId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${survey?.title} - 설문 결과`,
          url: shareUrl,
        });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const analyzeQuestion = (question) => {
    const questionResponses = responses.flatMap(r => 
      (r.answers || []).filter(a => a.question_id === question.id)
    );

    if (question.question_type === 'multiple_choice' || question.question_type === 'multiple_select') {
      const counts = {};
      (question.options || []).forEach(opt => { counts[opt] = 0; });
      
      questionResponses.forEach(a => {
        if (question.question_type === 'multiple_select') {
          // 다중선택: 배열 또는 쉼표로 구분된 문자열 처리
          let selections = [];
          if (Array.isArray(a.answer)) {
            selections = a.answer;
          } else if (typeof a.answer === 'string') {
            selections = a.answer.split(',').map(s => s.trim());
          }
          selections.forEach(ans => { if (counts[ans] !== undefined) counts[ans]++; });
        } else {
          // 객관식: 단일 선택
          if (counts[a.answer] !== undefined) counts[a.answer]++;
        }
      });
      
      const total = question.question_type === 'multiple_select' ? responses.length : questionResponses.length || 1;
      return Object.entries(counts).map(([option, count]) => ({
        option,
        count,
        percentage: Math.round((count / total) * 100)
      }));
    }

    if (question.question_type === 'ranking') {
      const rankSums = {};
      const rankCounts = {};
      (question.options || []).forEach(opt => { rankSums[opt] = 0; rankCounts[opt] = 0; });
      
      questionResponses.forEach(a => {
        try {
          let parsed;
          if (typeof a.answer === 'string') {
            parsed = JSON.parse(a.answer);
          } else if (typeof a.answer === 'object' && a.answer !== null) {
            parsed = a.answer;
          }
          
          if (parsed) {
            Object.entries(parsed).forEach(([label, rank]) => {
              if (rankSums.hasOwnProperty(label)) {
                rankSums[label] += rank;
                rankCounts[label]++;
              }
            });
          }
        } catch (e) {
          // JSON 파싱 실패 시 무시
        }
      });
      
      return Object.entries(rankSums)
        .map(([option, sum]) => ({
          option,
          average_rank: rankCounts[option] > 0 ? parseFloat((sum / rankCounts[option]).toFixed(1)) : 999,
          response_count: rankCounts[option]
        }))
        .sort((a, b) => a.average_rank - b.average_rank);
    }

    if (question.question_type === 'numeric_rating') {
      const values = questionResponses.map(a => parseFloat(a.answer)).filter(v => !isNaN(v));
      const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;
      const distribution = {};
      for (let i = 0; i <= 10; i++) distribution[i] = 0;
      values.forEach(v => { distribution[Math.round(v)]++; });
      return { average: avg, distribution, count: values.length };
    }

    if (question.question_type === 'likert_scale') {
      const labels = ['', '전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'];
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      questionResponses.forEach(a => {
        const val = parseInt(a.answer);
        if (val >= 1 && val <= 5) counts[val]++;
      });
      const total = questionResponses.length || 1;
      const values = questionResponses.map(a => parseInt(a.answer)).filter(v => !isNaN(v));
      const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;
      return {
        average: avg,
        distribution: Object.entries(counts).map(([val, count]) => ({
          value: parseInt(val),
          label: labels[parseInt(val)],
          count,
          percentage: Math.round((count / total) * 100)
        }))
      };
    }

    if (question.question_type === 'image_choice') {
      const counts = {};
      (question.image_urls || []).forEach((_, idx) => { counts[idx] = 0; });
      questionResponses.forEach(a => {
        const idx = parseInt(a.answer);
        if (counts[idx] !== undefined) counts[idx]++;
      });
      const total = questionResponses.length || 1;
      return (question.image_urls || []).map((url, idx) => ({
        imageUrl: url,
        description: question.image_descriptions?.[idx] || `이미지 ${idx + 1}`,
        count: counts[idx],
        percentage: Math.round((counts[idx] / total) * 100)
      }));
    }

    if (question.question_type === 'short_answer') {
      return questionResponses.map(a => a.answer).filter(Boolean);
    }

    return questionResponses;
  };

  if (surveyLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">설문을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <Link to={createPageUrl('MySurveys')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Badge className="bg-white/20 text-white border-0 px-3 py-1">무료설문 결과</Badge>
        </div>
        
        <div className="px-6 pt-4 pb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{survey.title}</h1>
          {survey.description && <p className="text-emerald-100 text-sm mb-4">{survey.description}</p>}
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-center gap-4 bg-white/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-white" />
              <span className="text-white font-bold">{responses.length}명</span>
              <span className="text-emerald-100 text-sm">응답</span>
            </div>
            <div className="flex-1" />
            <Button onClick={handleShare} className="bg-white text-emerald-600 hover:bg-emerald-50">
              <Share2 className="w-4 h-4 mr-2" /> 공유하기
            </Button>
          </div>
        </div>
      </div>

      {/* Copy Link */}
      <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={shareUrl} 
              readOnly 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600"
            />
            <Button onClick={handleCopyLink} variant="outline" className={copied ? 'bg-green-50 border-green-300 text-green-600' : ''}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">이 링크를 공유하면 누구나 결과를 볼 수 있습니다.</p>
        </CardContent>
      </Card>

      {/* Results */}
      {questions.filter(q => q.question_type !== 'image_banner').map((question, idx) => {
        const analysis = analyzeQuestion(question);
        
        return (
          <Card key={question.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <div className="space-y-2">
                <Badge className="bg-purple-100 text-purple-700 border-0 w-fit text-xs">
                  Q{idx + 1}
                </Badge>
                <CardTitle className="text-base mb-2">{question.question_text}</CardTitle>
                <Badge className={
                  question.question_type === 'multiple_choice' ? 'bg-blue-100 text-blue-700 border-0 w-fit text-xs' :
                  question.question_type === 'multiple_select' ? 'bg-violet-100 text-violet-700 border-0 w-fit text-xs' :
                  question.question_type === 'ranking' ? 'bg-amber-100 text-amber-700 border-0 w-fit text-xs' :
                  question.question_type === 'numeric_rating' ? 'bg-teal-100 text-teal-700 border-0 w-fit text-xs' :
                  question.question_type === 'likert_scale' ? 'bg-indigo-100 text-indigo-700 border-0 w-fit text-xs' :
                  question.question_type === 'image_choice' ? 'bg-purple-100 text-purple-700 border-0 w-fit text-xs' :
                  question.question_type === 'short_answer' ? 'bg-amber-100 text-amber-700 border-0 w-fit text-xs' :
                  'bg-gray-100 text-gray-700 border-0 w-fit text-xs'
                }>
                  {question.question_type === 'multiple_choice' ? '객관식' :
                   question.question_type === 'multiple_select' ? '다중선택' :
                   question.question_type === 'ranking' ? '순위형' :
                   question.question_type === 'numeric_rating' ? '수치평정' :
                   question.question_type === 'likert_scale' ? '리커트척도' :
                   question.question_type === 'image_choice' ? '이미지선택' :
                   question.question_type === 'short_answer' ? '주관식' : question.question_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {/* Multiple Choice / Multiple Select */}
              {(question.question_type === 'multiple_choice' || question.question_type === 'multiple_select') && Array.isArray(analysis) && (
                <div className="space-y-3">
                  {analysis.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{item.option}</span>
                        <span className="text-gray-500">{item.count}명 ({item.percentage}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-3" />
                    </div>
                  ))}
                </div>
              )}

              {/* Ranking */}
              {question.question_type === 'ranking' && Array.isArray(analysis) && (
                <div className="space-y-2">
                  {analysis.map((item, i) => {
                    const getRankEmoji = (position) => {
                      if (position === 0) return '🥇';
                      if (position === 1) return '🥈';
                      if (position === 2) return '🥉';
                      return `${position + 1}위`;
                    };
                    
                    return (
                      <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl ${i < 3 ? 'bg-gradient-to-r' : 'bg-gray-50'} ${
                        i === 0 ? 'from-yellow-400 to-orange-500' :
                        i === 1 ? 'from-gray-300 to-gray-400' :
                        i === 2 ? 'from-orange-400 to-orange-500' : ''
                      }`}>
                        <div className="text-3xl flex-shrink-0">
                          {getRankEmoji(i)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-bold text-lg ${i < 3 ? 'text-white' : 'text-gray-700'}`}>
                              {item.option}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${i < 3 ? 'bg-white/30 text-white' : 'bg-amber-500 text-white'} border-0 text-xs`}>
                              평균 {item.average_rank}위
                            </Badge>
                            <span className={`text-xs ${i < 3 ? 'text-white/80' : 'text-gray-500'}`}>
                              {item.response_count}명 선택
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Numeric Rating */}
              {question.question_type === 'numeric_rating' && analysis.average !== undefined && (
                <div className="text-center">
                  <div className="text-5xl font-bold text-teal-600 mb-2">{analysis.average}</div>
                  <p className="text-gray-500 text-sm">평균 점수 (0~10점)</p>
                  <div className="mt-4 grid grid-cols-11 gap-1">
                    {Object.entries(analysis.distribution).map(([score, count]) => (
                      <div key={score} className="text-center">
                        <div className="text-xs text-gray-400 mb-1">{score}</div>
                        <div className="h-16 bg-gray-100 rounded relative overflow-hidden">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-teal-500 transition-all"
                            style={{ height: `${analysis.count ? (count / analysis.count) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Likert Scale */}
              {question.question_type === 'likert_scale' && analysis.distribution && (
                <div>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-indigo-600">{analysis.average}</div>
                    <p className="text-gray-500 text-sm">평균 점수</p>
                  </div>
                  <div className="space-y-2">
                    {analysis.distribution.map((item) => (
                      <div key={item.value}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{item.value}. {item.label}</span>
                          <span className="text-gray-500">{item.count}명 ({item.percentage}%)</span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Choice */}
              {question.question_type === 'image_choice' && Array.isArray(analysis) && (
                <div className="grid grid-cols-2 gap-4">
                  {analysis.map((item, i) => (
                    <div key={i} className="relative">
                      <img src={item.imageUrl} alt={item.description} className="w-full aspect-square object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl flex items-end p-3">
                        <div className="text-white">
                          <div className="font-bold text-lg">{item.percentage}%</div>
                          <div className="text-xs opacity-80">{item.count}명</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Short Answer */}
              {question.question_type === 'short_answer' && Array.isArray(analysis) && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analysis.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">아직 응답이 없습니다.</p>
                  ) : (
                    analysis.map((answer, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                        "{answer}"
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {responses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">아직 응답이 없습니다.</p>
          <p className="text-gray-400 text-sm mt-1">설문 링크를 공유하여 응답을 수집하세요!</p>
        </div>
      )}
    </div>
  );
}