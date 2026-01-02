import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">개인정보처리방침</h1>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg">개인정보 처리방침</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-gray-600 leading-relaxed">
          <section>
            <h3 className="text-gray-900 font-bold mb-2">1. 개인정보의 처리 목적</h3>
            <p>주식회사 픽켓팅(이하 '회사')은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>회원 가입 및 관리: 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원의 부정이용 방지와 비인가 사용방지, 가입의사 확인, 연령확인, 분쟁 조정을 위한 기록보존, 불만처리 등 민원처리, 고지사항 전달</li>
              <li>서비스 제공: 설문조사 생성 및 참여, 결과 분석, 크레딧 결제 및 정산, 콘텐츠 제공</li>
              <li>마케팅 및 광고에의 활용: 신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공</li>
            </ul>
          </section>

          <section>
            <h3 className="text-gray-900 font-bold mb-2">2. 개인정보의 처리 및 보유 기간</h3>
            <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>회원 가입 및 관리: 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지)</li>
              <li>전자상거래 등에서의 소비자 보호에 관한 법률에 따른 표시·광고, 계약내용 및 이행 등 거래에 관한 기록</li>
              <li>계약 또는 청약철회, 대금결제, 재화 등의 공급기록: 5년</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
            </ul>
          </section>

          <section>
            <h3 className="text-gray-900 font-bold mb-2">3. 처리하는 개인정보의 항목</h3>
            <p>회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>필수항목: 이메일, 비밀번호, 이름, 휴대전화번호</li>
              <li>선택항목: 회사명, 사업자등록번호, 직위/직책</li>
              <li>서비스 이용 과정에서 자동 수집: IP주소, 쿠키, MAC주소, 서비스 이용기록, 방문기록, 불량 이용기록 등</li>
            </ul>
          </section>

          <section>
            <h3 className="text-gray-900 font-bold mb-2">4. 개인정보 보호책임자</h3>
            <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className="bg-gray-50 p-4 rounded-xl mt-2 border border-gray-200">
              <p><span className="font-bold">성명:</span> 심민우</p>
              <p><span className="font-bold">직책:</span> 개인정보 보호 담당자</p>
              <p><span className="font-bold">이메일:</span> lucas@picketing.ai</p>
            </div>
          </section>

          <section>
            <h3 className="text-gray-900 font-bold mb-2">5. 사업자 정보</h3>
            <div className="bg-gray-50 p-4 rounded-xl mt-2 border border-gray-200">
              <p><span className="font-bold">상호명:</span> 주식회사 픽켓팅</p>
              <p><span className="font-bold">사업자등록번호:</span> 165-88-03767</p>
              <p><span className="font-bold">주소:</span> 서울특별시 금천구 가산디지털2로 143 (가산동, 가산 어반워크II) 508호</p>
              <p><span className="font-bold">대표 이메일:</span> biz@picketing.ai</p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}