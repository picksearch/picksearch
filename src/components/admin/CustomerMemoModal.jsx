import React, { useState, useEffect } from "react";
import { CustomerMemo } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Save, Loader2 } from "lucide-react";

export default function CustomerMemoModal({ user, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("active");
  const [existingMemoId, setExistingMemoId] = useState(null);

  const { data: existingMemo, isLoading } = useQuery({
    queryKey: ['customerMemo', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const memos = await CustomerMemo.filter({ user_email: user.email });
      return memos.length > 0 ? memos[0] : null;
    },
    enabled: !!user?.email && isOpen,
  });

  useEffect(() => {
    if (existingMemo) {
      setMemo(existingMemo.memo || "");
      setTags(existingMemo.tags || "");
      setStatus(existingMemo.status || "active");
      setExistingMemoId(existingMemo.id);
    } else {
      // Reset only if we are opening for a fresh user (handled by query key change)
      if (!isLoading) {
         // Wait for loading to finish before resetting to empty if null
         if (existingMemo === null) {
            setMemo("");
            setTags("");
            setStatus("active");
            setExistingMemoId(null);
         }
      }
    }
  }, [existingMemo, isLoading, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        user_email: user.email,
        memo,
        tags,
        status
      };
      if (existingMemoId) {
        await CustomerMemo.update(existingMemoId, data);
      } else {
        await CustomerMemo.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customerMemo']);
      queryClient.invalidateQueries(['allUsers']); // If we show memo indicator in list
      onClose();
      alert("고객 데이터가 저장되었습니다.");
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <User className="w-5 h-5 text-purple-600" />
             고객 상세 관리
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
             <div className="font-bold text-gray-900">{user?.full_name}</div>
             <div className="text-gray-500">{user?.email}</div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">고객 상태 분류</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'active', label: '일반', color: 'bg-green-100 text-green-700 border-green-200' },
                { id: 'potential', label: '잠재고객', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                { id: 'vip', label: 'VIP', color: 'bg-purple-100 text-purple-700 border-purple-200' },
                { id: 'black_list', label: '블랙리스트', color: 'bg-red-100 text-red-700 border-red-200' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setStatus(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    status === s.id 
                      ? `ring-2 ring-offset-1 ring-gray-300 ${s.color}` 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">관리자 메모</label>
            <Textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="고객 특이사항, 상담 내용, 요청사항 등을 기록하세요."
              className="h-32 resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">태그</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="예: 대량구매, 컴플레인, 친절함 (콤마로 구분)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>닫기</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            저장하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}