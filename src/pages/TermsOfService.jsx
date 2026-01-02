import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
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
        <h1 className="text-2xl font-bold text-gray-900">이용약관</h1>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg">서비스 이용약관</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-gray-600 leading-relaxed">
          <section>
            <h3 className="text-gray-900 font-bold mb-2">제1조 (목적)</h3>
            <p>이 약관은 주식회사 픽켓팅(이하 "회사")이 제공하는 픽서치 및 관련 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h3 className="text-gray-900 font-bold mb-2">제2조 (정의)</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>"서비스"라 함은 구현되는 단말기(PC, TV, 휴대형단말기 등의 각종 유무선 장치를 포함)와 상관없이 "회원"이 이용할 수 있는 픽서치 및 픽켓팅 관련 제반 서비스를 의미합니다.</li>
              <li>"회원"이라 함은 회사의 "서비스"에 접속하여 이 약관에 따라 "회사"와 이용계약을 체결하고 "회사"가 제공하는 "서비스"를 이용하는 고객을 말합니다.</li>
              <li>"크레딧"이라 함은 서비스 내에서 설문조사 생성, 응답 수집 등을 위해 사용되는 가상의 화폐단위를 말합니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-gray-900 font-bold mb-2">제3조 (약관의 게시와 개정)</h3>
            <p>회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다. 회사는 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
          </section>

          <section>
            <h3 className="text-gray-900 font-bold mb-2">제4조 (서비스의 제공 및 변경)</h3>
            <p>회사는 다음과 같은 업무를 수행합니다.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>설문조사 플랫폼 제공 및 운영</li>
              <li>설문 데이터 분석 및 리포트 제공</li>
              <li>타겟 오디언스 매칭 서비스</li>
              <li>기타 회사가 정하는 업무</li>
            </ul>
          </section>

          <section>
            <h3 className="text-gray-900 font-bold mb-2">제5조 (크레딧 및 결제)</h3>
            <p>회원은 유료 서비스를 이용하기 위해 크레딧을 충전하여 사용할 수 있습니다. 크레딧의 충전, 차감, 환불 등에 관한 사항은 회사의 별도 운영정책에 따릅니다.</p>
          </section>

          <section>
            <h3 className="text-gray-900 font-bold mb-2">제6조 (회사의 의무)</h3>
            <p>회사는 관련 법령과 이 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않으며, 계속적이고 안정적으로 서비스를 제공하기 위하여 최선을 다하여 노력합니다.</p>
          </section>

          <section>
            <h3 className="text-gray-900 font-bold mb-2">제7조 (문의 및 연락처)</h3>
            <p>서비스 이용과 관련하여 문의사항이 있으신 경우 아래의 연락처로 문의주시기 바랍니다.</p>
            <div className="bg-gray-50 p-4 rounded-xl mt-2 border border-gray-200">
              <p><span className="font-bold">회사명:</span> 주식회사 픽켓팅</p>
              <p><span className="font-bold">사업자등록번호:</span> 165-88-03767</p>
              <p><span className="font-bold">주소:</span> 서울특별시 금천구 가산디지털2로 143 (가산동, 가산 어반워크II) 508호</p>
              <p><span className="font-bold">이메일:</span> biz@picketing.ai</p>
              <p><span className="font-bold">담당자:</span> 심민우 (lucas@picketing.ai)</p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}