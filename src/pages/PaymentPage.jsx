import React, { useState } from "react";
import { auth } from "@/api/auth";
import { Survey, Payment, SystemConfig } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Copy, Check, Building2, User, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get('id');

  const [depositorName, setDepositorName] = useState("");
  const [proofType, setProofType] = useState("cash_receipt_personal");
  const [proofIdentifier, setProofIdentifier] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [taxEmail, setTaxEmail] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessItem, setBusinessItem] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const surveys = await Survey.filter({ id: surveyId });
      return surveys[0];
    },
    enabled: !!surveyId
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await auth.me();
      } catch (error) {
        return null;
      }
    }
  });

  const { data: bankAccount } = useQuery({
    queryKey: ['bankAccount'],
    queryFn: async () => {
      const configs = await SystemConfig.filter({ key: 'bank_account' });
      if (configs.length > 0 && configs[0].value) {
        const val = configs[0].value;
        if (typeof val === 'object' && val.bankName) {
          return {
            bankName: val.bankName,
            accountNumber: val.accountNumber,
            accountHolder: val.accountHolder
          };
        }
        return { display: val };
      }
      return { bankName: '신한은행', accountNumber: '100-037-544100', accountHolder: '주식회사픽켓팅' };
    }
  });

  const [paymentSubmitted, setPaymentSubmitted] = React.useState(false);

  const hasFilledAllFields = () => {
    if (!depositorName.trim()) return false;

    if (proofType === 'cash_receipt_personal') {
      return proofIdentifier.trim() !== '';
    }
    if (proofType === 'cash_receipt_business') {
      return proofIdentifier.trim() !== '';
    }
    if (proofType === 'tax_invoice') {
      return companyName.trim() && ceoName.trim() && proofIdentifier.trim() && taxEmail.trim() && businessType.trim() && businessItem.trim();
    }
    return false;
  };

  const handleNumberKeyDown = (e) => {
    // Allow navigation and deletion
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) return;
    // Allow shortcuts (Ctrl+A, Ctrl+C, etc)
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    // Block non-numeric
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  React.useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!paymentSubmitted && !hasFilledAllFields()) {
        e.preventDefault();
        e.returnValue = '입금 정보가 입력되지 않았습니다. 이 페이지를 벗어나면 작성된 설문이 사라집니다.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [paymentSubmitted, depositorName, proofType, proofIdentifier, companyName, ceoName, taxEmail, businessType, businessItem]);

  const submitPaymentInfoMutation = useMutation({
    mutationFn: async () => {
      if (!depositorName.trim()) {
        throw new Error('입금자명을 입력해주세요.');
      }

      if (proofType === 'cash_receipt_personal' && !proofIdentifier.trim()) {
        throw new Error('휴대폰번호를 입력해주세요.');
      }

      if (proofType === 'cash_receipt_business' && !proofIdentifier.trim()) {
        throw new Error('사업자번호를 입력해주세요.');
      }

      if (proofType === 'tax_invoice') {
        if (!companyName.trim() || !ceoName.trim() || !proofIdentifier.trim() || !taxEmail.trim() || !businessType.trim() || !businessItem.trim()) {
          throw new Error('세금계산서 정보를 모두 입력해주세요.');
        }
      }

      // 설문을 pending 상태로 업데이트
      await Survey.update(surveyId, {
        status: 'pending'
      });

      await Payment.create({
        user_email: user.email,
        amount: survey.total_cost,
        type: 'deposit',
        status: 'pending',
        survey_id: surveyId,
        depositor_name: depositorName,
        proof_type: proofType,
        proof_identifier: proofIdentifier,
        company_name: proofType === 'tax_invoice' ? companyName : undefined,
        ceo_name: proofType === 'tax_invoice' ? ceoName : undefined,
        tax_email: proofType === 'tax_invoice' ? taxEmail : undefined,
        business_type: proofType === 'tax_invoice' ? businessType : undefined,
        business_item: proofType === 'tax_invoice' ? businessItem : undefined
      });

      return surveyId;
    },
    onSuccess: () => {
      setPaymentSubmitted(true);
      queryClient.invalidateQueries(['mySurveys']);
      navigate(createPageUrl('PaymentConfirmation') + `?id=${surveyId}`);
    },
    onError: (error) => {
      alert(error.message || '정보 제출에 실패했습니다.');
    }
  });

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

  if (surveyLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
      </div>);

  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">설문을 찾을 수 없습니다.</p>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-xl border-0 text-white">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-white" />
              <h1 className="text-2xl font-bold mb-2">설문 작성이 완료되었습니다!</h1>
              <p className="text-blue-100 leading-relaxed">
                입금 확인을 위한 입금 정보를 입력해주세요.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Depositor Name */}
        <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg">입금자명</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Input
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              placeholder="입금하시는 분 성함"
              className="h-12 rounded-xl border-gray-200" />

            <p className="text-xs text-red-600 mt-2 font-medium">
              * 실제 입금하는 입금자명과 작성한 입금자명이 100% 일치해야 승인됩니다 (띄어쓰기 포함)
            </p>
          </CardContent>
        </Card>

        {/* Proof Type Selection */}
        <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg">지출증빙</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Radio Options */}
            <div className="space-y-3">
              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${proofType === 'cash_receipt_personal' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`
              }>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="proofType"
                    value="cash_receipt_personal"
                    checked={proofType === 'cash_receipt_personal'}
                    onChange={(e) => setProofType(e.target.value)}
                    className="w-5 h-5 text-blue-500" />

                  <div>
                    <div className="font-bold text-gray-900">현금영수증 (소득공제)</div>
                  </div>
                </div>
              </label>

              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${proofType === 'cash_receipt_business' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`
              }>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="proofType"
                    value="cash_receipt_business"
                    checked={proofType === 'cash_receipt_business'}
                    onChange={(e) => setProofType(e.target.value)}
                    className="w-5 h-5 text-blue-500" />

                  <div>
                    <div className="font-bold text-gray-900">현금영수증 (지출증빙)</div>
                  </div>
                </div>
              </label>

              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${proofType === 'tax_invoice' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`
              }>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="proofType"
                    value="tax_invoice"
                    checked={proofType === 'tax_invoice'}
                    onChange={(e) => setProofType(e.target.value)}
                    className="w-5 h-5 text-blue-500" />

                  <div>
                    <div className="font-bold text-gray-900">세금계산서</div>
                  </div>
                </div>
              </label>
            </div>

            {/* Conditional Fields */}
            {proofType === 'cash_receipt_personal' &&
              <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold text-gray-700">휴대폰번호</label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  onKeyDown={handleNumberKeyDown}
                  value={proofIdentifier}
                  onChange={(e) => setProofIdentifier(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="숫자만 입력해주세요"
                  className="h-12 rounded-xl border-gray-200" />

              </div>
            }

            {proofType === 'cash_receipt_business' &&
              <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold text-gray-700">사업자등록번호</label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  onKeyDown={handleNumberKeyDown}
                  value={proofIdentifier}
                  onChange={(e) => setProofIdentifier(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="숫자만 입력해주세요"
                  className="h-12 rounded-xl border-gray-200" />

              </div>
            }

            {proofType === 'tax_invoice' &&
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">사업자등록번호</label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    onKeyDown={handleNumberKeyDown}
                    value={proofIdentifier}
                    onChange={(e) => setProofIdentifier(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="숫자만 입력해주세요"
                    className="h-12 rounded-xl border-gray-200" />

                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">상호명 (법인명)</label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="주식회사 ○○○"
                      className="h-12 rounded-xl border-gray-200" />

                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">대표자명</label>
                    <Input
                      value={ceoName}
                      onChange={(e) => setCeoName(e.target.value)}
                      placeholder="홍길동"
                      className="h-12 rounded-xl border-gray-200" />

                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">업태</label>
                    <Input
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="제조업, 도소매업 등"
                      className="h-12 rounded-xl border-gray-200" />

                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">종목</label>
                    <Input
                      value={businessItem}
                      onChange={(e) => setBusinessItem(e.target.value)}
                      placeholder="화장품 제조 등"
                      className="h-12 rounded-xl border-gray-200" />

                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">수신 이메일</label>
                  <Input
                    value={taxEmail}
                    onChange={(e) => setTaxEmail(e.target.value)}
                    placeholder="tax@company.com"
                    className="h-12 rounded-xl border-gray-200" />

                </div>
              </div>
            }

            {/* Submit Button */}
            <Button
              onClick={() => submitPaymentInfoMutation.mutate()}
              disabled={submitPaymentInfoMutation.isPending}
              className="w-full h-14 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold mt-6">

              {submitPaymentInfoMutation.isPending ?
                <>제출중...</> :

                <>입금 계좌 확인하기</>
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>);

}