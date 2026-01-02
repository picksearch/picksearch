import React, { useState } from "react";
import { CoinTransaction, User } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Users, Send, Search, Loader2, Gift } from "lucide-react";

export default function CoinManager() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState("");
  const [coinAmount, setCoinAmount] = useState("");
  const [description, setDescription] = useState("");
  const [grantType, setGrantType] = useState("individual"); // individual or all
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => User.list()
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['recentCoinTransactions'],
    queryFn: async () => {
      const transactions = await CoinTransaction.filter(
        { type: 'admin_grant' },
        '-created_date',
        20
      );
      return transactions;
    }
  });

  const grantCoinsMutation = useMutation({
    mutationFn: async ({ targetUsers, amount, desc }) => {
      const results = [];
      for (const user of targetUsers) {
        // Update user's coin balance
        const newBalance = (user.search_coins || 0) + amount;
        await User.update(user.id, {
          search_coins: newBalance
        });

        // Create transaction record
        await CoinTransaction.create({
          user_email: user.email,
          amount: amount,
          type: 'admin_grant',
          description: desc || '관리자 지급'
        });
        
        results.push(user.email);
      }
      return results;
    },
    onSuccess: (emails) => {
      queryClient.invalidateQueries(['allUsers']);
      queryClient.invalidateQueries(['recentCoinTransactions']);
      alert(`${emails.length}명에게 ${coinAmount} 서치코인을 지급했습니다.`);
      setCoinAmount("");
      setDescription("");
      setSelectedUser("");
    },
    onError: (error) => {
      alert('코인 지급 실패: ' + error.message);
    }
  });

  const handleGrant = () => {
    const amount = parseInt(coinAmount);
    if (!amount || amount <= 0) {
      alert('올바른 코인 수량을 입력해주세요.');
      return;
    }

    let targetUsers = [];
    if (grantType === 'all') {
      if (!window.confirm(`전체 ${users.length}명에게 ${amount} 서치코인을 지급하시겠습니까?`)) {
        return;
      }
      targetUsers = users;
    } else {
      const user = users.find(u => u.email === selectedUser);
      if (!user) {
        alert('사용자를 선택해주세요.');
        return;
      }
      targetUsers = [user];
    }

    grantCoinsMutation.mutate({
      targetUsers,
      amount,
      desc: description
    });
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-500" />
            서치코인 지급
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Grant Type Selection */}
          <div className="flex gap-2">
            <Button
              variant={grantType === 'individual' ? 'default' : 'outline'}
              onClick={() => setGrantType('individual')}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              특정 회원
            </Button>
            <Button
              variant={grantType === 'all' ? 'default' : 'outline'}
              onClick={() => setGrantType('all')}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              전체 회원 ({users.length}명)
            </Button>
          </div>

          {/* User Selection (for individual) */}
          {grantType === 'individual' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">회원 선택</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="이메일 또는 이름으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="회원을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredUsers.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      <div className="flex items-center gap-2">
                        <span>{user.full_name || user.email}</span>
                        <span className="text-xs text-gray-400">
                          ({user.search_coins || 0} 코인)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">지급할 코인 수량</label>
            <Input
              type="number"
              placeholder="예: 10"
              value={coinAmount}
              onChange={(e) => setCoinAmount(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">지급 사유 (선택)</label>
            <Textarea
              placeholder="예: 이벤트 참여 보상"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleGrant}
            disabled={grantCoinsMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white"
          >
            {grantCoinsMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />지급 중...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" />코인 지급하기</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 관리자 지급 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">지급 내역이 없습니다.</p>
            ) : (
              recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{tx.user_email}</p>
                    <p className="text-xs text-gray-500">{tx.description || '관리자 지급'}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-700">+{tx.amount}</Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(tx.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}