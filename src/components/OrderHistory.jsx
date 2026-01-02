import React from "react";
import { Survey } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { formatKST } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt } from "lucide-react";

export default function OrderHistory({ user }) {
  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ['userSurveys', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await Survey.filter(
        { user_id: user.id },
        'created_at',
        false
      );
    },
    enabled: !!user?.id,
  });

  const orders = surveys
    .filter(s => s.status !== 'draft' && s.status !== 'preview')
    .map(s => ({
      id: s.id,
      title: s.title,
      date: s.created_at,
      amount: s.survey_type === 'free' ? 0 : (s.total_cost || 0),
      type: s.survey_type === 'free' ? '무료설문' : '타겟설문'
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Receipt className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">아직 주문 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-sm mb-1 leading-tight">
                {order.title}
              </h4>
              <p className="text-xs text-gray-500">
                {formatKST(order.date)}
              </p>
            </div>
            <Badge className={order.type === '무료설문' ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-blue-100 text-blue-700 border-0'}>
              {order.type}
            </Badge>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-600">결제 금액</span>
            <span className="font-bold text-gray-900">
              {order.amount === 0 ? '무료' : `${order.amount.toLocaleString()}원`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}