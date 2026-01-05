import React, { useState, useEffect } from "react";
import { auth } from "@/api/auth";
import { Survey, Question, Response, SurveyCategory } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl, formatKST } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, BarChart3, Users, Clock, CheckCircle, AlertCircle, ExternalLink, Target, FolderPlus, Folder, Edit2, Trash2, X, Copy, ChevronDown, Search, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MySurveys() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);
  const [deletingCategory, setDeletingCategory] = useState(null);

  const [editingSurvey, setEditingSurvey] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    target_participants: 0,
    total_cost: 0
  });

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await auth.me();
      } catch (error) {
        return null;
      }
    },
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false
  });

  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ['mySurveys', user?.email, user?.role],
    queryFn: async () => {
      if (!user?.email) return [];
      let result = [];
      if (user.role === 'admin') {
        const listResult = await Survey.list({ limit: 1000 });
        result = listResult.data || [];
      } else {
        result = await Survey.getMine();
      }
      return result.filter((s) => s.status !== 'preview');
    },
    enabled: !!user?.email,
    staleTime: 30000,
    cacheTime: 600000,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    keepPreviousData: true
  });

  // DB에서 카테고리 목록 가져오기
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['surveyCategories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await SurveyCategory.list();
    },
    enabled: !!user,
    staleTime: 30000
  });

  const updateSurveyCategoryMutation = useMutation({
    mutationFn: async ({ surveyId, category }) => {
      await Survey.update(surveyId, { category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mySurveys']);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryName) => {
      const surveysInCategory = surveys.filter((s) => s.category === categoryName);
      await Promise.all(
        surveysInCategory.map((s) => Survey.update(s.id, { category: null }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mySurveys']);
      setDeletingCategory(null);
      alert('카테고리가 삭제되었습니다.');
    }
  });

  const updateSurveyDetailsMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await Survey.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mySurveys']);
      setEditingSurvey(null);
      alert('설문 정보가 수정되었습니다.');
    }
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

  const deleteSurveyMutation = useMutation({
    mutationFn: async (surveyId) => {
      const questions = await Question.filter({ survey_id: surveyId });
      await Promise.all(questions.map((q) => Question.delete(q.id)));

      const responses = await Response.filter({ survey_id: surveyId });
      await Promise.all(responses.map((r) => Response.delete(r.id)));

      await Survey.delete(surveyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mySurveys']);
      alert('설문조사가 삭제되었습니다.');
    }
  });

  const closeSurveyMutation = useMutation({
    mutationFn: async (surveyId) => {
      const today = new Date().toISOString();
      await Survey.update(surveyId, {
        status: 'closed',
        scheduled_end: today
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mySurveys']);
      alert('설문조사가 완료(종료)되었습니다.');
    }
  });

  const copySurvey = async (survey) => {
    try {
      const questions = await Question.filter({ survey_id: survey.id }, 'order');

      const isFreeSurvey = survey.survey_type === 'free';

      localStorage.setItem('copied_survey', JSON.stringify({
        title: survey.title + ' (복사본)',
        description: survey.description,
        survey_purpose: survey.survey_purpose || '',
        usage_purpose: survey.usage_purpose || '',
        survey_type: survey.survey_type || 'basic',
        target_options: survey.target_options || null,
        scheduled_start: survey.scheduled_start || null,
        scheduled_end: survey.scheduled_end || null,
        slot_count: survey.slot_count || 1,
        landing_enabled: survey.landing_enabled || false,
        landing_page_url: survey.landing_page_url || '',
        questions: questions.map((q, idx) => ({
          id: Date.now() + idx,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          image_urls: q.image_urls || [],
          image_descriptions: q.image_descriptions || [],
          max_selections: q.max_selections,
          branch_targets: q.branch_targets,
          order: idx,
          cost: q.cost
        }))
      }));

      if (isFreeSurvey) {
        navigate(createPageUrl('CreateFreeSurvey') + '?copy=true');
      } else {
        navigate(createPageUrl('CreateSurvey') + '?copy=true');
      }
    } catch (error) {
      alert('설문 복사에 실패했습니다: ' + error.message);
    }
  };

  const allCategories = React.useMemo(() => {
    // DB에서 가져온 카테고리 이름들
    const dbCategoryNames = dbCategories.map(c => c.name);
    // 설문에 할당된 카테고리들 (본인 설문에만 있는 것들)
    const surveyCategories = surveys
      .map((s) => s.category)
      .filter((c) => c && c.trim() !== '');
    // 합치고 중복 제거
    const combined = [...new Set([...dbCategoryNames, ...surveyCategories])];
    return combined.sort();
  }, [surveys, dbCategories]);

  // 카테고리 생성 mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (name) => {
      return await SurveyCategory.create(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['surveyCategories']);
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  // 카테고리 삭제 mutation (DB에서)
  const deleteCategoryByNameMutation = useMutation({
    mutationFn: async (name) => {
      return await SurveyCategory.deleteByName(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['surveyCategories']);
    }
  });

  const addCategory = (name) => {
    if (name && name.trim() && !allCategories.includes(name.trim())) {
      createCategoryMutation.mutate(name.trim());
    }
    setNewCategoryName('');
  };

  const removeCustomCategory = (name) => {
    // DB에서 카테고리 삭제
    const categoryInDb = dbCategories.find(c => c.name === name);
    if (categoryInDb) {
      deleteCategoryByNameMutation.mutate(name);
    }
  };

  const defaultStatus = { label: '알수없음', color: 'bg-gray-100 text-gray-700', icon: AlertCircle };
  const statusConfig = {
    draft: { label: '임시저장', color: 'bg-gray-100 text-gray-700', icon: Edit2 },
    pending: { label: '설문대기', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    review: { label: '설문대기', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    scheduled: { label: '예약됨', color: 'bg-blue-100 text-blue-700', icon: Clock },
    live: { label: '진행중', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    closed: { label: '종료', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
    rejected: { label: '설문대기', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle }
  };

  const getTierName = (type) => {
    switch (type) {
      case 'basic': return '베이직';
      case 'standard': return '스탠다드';
      case 'premium': return '프리미엄';
      case 'vip': return 'VIP';
      case 'targeted': return '타겟 설문';
      case 'paid': return '타겟 설문';
      case 'free': return '무료설문';
      default: return '타겟 설문';
    }
  };

  const getTargetSummary = (survey) => {
    if (survey.target_persona) {
      return survey.target_persona.length > 15 ? survey.target_persona.substring(0, 15) + '...' : survey.target_persona;
    }

    if (survey.target_options?.cells?.[0]?.targets) {
      const targets = survey.target_options.cells[0].targets;
      const parts = [];

      if (targets.DEMO?.gender) parts.push(targets.DEMO.gender === 'M' ? '남성' : '여성');
      if (targets.DEMO?.age_10s) parts.push(`${targets.DEMO.age_10s.length}개 연령대`);

      if (parts.length > 0) return parts.join(', ');
      if (Object.keys(targets).length > 0) return '상세 타겟 설정됨';
    }

    if (survey.survey_type === 'basic') return '불특정 다수';

    return '전체';
  };

  const getSurveyUrl = (survey) => {
    return `${window.location.origin}${createPageUrl('TakeSurvey')}?key=${survey.secret_key}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('URL이 복사되었습니다!');
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

  const filteredSurveys = React.useMemo(() => {
    return surveys.filter((survey) => {
      const statusMatch = statusFilter === 'all' || survey.status === statusFilter;
      const categoryMatch = categoryFilter === 'all' || (
        categoryFilter === 'uncategorized' ? !survey.category : survey.category === categoryFilter);
      const searchMatch = !searchTerm ||
        survey.title && survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        survey.description && survey.description.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && categoryMatch && searchMatch;
    });
  }, [surveys, statusFilter, categoryFilter, searchTerm]);

  React.useEffect(() => {
    setVisibleCount(5);
  }, [statusFilter, categoryFilter]);

  const statusCounts = React.useMemo(() => {
    return {
      pending: surveys.filter((s) => s.status === 'pending').length,
      review: surveys.filter((s) => s.status === 'review').length,
      scheduled: surveys.filter((s) => s.status === 'scheduled').length,
      live: surveys.filter((s) => s.status === 'live').length,
      closed: surveys.filter((s) => s.status === 'closed').length,
      rejected: surveys.filter((s) => s.status === 'rejected').length
    };
  }, [surveys]);

  if (userLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) =>
          <div key={i} className="h-32 bg-white/50 rounded-2xl animate-pulse" />
        )}
      </div>);

  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-gray-500 mb-4">로그인이 필요합니다</p>
        <Button onClick={() => auth.redirectToLogin(window.location.pathname)}>
          로그인하기
        </Button>
      </div>);

  }

  return (
    <div className="min-h-screen bg-[#F2F4F6] pb-20">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">

          <div className="relative z-10 flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold text-[#191F28] mb-2 tracking-tight">
                내 <span className="text-blue-600">설문</span>
              </h1>
              <p className="text-[#8B95A1] text-sm font-medium">
                내가 만든 설문을 관리하세요
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Link to={`${createPageUrl("CreateSurvey")}?start=1`}>
                <Button className="bg-[#3182F6] hover:bg-[#1B64DA] text-white rounded-xl h-9 font-bold text-xs shadow-sm px-3">
                  + 타겟 설문
                </Button>
              </Link>
              <Link to={createPageUrl("CreateFreeSurvey")}>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-9 font-bold text-xs shadow-sm px-3">
                  + 무료 설문
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Delete Category Confirmation Modal */}
        {deletingCategory &&
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
              <h2 className="text-lg font-bold text-gray-800">카테고리를 삭제하시겠습니까?</h2>
              <p className="text-sm text-gray-600">
                카테고리만 삭제되며, 설문은 삭제되지 않습니다.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeletingCategory(null)}
                  className="flex-1 rounded-xl">

                  아니오
                </Button>
                <Button
                  onClick={() => deleteCategoryMutation.mutate(deletingCategory)}
                  disabled={deleteCategoryMutation.isPending}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl">

                  예
                </Button>
              </div>
            </div>
          </div>
        }

        {/* Edit Survey Modal */}
        {editingSurvey &&
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
              <h2 className="text-xl font-bold text-gray-800">설문 정보 수정 (관리자)</h2>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">설문 제목</label>
                  <Input
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="rounded-xl" />

                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">설문 설명</label>
                  <Input
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="rounded-xl" />

                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">목표 참여자 수</label>
                    <Input
                      type="number"
                      value={editFormData.target_participants}
                      onChange={(e) => setEditFormData({ ...editFormData, target_participants: parseInt(e.target.value) || 0 })}
                      className="rounded-xl" />

                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">총 비용 (크레딧)</label>
                    <Input
                      type="number"
                      value={editFormData.total_cost}
                      onChange={(e) => setEditFormData({ ...editFormData, total_cost: parseInt(e.target.value) || 0 })}
                      className="rounded-xl" />

                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingSurvey(null)}
                  className="rounded-xl">

                  취소
                </Button>
                <Button
                  onClick={() => updateSurveyDetailsMutation.mutate({
                    id: editingSurvey.id,
                    data: editFormData
                  })}
                  disabled={updateSurveyDetailsMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl">

                  수정 완료
                </Button>
              </div>
            </div>
          </div>
        }

        {/* Filters & Search Area */}
        <div className="space-y-3">
          {/* Search & Filter Row */}
          <div className="flex gap-2 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 rounded-xl bg-white border-gray-200 h-11 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 ({surveys.length})</SelectItem>
                <SelectItem value="pending">입금대기 ({statusCounts.pending})</SelectItem>
                <SelectItem value="review">검토중 ({statusCounts.review})</SelectItem>
                <SelectItem value="scheduled">진행예정 ({statusCounts.scheduled})</SelectItem>
                <SelectItem value="live">진행중 ({statusCounts.live})</SelectItem>
                <SelectItem value="closed">종료 ({statusCounts.closed})</SelectItem>
                <SelectItem value="rejected">거절됨 ({statusCounts.rejected})</SelectItem>
              </SelectContent>
            </Select>

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
              title="카테고리 관리">

              <FolderPlus className="w-5 h-5" />
            </Button>
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

        {/* Category Manager */}
        {showCategoryManager &&
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">카테고리 관리</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCategoryManager(false)}>

                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="새 카테고리 이름"
                  className="rounded-xl"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newCategoryName.trim()) {
                      addCategory(newCategoryName);
                    }
                  }} />

                <Button
                  onClick={() => addCategory(newCategoryName)}
                  className="bg-blue-500 hover:bg-blue-600 rounded-xl">

                  <FolderPlus className="w-4 h-4" />
                </Button>
              </div>
              {allCategories.length > 0 &&
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">카테고리 목록</div>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map((cat) => {
                      const isFromSurvey = surveys.some(s => s.category === cat);
                      const isInDb = dbCategories.some(c => c.name === cat);
                      return (
                        <Badge key={cat} className="bg-blue-100 text-blue-700 border-0 pl-3 pr-2 py-1.5 flex items-center gap-2">
                          <Folder className="w-3 h-3" />
                          {cat}
                          <button
                            onClick={() => {
                              if (isFromSurvey) {
                                setDeletingCategory(cat);
                              } else if (isInDb) {
                                removeCustomCategory(cat);
                              }
                            }}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                            title={isFromSurvey ? "설문에서 카테고리 해제" : "카테고리 삭제"}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              }
              {allCategories.length === 0 &&
                <div className="text-xs text-gray-400 text-center py-2">
                  카테고리가 없습니다. 위에서 새 카테고리를 추가하세요.
                </div>
              }
            </CardContent>
          </Card>
        }

        {/* Survey List */}
        <div className="space-y-3">
          {filteredSurveys.length === 0 ?
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-8 text-center shadow-sm">

              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-[#8B95A1] mb-4">
                {surveys.length === 0 ? '아직 생성된 설문조사가 없습니다' : '해당하는 설문조사가 없습니다'}
              </p>
              {surveys.length === 0 &&
                <Link to={createPageUrl("CreateSurvey")}>
                  <Button className="bg-[#3182F6] hover:bg-[#1B64DA] text-white shadow-sm">
                    첫 설문조사 만들기
                  </Button>
                </Link>
              }
            </motion.div> :

            <>
              {filteredSurveys.slice(0, visibleCount).map((survey, index) => {
                const statusInfo = statusConfig[survey.status] || defaultStatus;
                const StatusIcon = statusInfo.icon;
                const actualCompletedCount = survey.completed_responses || 0;

                return (
                  <motion.div
                    key={survey.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group">

                    <div className="bg-white rounded-[24px] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 relative">
                      <div className={`h-1.5 w-full ${survey.status === 'live' ? 'bg-green-500' :
                        survey.status === 'draft' ? 'bg-gray-300' :
                          survey.status === 'closed' ? 'bg-blue-500' : 'bg-orange-400'}`
                      } />

                      <div className="p-6 pb-5">
                        {/* Title First */}
                        <div className="mb-3 pr-10">
                          <h3 className="text-xl font-extrabold text-gray-900 mb-2 leading-snug tracking-tight break-words">
                            {survey.title}
                          </h3>

                          {/* Status & Tier Badges */}
                          <div className="flex flex-wrap gap-1.5 items-center mb-2">
                            {survey.status === 'rejected' &&
                              <Badge className="bg-red-100 text-red-700 border-0 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                거절됨
                              </Badge>
                            }
                            <Badge className={`${statusInfo.color} border-0 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <Badge className={`${survey.survey_type === 'free' ? 'bg-gray-50 text-gray-500' : 'bg-[#bfdbfe] text-blue-700'} border-0 px-2.5 py-1 rounded-lg text-[11px] font-medium`}>
                              {getTierName(survey.survey_type)}
                            </Badge>
                            {survey.category &&
                              <Badge className="bg-sky-50 text-blue-500 px-2.5 py-1 font-medium rounded-lg inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent shadow hover:bg-primary/80 border-0">
                                <Folder className="w-3 h-3 mr-1" />
                                {survey.category}
                              </Badge>
                            }
                          </div>

                          {/* Creation Date */}
                          <div className="text-sm text-gray-500">
                            {formatKST(survey.created_at)}
                          </div>
                        </div>

                        {/* Integrated Menu */}
                        <div className="absolute top-6 right-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full">
                                <MoreHorizontal className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-gray-100 shadow-lg">
                              <DropdownMenuItem onClick={() => copySurvey(survey)}>
                                <Copy className="w-4 h-4 mr-2" />
                                설문 복사
                              </DropdownMenuItem>
                              {survey.status === 'live' &&
                                <DropdownMenuItem onClick={() => copyToClipboard(getSurveyUrl(survey))}>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  링크 복사
                                </DropdownMenuItem>
                              }
                              <div className="h-px bg-gray-100 my-1" />
                              <DropdownMenuItem onClick={() => {
                                const newCat = prompt('새 카테고리 이름을 입력하세요');
                                if (newCat && newCat.trim()) {
                                  updateSurveyCategoryMutation.mutate({ surveyId: survey.id, category: newCat.trim() });
                                }
                              }}>
                                <FolderPlus className="w-4 h-4 mr-2" />
                                새 카테고리...
                              </DropdownMenuItem>
                              {allCategories.map((cat) =>
                                <DropdownMenuItem key={cat} onClick={() => updateSurveyCategoryMutation.mutate({ surveyId: survey.id, category: cat })}>
                                  <Folder className="w-4 h-4 mr-2" />
                                  {cat}로 이동
                                </DropdownMenuItem>
                              )}
                              {(user?.role === 'admin' || survey.status === 'draft') &&
                                <>
                                  <div className="h-px bg-gray-100 my-1" />
                                  {user?.role === 'admin' &&
                                    <DropdownMenuItem onClick={() => openEditModal(survey)}>
                                      <Edit2 className="w-4 h-4 mr-2" />
                                      설문 수정 (관리자)
                                    </DropdownMenuItem>
                                  }
                                  <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => {
                                    if (confirm('삭제하시겠습니까?')) deleteSurveyMutation.mutate(survey.id);
                                  }}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    설문 삭제
                                  </DropdownMenuItem>
                                </>
                              }
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Stats Grid */}
                        {survey.status !== 'draft' &&
                          <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 mb-5">
                            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                              <div>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
                                  <Clock className="w-3.5 h-3.5" /> 설문 기간
                                </div>
                                <div className="text-sm font-bold text-gray-700 tracking-tight leading-tight">
                                  {formatKST(survey.scheduled_start, 'yyyy.MM.dd')} ~
                                  <br />
                                  {formatKST(survey.scheduled_end, 'yyyy.MM.dd')}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-500 mb-1.5">
                                  <Users className="w-3.5 h-3.5" /> 실시간 참여자
                                </div>
                                <div className="text-2xl font-black text-blue-600">
                                  {actualCompletedCount?.toLocaleString()}<span className="text-sm ml-0.5 font-bold text-blue-400">명</span>
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-medium text-gray-400 mb-1.5">총 예산</div>
                                <div className="text-base font-bold text-gray-900">
                                  {survey.total_cost?.toLocaleString()}<span className="text-xs ml-0.5 font-medium text-gray-500">원</span>
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-medium text-gray-400 mb-1.5">1인당 수집 비용</div>
                                <div className="text-base font-bold text-blue-500">
                                  {actualCompletedCount > 0 ? Math.round(survey.total_cost / actualCompletedCount).toLocaleString() : 0}
                                  <span className="text-xs ml-0.5 font-medium text-blue-300">원</span>
                                </div>
                              </div>
                            </div>

                            {survey.target_persona &&
                              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center text-xs text-gray-500 font-medium">
                                <Target className="w-3.5 h-3.5 mr-2 text-gray-400" />
                                <span className="truncate text-gray-600">{getTargetSummary(survey)}</span>
                              </div>
                            }
                          </div>
                        }

                        {/* Actions Footer */}
                        <div className="flex gap-2">
                          {survey.status === 'draft' &&
                            <Link to={survey.survey_type === 'free' ? `${createPageUrl('CreateFreeSurvey')}?draft=${survey.id}` : `${createPageUrl('CreateSurvey')}?draft=${survey.id}`} className="w-full">
                              <Button className={`w-full ${survey.survey_type === 'free' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100' : 'bg-[#3182F6] hover:bg-[#1B64DA] shadow-blue-100'} text-white rounded-xl h-11 font-bold shadow-lg transition-all active:scale-[0.98]`}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                이어서 작성하기
                              </Button>
                            </Link>
                          }

                          {(survey.status === 'pending' || survey.status === 'review' || survey.status === 'scheduled') &&
                            <div className="w-full bg-yellow-50 text-yellow-700 rounded-xl p-3 text-sm font-medium text-center border border-yellow-100 flex items-center justify-center gap-2">
                              <Clock className="w-4 h-4" />
                              매체사 확인 후 시작일에 설문이 시작됩니다
                            </div>
                          }

                          {survey.status === 'rejected' &&
                            <div className="w-full space-y-2">
                              <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm border border-red-200">
                                <div className="font-bold mb-1 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  거절 사유
                                </div>
                                <div className="text-red-600">{survey.rejection_reason || '사유가 제공되지 않았습니다.'}</div>
                              </div>
                              <div className="bg-slate-50 text-slate-800 p-2 text-xs text-center rounded-xl border border-green-100">
                                💰 결제하신 크레딧 {survey.total_cost?.toLocaleString()}원이 환불되었습니다
                              </div>
                            </div>
                          }

                          {survey.status === 'live' && survey.survey_type !== 'free' &&
                            <Link to={`${createPageUrl('SurveyDetail')}?id=${survey.id}`} className="w-full">
                              <Button className="w-full bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-200 rounded-xl h-11 font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                실시간 응답 확인
                              </Button>
                            </Link>
                          }

                          {survey.status === 'live' && survey.survey_type === 'free' &&
                            <Link to={`${createPageUrl('FreeSurveyResults')}?id=${survey.id}`} className="w-full">
                              <Button className="w-full bg-white hover:bg-emerald-50 text-emerald-600 border-2 border-emerald-200 rounded-xl h-11 font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                실시간 응답 확인
                              </Button>
                            </Link>
                          }

                          {survey.status === 'closed' && survey.survey_type !== 'free' &&
                            <Link to={`${createPageUrl('SurveyResults')}?id=${survey.id}`} className="w-full">
                              <Button className="w-full bg-blue-600 border-2 border-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                설문 결과 인사이트
                              </Button>
                            </Link>
                          }

                          {survey.status === 'closed' && survey.survey_type === 'free' &&
                            <Link to={`${createPageUrl('FreeSurveyResults')}?id=${survey.id}`} className="w-full">
                              <Button className="w-full bg-emerald-500 border-2 border-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-11 font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                결과 보기
                              </Button>
                            </Link>
                          }

                        </div>
                      </div>
                    </div>
                  </motion.div>);

              })}

              {filteredSurveys.length > visibleCount &&
                <div className="flex justify-center pt-6 pb-8">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                    className="rounded-full px-8 py-6 h-auto bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md group">

                    <span className="text-sm font-bold mr-2">더 보기</span>
                    <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  </Button>
                </div>
              }
            </>
          }
        </div>
      </div>
    </div>);

}