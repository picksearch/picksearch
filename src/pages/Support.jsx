import React, { useState } from "react";
import { auth } from "@/api/auth";
import { SupportTicket, FAQ } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle, HelpCircle, Plus, Loader2, ChevronRight, User, Calendar, LifeBuoy } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { formatKST } from "@/utils";

// 기본 FAQ 데이터
const defaultFaqs = [
  {
    id: 'faq-1',
    question: '픽서치는 어떤 서비스인가요?',
    answer: `SK 플래닛(SKP)의 방대한 데이터 자산과 AI 기술이 결합된 '초정밀 타겟팅 설문 플랫폼'입니다.

픽서치는 전문 지식 없이도 누구나 데이터 기반의 의사결정을 할 수 있도록 돕습니다. AI가 설문 문항의 설계를 돕고, SKP의 검증된 패널로부터 신뢰도 높은 응답 데이터를 수집하여 시각화 리포트까지 원스톱으로 제공하는 올인원(All-in-one) 솔루션입니다.`
  },
  {
    id: 'faq-2',
    question: '설문 참여자는 어떤 경로와 기준을 통해 모집되나요?',
    answer: `SKP의 '실명 인증 시스템'과 국내 최대 규모의 'DMP 타겟팅'을 통해 검증된 패널만 모집합니다.

픽서치의 패널은 익명의 웹 사용자가 아닌, 시럽(Syrup) 및 OK캐쉬백 등 SK 플래닛 서비스를 이용하는 실제 유저들입니다. 100% 본인 인증을 거친 실명 기반 패널로, 허위 계정이나 봇(Bot)의 접근을 원천 차단합니다. 1.3억 개의 비식별 행태 데이터를 활용해 단순 인구통계를 넘어 위치, 소비 패턴, 앱 사용 정보 등 프로젝트 목적에 딱 맞는 타겟에게 설문을 배포합니다.`
  },
  {
    id: 'faq-3',
    question: '설문 배포는 어떤 과정으로 진행되나요?',
    answer: `전문 검수와 자동화 시스템을 통해 신속하고 정확하게 배포됩니다.

1. 설문 생성 및 결제: AI 문항 생성 기능을 활용하거나 직접 문항을 설계한 뒤 결제를 진행합니다.
2. 픽서치 운영팀 검수: 설문 내용과 매체사 가이드라인 준수 여부를 검토하여 승인합니다.
3. SKP 플랫폼 노출: 승인 후 지정일에 시럽(Syrup) 앱 등 주요 제휴 플랫폼의 이벤트 지면에 배너와 푸시 알림으로 게시됩니다.
4. 실시간 데이터 수집: 검증된 패널들이 모바일에서 설문에 참여하며, 모든 과정은 실시간으로 대시보드에 반영됩니다.`
  },
  {
    id: 'faq-4',
    question: '픽서치의 장점은 무엇인가요?',
    answer: `패널 모집 자동화와 고품질의 데이터를 통한 마케팅 시너지입니다.

패널 모집 자동화를 통해 별도의 홍보 활동 없이도 목표 응답 수를 빠르게 달성할 수 있습니다.

SK 통합 계정 체계를 통해 중복 응답과 어뷰징을 시스템적으로 방어하여 순도 높은 데이터를 보장합니다.

또한 설문 종료 후 커스텀 랜딩 페이지로 연결하여 브랜드 인지도 제고 및 실제 구매 전환 효과까지 기대할 수 있습니다.`
  },
  {
    id: 'faq-5',
    question: '어떤 결제 수단을 지원하며 증빙 서류 발행이 가능한가요?',
    answer: `현재 무통장 입금 방식을 지원하며, 법인 고객을 위한 세금계산서 발행이 가능합니다.

설문 게시를 위해 지정된 계좌(신한은행 100-037-544100, 예금주: 주식회사픽켓팅)로 입금해 주시면 확인 후 즉시 검수가 진행됩니다.

결제 시 현금영수증(소득공제/지출증빙) 또는 세금계산서 중 원하는 증빙 방식을 선택하실 수 있습니다.`
  },
  {
    id: 'faq-6',
    question: '환불 규정은 어떻게 되나요?',
    answer: `결제 후 시스템 등록이 시작되면 원칙적으로 환불이 불가하나, 예외적인 경우에는 가능합니다.

픽서치는 결제 즉시 제휴 매체사 시스템과 연동되어 리워드 광고 집행 준비가 시작되므로 단순 변심에 의한 환불은 어렵습니다.

다만, 매체사 내부 기준이나 시스템 오류로 인해 설문 집행이 거절된 경우에는 전액 환불 처리를 도와드립니다.

환불의 경우, 담당자가 별도의 연락을 드릴 예정입니다.`
  },
  {
    id: 'faq-7',
    question: '결과 데이터는 어떤 형식으로 제공되나요?',
    answer: `분석 목적에 따라 csv 형태의 raw data와 초정밀 리포트를 모두 제공합니다.

raw data는 엑셀이나 통계 도구(SPSS, Python 등)를 활용해 심층 분석이 가능한 csv 형태의 원본 데이터입니다.

초정밀 리포트는 실시간 대시보드 데이터를 기반으로 AI가 주요 인사이트를 도출하고 그래프로 시각화하여 보고서로 활용하기에 최적화되어 있습니다.`
  }
];

