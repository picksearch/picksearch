import React, { useState } from "react";
import { auth } from "@/api/auth";
import { Payment, Survey, SystemConfig, SurveyCategory, SupportTicket } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Coins, CheckCircle, XCircle, Clock, Settings,
  Users, Crown, UserCog, Home, LayoutDashboard, FileSpreadsheet,
  LogOut, Menu, X, ExternalLink, MessageSquare, FolderOpen, Trash2
} from "lucide-react";
import AdminSupportManager from "@/components/admin/AdminSupportManager";
import SEOSettingsManager from "@/components/admin/SEOSettingsManager";
import CustomerMemoModal from "@/components/admin/CustomerMemoModal";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl, formatKST } from "@/utils";

// Import OrderManagement to use as a component
import OrderManagement from "./OrderManagement";

export default function AdminSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [selectedUserForMemo, setSelectedUserForMemo] = useState(null);
  const [selectedUserForTickets, setSelectedUserForTickets] = useState(null);

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => auth.me(),
    retry: false,
  });

  // Stats Queries (for Dashboard)
  const { data: allCredits = [] } = useQuery({
    queryKey: ['allCredits'],
    queryFn: async () => {
      const pending = await Payment.filter({ status: 'pending' }, 'created_at', false);
      const confirmed = await Payment.filter({ status: 'confirmed' }, 'created_at', false);
      return [...pending, ...confirmed].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
  });

  // 대기중인 입금만 필터 (대시보드용)
  const pendingCredits = allCredits.filter(c => c.status === 'pending');

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // 전체 문의 내역 조회
  const { data: allTickets = [] } = useQuery({
    queryKey: ['allTickets'],
    queryFn: () => SupportTicket.getAll(),
  });

  // 사용자별 문의 수 계산
  const getTicketCountByUser = (userId) => {
    return allTickets.filter(t => t.user_id === userId).length;
  };

  // 사용자별 문의 내역 가져오기
  const getTicketsByUser = (userId) => {
    return allTickets.filter(t => t.user_id === userId);
  };

  const { data: pendingSurveys = [] } = useQuery({
    queryKey: ['pendingSurveysCount'],
    queryFn: () => Survey.filter({ status: 'pending' }),
  });

  const { data: systemConfig, refetch: refetchConfig } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: () => SystemConfig.list(),
  });

  // 카테고리 목록 조회 (admin은 전체)
  const { data: allCategories = [] } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => SurveyCategory.list(),
  });

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, value }) => {
      console.log('Saving bank account:', { id, value });
      if (id) {
        await SystemConfig.update(id, { value });
      } else {
        await SystemConfig.create({
          key: 'bank_account',
          value,
          description: '무통장 입금 계좌 정보'
        });
      }
    },
    onSuccess: () => {
      refetchConfig();
      alert('설정이 저장되었습니다.');
    },
    onError: (error) => {
      console.error('Save failed:', error);
      alert('저장 실패: ' + error.message);
    },
  });

  const approveCreditMutation = useMutation({
    mutationFn: async (transaction) => {
      // 더블 체크: 트랜잭션의 최신 상태를 서버에서 다시 확인
      const currentTxs = await Payment.filter({ id: transaction.id });
      if (!currentTxs || currentTxs.length === 0) {
        throw new Error("트랜잭션을 찾을 수 없습니다.");
      }

      const currentTx = currentTxs[0];
      if (currentTx.status !== 'pending') {
        throw new Error("이미 처리된 요청입니다.");
      }

      // Payment 상태를 confirmed로 변경
      await Payment.update(transaction.id, { status: 'confirmed' });

      // 해당 설문의 status를 review로, payment_status를 paid로 변경
      if (transaction.survey_id) {
        await Survey.update(transaction.survey_id, {
          status: 'review',
          payment_status: 'paid'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allCredits']);
      queryClient.invalidateQueries(['pendingSurveysCount']);
      alert('입금이 확인되었습니다.');
    },
    onError: (error) => {
      queryClient.invalidateQueries(['allCredits']);
      alert(error.message || '처리 중 오류가 발생했습니다.');
    }
  });

  const rejectCreditMutation = useMutation({
    mutationFn: async (transactionId) => {
      await Payment.update(transactionId, { status: 'rejected' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allCredits']);
      alert('입금이 거절되었습니다.');
    },
  });

  const toggleUserRoleMutation = useMutation({
    mutationFn: async ({ userId, currentRole }) => {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await User.update(userId, { role: newRole });
      return newRole;
    },
    onSuccess: (newRole) => {
      queryClient.invalidateQueries(['allUsers']);
      alert(`권한이 ${newRole === 'admin' ? '관리자' : '일반 사용자'}로 변경되었습니다.`);
    },
  });

  // 카테고리 삭제 mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId) => SurveyCategory.delete(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCategories']);
      queryClient.invalidateQueries(['surveyCategories']); // MySurveys 페이지의 카테고리도 갱신
      alert('카테고리가 삭제되었습니다.');
    },
    onError: (error) => {
      alert('삭제 실패: ' + error.message);
    }
  });

  React.useEffect(() => {
    if (!userLoading && (userError || !user)) {
      auth.redirectToLogin(window.location.pathname);
    }
  }, [user, userLoading, userError]);

  if (userLoading) return <div className="flex h-screen items-center justify-center"><div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user || user.role !== 'admin') return <div className="flex h-screen items-center justify-center text-red-500 font-bold">관리자 권한이 필요합니다.</div>;

  const MenuItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-purple-50 text-purple-600 font-bold shadow-sm' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      {isSidebarOpen && <span>{label}</span>}
      {id === 'credit' && pendingCredits.length > 0 && (
        <Badge className="ml-auto bg-yellow-100 text-yellow-700 border-0">{pendingCredits.length}</Badge>
      )}
      {id === 'orders' && pendingSurveys.length > 0 && (
        <Badge className="ml-auto bg-orange-100 text-orange-700 border-0">{pendingSurveys.length}</Badge>
      )}
    </button>
  );

  const openInNewWindow = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Mobile/Small Screen Warning & New Window Button */}
      <div className="lg:hidden fixed inset-0 z-50 bg-gray-900/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
        <Shield className="w-16 h-16 text-purple-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">PC 환경에 최적화된 페이지입니다</h2>
        <p className="text-gray-300 mb-8 max-w-xs">
          관리자 페이지는 복잡한 데이터 관리를 위해<br/>넓은 화면(PC)에서 이용해주세요.
        </p>
        <Button 
          onClick={openInNewWindow}
          className="bg-purple-600 hover:bg-purple-700 text-white text-lg h-14 px-8 rounded-2xl shadow-xl"
        >
          <ExternalLink className="w-5 h-5 mr-2" />
          새 창에서 넓게 보기
        </Button>
        <button 
          onClick={() => setSidebarOpen(false)}
          className="mt-4 text-gray-500 text-sm underline hover:text-gray-300"
        >
          그냥 여기서 볼래요 (권장하지 않음)
        </button>
      </div>

      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-white border-r border-gray-200 flex flex-col z-20 relative"
      >
        <div className="p-5 flex items-center gap-3 border-b border-gray-100 h-16">
          <Shield className="w-8 h-8 text-purple-600 flex-shrink-0" />
          {isSidebarOpen && <span className="font-bold text-xl text-gray-900 truncate">관리자 페이지</span>}
        </div>

        <div className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
          <MenuItem id="dashboard" icon={LayoutDashboard} label="대시보드" />
          <MenuItem id="credit" icon={Coins} label="입금 관리" />
          <MenuItem id="orders" icon={FileSpreadsheet} label="주문/설문 관리" />
          <MenuItem id="users" icon={Users} label="회원/고객 데이터" />
          <MenuItem id="categories" icon={FolderOpen} label="카테고리 관리" />
          <MenuItem id="support" icon={MessageSquare} label="고객센터" />
          <MenuItem id="seo" icon={Settings} label="SEO 설정" />
          <MenuItem id="system" icon={Settings} label="시스템 설정" />
        </div>

        <div className="p-3 border-t border-gray-100 space-y-2">
          <Link to={createPageUrl("ClientHome")}>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-all">
              <Home className="w-5 h-5" />
              {isSidebarOpen && <span className="font-medium">홈으로 돌아가기</span>}
            </button>
          </Link>
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600"
          >
            {isSidebarOpen ? <Menu className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-lg font-bold text-gray-800">
            {activeTab === 'dashboard' && '대시보드'}
            {activeTab === 'orders' && '주문 및 설문 관리'}
            {activeTab === 'credit' && '입금 관리'}
            {activeTab === 'users' && '회원 관리'}
            {activeTab === 'categories' && '카테고리 관리'}
            {activeTab === 'support' && '고객센터 관리'}
            {activeTab === 'seo' && 'SEO(검색엔진 최적화) 설정'}
            {activeTab === 'system' && '시스템 환경설정'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-bold text-gray-800">{user.full_name || '관리자'}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">입금 대기</p>
                        <h3 className="text-2xl font-bold text-gray-900">{pendingCredits.length}건</h3>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">설문 승인 대기</p>
                        <h3 className="text-2xl font-bold text-gray-900">{pendingSurveys.length}건</h3>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">총 회원수</p>
                        <h3 className="text-2xl font-bold text-gray-900">{allUsers.length}명</h3>
                      </div>
                    </CardContent>
                  </Card>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>최근 가입 회원</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {allUsers.slice(0, 5).map(u => (
                          <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                {u.full_name?.[0] || 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-sm">{u.full_name}</div>
                                <div className="text-xs text-gray-500">{u.email}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatKST(u.created_at, 'yyyy.MM.dd')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle>최근 입금 요청</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {pendingCredits.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">대기중인 요청이 없습니다.</p>
                        ) : (
                          pendingCredits.slice(0, 5).map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                              <div>
                                <div className="font-bold text-sm text-gray-800">{c.amount.toLocaleString()}원</div>
                                <div className="text-xs text-gray-500">{c.user_email}</div>
                              </div>
                              <Badge className="bg-yellow-200 text-yellow-800 border-0">대기중</Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <OrderManagement />
              </div>
            )}

            {activeTab === 'credit' && (
               <div className="space-y-6">
                 {allCredits.length === 0 ? (
                   <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                     <Coins className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                     <p className="text-lg text-gray-500">입금 요청 내역이 없습니다.</p>
                   </div>
                 ) : (
                   allCredits.map(transaction => {
                     const isConfirmed = transaction.status === 'confirmed';
                     return (
                       <Card key={transaction.id} className={`border-0 shadow-sm hover:shadow-md transition-all ${isConfirmed ? 'opacity-70' : ''}`}>
                         <CardContent className="p-6 flex items-center justify-between">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <Badge className={isConfirmed ? "bg-green-100 text-green-700 border-0" : "bg-yellow-100 text-yellow-700 border-0"}>
                                 {isConfirmed ? '입금완료' : '대기중'}
                               </Badge>
                               <span className="text-sm text-gray-500">{formatKST(transaction.created_at)}</span>
                             </div>
                             <h3 className="text-xl font-bold text-gray-900 mb-1">
                               {transaction.amount.toLocaleString()}원 입금 요청
                             </h3>
                             <p className="text-gray-600">{transaction.user_email} {transaction.depositor_name ? `(${transaction.depositor_name})` : ''}</p>
                           </div>
                           <div className="flex gap-2 ml-6">
                             <Button
                               onClick={() => approveCreditMutation.mutate(transaction)}
                               disabled={isConfirmed || approveCreditMutation.isPending}
                               className={isConfirmed
                                 ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                 : "bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"}
                             >
                               <CheckCircle className="w-4 h-4 mr-2" />
                               {isConfirmed ? '입금 완료' : (approveCreditMutation.isPending ? '처리중...' : '입금 확인')}
                             </Button>
                             {!isConfirmed && (
                               <Button
                                 onClick={() => rejectCreditMutation.mutate(transaction.id)}
                                 disabled={rejectCreditMutation.isPending}
                                 variant="outline"
                                 className="border-red-200 text-red-600 hover:bg-red-50"
                               >
                                 <XCircle className="w-4 h-4 mr-2" /> 거절
                               </Button>
                             )}
                           </div>
                         </CardContent>
                       </Card>
                     );
                   })
                 )}
               </div>
            )}

            {activeTab === 'users' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>전체 회원 목록 ({allUsers.length}명)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 text-left">
                          <th className="py-3 px-4 text-sm font-medium text-gray-500">회원정보</th>
                          <th className="py-3 px-4 text-sm font-medium text-gray-500">가입일</th>
                          <th className="py-3 px-4 text-sm font-medium text-gray-500">문의 내역</th>
                          <th className="py-3 px-4 text-sm font-medium text-gray-500">권한</th>
                          <th className="py-3 px-4 text-sm font-medium text-gray-500 text-right">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map(u => (
                          <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-4">
                              <div className="font-bold text-gray-900">{u.full_name || '이름 없음'}</div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-500">
                              {formatKST(u.created_at, 'yyyy.MM.dd')}
                            </td>
                            <td className="py-4 px-4">
                              {getTicketCountByUser(u.id) > 0 ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedUserForTickets(u)}
                                  className="text-xs h-7 text-orange-600 hover:bg-orange-50"
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  {getTicketCountByUser(u.id)}건
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400">없음</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={`${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'} border-0`}>
                                {u.role === 'admin' ? '관리자' : '일반'}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedUserForMemo(u)}
                                  className="text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                                >
                                  고객 데이터
                                </Button>
                                {u.id !== user.id && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (confirm(`권한을 변경하시겠습니까?`)) {
                                        toggleUserRoleMutation.mutate({ userId: u.id, currentRole: u.role });
                                      }
                                    }}
                                    className="text-xs h-8"
                                  >
                                    권한 변경
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {selectedUserForMemo && (
                    <CustomerMemoModal
                      user={selectedUserForMemo}
                      isOpen={!!selectedUserForMemo}
                      onClose={() => setSelectedUserForMemo(null)}
                    />
                  )}

                  {/* 문의 내역 모달 */}
                  <AnimatePresence>
                    {selectedUserForTickets && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedUserForTickets(null)}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-[90%] max-w-[600px] max-h-[80vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
                        >
                          <div className="flex items-center justify-between p-4 border-b">
                            <div>
                              <h3 className="font-bold text-lg">{selectedUserForTickets.full_name || '이름 없음'}님의 문의 내역</h3>
                              <p className="text-sm text-gray-500">{selectedUserForTickets.email}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUserForTickets(null)}
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4">
                            {getTicketsByUser(selectedUserForTickets.id).length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                문의 내역이 없습니다.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {getTicketsByUser(selectedUserForTickets.id).map(ticket => (
                                  <div key={ticket.id} className="border rounded-xl p-4 bg-gray-50">
                                    <div className="flex items-start justify-between mb-2">
                                      <Badge className={`${ticket.status === 'open' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'} border-0`}>
                                        {ticket.status === 'open' ? '대기중' : '답변완료'}
                                      </Badge>
                                      <span className="text-xs text-gray-400">
                                        {formatKST(ticket.created_at, 'yyyy.MM.dd HH:mm')}
                                      </span>
                                    </div>
                                    <h4 className="font-medium text-gray-900 mb-1">{ticket.subject}</h4>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticket.message}</p>
                                    {ticket.admin_response && (
                                      <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 mb-1">관리자 답변</p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.admin_response}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            {activeTab === 'categories' && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    전체 카테고리 목록 ({allCategories.length}개)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    사용자가 생성한 모든 카테고리를 관리할 수 있습니다. 카테고리를 삭제해도 해당 카테고리가 지정된 설문은 삭제되지 않습니다.
                  </p>
                  {allCategories.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl text-gray-500">
                      등록된 카테고리가 없습니다.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {allCategories.map(category => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <FolderOpen className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">{category.name}</div>
                              <div className="text-xs text-gray-500">
                                생성일: {formatKST(category.created_at, 'yyyy.MM.dd HH:mm')}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?\n\n해당 카테고리가 지정된 설문은 삭제되지 않습니다.`)) {
                                deleteCategoryMutation.mutate(category.id);
                              }
                            }}
                            disabled={deleteCategoryMutation.isPending}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            삭제
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'support' && (
              <AdminSupportManager />
            )}

            {activeTab === 'seo' && (
              <SEOSettingsManager />
            )}

            {activeTab === 'system' && (
              <Card className="border-0 shadow-sm max-w-2xl">
                <CardHeader>
                  <CardTitle>시스템 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4">
                      무통장 입금 계좌 정보
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">은행명</label>
                        <Input
                          defaultValue={(() => {
                            const value = systemConfig?.find(c => c.key === 'bank_account')?.value;
                            if (value && typeof value === 'object') return value.bankName || '';
                            return '';
                          })()}
                          id="bank-name-input"
                          placeholder="신한은행"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">계좌번호</label>
                        <Input
                          defaultValue={(() => {
                            const value = systemConfig?.find(c => c.key === 'bank_account')?.value;
                            if (value && typeof value === 'object') return value.accountNumber || '';
                            return '';
                          })()}
                          id="bank-account-input"
                          placeholder="123-456-789000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">예금주</label>
                        <Input
                          defaultValue={(() => {
                            const value = systemConfig?.find(c => c.key === 'bank_account')?.value;
                            if (value && typeof value === 'object') return value.accountHolder || '';
                            return '';
                          })()}
                          id="bank-holder-input"
                          placeholder="홍길동"
                        />
                      </div>
                      <Button
                        className="w-full mt-2"
                        onClick={() => {
                          const bankName = document.getElementById('bank-name-input').value;
                          const accountNumber = document.getElementById('bank-account-input').value;
                          const accountHolder = document.getElementById('bank-holder-input').value;
                          updateConfigMutation.mutate({
                            id: systemConfig?.find(c => c.key === 'bank_account')?.id,
                            value: { bankName, accountNumber, accountHolder }
                          });
                        }}
                      >
                        저장
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      사용자가 크레딧 충전 페이지에서 보게 될 계좌 정보입니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}