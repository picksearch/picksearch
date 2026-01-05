import React, { useState, useMemo } from "react";
import { auth } from "@/api/auth";
import { Survey, Question, Response, SurveyReport } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl, formatKST } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Label, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from "recharts";
import { Sparkles, Users, Target, ArrowLeft, Home, Loader2, BarChart3, MessageSquare, Download, FileText, ChevronDown, Clock, CheckCircle, Info, Database, Search, X, FolderPlus, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { SAMPLE_SURVEY, SAMPLE_QUESTIONS, SAMPLE_RESPONSES, SAMPLE_AI_REPORT } from "@/components/SampleSurveyData";
import ReactMarkdown from 'react-markdown';

const COLORS = ['#3182F6', '#0EA5E9', '#8B5CF6', '#F59E0B', '#10B981'];

export default function SurveyResults() {
  const navigate = useNavigate();
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showHyperReport, setShowHyperReport] = useState(false);
  const [hyperReportData, setHyperReportData] = useState(null);
  const [generatingHyperReport, setGeneratingHyperReport] = useState(false);

  React.useEffect(() => {
    if (selectedSurvey?.isSample) {
      setAiReport(SAMPLE_AI_REPORT);
      setHyperReportData(null);
      return;
    }

    if (!selectedSurvey?.id) {
      setAiReport(null);
      setHyperReportData(null);
      return;
    }

    // survey_reports 테이블에서 리포트 데이터 불러오기
    const loadReportData = async () => {
      try {
        const report = await SurveyReport.getBySurveyId(selectedSurvey.id);
        if (report) {
          setAiReport(report.ai_analysis_data || null);
          setHyperReportData(report.hyper_precision_report || null);
        } else {
          setAiReport(null);
          setHyperReportData(null);
        }
      } catch (error) {
        console.error('Failed to load report data:', error);
        setAiReport(null);
        setHyperReportData(null);
      }
    };

    loadReportData();
  }, [selectedSurvey?.id, selectedSurvey?.isSample]);

  const handlePrintReport = () => {
    const originalTitle = document.title;
    const timestamp = formatKST(new Date(), 'yyyyMMdd_HHmmss');
    document.title = `${timestamp}_${selectedSurvey.title}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const generateHyperPrecisionReport = async () => {
    if (!selectedSurvey) return;

    setGeneratingHyperReport(true);
    setShowHyperReport(true);

    try {
      const surveyQuestions = await Question.filter({
        survey_id: selectedSurvey.id
      }, 'order');

      const surveyResponses = await Response.filter({
        survey_id: selectedSurvey.id,
        status: 'completed'
      });

      // 데이터 요약 생성
      const dataSummary = {
        설문정보: {
          제목: selectedSurvey.title,
          설문목적: selectedSurvey.survey_purpose || '미지정',
          결과활용목적: selectedSurvey.usage_purpose || '미지정',
          총응답수: surveyResponses.length,
          완료율: selectedSurvey.total_responses > 0 ?
          `${(selectedSurvey.completed_responses / selectedSurvey.total_responses * 100).toFixed(1)}%` :
          '0%'
        },
        질문별_응답_통계: surveyQuestions.map((q) => {
          const questionResponses = surveyResponses.
          map((r) => r.answers?.find((a) => a.question_id === q.id)).
          filter(Boolean);

          // 응답 분포 계산
          const answerDistribution = {};
          questionResponses.forEach((ans) => {
            const answer = ans.answer;
            if (answer) {
              answerDistribution[answer] = (answerDistribution[answer] || 0) + 1;
            }
          });

          return {
            질문: q.question_text,
            유형: q.question_type,
            응답수: questionResponses.length,
            응답분포: answerDistribution,
            주관식답변_샘플: q.question_type === 'short_answer' ?
            questionResponses.slice(0, 10).map((a) => a.answer) :
            null
          };
        })
      };

      const systemPrompt = `당신은 15년 경력의 MBB(McKinsey, Bain, BCG) 출신 시니어 마케팅 컨설턴트입니다. 
지금부터 제공되는 설문조사 데이터를 분석하여, 클라이언트(기업 의사결정권자)가 즉시 실행 가능한 비즈니스 전략을 수립할 수 있도록 '초정밀 분석 리포트'를 작성해야 합니다.

[분석 원칙]
1. 단순한 수치 나열 금지: "A가 50%입니다"가 아니라, "A가 50%인 것은 시장 트렌드가 B로 이동했음을 시사합니다"와 같이 '해석(Why)'을 제시할 것.
2. 비판적 사고: 데이터에서 긍정적인 신호뿐만 아니라, 리스크나 경고 신호도 날카롭게 찾아낼 것.
3. 전문적인 어조: 해요체 대신 정중하고 신뢰감 있는 건조체(하십시오, ~임, ~함)를 사용할 것.
4. 구조화된 출력: 가독성을 위해 불렛 포인트, 소제목, 굵은 글씨를 적극 활용할 것.

[리포트 출력 양식]

## 1. 핵심 요약 (Executive Summary)
* 전체 데이터를 관통하는 가장 중요한 인사이트 3가지를 요약.
* 의사결정권자가 30초 안에 결론을 내릴 수 있도록 강력한 문장 사용.

## 2. Deep-Dive 데이터 분석
* **인구통계학적 특이점:** 특정 성별, 연령, 직업군에서 두드러진 응답 패턴 분석.
* **문항 간 교차 분석(Cross-Tabulation) 추론:** (예: 가격 만족도가 낮은 집단이 품질 중요도를 높게 평가한 경향 등 상관관계 발견 시 기술)
* **숨겨진 니즈 발견:** 주관식 응답이나 선택 패턴 뒤에 숨어 있는 고객의 진짜 욕망(Job-to-be-done) 분석.

## 3. 잠재 리스크 및 개선점 (Pain Points)
* 제품/서비스 출시 시 발생할 수 있는 예상 장애물.
* 고객이 이탈할 가능성이 있는 지점(Churn Point) 식별.

## 4. 실행 전략 제안 (Actionable Strategy)
* 데이터에 기반하여 당장 다음 주에 실행해야 할 구체적인 마케팅/세일즈 액션 아이템 3~5가지.
* 타겟팅 전략 수정 제안 (누구를 공략해야 ROI가 높은가).
* **중요:** 각 전략은 반드시 명사형으로 종결할 것 (예: "프로그램을 개발하시오" ❌, "프로그램 개발" ✅, "전략을 수립하십시오" ❌, "전략 수립" ✅)

[입력 데이터]
설문 주제: ${selectedSurvey.title}
설문 목적: ${selectedSurvey.survey_purpose || '명시되지 않음'}
결과 활용 목적: ${selectedSurvey.usage_purpose || '명시되지 않음'}
데이터 요약: ${JSON.stringify(dataSummary, null, 2)}

위 데이터를 기반으로 초정밀 분석 리포트를 작성하십시오.`;

      const result = await InvokeLLM({
        prompt: systemPrompt,
        add_context_from_internet: false
      });

      setHyperReportData(result);

      // survey_reports 테이블에 저장
      await SurveyReport.updateHyperPrecisionReport(selectedSurvey.id, result);
    } catch (error) {
      console.error('초정밀 리포트 생성 실패:', error);
      alert('리포트 생성에 실패했습니다: ' + error.message);
    } finally {
      setGeneratingHyperReport(false);
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
    retry: false
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['userSurveys', user?.email, user?.role],
    queryFn: async () => {
      // 샘플 설문을 항상 첫 번째로 추가
      const sampleSurveyWithBadge = { ...SAMPLE_SURVEY, isSample: true };

      if (!user?.email) {
        return [sampleSurveyWithBadge];
      }

      let userSurveys = [];
      if (user.role === 'admin') {
        const result = await Survey.list({ limit: 1000 });
        userSurveys = result.data || result;
      } else {
        userSurveys = await Survey.filter({ user_id: user.id }, 'created_at', false);
      }

      return [sampleSurveyWithBadge, ...userSurveys];
    },
    enabled: true
  });

  // URL Query Parameter Handling
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('id');
    if (surveyId && surveys.length > 0 && !selectedSurvey) {
      const foundSurvey = surveys.find((s) => s.id === surveyId);
      if (foundSurvey) {
        setSelectedSurvey(foundSurvey);
      }
    }
  }, [surveys, selectedSurvey]);

  const { data: questions = [] } = useQuery({
    queryKey: ['surveyQuestions', selectedSurvey?.id],
    queryFn: () => {
      if (selectedSurvey?.isSample) {
        return Promise.resolve(SAMPLE_QUESTIONS);
      }
      return Question.filter({ survey_id: selectedSurvey.id }, 'order');
    },
    enabled: !!selectedSurvey?.id
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['surveyResponses', selectedSurvey?.id],
    queryFn: () => {
      if (selectedSurvey?.isSample) {
        return Promise.resolve(SAMPLE_RESPONSES);
      }
      // Fetch with high limit to ensure we get all completed responses
      return Response.filter({ survey_id: selectedSurvey.id }, 'created_at', false);
    },
    enabled: !!selectedSurvey?.id
  });

  const completedResponses = useMemo(() => {
    return responses.filter((r) => r.status === 'completed');
  }, [responses]);

  // Survey의 completed_responses를 실제 응답 수와 동기화 (데이터 정합성 보장)
  React.useEffect(() => {
    if (selectedSurvey && !selectedSurvey.isSample && completedResponses.length > 0) {
      if (selectedSurvey.completed_responses !== completedResponses.length) {
        console.log(`[Self-Healing] Syncing count: ${selectedSurvey.completed_responses} -> ${completedResponses.length}`);

        // 로컬 상태 즉시 업데이트 (UI 반영)
        setSelectedSurvey((prev) => ({
          ...prev,
          completed_responses: completedResponses.length,
          in_progress_count: Math.max((prev.in_progress_count || 0) - (completedResponses.length - (prev.completed_responses || 0)), 0)
        }));

        // 서버 업데이트 (조용히 처리) 및 캐시 갱신
        Survey.update(selectedSurvey.id, {
          completed_responses: completedResponses.length
        }).then(() => {
          // 중요: 업데이트 후 캐시를 무효화하여 ClientHome 등 다른 곳에서도 최신 숫자를 보도록 함
          queryClient.invalidateQueries(['userSurveys']);
          queryClient.invalidateQueries(['mySurveys']);
        }).catch((err) => console.error('Survey count sync failed:', err));
      }
    }
  }, [selectedSurvey, completedResponses.length]);

  const allCategories = useMemo(() => {
    const categories = surveys.
    map((s) => s.category).
    filter((c) => c && c.trim() !== '');
    return [...new Set(categories)].sort();
  }, [surveys]);

  const getStatusGroup = (status) => {
    if (status === 'live' || status === 'scheduled') return 'active';
    if (status === 'pending' || status === 'review' || status === 'draft') return 'pending';
    if (status === 'closed') return 'closed';
    return 'other';
  };

  const statusCounts = useMemo(() => {
    return {
      active: surveys.filter((s) => getStatusGroup(s.status) === 'active').length,
      pending: surveys.filter((s) => getStatusGroup(s.status) === 'pending').length,
      closed: surveys.filter((s) => getStatusGroup(s.status) === 'closed' || s.isSample).length // Sample treated as closed/result-ready
    };
  }, [surveys]);

  const filteredSurveys = useMemo(() => {
    return surveys.filter((survey) => {
      // Sample survey logic
      if (survey.isSample) {




        // Always show sample if filters are default, otherwise apply filters
        // Or maybe treat sample as "Closed" status
      }const statusGroup = survey.isSample ? 'closed' : getStatusGroup(survey.status);const statusMatch = statusFilter === 'all' || statusGroup === statusFilter;
      const categoryMatch = categoryFilter === 'all' || (
      categoryFilter === 'uncategorized' ? !survey.category : survey.category === categoryFilter);

      const searchMatch = !searchTerm ||
      survey.title && survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.description && survey.description.toLowerCase().includes(searchTerm.toLowerCase());

      return statusMatch && categoryMatch && searchMatch;
    });
  }, [surveys, statusFilter, categoryFilter, searchTerm]);

  // Reset visible count when filters change
  React.useEffect(() => {
    setVisibleCount(5);
  }, [statusFilter, categoryFilter, searchTerm]);

  const rootQuestions = useMemo(() => {
    return questions.filter((q) => !q.parent_question_id);
  }, [questions]);

  // 질문 타입별 전처리 함수 - Raw Data를 Structured JSON으로 변환
  const buildStructuredSummary = (question, responses) => {
    const qResponses = responses.
    map((r) => {
      const answer = r.answers?.find((a) => String(a.question_id) === String(question.id));
      return answer?.answer;
    }).
    filter((a) => a !== undefined && a !== null && a !== '');

    const totalResponses = qResponses.length;
    const base = {
      qid: String(question.id),
      title: question.question_text,
      type: question.question_type,
      total_responses: totalResponses
    };

    // 객관식 (single choice)
    if (question.question_type === 'multiple_choice') {
      const options = question.options || [];
      const counts = {};
      options.forEach((opt) => {counts[opt] = 0;});

      qResponses.forEach((ans) => {
        if (counts.hasOwnProperty(ans)) {
          counts[ans]++;
        }
      });

      const optionStats = options.map((opt) => ({
        label: opt,
        count: counts[opt] || 0,
        percentage: totalResponses > 0 ? parseFloat(((counts[opt] || 0) / totalResponses * 100).toFixed(1)) : 0
      }));

      return { ...base, options: optionStats };
    }

    // 다중선택 (multiple select)
    if (question.question_type === 'multiple_select') {
      const options = question.options || [];
      const counts = {};
      options.forEach((opt) => {counts[opt] = 0;});
      let totalSelections = 0;

      qResponses.forEach((ans) => {
        // 쉼표로 구분된 복수 응답 처리
        const selections = ans.split(',').map((s) => s.trim());
        selections.forEach((sel) => {
          if (counts.hasOwnProperty(sel)) {
            counts[sel]++;
            totalSelections++;
          }
        });
      });

      const optionStats = options.map((opt) => ({
        label: opt,
        count: counts[opt] || 0,
        percentage_of_respondents: totalResponses > 0 ? parseFloat(((counts[opt] || 0) / totalResponses * 100).toFixed(1)) : 0
      }));

      return { ...base, total_respondents: totalResponses, total_selections: totalSelections, options: optionStats };
    }

    // 순위형 (ranking)
    if (question.question_type === 'ranking') {
      const options = question.options || [];
      const rankSums = {};
      const rankCounts = {};
      options.forEach((opt) => {rankSums[opt] = 0;rankCounts[opt] = 0;});

      qResponses.forEach((ans) => {
        try {
          const parsed = JSON.parse(ans);
          Object.entries(parsed).forEach(([label, rank]) => {
            if (rankSums.hasOwnProperty(label)) {
              rankSums[label] += rank;
              rankCounts[label]++;
            }
          });
        } catch (e) {


          // JSON 파싱 실패 시 무시
        }});
      const optionStats = options.map((opt) => ({
        label: opt,
        response_count: rankCounts[opt] || 0,
        average_rank: rankCounts[opt] > 0 ? parseFloat((rankSums[opt] / rankCounts[opt]).toFixed(1)) : null
      }));

      return { ...base, options: optionStats };
    }

    // 리커트척도 (likert_scale)
    if (question.question_type === 'likert_scale') {
      const distribution = [0, 0, 0, 0, 0]; // 1~5점
      let sum = 0;
      let validCount = 0;

      qResponses.forEach((ans) => {
        const val = parseInt(ans);
        if (!isNaN(val) && val >= 1 && val <= 5) {
          distribution[val - 1]++;
          sum += val;
          validCount++;
        }
      });

      const percentages = distribution.map((v) => validCount > 0 ? parseFloat((v / validCount * 100).toFixed(1)) : 0);
      const average = validCount > 0 ? parseFloat((sum / validCount).toFixed(2)) : 0;

      return {
        ...base,
        total_valid_responses: validCount,
        distribution: {
          "1_strongly_disagree": { count: distribution[0], percentage: percentages[0] },
          "2_disagree": { count: distribution[1], percentage: percentages[1] },
          "3_neutral": { count: distribution[2], percentage: percentages[2] },
          "4_agree": { count: distribution[3], percentage: percentages[3] },
          "5_strongly_agree": { count: distribution[4], percentage: percentages[4] }
        },
        average_score: average
      };
    }

    // 수치평정 (numeric_rating) - 0~10점
    if (question.question_type === 'numeric_rating') {
      const distribution = new Array(11).fill(0); // 0~10
      let sum = 0;
      let validCount = 0;

      qResponses.forEach((ans) => {
        const val = parseInt(ans);
        if (!isNaN(val) && val >= 0 && val <= 10) {
          distribution[val]++;
          sum += val;
          validCount++;
        }
      });

      const average = validCount > 0 ? parseFloat((sum / validCount).toFixed(2)) : 0;

      return {
        ...base,
        total_valid_responses: validCount,
        distribution: distribution.map((count, idx) => ({ score: idx, count })),
        average_score: average
      };
    }

    // 이미지 선택 (image_choice)
    if (question.question_type === 'image_choice') {
      const labels = question.image_descriptions || ['선택지 1', '선택지 2'];
      let count0 = 0;
      let count1 = 0;

      qResponses.forEach((ans) => {
        if (ans === '0') count0++;else
        if (ans === '1') count1++;
      });

      const total = count0 + count1;
      return {
        ...base,
        options: [
        { label: labels[0] || '선택지 1', count: count0, percentage: total > 0 ? parseFloat((count0 / total * 100).toFixed(1)) : 0 },
        { label: labels[1] || '선택지 2', count: count1, percentage: total > 0 ? parseFloat((count1 / total * 100).toFixed(1)) : 0 }]

      };
    }

    // 주관식 (short_answer)
    if (question.question_type === 'short_answer') {
      return {
        ...base,
        text_responses: qResponses
      };
    }

    // 기타 타입
    return { ...base, raw_responses: qResponses };
  };

  const structuredSurveyData = useMemo(() => {
    if (!selectedSurvey || !rootQuestions.length || !completedResponses.length) return null;

    const questionSummaries = rootQuestions.map((q) => buildStructuredSummary(q, completedResponses));

    return {
      survey_title: selectedSurvey.title,
      survey_purpose: selectedSurvey.survey_purpose || '',
      usage_purpose: selectedSurvey.usage_purpose || '',
      total_respondents: completedResponses.length,
      questions: questionSummaries
    };
  }, [selectedSurvey, rootQuestions, completedResponses]);

  const handleDownloadData = () => {
    if (!selectedSurvey || !questions || completedResponses.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    try {
      // UTF-8 BOM 추가 (Excel 한글 깨짐 방지)
      const BOM = '\uFEFF';
      let csvContent = BOM;

      // 1. Survey Overview
      csvContent += `[설문조사 개요]\n`;
      csvContent += `설문이름,"${(selectedSurvey.title || '').replace(/"/g, '""')}"\n`;
      csvContent += `목적,"${(selectedSurvey.description || '').replace(/"/g, '""')}"\n`;

      const completionRate = selectedSurvey.target_participants ?
      (completedResponses.length / selectedSurvey.target_participants * 100).toFixed(1) :
      0;
      csvContent += `목표응답자,${selectedSurvey.target_participants || 0}명,총응답자,${completedResponses.length}명\n`;
      csvContent += `완료율,${completionRate}%\n`;
      csvContent += `\n`;

      // 2. Question List
      csvContent += `[질문 리스트]\n`;
      questions.forEach((q, idx) => {
        csvContent += `Q${idx + 1},"${(q.question_text || '').replace(/"/g, '""')}"\n`;
      });
      csvContent += `\n`;

      // 3. Data Headers
      const headers = ['ID', ...questions.map((_, idx) => `Q${idx + 1}`)];
      csvContent += headers.join(',') + '\n';

      // 4. Data Rows
      completedResponses.forEach((response) => {
        // Random Unique ID
        const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();

        const rowData = [randomId];

        questions.forEach((q) => {
          const answerObj = response.answers?.find((a) => String(a.question_id) === String(q.id));
          let answerValue = answerObj ? answerObj.answer : '';

          // Format based on type
          if (q.question_type === 'ranking') {
            try {
              const parsed = JSON.parse(answerValue);
              if (typeof parsed === 'object' && parsed !== null) {
                const sorted = Object.entries(parsed).
                sort((a, b) => a[1] - b[1]).
                map((e) => e[0]);
                answerValue = sorted.join(' ; ');
              }
            } catch (e) {


              // If parsing fails, keep original
            }} else if (q.question_type === 'image_choice') {if (answerValue === '0') answerValue = '선택지 1';
            if (answerValue === '1') answerValue = '선택지 2';
          }

          // Escape quotes and wrap in quotes to handle commas
          rowData.push(`"${String(answerValue).replace(/"/g, '""')}"`);
        });

        csvContent += rowData.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedSurvey.title}_결과데이터_${formatKST(new Date(), 'yyyyMMdd')}.csv`;
      link.click();

    } catch (error) {
      console.error('Download failed:', error);
      alert('데이터 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleGenerateReport = async () => {
    if (!structuredSurveyData) return;

    setIsGeneratingReport(true);

    // 디버깅: 전송되는 전처리된 데이터 확인
    console.log('=== AI에 전송되는 Structured Data ===');
    console.log(JSON.stringify(structuredSurveyData, null, 2));

    try {
      // 시스템 프롬프트 - AI가 오직 전처리된 JSON만 사용하도록 강제
      const systemPrompt = `You are an analyst that summarizes survey results.
IMPORTANT RULES:
1. Use ONLY the structured JSON data provided.
2. DO NOT read or rely on any UI text, chart labels, tooltips, or narrative descriptions.
3. All counts and percentages must be calculated ONLY from:
   - "total_responses" / "total_respondents" / "total_selections"
   - each option's "count", "average_score", or "average_rank".
4. If there is any inconsistency between text and numbers, TRUST THE NUMBERS.
5. Respond in Korean, in a concise business report style.`;

      // 사용자 프롬프트 - 전처리된 JSON만 전달
      const userPrompt = `아래는 설문조사 결과의 전처리된 JSON 데이터입니다.
반드시 아래 JSON 데이터의 숫자만 기반으로 요약해 주세요.
UI 텍스트, 그래프, 설명 문구는 절대 참조하지 마세요.

JSON:
${JSON.stringify(structuredSurveyData, null, 2)}

출력 형식:
{
  "summary": "전체 설문에 대한 종합 요약 (3-5줄, 핵심 인사이트 포함). 반드시 JSON의 count, percentage 숫자를 인용하세요.",
  "questions": [
    {
      "qid": "question_id (문자열)",
      "type": "question_type",
      "title": "질문 제목",
      "data": {
        "labels": ["선택지1", "선택지2"],
        "values": [count1, count2],
        "percentages": [percentage1, percentage2],
        "average": average_score (수치형/리커트용),
        "average_ranks": [rank1, rank2] (순위형용),
        "distribution": [0점count, 1점count, ...] (수치평정용) 또는 [1점, 2점, 3점, 4점, 5점] (리커트용),
        "text_responses": ["답변1", "답변2"] (주관식용)
      },
      "insight": "핵심 인사이트 한 줄 (JSON의 숫자를 반드시 인용)",
      "ai_analysis": "심층 분석 2-3줄 (JSON의 숫자를 반드시 인용)"
    }
  ]
}

중요 규칙:
1. values, percentages, average 등 모든 숫자는 위 JSON의 count, percentage, average_score 값을 그대로 사용하세요.
2. 직접 계산하지 말고 JSON에 이미 계산된 값을 복사하세요.
3. insight와 ai_analysis 작성 시 반드시 구체적 수치를 인용하세요. (예: "A가 45.2%로 가장 높았으며...")
4. 리커트척도: 1-2점=부정, 3점=중립, 4-5점=긍정으로 해석하세요.`;

      const result = await InvokeLLM({
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  qid: { type: "string" },
                  type: { type: "string" },
                  title: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      labels: { type: "array", items: { type: "string" } },
                      values: { type: "array", items: { type: "number" } },
                      percentages: { type: "array", items: { type: "number" } },
                      average: { type: "number" },
                      average_ranks: { type: "array", items: { type: "number" } },
                      distribution: { type: "array", items: { type: "number" } },
                      text_responses: { type: "array", items: { type: "string" } }
                    }
                  },
                  insight: { type: "string" },
                  ai_analysis: { type: "string" }
                }
              }
            }
          }
        }
      });

      // 디버깅: AI 응답 확인
      console.log('=== AI 응답 결과 ===');
      console.log(JSON.stringify(result, null, 2));

      setAiReport(result);

      // survey_reports 테이블에 저장
      await SurveyReport.updateAiAnalysis(selectedSurvey.id, result);

    } catch (error) {
      console.error('리포트 생성 실패:', error);
      alert('리포트 생성에 실패했습니다.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20; // 그래프 바깥쪽으로 위치 조정
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if ((percentage || 0) < 1) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#333"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-bold text-xs">

        {`${(percentage || 0).toFixed(1)}%`}
      </text>);

  };

  // FE에서 직접 계산하는 함수 - AI 할루시네이션 방지
  const getCalculatedData = (questionId, questionType) => {
    const originalQ = rootQuestions.find((q) => String(q.id) === String(questionId));
    if (!originalQ) return null;

    const qResponses = completedResponses.
    map((r) => {
      const answer = r.answers?.find((a) => String(a.question_id) === String(questionId));
      return answer?.answer;
    }).
    filter((a) => a !== undefined && a !== null && a !== '');

    const totalResponses = qResponses.length;

    if (questionType === 'multiple_choice') {
      const options = originalQ.options || [];
      const counts = {};
      options.forEach((opt) => {counts[opt] = 0;});
      qResponses.forEach((ans) => {
        if (counts.hasOwnProperty(ans)) counts[ans]++;
      });
      return {
        labels: options,
        values: options.map((opt) => counts[opt] || 0),
        percentages: options.map((opt) => totalResponses > 0 ? parseFloat(((counts[opt] || 0) / totalResponses * 100).toFixed(1)) : 0)
      };
    }

    if (questionType === 'multiple_select') {
      const options = originalQ.options || [];
      const counts = {};
      options.forEach((opt) => {counts[opt] = 0;});
      qResponses.forEach((ans) => {
        const selections = ans.split(',').map((s) => s.trim());
        selections.forEach((sel) => {
          if (counts.hasOwnProperty(sel)) counts[sel]++;
        });
      });
      return {
        labels: options,
        values: options.map((opt) => counts[opt] || 0),
        percentages: options.map((opt) => totalResponses > 0 ? parseFloat(((counts[opt] || 0) / totalResponses * 100).toFixed(1)) : 0)
      };
    }

    if (questionType === 'image_choice') {
      const labels = originalQ.image_descriptions || ['선택지 1', '선택지 2'];
      let count0 = 0,count1 = 0;
      qResponses.forEach((ans) => {
        if (ans === '0') count0++;else
        if (ans === '1') count1++;
      });
      const total = count0 + count1;
      return {
        labels,
        values: [count0, count1],
        percentages: [
        total > 0 ? parseFloat((count0 / total * 100).toFixed(1)) : 0,
        total > 0 ? parseFloat((count1 / total * 100).toFixed(1)) : 0]

      };
    }

    if (questionType === 'ranking') {
      const options = originalQ.options || [];
      const rankSums = {};
      const rankCounts = {};
      options.forEach((opt) => {rankSums[opt] = 0;rankCounts[opt] = 0;});
      qResponses.forEach((ans) => {
        try {
          const parsed = JSON.parse(ans);
          Object.entries(parsed).forEach(([label, rank]) => {
            if (rankSums.hasOwnProperty(label)) {
              rankSums[label] += rank;
              rankCounts[label]++;
            }
          });
        } catch (e) {}
      });
      return {
        labels: options,
        values: options.map((opt) => rankCounts[opt] || 0),
        average_ranks: options.map((opt) => rankCounts[opt] > 0 ? parseFloat((rankSums[opt] / rankCounts[opt]).toFixed(1)) : 0)
      };
    }

    if (questionType === 'numeric_rating') {
      const distribution = new Array(11).fill(0);
      let sum = 0,validCount = 0;
      qResponses.forEach((ans) => {
        const val = parseInt(ans);
        if (!isNaN(val) && val >= 0 && val <= 10) {
          distribution[val]++;
          sum += val;
          validCount++;
        }
      });
      return {
        distribution,
        average: validCount > 0 ? parseFloat((sum / validCount).toFixed(1)) : 0
      };
    }

    if (questionType === 'likert_scale') {
      const distribution = [0, 0, 0, 0, 0];
      let sum = 0,validCount = 0;
      qResponses.forEach((ans) => {
        const val = parseInt(ans);
        if (!isNaN(val) && val >= 1 && val <= 5) {
          distribution[val - 1]++;
          sum += val;
          validCount++;
        }
      });
      return {
        distribution,
        percentages: distribution.map((v) => validCount > 0 ? parseFloat((v / validCount * 100).toFixed(1)) : 0),
        average: validCount > 0 ? parseFloat((sum / validCount).toFixed(2)) : 0
      };
    }

    if (questionType === 'short_answer') {
      return { text_responses: qResponses };
    }

    return null;
  };

  const renderQuestion = (question) => {
    const { type, title, insight, ai_analysis } = question;

    // AI 데이터 대신 FE에서 직접 계산한 데이터 사용
    const data = getCalculatedData(question.qid, type) || question.data;

    if (!data) {
      return (
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <Badge className="bg-purple-100 text-purple-700 border-0 w-fit mb-2 text-xs">
              Q{rootQuestions.findIndex((q) => q.id === question.qid) + 1}
            </Badge>
            <CardTitle className="text-base mb-2">{title}</CardTitle>
            <Badge className="bg-purple-100 text-purple-700 border-0 w-fit text-xs">
              {type === 'multiple_choice' ? '객관식' :
              type === 'multiple_select' ? '다중선택형' :
              type === 'image_choice' ? '이미지선택' :
              type === 'ranking' ? '순위형' :
              type === 'numeric_rating' ? '수치 평정형' :
              type === 'likert_scale' ? '리커트척도' :
              type === 'short_answer' ? '주관식' : type}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="py-12 text-center text-gray-400">
              아직 응답이 없습니다
            </div>
          </CardContent>
        </Card>);

    }

    // 주관식
    if (type === 'short_answer') {
      return (
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <Badge className="bg-purple-100 text-purple-700 border-0 w-fit mb-2 text-xs">
              Q{rootQuestions.findIndex((q) => q.id === question.qid) + 1}
            </Badge>
            <CardTitle className="text-base mb-2">{title}</CardTitle>
            <Badge className="bg-amber-100 text-amber-700 border-0 w-fit text-xs">주관식</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {data.text_responses && data.text_responses.map((response, idx) =>
                <div key={idx} className="bg-white rounded-lg p-3 border border-amber-100">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-amber-500 text-white border-0 text-xs flex-shrink-0">
                        #{idx + 1}
                      </Badge>
                      <p className="text-sm text-gray-700 flex-1">{response}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 text-sm text-gray-700">
              💡 {insight}
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-sm text-gray-700">
              🤖 {ai_analysis}
            </div>
          </CardContent>
        </Card>);

    }

    // 객관식 - 도넛 차트 + 표
    if (type === 'multiple_choice') {
      const chartData = (data.labels || []).map((label, idx) => ({
        name: label,
        value: data.values?.[idx] || 0,
        percentage: data.percentages?.[idx] || 0
      }));
      const maxItem = chartData.reduce((max, item) => item.value > max.value ? item : max, chartData[0] || { name: '', value: 0, percentage: 0 });

      return (
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <Badge className="bg-purple-100 text-purple-700 border-0 w-fit mb-2 text-xs">
              Q{rootQuestions.findIndex((q) => q.id === question.qid) + 1}
            </Badge>
            <CardTitle className="text-base mb-2">{title}</CardTitle>
            <Badge className="bg-blue-100 text-blue-700 border-0 w-fit text-xs">객관식</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={65} // 라벨 공간 확보를 위해 사이즈 축소
                  paddingAngle={2}
                  dataKey="value"
                  label={renderLabel}
                  labelLine={false}>

                  {chartData.map((entry, index) =>
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="text-center text-sm text-gray-700">
              <span className="font-bold" style={{ color: COLORS[chartData.indexOf(maxItem) % COLORS.length] }}>
                {maxItem.name}({(maxItem.percentage || 0).toFixed(1)}%)
              </span>
              {' '}가 가장 많았으며, {insight}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600 px-2">
                <div className="flex-1">응답</div>
                <div className="w-20 text-right">비율</div>
                <div className="w-20 text-right">응답 수</div>
              </div>
              {chartData.map((item, idx) =>
              <div key={idx} className="flex items-center gap-2 px-2">
                  <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }} />

                  <div className="flex-1 text-sm text-gray-700">{item.name}</div>
                  <div className="w-20 text-right text-sm font-bold" style={{ color: COLORS[idx % COLORS.length] }}>
                    {(item.percentage || 0).toFixed(1)}%
                  </div>
                  <div className="w-20 text-right text-sm text-gray-600">{item.value}</div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-sm text-gray-700">
              🤖 {ai_analysis}
            </div>
          </CardContent>
        </Card>);

    }

    // 다중선택형
    if (type === 'multiple_select') {
      return (
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <Badge className="bg-purple-100 text-purple-700 border-0 w-fit mb-2 text-xs">
              Q{rootQuestions.findIndex((q) => q.id === question.qid) + 1}
            </Badge>
            <CardTitle className="text-base mb-2">{title}</CardTitle>
            <Badge className="bg-violet-100 text-violet-700 border-0 w-fit text-xs">다중선택형</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.labels && data.labels.map((label, idx) =>
            <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{label}</span>
                  <span className="text-blue-600 text-sm font-bold">
                    {data.values?.[idx] || 0}명 ({(data.percentages?.[idx] || 0).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 rounded-full h-2 transition-all"

                style={{ width: `${data.percentages?.[idx] || 0}%` }} />

                </div>
              </div>
            )}

            <div className="bg-violet-50 rounded-xl p-3 text-sm text-gray-700 mt-4">
              💡 {insight}
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-sm text-gray-700">
              🤖 {ai_analysis}
            </div>
          </CardContent>
        </Card>);

    }

    // 이미지 선택형
    if (type === 'image_choice') {
      // 원본 질문에서 이미지 URL 가져오기 (ID 타입 불일치 방지를 위해 String 변환 비교)
      const originalQuestion = rootQuestions.find((q) => String(q.id) === String(question.qid));
      const imageUrls = originalQuestion?.image_urls || [];

      // 최대 비율 찾기
      const maxPercentage = Math.max(...(data.percentages || [0]));
      const maxIndex = data.percentages?.indexOf(maxPercentage) || 0;

      return (
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <Badge className="bg-purple-100 text-purple-700 border-0 w-fit mb-2 text-xs">
              Q{rootQuestions.findIndex((q) => q.id === question.qid) + 1}
            </Badge>
            <CardTitle className="text-base mb-2">{title}</CardTitle>
            <Badge className="bg-purple-100 text-purple-700 border-0 w-fit text-xs">이미지선택</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {data.labels && data.labels.map((label, idx) => {
                const percentage = data.percentages?.[idx] || 0;
                // 비율에 따라 이미지 크기 결정 (최소 80px, 최대 180px)
                const imageSize = 80 + percentage / 100 * 100;
                const isMaxPercentage = idx === maxIndex;

                return (
                  <div key={idx} className="flex items-start gap-4">
                    {/* 이미지 */}
                    <div
                      className={`rounded-2xl overflow-hidden flex-shrink-0 ${isMaxPercentage ? 'border-4 border-pink-500' : 'border-2 border-gray-200'}`}
                      style={{
                        width: `${imageSize}px`,
                        height: `${imageSize}px`
                      }}>

                      {imageUrls[idx] ?
                      <>
                          <img
                          src={imageUrls[idx]}
                          alt={label}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }} />

                          <div className="w-full h-full bg-gray-100 hidden items-center justify-center absolute top-0 left-0">
                            <span className="text-gray-400 text-xs">이미지 없음</span>
                          </div>
                        </> :

                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">이미지 없음</span>
                        </div>
                      }
                    </div>
                    
                    {/* 레이블과 막대 그래프 */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                        <Badge className="bg-purple-500 text-white border-0">
                          {percentage.toFixed(1)}% ({data.values?.[idx] || 0}명)
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            background: 'linear-gradient(to right, #EC4899, #F472B6)'
                          }} />

                      </div>
                    </div>
                  </div>);

              })}
            </div>

            {/* 인사이트 텍스트 */}
            <div className="text-sm text-gray-700 leading-relaxed">
              소비자들은{' '}
              <span className="font-bold text-pink-600">
                {data.labels?.[maxIndex]}({maxPercentage.toFixed(1)}%)
              </span>
              을 선택지{' '}
              <span className="font-bold text-gray-800">
                {data.labels?.[(maxIndex + 1) % data.labels.length]}({data.percentages?.[(maxIndex + 1) % data.labels.length]?.toFixed(1) || 0}%)
              </span>
              보다 더 많이 선호하는 것으로 나타났습니다.
            </div>

            <div className="bg-purple-50 rounded-xl p-3 text-sm text-gray-700">
              💡 {insight}
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-sm text-gray-700">
              🤖 {ai_analysis}
            </div>
          </CardContent>
        </Card>);

    }

    // 순위형
    if (type === 'ranking') {
      // 평균 순위 기준으로 정렬 (낮은 순위가 1등)
      const sortedData = (data.labels || []).map((label, idx) => ({
        label,
        rank: data.average_ranks?.[idx] || 0,
        value: data.values?.[idx] || 0
      })).sort((a, b) => a.rank - b.rank);

      const getRankEmoji = (position) => {
        if (position === 0) return '🥇';
        if (position === 1) return '🥈';
        if (position === 2) return '🥉';
        return `${position + 1}위`;
      };

      const getRankColor = (position) => {
        if (position === 0) return 'from-yellow-400 to-orange-500';
        if (position === 1) return 'from-gray-300 to-gray-400';
        if (position === 2) return 'from-orange-400 to-orange-500';
        return 'from-gray-200 to-gray-300';
      };

      return (
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <Badge className="bg-purple-100 text-purple-700 border-0 w-fit mb-2 text-xs">
              Q{rootQuestions.findIndex((q) => q.id === question.qid) + 1}
            </Badge>
            <CardTitle className="text-base mb-2">{title}</CardTitle>
            <Badge className="bg-amber-100 text-amber-700 border-0 w-fit text-xs">순위형</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 순위별로 정렬된 카드 표시 */}
            {sortedData.map((item, position) =>
            <div
              key={position}
              className={`rounded-2xl p-4 ${position < 3 ? 'bg-gradient-to-r ' + getRankColor(position) : 'bg-gray-50'} ${position === 0 ? 'shadow-lg scale-[1.02]' : ''}`}>

                <div className="flex items-center gap-3">
                  <div className="text-3xl flex-shrink-0">
                    {getRankEmoji(position)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold ${position < 3 ? 'text-white' : 'text-gray-700'} text-lg`}>
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${position < 3 ? 'bg-white/30 text-white' : 'bg-amber-500 text-white'} border-0 text-xs`}>
                        평균 {item.rank.toFixed(1)}위
                      </Badge>
                      <span className={`text-xs ${position < 3 ? 'text-white/80' : 'text-gray-500'}`}>
                        {item.value}명 선택
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-50 rounded-xl p-3 text-sm text-gray-700 mt-4">
              💡 {insight}
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-sm text-gray-700">
              🤖 {ai_analysis}
            </div>
          </CardContent>
        </Card>);

    }

    // 수치 평정형
    if (type === 'numeric_rating') {
      const maxValue = Math.max(...(data.distribution || [1]));

      return (
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <Badge className="bg-purple-100 text-purple-700 border-0 w-fit mb-2 text-xs">
              Q{rootQuestions.findIndex((q) => q.id === question.qid) + 1}
            </Badge>
            <CardTitle className="text-base mb-2">{title}</CardTitle>
            <Badge className="bg-teal-100 text-teal-700 border-0 w-fit text-xs">수치 평정형</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-gray-800">평균 {(data.average || 0).toFixed(1)}점</div>
            </div>

            <div className="flex items-end justify-between gap-1 h-48 bg-gray-50 rounded-xl p-4">
              {(data.distribution || []).map((value, idx) =>
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gray-200 rounded-t-lg relative" style={{ height: '160px' }}>
                    {value > 0 &&
                  <div
                    className="w-full rounded-t-lg absolute bottom-0 transition-all"
                    style={{
                      height: `${value / maxValue * 100}%`,
                      background: 'linear-gradient(to top, #EC4899, #F472B6)'
                    }} />

                  }
                  </div>
                  <span className="text-sm font-bold text-gray-700">{idx}</span>
                </div>
              )}
            </div>

            <div className="bg-teal-50 rounded-xl p-3 text-sm text-gray-700">
              💡 {insight}
            </div>

            <div className="bg-blue-50 rounded-xl p-3 text-sm text-gray-700">
              🤖 {ai_analysis}
            </div>
          </CardContent>
        </Card>);

    }

    // 리커트 척도
    if (type === 'likert_scale') {
      const likertLabels = ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'];
      const likertColors = ['#EC4899', '#F9A8D4', '#D1D5DB', '#93C5FD', '#3B82F6'];
      const likertColorNames = ['매우 아니다', '약간 아니다', '보통이다', '약간 그렇다', '매우 그렇다'];

      // FE에서 직접 데이터 계산 (AI 할루시네이션 방지)
      const originalQ = rootQuestions.find((q) => String(q.id) === String(question.qid));
      let distribution = [0, 0, 0, 0, 0];
      let totalCount = 0;

      if (originalQ) {
        completedResponses.forEach((r) => {
          const ans = r.answers?.find((a) => String(a.question_id) === String(originalQ.id));
          if (ans && ans.answer) {
            const val = parseInt(ans.answer);
            if (!isNaN(val) && val >= 1 && val <= 5) {
              distribution[val - 1]++;
              totalCount++;
            }
          }
        });
      } else {
        distribution = data.distribution || [0, 0, 0, 0, 0];
        totalCount = distribution.reduce((a, b) => a + b, 0);
      }

      const percentages = distribution.map((v) => totalCount > 0 ? v / totalCount * 100 : 0);
      const average = totalCount > 0 ?
      distribution.reduce((acc, curr, idx) => acc + curr * (idx + 1), 0) / totalCount :
      0;

      // 데이터 준비
      const chartData = likertLabels.map((label, idx) => ({
        name: likertColorNames[idx],
        value: distribution[idx],
        percentage: percentages[idx],
        fill: likertColors[idx]
      }));

      // 긍정/부정/중립 비율 계산
      const negativeSum = percentages[0] + percentages[1];
      const neutralSum = percentages[2];
      const positiveSum = percentages[3] + percentages[4];

      let dominantSentiment = '';
      let dominantColor = '';
      let analysisText = '';

      if (positiveSum > negativeSum && positiveSum > neutralSum) {
        dominantSentiment = '긍정적';
        dominantColor = 'text-blue-600';
        analysisText = `긍정 응답(${positiveSum.toFixed(1)}%)이 가장 높게 나타났습니다.`;
      } else if (negativeSum > positiveSum && negativeSum > neutralSum) {
        dominantSentiment = '부정적';
        dominantColor = 'text-pink-600';
        analysisText = `부정 응답(${negativeSum.toFixed(1)}%)이 가장 높게 나타났습니다.`;
      } else {
        dominantSentiment = '중립적';
        dominantColor = 'text-gray-600';
        analysisText = `중립 응답(${neutralSum.toFixed(1)}%)이 가장 높게 나타났습니다.`;
      }

      return (
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <Badge className="bg-purple-100 text-purple-700 border-0 w-fit mb-2 text-xs">
              Q{rootQuestions.findIndex((q) => q.id === question.qid) + 1}
            </Badge>
            <CardTitle className="text-base mb-2">{title}</CardTitle>
            <Badge className="bg-indigo-100 text-indigo-700 border-0 w-fit text-xs">리커트척도</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 평균 점수 표시 */}
            <div className="text-center py-2">
              <div className="text-3xl font-bold text-gray-800">평균 {average.toFixed(2)}점 <span className="text-sm font-normal text-gray-500">/ 5.0</span></div>
            </div>

            {/* 막대 그래프 (BarChart) 추가 */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border border-gray-100 shadow-lg rounded-lg text-xs">
                            <p className="font-bold">{data.name}</p>
                            <p>{data.value}명 ({data.percentage.toFixed(1)}%)</p>
                          </div>);

                      }
                      return null;
                    }} />

                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) =>
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                    )}
                    <LabelList dataKey="percentage" position="top" formatter={(val) => `${val.toFixed(1)}%`} style={{ fontSize: '11px', fill: '#666' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 연속된 바 그래프 (기존 유지 - 비율 한눈에 보기 좋음) */}
            <div className="w-full h-4 flex rounded-full overflow-hidden opacity-80">
              {percentages.map((percentage, idx) =>
              percentage > 0 &&
              <div
                key={idx}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: likertColors[idx]
                }}
                title={`${likertColorNames[idx]}: ${percentage.toFixed(1)}%`} />


              )}
            </div>

            {/* 범례 및 상세 수치 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {likertLabels.map((label, idx) =>
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: likertColors[idx] }} />

                    <span className="text-gray-700">{likertColorNames[idx]}</span>
                  </div>
                  <span className="font-bold text-gray-700">
                    {distribution[idx]}명 ({percentages[idx].toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>

            {/* 분석 요약 */}
            <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="block font-bold mb-1 text-gray-900">📊 분석 요약</span>
              전체 응답 중 <span className={`font-bold ${dominantColor}`}>{dominantSentiment}</span>인 반응이 우세하며, {analysisText}
              <br />
              (긍정 {positiveSum.toFixed(1)}% vs 부정 {negativeSum.toFixed(1)}% vs 중립 {neutralSum.toFixed(1)}%)
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 text-sm text-gray-700">
              <span className="font-bold text-indigo-800 block mb-1">💡 주요 인사이트</span>
              {insight}
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700">
               <span className="font-bold text-blue-800 block mb-1">🤖 AI 심층 분석</span>
               {ai_analysis}
            </div>
          </CardContent>
        </Card>);

    }

    return null;
  };

  if (userLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-white/50 rounded-2xl animate-pulse" />
      </div>);

  }

  return (
    <div className="space-y-6 pb-24">


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden mb-6">

        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#8B95A1] mb-6">
              <Database className="w-4 h-4" />
              설문 DATA
            </div>
            <h1 className="text-3xl font-extrabold text-[#191F28] mb-3 tracking-tight">
              설문 결과 <span className="text-[#3182F6]">인사이트</span>
            </h1>
            <p className="text-[#8B95A1] font-medium">
              AI가 분석한 시각화된 결과를 확인해보세요
            </p>
          </div>
          <div className="hidden md:flex w-16 h-16 bg-blue-50 rounded-2xl items-center justify-center text-[#3182F6]">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round">

              <path d="M3 3v18h18" />
              <motion.line
                x1="18" y1="17" x2="18" y2="9"
                animate={{ y2: [14, 6, 14] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />

              <motion.line
                x1="13" y1="17" x2="13" y2="5"
                animate={{ y2: [12, 4, 12] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />

              <motion.line
                x1="8" y1="17" x2="8" y2="14"
                animate={{ y2: [15, 8, 15] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />

            </svg>
          </div>
        </div>
      </motion.div>

      {!selectedSurvey ?
      <div className="space-y-3">
          {/* Search & Filter UI */}
          <div className="space-y-3 mb-6">
            {/* Search & Category Settings Row */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                placeholder="내 설문 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 rounded-2xl border-gray-100 bg-white focus:bg-white transition-all text-sm shadow-sm focus:ring-2 focus:ring-blue-100" />

                {searchTerm &&
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-gray-500">

                    <X className="w-3.5 h-3.5" />
                  </button>
              }
              </div>
              <Button
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              className="h-11 w-11 rounded-2xl bg-white border border-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50 shadow-sm p-0 shrink-0 transition-colors"
              title="카테고리 필터">

                <FolderPlus className="w-5 h-5" />
              </Button>
            </div>

            {/* Category Manager (Filter Add) */}
            {showCategoryManager &&
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">

                <div className="flex gap-2">
                  <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="필터할 카테고리 입력"
                className="rounded-xl h-10 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    setCategoryFilter(newCategoryName.trim());
                    setNewCategoryName('');
                    setShowCategoryManager(false);
                  }
                }} />

                  <Button
                onClick={() => {
                  if (newCategoryName.trim()) {
                    setCategoryFilter(newCategoryName.trim());
                    setNewCategoryName('');
                    setShowCategoryManager(false);
                  }
                }}
                className="bg-purple-500 hover:bg-purple-600 rounded-xl h-10 w-10 p-0">

                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
          }

            {/* 3D Status Filter Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[
            { id: 'all', label: '전체', icon: '📂', count: surveys.length, color: 'bg-gray-50', activeColor: 'bg-white', borderColor: 'border-gray-200', activeBorder: 'border-blue-200' },
            { id: 'pending', label: '대기', icon: '⏳', count: statusCounts.pending, color: 'bg-blue-50', activeColor: 'bg-blue-50', borderColor: 'border-blue-100', activeBorder: 'border-blue-200' },
            { id: 'active', label: '진행중', icon: '🔥', count: statusCounts.active, color: 'bg-orange-50', activeColor: 'bg-orange-50', borderColor: 'border-orange-100', activeBorder: 'border-orange-200' },
            { id: 'closed', label: '종료', icon: '🏁', count: statusCounts.closed, color: 'bg-green-50', activeColor: 'bg-green-50', borderColor: 'border-green-100', activeBorder: 'border-green-200' }].
            map((item) => {
              const isActive = statusFilter === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setStatusFilter(item.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0, scale: 0.98 }}
                  className={`
                      relative flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all border border-b-[4px] active:border-b-0 active:mt-[4px] active:mb-0 mb-[4px]
                      ${isActive ? `${item.activeColor} ${item.activeBorder}` : `bg-white border-gray-100`}
                    `}
                  style={{
                    boxShadow: isActive ? '0 4px 12px -2px rgba(0,0,0,0.05)' : 'none'
                  }}>

                    <span className="text-xl mb-0.5 filter drop-shadow-sm">{item.icon}</span>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                    {item.count > 0 &&
                  <span className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 text-[9px] flex items-center justify-center rounded-full font-bold ${isActive ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {item.count}
                      </span>
                  }
                  </motion.button>);

            })}
            </div>

            {/* Category Chips */}
            {allCategories.length > 0 &&
          <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar mask-linear-fade">
                <button
              onClick={() => setCategoryFilter('all')}
              className={`
                      px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border
                      ${categoryFilter === 'all' ?
              'bg-gray-800 text-white border-gray-800 shadow-md transform -translate-y-0.5' :
              'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}
                  `}>

                  전체
                </button>
                <button
              onClick={() => setCategoryFilter('uncategorized')}
              className={`
                      px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border
                      ${categoryFilter === 'uncategorized' ?
              'bg-gray-800 text-white border-gray-800 shadow-md transform -translate-y-0.5' :
              'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}
                  `}>

                  미분류
                </button>
                {allCategories.map((cat) =>
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`
                        px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border
                        ${categoryFilter === cat ?
              'bg-indigo-500 text-white border-indigo-500 shadow-md transform -translate-y-0.5' :
              'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}
                    `}>

                    #{cat}
                  </button>
            )}
              </div>
          }
          </div>

          <h3 className="text-lg font-bold text-gray-800 px-1">분석할 설문 선택</h3>
          {filteredSurveys.length === 0 ?
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">검색 결과가 없습니다</p>
                <Button
            variant="link"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setCategoryFilter('all');
            }}
            className="text-blue-500 mt-1">

                  필터 초기화
                </Button>
             </div> :

        <>
              {filteredSurveys.
          slice(0, visibleCount).
          map((survey, index) =>
          <motion.div
            key={survey.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}>

                  <Card
              className="bg-white rounded-2xl shadow-sm border-0 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setSelectedSurvey(survey)}>

                    <CardContent className="p-5">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {survey.isSample &&
                    <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 mb-2">
                              샘플 설문
                            </Badge>
                    }
                          <h4 className="font-bold text-lg text-gray-800 mb-1">{survey.title}</h4>
                          <p className="text-sm text-gray-500 mb-2">{survey.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                              {survey.completed_responses || 0}명 응답
                            </Badge>
                            <Badge className={`border-0 text-xs ${survey.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {survey.status === 'live' ? '진행중' : '종료'}
                            </Badge>
                            {survey.creator_name &&
                      <Badge className="bg-indigo-50 text-indigo-600 border-0 text-xs">
                                👤 {survey.creator_name}
                              </Badge>
                      }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
          )}
              
              {filteredSurveys.length > visibleCount &&
          <div className="relative flex flex-col items-center pt-8 pb-4 -mt-4 z-10">
                  <div className="absolute -top-24 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-white/40 to-white/90 pointer-events-none" />
                  <Button
              variant="ghost"
              onClick={() => setVisibleCount((prev) => prev + 5)}
              className="relative z-20 flex flex-col items-center gap-1 h-auto py-2 hover:bg-transparent group">

                    <span className="text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">더 보기</span>
                    <ChevronDown className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </Button>
                </div>
          }
            </>
        }
        </div> :

      <div className="space-y-6">
          {selectedSurvey.isSample &&
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-4 shadow-lg text-white text-center mb-4">

              <p className="text-sm font-bold flex items-center justify-center gap-2">
                <span>📊</span> 이 설문은 픽서치 결과 분석 기능을 체험할 수 있는 샘플 설문입니다
              </p>
            </motion.div>
        }

          <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            if (params.get('id')) {
              navigate(-1);
            } else {
              setSelectedSurvey(null);
            }
          }}
          className="w-full mb-3 bg-white text-gray-700 border border-gray-200 border-b-[4px] border-b-gray-300 rounded-xl h-12 text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:border-b-0 active:translate-y-[4px] active:mb-[4px] active:mb-[7px]">

            <ArrowLeft className="w-4 h-4 text-gray-500" />
            <span>뒤로가기</span>
          </motion.button>

          <div className="flex justify-between items-center gap-2 px-1">
            <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrintReport}
            className="flex-1 bg-white text-gray-700 border border-gray-200 border-b-[4px] border-b-gray-300 rounded-xl h-12 text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:border-b-0 active:translate-y-[4px] active:mb-[4px]">

              <FileText className="w-4 h-4 text-purple-500" />
              <span>PDF</span>
            </motion.button>

            {!aiReport && !selectedSurvey.isSample && selectedSurvey.status === 'closed' &&
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateReport}
            disabled={isGeneratingReport || !structuredSurveyData}
            className="flex-1 bg-white text-gray-700 border border-gray-200 border-b-[4px] border-b-gray-300 rounded-xl h-12 text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:border-b-0 active:translate-y-[4px] active:mb-[4px] disabled:opacity-50 disabled:cursor-not-allowed">

                {isGeneratingReport ?
            <><Loader2 className="w-4 h-4 animate-spin text-pink-500" /><span>생성중</span></> :

            <><Sparkles className="w-4 h-4 text-pink-500" /><span>AI 분석</span></>
            }
              </motion.button>
          }

            {selectedSurvey.status === 'closed' && completedResponses.length > 0 &&
          <>
                <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownloadData}
              className="flex-1 bg-white text-gray-700 border border-gray-200 border-b-[4px] border-b-gray-300 rounded-xl h-12 text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:border-b-0 active:translate-y-[4px] active:mb-[4px]">

                  <Download className="w-4 h-4 text-green-500" />
                  <span>데이터</span>
                </motion.button>
                {hyperReportData ?
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowHyperReport(true)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 border-b-[4px] border-b-purple-800 rounded-xl h-12 text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:border-b-0 active:translate-y-[4px] active:mb-[4px] shadow-lg">

                    <Sparkles className="w-4 h-4" />
                    <span>초정밀 리포트</span>
                  </motion.button> :

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateHyperPrecisionReport}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 border-b-[4px] border-b-purple-800 rounded-xl h-12 text-sm font-bold transition-all flex items-center justify-center gap-1.5 active:border-b-0 active:translate-y-[4px] active:mb-[4px] shadow-lg">

                    <Sparkles className="w-4 h-4" />
                    <span>초정밀 AI</span>
                  </motion.button>
            }
              </>
          }
          </div>

          <div className="grid grid-cols-3 gap-2">
            <motion.div
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl border border-gray-200 border-b-[4px] border-b-gray-300 p-3 flex flex-col items-center justify-center h-24">

              <div className="text-[10px] font-bold text-gray-400 mb-1">총 예산</div>
              <div className="text-lg font-extrabold text-gray-800 tracking-tight">
                 {(selectedSurvey.total_cost || 0).toLocaleString()}
              </div>
              <div className="w-8 h-0.5 bg-yellow-400 rounded-full mt-2 opacity-50"></div>
            </motion.div>

            <motion.div
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl border border-gray-200 border-b-[4px] border-b-gray-300 p-3 flex flex-col items-center justify-center h-24">

              <div className="text-[10px] font-bold text-gray-400 mb-1">총 응답자</div>
              <div className="text-lg font-extrabold text-gray-800 tracking-tight">
                 {completedResponses.length.toLocaleString()}
              </div>
              <div className="w-8 h-0.5 bg-blue-400 rounded-full mt-2 opacity-50"></div>
            </motion.div>

            <motion.div
            whileHover={{ y: -2 }}
            className="bg-white rounded-xl border border-gray-200 border-b-[4px] border-b-gray-300 p-3 flex flex-col items-center justify-center h-24">

              <div className="text-[10px] font-bold text-gray-400 mb-1">1인당 비용</div>
              <div className="text-lg font-extrabold text-gray-800 tracking-tight">
                {completedResponses.length > 0 ?
              Math.round((selectedSurvey.total_cost || 0) / completedResponses.length).toLocaleString() :
              0}
              </div>
              <div className="w-8 h-0.5 bg-green-400 rounded-full mt-2 opacity-50"></div>
            </motion.div>
          </div>

          <style>{`
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden;
              }
              #ai-report-container, #ai-report-container * {
                visibility: visible;
              }
              #ai-report-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <AnimatePresence>
            {aiReport &&
          <motion.div
            id="ai-report-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4">

                <motion.div
              className="bg-white rounded-[24px] border border-gray-200 border-b-[4px] border-b-gray-300 shadow-sm overflow-hidden mb-6"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}>

                  {/* Header Strip */}
                  <div className="bg-blue-50/80 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <div className="bg-blue-500 text-white p-1.5 rounded-lg shadow-sm">
                         <Sparkles className="w-4 h-4" />
                       </div>
                       <span className="font-extrabold text-blue-600 tracking-tight">AI 분석 리포트</span>
                     </div>
                     <span className="text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded-lg border border-gray-100">
                        {formatKST(new Date(), 'yyyy.MM.dd')}
                     </span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
                      {selectedSurvey.title}
                    </h3>

                    <div className="space-y-3">
                      {(aiReport.summary || "").split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;

                    // Header detection (ends with :)
                    if (trimmed.endsWith(':')) {
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="pt-6 pb-3 flex items-center gap-2">

                              <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                              <h4 className="text-lg font-bold text-gray-800">
                                {trimmed.replace(':', '')}
                              </h4>
                            </motion.div>);

                    }

                    // Bullet point detection
                    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                      const content = trimmed.substring(1).trim();
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">

                              <div className="flex-shrink-0 mt-0.5 text-blue-500 bg-white p-1 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed font-medium">
                                {content.split(/'([^']+)'/).map((part, idx) =>
                            idx % 2 === 1 ? <span key={idx} className="text-blue-600 font-extrabold bg-blue-50 px-1 rounded">'{part}'</span> : part
                            )}
                              </p>
                            </motion.div>);

                    }

                    // Normal text
                    return (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-gray-600 leading-relaxed text-sm font-medium bg-gray-50/50 p-3 rounded-xl">

                            {trimmed}
                          </motion.p>);

                  })}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                       <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                         <Info className="w-3 h-3" />
                         <span>AI 분석 결과는 참고용으로 활용해주세요</span>
                       </div>
                    </div>
                  </div>
                </motion.div>

                {aiReport.questions?.map((question, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}>

                    {renderQuestion(question)}
                  </motion.div>
            )}
              </motion.div>
          }
          </AnimatePresence>

          {!aiReport && completedResponses.length === 0 &&
        <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">아직 응답이 없습니다</h3>
                <p className="text-sm text-gray-500">응답이 수집되면 AI 분석을 시작할 수 있습니다</p>
              </CardContent>
            </Card>
        }

          {/* Hyper Precision Report Modal */}
          <AnimatePresence>
            {showHyperReport &&
          <>
                <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowHyperReport(false)} />

                <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-4 left-4 right-4 bottom-4 md:top-8 md:left-8 md:right-8 md:bottom-8 max-h-[90vh] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col">

                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">초정밀 AI 분석 리포트</h2>
                      </div>
                    </div>
                    <button
                  onClick={() => setShowHyperReport(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">

                      <X className="w-6 h-6 text-white" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                    {generatingHyperReport ?
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                        <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full" />

                        <div className="text-center space-y-2">
                          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2 justify-center">
                            <Sparkles className="w-6 h-6 text-purple-600" />
                            심층 리포트 생성 중...
                          </h3>
                          <p className="text-gray-500">전문 컨설턴트 수준의 분석을 진행하고 있습니다</p>
                          <p className="text-sm text-gray-400">약 30-60초 소요됩니다</p>
                        </div>
                      </div> :
                hyperReportData ?
                <div className="max-w-4xl mx-auto">
                        <div className="prose prose-lg max-w-none">
                          <ReactMarkdown
                      components={{
                        h2: ({ node, ...props }) =>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b-2 border-purple-200" {...props} />,

                        h3: ({ node, ...props }) =>
                        <h3 className="text-xl font-bold text-gray-800 mt-6 mb-3" {...props} />,

                        p: ({ node, ...props }) =>
                        <p className="text-gray-700 leading-relaxed mb-4" {...props} />,

                        ul: ({ node, ...props }) =>
                        <ul className="list-disc pl-6 space-y-2 mb-4" {...props} />,

                        li: ({ node, ...props }) =>
                        <li className="text-gray-700" {...props} />,

                        strong: ({ node, ...props }) =>
                        <strong className="font-bold text-gray-900" {...props} />

                      }}>

                            {hyperReportData}
                          </ReactMarkdown>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
                          <Button
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>초정밀 AI 분석 리포트</title>
                                    <style>
                                      body { font-family: 'Noto Sans KR', sans-serif; padding: 40px; line-height: 1.8; }
                                      h1 { color: #7c3aed; font-size: 28px; margin-bottom: 30px; }
                                      h2 { color: #7c3aed; border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-top: 40px; margin-bottom: 20px; font-size: 24px; }
                                      h3 { color: #4f46e5; margin-top: 20px; font-size: 18px; }
                                      p, li { line-height: 1.8; color: #333; }
                                      ul { padding-left: 20px; margin: 15px 0; }
                                      strong { color: #000; font-weight: 700; }
                                      .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
                                    </style>
                                  </head>
                                  <body>
                                    <h1>🎯 초정밀 AI 분석 리포트</h1>
                                    <div class="meta">
                                      <p><strong>설문:</strong> ${selectedSurvey?.title}</p>
                                      <p><strong>생성일:</strong> ${formatKST(new Date(), 'yyyy년 MM월 dd일')}</p>
                                    </div>
                                    <hr/>
                                    ${hyperReportData.replace(/\n/g, '<br/>')}
                                  </body>
                                </html>
                              `);
                        printWindow.document.close();
                        printWindow.print();
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white">

                            <Download className="w-4 h-4 mr-2" />
                            PDF로 저장
                          </Button>
                        </div>
                      </div> :
                null}
                  </div>
                </motion.div>
              </>
          }
          </AnimatePresence>
        </div>
      }
    </div>);

}