export default function Support() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("faq");

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => auth.me(),
  });

  // Fetch FAQs
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      return await FAQ.filter({ is_active: true }, 'order');
    }
  });

  // Fetch My Tickets
  const { data: tickets = [], isLoading: isTicketsLoading } = useQuery({
    queryKey: ['myTickets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await SupportTicket.filter({ user_email: user.email }, 'created_at', false);
    },
    enabled: !!user?.email
  });

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim() || !newContent.trim()) throw new Error("제목과 내용을 입력해주세요.");
      await SupportTicket.create({
        title: newTitle,
        content: newContent,
        user_email: user.email,
        status: 'open'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myTickets']);
      setIsCreateOpen(false);
      setNewTitle("");
      setNewContent("");
      alert("문의가 등록되었습니다.");
    },
    onError: (err) => alert(err.message)
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">답변대기</Badge>;
      case 'in_progress': return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">처리중</Badge>;
      case 'answered': return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">답변완료</Badge>;
      case 'closed': return <Badge variant="secondary">종료</Badge>;
      default: return <Badge variant="outline">대기</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden mb-8"
      >
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-50 p-1.5 rounded-lg">
                <LifeBuoy className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[#8B95A1] font-bold text-sm">고객센터</span>
            </div>
            <div className="text-4xl font-extrabold text-[#191F28] mb-2 tracking-tight leading-tight">
              무엇을 <br /><span className="text-blue-600">도와드릴까요?</span>
            </div>
            <p className="text-[#8B95A1] text-sm font-medium">
              궁금한 점이 있으신가요? 언제든 문의해주세요.
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
                 <motion.path
                   d="M12 24C12 17.3726 17.3726 12 24 12C30.6274 12 36 17.3726 36 24C36 29.23 32.86 33.68 28.29 35.31C27.65 35.54 27.5 36.28 28 36.78L30.5 39.28C31.13 39.91 30.68 41 29.79 41H24C14.61 41 7 33.39 7 24C7 23.32 7.05 22.66 7.15 22"
                   stroke="#3B82F6"
                   strokeWidth="3"
                   strokeLinecap="round"
                   initial={{ pathLength: 0 }}
                   animate={{ pathLength: 1 }}
                   transition={{ duration: 2, ease: "easeInOut" }}
                 />
                 <motion.circle
                   cx="24" cy="24" r="3"
                   fill="#60A5FA"
                   animate={{ scale: [1, 1.5, 1] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 />
                 <motion.circle
                   cx="38" cy="10" r="4"
                   fill="#93C5FD"
                   initial={{ y: 5, opacity: 0 }}
                   animate={{ y: -5, opacity: 1 }}
                   transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1 }}
                 />
                 <motion.path
                    d="M38 10L42 6"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity: 1, pathLength: 1 }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                 />
               </svg>
             </div>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-gray-50 p-1.5 rounded-[1.2rem] border border-gray-100">
          <TabsTrigger 
            value="faq" 
            className="rounded-2xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md text-gray-500 font-bold transition-all duration-200"
          >
            자주 묻는 질문 (FAQ)
          </TabsTrigger>
          <TabsTrigger 
            value="inquiry" 
            className="rounded-2xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md text-gray-500 font-bold transition-all duration-200"
          >
            1:1 문의
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inquiry" className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-gray-900">나의 문의 내역</h2>
              {user && <Badge className="bg-blue-50 text-blue-600 border-0">{tickets.length}</Badge>}
            </div>
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              if (open && !user) {
                if (window.confirm("1:1 문의는 가입 후 이용 가능합니다.\n\n지금 가입하시겠습니까?")) {
                  auth.redirectToLogin();
                }
              } else {
                setIsCreateOpen(open);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#3182F6] hover:bg-[#1B64DA] text-white rounded-2xl h-10 px-5 font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">
                  <Plus className="w-4 h-4 mr-1.5" />
                  새 문의하기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle>1:1 문의 작성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">제목</label>
                    <Input 
                      placeholder="문의 제목을 입력하세요" 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">내용</label>
                    <Textarea 
                      placeholder="문의하실 내용을 자세히 적어주세요" 
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="min-h-[150px] rounded-xl resize-none"
                    />
                  </div>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12"
                    onClick={() => createTicketMutation.mutate()}
                    disabled={createTicketMutation.isPending}
                  >
                    {createTicketMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "문의 등록하기"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {!user ? (
            <Card className="border-0 shadow-sm bg-gray-50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium mb-4">로그인 후 문의 내역을 확인할 수 있습니다</p>
                <Button 
                  onClick={() => auth.redirectToLogin()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  로그인/가입하기
                </Button>
              </CardContent>
            </Card>
          ) : isTicketsLoading ? (
             <div className="text-center py-10 text-gray-500">불러오는 중...</div>
          ) : tickets.length === 0 ? (
            <Card className="border-0 shadow-sm bg-gray-50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">등록된 문의 내역이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Accordion key={ticket.id} type="single" collapsible className="w-full">
                  <AccordionItem value={ticket.id} className="bg-white border border-gray-100 rounded-[1.5rem] px-6 shadow-sm mb-4 overflow-hidden transition-all data-[state=open]:ring-2 data-[state=open]:ring-blue-100 data-[state=open]:shadow-md">
                    <AccordionTrigger className="hover:no-underline py-5">
                      <div className="flex flex-col items-start text-left w-full gap-2">
                        <div className="flex justify-between w-full items-center pr-2">
                          <span className="font-bold text-lg text-gray-900 line-clamp-1 flex-1 mr-4">{ticket.title}</span>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-lg">
                          {formatKST(ticket.created_at)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-6 border-t border-gray-50">
                      <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-700">
                            <User className="w-4 h-4" />
                            문의 내용
                          </div>
                          <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{ticket.content}</p>
                        </div>

                        {ticket.admin_reply && (
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-sm font-bold text-blue-800">
                                <MessageCircle className="w-4 h-4" />
                                관리자 답변
                              </div>
                              {ticket.answered_at && (
                                <span className="text-xs text-blue-400">
                                  {formatKST(ticket.answered_at)}
                                </span>
                              )}
                            </div>
                            <p className="text-blue-900 whitespace-pre-wrap text-sm leading-relaxed">{ticket.admin_reply}</p>
                          </div>
                        )}
                        
                        {!ticket.admin_reply && (
                          <p className="text-center text-xs text-gray-400 py-2">
                            담당자가 내용을 확인하고 있습니다. 잠시만 기다려주세요.
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <div className="space-y-3">
            <Accordion type="single" collapsible className="w-full space-y-3">
              {[...defaultFaqs, ...faqs].map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="bg-white border border-gray-100 rounded-[1.2rem] px-6 shadow-sm overflow-hidden transition-all data-[state=open]:ring-2 data-[state=open]:ring-blue-100 data-[state=open]:shadow-md">
                  <AccordionTrigger className="hover:no-underline py-5 text-left font-bold text-gray-800 text-base">
                    <span className="flex items-start gap-3">
                      <span className="bg-blue-100 text-blue-600 font-extrabold text-sm px-2.5 py-1 rounded-lg">Q</span>
                      <span className="mt-0.5 pr-4">{faq.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed pb-6 pt-2 border-t border-gray-50">
                    <div className="bg-gray-50 rounded-xl p-4 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-blue-500 text-white font-bold text-xs px-2 py-0.5 rounded">A</span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{faq.answer}</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}