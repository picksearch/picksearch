import React, { useState, useEffect } from "react";
import { auth } from "@/api/auth";
import { SystemConfig } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, LogOut, Save, Settings, Gift, History, ChevronRight, ShoppingBag, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OrderHistory from "@/components/OrderHistory";
import { motion } from "framer-motion";
export default function MyPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      return await auth.me();
    }
  });

  // 무통장 입금 계좌 정보 가져오기
  const { data: bankAccount } = useQuery({
    queryKey: ['bankAccount'],
    queryFn: async () => {
      const configs = await SystemConfig.filter({ key: 'bank_account' });
      if (configs.length > 0 && configs[0].value) {
        const val = configs[0].value;
        // 객체 형식인 경우 (새 형식)
        if (typeof val === 'object' && val.bankName) {
          return {
            bankName: val.bankName,
            accountNumber: val.accountNumber,
            accountHolder: val.accountHolder
          };
        }
        // 문자열인 경우 (이전 형식)
        return { display: val };
      }
      return { bankName: '신한은행', accountNumber: '100-037-544100', accountHolder: '주식회사픽켓팅' }; // 기본값
    }
  });

  // Set fullName when user data is loaded
  useEffect(() => {
    if (user) {
      setFullName(user.custom_name || user.full_name || "");
      setRefundBankName(user.refund_bank_name || "");
      setRefundAccountNumber(user.refund_account_number || "");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async ({ newName, bankName, accountNumber }) => {
      await auth.updateMe({
        custom_name: newName,
        refund_bank_name: bankName,
        refund_account_number: accountNumber
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.refetchQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
      alert('프로필이 수정되었습니다.');
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
      alert('프로필 수정에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  });

  const handleSave = () => {
    if (!fullName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    updateProfileMutation.mutate({ 
      newName: fullName, 
      bankName: refundBankName, 
      accountNumber: refundAccountNumber 
    });
  };

  const handleLogout = async () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      await auth.logout();
    }
  };

  const handleCopyAccount = async () => {
    try {
      let textToCopy = "신한은행 100-037-544100 (주식회사픽켓팅)";
      if (bankAccount) {
        if (bankAccount.display) {
          textToCopy = bankAccount.display;
        } else if (bankAccount.bankName) {
          textToCopy = `${bankAccount.bankName} ${bankAccount.accountNumber} (${bankAccount.accountHolder})`;
        }
      }
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('계좌번호가 복사되었습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-white/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">로그인이 필요합니다</p>
        <Button onClick={() => auth.redirectToLogin()}>
          로그인하기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden mb-8"
      >
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-50 p-1.5 rounded-lg">
                <Settings className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[#8B95A1] font-bold text-sm">계정 설정</span>
            </div>
            <div className="text-4xl font-extrabold text-[#191F28] mb-2 tracking-tight">
              마이<span className="text-blue-600">페이지</span>
            </div>
            <p className="text-[#8B95A1] text-sm font-medium">
              내 정보를 관리하세요
            </p>
          </div>

          {/* Motion Graphic */}
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500 relative overflow-hidden">
             <motion.div
               className="absolute inset-0 bg-blue-100/50"
               animate={{ 
                 scale: [1, 1.2, 1],
                 opacity: [0.3, 0.6, 0.3]
               }}
               transition={{ 
                 duration: 3, 
                 repeat: Infinity, 
                 ease: "easeInOut" 
               }}
             />
             <div className="relative z-10">
               <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                 {/* User Circle */}
                 <motion.circle 
                   cx="24" cy="20" r="8" 
                   stroke="#3B82F6" strokeWidth="2.5"
                   fill="none"
                   initial={{ pathLength: 0 }}
                   animate={{ pathLength: 1 }}
                   transition={{ duration: 2, ease: "easeInOut" }}
                 />
                 {/* User Body */}
                 <motion.path
                   d="M12 38C12 32.4772 16.4772 28 22 28H26C31.5228 28 36 32.4772 36 38"
                   stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round"
                   fill="none"
                   initial={{ pathLength: 0 }}
                   animate={{ pathLength: 1 }}
                   transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                 />
                 {/* Gear */}
                 <motion.g
                   animate={{ rotate: 360 }}
                   transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                 >
                    <path 
                      d="M38 14L42 10M38 10L42 14" 
                      stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round"
                      className="opacity-0"
                    />
                    <circle cx="36" cy="12" r="4" stroke="#60A5FA" strokeWidth="2" strokeDasharray="2 2" />
                 </motion.g>
                 {/* Badge */}
                 <motion.circle
                   cx="36" cy="36" r="6"
                   fill="#2563EB"
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ delay: 2, type: "spring" }}
                 />
                 <motion.path
                   d="M34 36L35.5 37.5L38.5 34.5"
                   stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                   initial={{ opacity: 0, pathLength: 0 }}
                   animate={{ opacity: 1, pathLength: 1 }}
                   transition={{ delay: 2.2, duration: 0.5 }}
                 />
               </svg>
             </div>
          </div>
        </div>
      </motion.div>

      <Card className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 p-2 rounded-xl">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-extrabold text-gray-900">프로필 정보</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">이름</label>
            {isEditing ? (
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="rounded-2xl h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50/50"
              />
            ) : (
              <div className="bg-gray-50 rounded-2xl px-5 py-4 text-gray-900 font-bold border border-gray-100">
                {user.custom_name || user.full_name || '이름 없음'}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
              <Mail className="w-4 h-4" />
              이메일
            </label>
            <div className="bg-gray-50 rounded-2xl px-5 py-4 text-gray-600 font-medium border border-gray-100">
              {user.email}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
              <Shield className="w-4 h-4" />
              권한
            </label>
            <div className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                user.role === 'admin' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {user.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                {user.role === 'admin' ? '관리자' : '일반 사용자'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">환불 계좌 정보</label>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={refundBankName}
                  onChange={(e) => setRefundBankName(e.target.value)}
                  placeholder="환불 받을 은행명"
                  className="rounded-2xl h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50/50"
                />
                <Input
                  value={refundAccountNumber}
                  onChange={(e) => setRefundAccountNumber(e.target.value)}
                  placeholder="환불 받을 계좌 번호"
                  className="rounded-2xl h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-50/50"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className={`bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 ${!user.refund_bank_name ? "text-gray-400" : "text-gray-900 font-medium"}`}>
                  {user.refund_bank_name || '환불 받을 은행명'}
                </div>
                <div className={`bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100 ${!user.refund_account_number ? "text-gray-400" : "text-gray-900 font-medium"}`}>
                  {user.refund_account_number || '환불 받을 계좌 번호'}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setFullName(user.custom_name || user.full_name || "");
                    setRefundBankName(user.refund_bank_name || "");
                    setRefundAccountNumber(user.refund_account_number || "");
                  }}
                  className="flex-1 rounded-2xl h-12 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 bg-[#3182F6] hover:bg-[#1B64DA] text-white rounded-2xl h-12 font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-[#3182F6] hover:bg-[#1B64DA] text-white rounded-2xl h-12 font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
              >
                프로필 수정
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-xl font-extrabold text-gray-900">무통장 입금 계좌</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-600 text-base font-semibold leading-tight">
                  {bankAccount?.display ? (
                    <span className="whitespace-pre-line">{bankAccount.display}</span>
                  ) : (
                    <>
                      {bankAccount?.bankName || '신한은행'}<br />
                      {bankAccount?.accountNumber || '100-037-544100'}<br />
                      ({bankAccount?.accountHolder || '주식회사픽켓팅'})
                    </>
                  )}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyAccount}
                className={`${copied ? 'text-green-600' : 'text-blue-600'}`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mt-8">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 p-2 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-extrabold text-gray-900">주문 내역</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <OrderHistory user={user} />
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-2xl h-14 font-bold transition-all"
      >
        <LogOut className="w-5 h-5 mr-2" />
        로그아웃
      </Button>


    </div>
  );
}