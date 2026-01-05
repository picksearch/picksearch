import React, { useState } from "react";
import { Survey, SystemConfig } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentConfirmation() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const surveyId = urlParams.get('id');
  const [copied, setCopied] = useState(false);

  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const surveys = await Survey.filter({ id: surveyId });
      return surveys[0];
    },
    enabled: !!surveyId
  });

  // 무통장 입금 계좌 정보 가져오기
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
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">설문을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Success Message Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-xl border-0 text-white">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-white" />
              <h1 className="text-2xl font-bold mb-2">입금 정보를 저장했습니다!</h1>
              <p className="text-blue-100 leading-relaxed">
                입금 계좌는 마이페이지에서 다시 확인할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bank Account Info */}
        <Card className="bg-white rounded-3xl shadow-sm border border-gray-100">
          <CardHeader className="bg-blue-50/50 border-b border-blue-100">
            <CardTitle className="text-lg flex items-center gap-2">
              무통장 입금 계좌
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-blue-900 text-xl font-bold leading-tight">
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
              <p className="text-base text-blue-600 mt-3">
                총 결제 금액: <span className="font-bold text-base">{survey.total_cost?.toLocaleString()}원</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/mysurveys')}
            className="w-full h-14 text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold"
          >
            내 설문 보러가기
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('MyPage'))}
            variant="outline"
            className="w-full h-14 text-base border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl font-bold"
          >
            환불 계좌 정보 등록하기
          </Button>
        </div>
      </div>
    </div>
  );
}