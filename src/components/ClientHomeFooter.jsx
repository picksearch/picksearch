import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

export default function ClientHomeFooter() {
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null

  const toggleCompanyInfo = () => setIsCompanyInfoOpen(!isCompanyInfoOpen);

  const openModal = (type) => setActiveModal(type);
  const closeModal = () => setActiveModal(null);

  return (
    <div className="py-8 px-4 pb-32">
      {/* Links */}
      <div className="flex justify-center items-center gap-4 mb-6 text-sm text-gray-500 font-bold">
        <button onClick={() => openModal('terms')} className="hover:text-gray-900 transition-colors">이용약관</button>
        <span className="w-px h-3 bg-gray-300"></span>
        <button onClick={() => openModal('privacy')} className="hover:text-gray-900 transition-colors">개인정보처리방침</button>
      </div>

      {/* Company Info Collapsible */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden transition-all">
        <button
          onClick={toggleCompanyInfo}
          className="w-full px-4 py-3 flex justify-between items-center text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <span className="flex-1 text-center ml-4">(주)픽켓팅 사업자 정보</span>
          {isCompanyInfoOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        <AnimatePresence>
          {isCompanyInfoOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100"
            >
              <div className="p-4 text-xs text-gray-500 space-y-2 leading-relaxed bg-gray-50/50">
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="font-medium text-gray-400">대표자</span>
                  <span>이시우</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="font-medium text-gray-400">상호</span>
                  <span>주식회사 픽켓팅</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="font-medium text-gray-400">주소</span>
                  <span>서울시 강남구 영동대로 602, 6층 k45</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="font-medium text-gray-400">사업자번호</span>
                  <span>165-88-03767</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="font-medium text-gray-400">통신판매업 신고번호</span>
                  <span>2024-서울강남-07205호</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="font-medium text-gray-400">개인정보 보호책임자</span>
                  <span>심민우</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="font-medium text-gray-400">제휴문의</span>
                  <span>biz@picketing.ai</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-1">
                  <span className="font-medium text-gray-400">대표번호</span>
                  <span>070-4300-0829</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Sheet Modal */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/60 z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[70] max-h-[85vh] flex flex-col shadow-2xl max-w-md mx-auto"
            >
              <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white rounded-t-3xl sticky top-0">
                <h3 className="text-lg font-bold text-gray-900">
                  [{activeModal === 'terms' ? '이용약관' : '개인정보처리방침'}]
                </h3>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="overflow-y-auto p-6 text-sm text-gray-600 leading-relaxed pb-10">
                {activeModal === 'terms' ? <TermsContent /> : <PrivacyContent />}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-gray-900 font-bold mb-2 text-base">제1조 (목적)</h3>
        <p>이 약관은 주식회사 픽켓팅(이하 "회사")이 제공하는 픽서치 및 관련 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
      </section>

      <section>
        <h3 className="text-gray-900 font-bold mb-2 text-base">제2조 (정의)</h3>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>"서비스"란 구현되는 단말기(PC, TV, 휴대형단말기 등 각종 유무선 기기를 포함)와 무관하게 회원이 이용할 수 있는 픽서치 및 픽켓팅 관련 제반 서비스를 뜻합니다.</li>
          <li>"회원"이란 회사의 서비스에 접속해 이 약관에 따라 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 뜻합니다.</li>
          <li>"유료 서비스"란 회원이 이용료를 지급한 뒤 이용할 수 있는 서비스 또는 기능을 뜻합니다.</li>
          <li>"이용료"란 유료 서비스 이용을 위해 회원이 회사에 지급해야 하는 금액을 뜻합니다.</li>
          <li>"무통장입금"이란 회사가 지정한 계좌로 회원이 이용료를 입금하는 결제 방식을 뜻합니다.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-gray-900 font-bold mb-2 text-base">제3조 (약관의 게시 및 개정)</h3>
        <p>회사는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다. 회사는 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 위반하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
      </section>

      <section>
        <h3 className="text-gray-900 font-bold mb-2 text-base">제4조 (서비스의 제공 및 변경)</h3>
        <p>회사는 다음 업무를 수행합니다.</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>설문조사 플랫폼 제공 및 운영</li>
          <li>설문 데이터 분석 및 리포트 제공</li>
          <li>타겟 오디언스 매칭 서비스</li>
          <li>기타 회사가 정하는 업무</li>
        </ul>
      </section>

      <section>
        <h3 className="text-gray-900 font-bold mb-2 text-base">제5조 (이용료 및 결제)</h3>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>회원은 유료 서비스 이용을 위해 회사가 안내한 이용료를 회사가 지정한 계좌로 무통장입금 방식으로 지급합니다.</li>
          <li>결제 완료 시점은 회사가 입금 사실을 확인한 시점으로 합니다.</li>
          <li>입금자명, 입금 금액, 입금 일시가 회사 안내 내용과 다르면 입금 확인이 지연되거나 결제 처리가 보류될 수 있으며, 이로 인한 불이익은 회원에게 있을 수 있습니다.</li>
          <li>회사는 관련 법령 및 내부 기준에 따라 현금영수증, 세금계산서 등 증빙을 발급할 수 있습니다(발급 가능 항목 및 절차는 회사 안내 또는 별도 정책에 따름).</li>
          <li>환불, 청약철회, 이용료 정산 기준 등은 관련 법령이 정한 범위 내에서 회사의 별도 운영정책 또는 서비스 화면의 안내에 따릅니다.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-gray-900 font-bold mb-2 text-base">제6조 (회사의 의무)</h3>
        <p>회사는 관련 법령 및 이 약관이 금지하는 행위를 하지 않으며, 계속적이고 안정적으로 서비스를 제공하기 위해 최선을 다해 노력합니다.</p>
      </section>

      <section>
        <h3 className="text-gray-900 font-bold mb-2 text-base">제7조 (문의 및 연락처)</h3>
        <p>서비스 이용과 관련하여 문의사항이 있으신 경우 아래의 연락처로 문의주시기 바랍니다.</p>
        <div className="bg-gray-50 p-4 rounded-xl mt-2 border border-gray-200">
          <p><span className="font-bold">회사명:</span> 주식회사 픽켓팅</p>
          <p><span className="font-bold">이메일:</span> biz@picketing.ai</p>
          <p><span className="font-bold">대표번호:</span> 070-4300-0829</p>
        </div>
      </section>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-gray-900 font-bold mb-2 text-base">1. 개인정보의 처리 목적</h3>
        <p>주식회사 픽켓팅(이하 '회사')은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>회원 가입 및 관리: 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원의 부정이용 방지와 비인가 사용방지, 가입의사 확인</li>
          <li>서비스 제공: 설문조사 생성 및 참여, 결과 분석, 크레딧 결제 및 정산</li>
          <li>마케팅 및 광고에의 활용: 신규 서비스(제품) 개발 및 맞춤 서비스 제공</li>
        </ul>
      </section>

      <section>
        <h3 className="text-gray-900 font-bold mb-2 text-base">2. 개인정보의 처리 및 보유 기간</h3>
        <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>회원 가입 및 관리: 회원 탈퇴 시까지</li>
          <li>계약 또는 청약철회, 대금결제, 재화 등의 공급기록: 5년</li>
          <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
        </ul>
      </section>

      <section>
        <h3 className="text-gray-900 font-bold mb-2 text-base">3. 처리하는 개인정보의 항목</h3>
        <p>회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>필수항목: 이메일, 비밀번호, 이름, 휴대전화번호</li>
          <li>선택항목: 회사명, 사업자등록번호, 직위/직책</li>
        </ul>
      </section>

      <section>
        <h3 className="text-gray-900 font-bold mb-2 text-base">4. 개인정보 보호책임자</h3>
        <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
        <div className="bg-gray-50 p-4 rounded-xl mt-2 border border-gray-200">
          <p><span className="font-bold">성명:</span> 심민우</p>
          <p><span className="font-bold">직책:</span> 개인정보 보호 담당자</p>
          <p><span className="font-bold">이메일:</span> lucas@picketing.ai</p>
        </div>
      </section>
    </div>
  );
}