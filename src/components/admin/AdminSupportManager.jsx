import React, { useState } from "react";
import { SupportTicket, FAQ } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { formatKST } from "@/utils";
import { MessageSquare, Trash2, Plus, Edit2, Search, Filter, Send } from "lucide-react";

export default function AdminSupportManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("tickets");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  
  // FAQ State
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
  const [faqFormData, setFaqFormData] = useState({ question: "", answer: "", order: 0 });

  // Fetch Tickets
  const { data: tickets = [] } = useQuery({
    queryKey: ['adminTickets'],
    queryFn: () => SupportTicket.getAll(),
    refetchInterval: 10000
  });

  // Fetch FAQs
  const { data: faqs = [] } = useQuery({
    queryKey: ['adminFAQs'],
    queryFn: () => FAQ.list('order')
  });

  // Ticket Mutation
  const replyTicketMutation = useMutation({
    mutationFn: async ({ id, reply, status }) => {
      await SupportTicket.update(id, {
        admin_response: reply,
        status: status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminTickets']);
      queryClient.invalidateQueries(['myTickets']); // 사용자 문의 목록도 갱신
      setSelectedTicket(null);
      setReplyContent("");
      alert("답변이 등록되었습니다.");
    }
  });

  // FAQ Mutations
  const upsertFAQMutation = useMutation({
    mutationFn: async (data) => {
      if (editingFAQ) {
        await FAQ.update(editingFAQ.id, data);
      } else {
        await FAQ.create({ ...data, is_active: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFAQs']);
      queryClient.invalidateQueries(['faqs']); // Support 페이지의 FAQ도 갱신
      setIsFAQModalOpen(false);
      setEditingFAQ(null);
      setFaqFormData({ question: "", answer: "", order: 0 });
      alert("FAQ가 저장되었습니다.");
    }
  });

  const deleteFAQMutation = useMutation({
    mutationFn: (id) => FAQ.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFAQs']);
      queryClient.invalidateQueries(['faqs']); // Support 페이지의 FAQ도 갱신
      alert("FAQ가 삭제되었습니다.");
    }
  });

  // 문의 삭제 Mutation
  const deleteTicketMutation = useMutation({
    mutationFn: (id) => SupportTicket.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminTickets']);
      queryClient.invalidateQueries(['myTickets']);
      setSelectedTicket(null);
      alert("문의가 삭제되었습니다.");
    }
  });

  const openFAQModal = (faq = null) => {
    if (faq) {
      setEditingFAQ(faq);
      setFaqFormData({ question: faq.question, answer: faq.answer, order: faq.order || 0 });
    } else {
      setEditingFAQ(null);
      setFaqFormData({ question: "", answer: "", order: 0 });
    }
    setIsFAQModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">고객센터 관리</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-2">
          <TabsTrigger value="tickets">1:1 문의 관리</TabsTrigger>
          <TabsTrigger value="faqs">FAQ 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ticket List */}
            <div className="md:col-span-1 space-y-3 h-[600px] overflow-y-auto pr-2">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setReplyContent(ticket.admin_response || "");
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      ticket.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                      ticket.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }>
                      {ticket.status === 'open' ? '대기중' :
                       ticket.status === 'in_progress' ? '처리중' :
                       ticket.status === 'resolved' ? '답변완료' :
                       ticket.status === 'closed' ? '종료' : ticket.status}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {formatKST(ticket.created_at, 'MM.dd HH:mm')}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm line-clamp-1 mb-1">{ticket.subject}</h4>
                  <p className="text-xs text-gray-500">{ticket.user_email}</p>
                </div>
              ))}
            </div>

            {/* Ticket Detail & Reply */}
            <div className="md:col-span-2">
              {selectedTicket ? (
                <Card className="h-full">
                  <CardHeader className="border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg mb-2">{selectedTicket.subject}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{selectedTicket.user_email}</span>
                          <span>•</span>
                          <span>{formatKST(selectedTicket.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="bg-gray-50 p-4 rounded-xl min-h-[100px]">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        관리자 답변
                      </label>
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="답변 내용을 입력하세요..."
                        className="min-h-[150px] rounded-xl resize-none text-base"
                      />
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (window.confirm('문의를 삭제하시겠습니까?')) {
                              deleteTicketMutation.mutate(selectedTicket.id);
                            }
                          }}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          삭제
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => replyTicketMutation.mutate({
                               id: selectedTicket.id,
                               reply: replyContent,
                               status: 'closed'
                            })}
                            disabled={selectedTicket.status === 'closed' || !replyContent.trim() || replyTicketMutation.isPending}
                            className={selectedTicket.status === 'closed' || !replyContent.trim() ? "text-gray-400 cursor-not-allowed" : "text-gray-600"}
                          >
                            {selectedTicket.status === 'closed' ? '종료됨' : '종료 처리'}
                          </Button>
                          <Button
                            onClick={() => replyTicketMutation.mutate({
                               id: selectedTicket.id,
                               reply: replyContent,
                               status: 'resolved'
                            })}
                            disabled={!replyContent.trim() || replyTicketMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            답변 등록
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                  문의를 선택해주세요
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openFAQModal()} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              FAQ 추가
            </Button>
          </div>

          <div className="grid gap-4">
            {faqs.map(faq => (
              <Card key={faq.id} className="overflow-hidden">
                <div className="flex items-center p-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-gray-50">순서: {faq.order}</Badge>
                      <h4 className="font-bold text-gray-800">{faq.question}</h4>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openFAQModal(faq)}>
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if(confirm("삭제하시겠습니까?")) deleteFAQMutation.mutate(faq.id);
                    }}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {faqs.length === 0 && (
               <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                 등록된 FAQ가 없습니다.
               </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* FAQ Modal */}
      <Dialog open={isFAQModalOpen} onOpenChange={setIsFAQModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFAQ ? 'FAQ 수정' : 'FAQ 추가'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">질문</label>
              <Input 
                value={faqFormData.question} 
                onChange={(e) => setFaqFormData({...faqFormData, question: e.target.value})}
                placeholder="질문을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">답변</label>
              <Textarea 
                value={faqFormData.answer} 
                onChange={(e) => setFaqFormData({...faqFormData, answer: e.target.value})}
                placeholder="답변을 입력하세요"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">정렬 순서</label>
              <Input 
                type="number"
                value={faqFormData.order} 
                onChange={(e) => setFaqFormData({...faqFormData, order: parseInt(e.target.value) || 0})}
              />
            </div>
            <Button 
              onClick={() => upsertFAQMutation.mutate(faqFormData)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              저장하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}