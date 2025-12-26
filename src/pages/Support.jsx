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
      return await FAQ.filter({ is_visible: true }, 'order');
    }
  });

  // Fetch My Tickets
  const { data: tickets = [], isLoading: isTicketsLoading } = useQuery({
    queryKey: ['myTickets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await SupportTicket.filter({ user_email: user.email }, '-created_date');
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
                          {format(new Date(ticket.created_date), 'yyyy.MM.dd HH:mm')}
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
                                  {format(new Date(ticket.answered_at), 'yyyy.MM.dd HH:mm')}
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
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="bg-white border border-gray-100 rounded-[1.2rem] px-6 shadow-sm overflow-hidden transition-all data-[state=open]:ring-2 data-[state=open]:ring-blue-50">
                  <AccordionTrigger className="hover:no-underline py-5 text-left font-bold text-gray-800 text-base">
                    <span className="flex items-start gap-3">
                      <span className="text-blue-500 font-extrabold text-lg">Q.</span>
                      <span className="mt-0.5">{faq.question}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed pb-6 pl-8">
                     <div className="whitespace-pre-wrap">{faq.answer}</div>
                  </AccordionContent>
                </AccordionItem>
              ))}
              {faqs.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  등록된 FAQ가 없습니다.
                </div>
              )}
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}