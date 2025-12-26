import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check } from "lucide-react";

export default function InviteModal({ isOpen, onClose, referralCode, userName }) {
  const [copied, setCopied] = useState(false);
  
  const referralUrl = `${window.location.origin}?ref=${referralCode}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = referralUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const shareMessage = `${userName || '친구'}님이 픽서치에 초대했어요! 🎁\n가입하면 10 서치코인을 드려요!\n\n`;
  
  const handleKakaoShare = () => {
    if (window.Kakao && window.Kakao.Share) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '픽서치 초대장 🎁',
          description: `${userName || '친구'}님이 픽서치에 초대했어요! 가입하면 10 서치코인을 드려요!`,
          imageUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690ca08f00a852116a9c9752/541bf4ce9_Logo1.png',
          link: {
            mobileWebUrl: referralUrl,
            webUrl: referralUrl,
          },
        },
        buttons: [
          {
            title: '초대 받기',
            link: {
              mobileWebUrl: referralUrl,
              webUrl: referralUrl,
            },
          },
        ],
      });
    } else {
      // Fallback: open kakao talk share URL
      window.open(`https://sharer.kakao.com/talk/friends/picker/link?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareMessage)}`, '_blank');
    }
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '픽서치 초대장',
          text: shareMessage,
          url: referralUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            친구 초대하기 🎁
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-500">
            친구를 초대하고 서치코인을 받으세요
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Reward Info */}
          <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-600 mb-2">친구가 가입하면</p>
            <div className="flex justify-center items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">+3</div>
                <div className="text-xs text-gray-500">나에게</div>
              </div>
              <div className="text-gray-300">|</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">+10</div>
                <div className="text-xs text-gray-500">친구에게</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">서치코인 지급!</p>
          </div>
          
          {/* Referral URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">내 초대 링크</label>
            <div className="flex gap-2">
              <Input 
                value={referralUrl} 
                readOnly 
                className="text-sm bg-gray-50 border-gray-200"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                className={`px-4 transition-all ${copied ? 'bg-green-50 border-green-300 text-green-600' : ''}`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Copy Button Only */}
          <div className="space-y-3">
            <Button
              onClick={handleCopy}
              className={`w-full h-12 font-bold rounded-xl transition-all ${
                copied 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  복사 완료!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  초대 링크 복사하기
                </>
              )}
            </Button>
          </div>
          
          {/* My Referral Code */}
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">내 추천인 코드</p>
            <p className="text-lg font-bold text-gray-700 tracking-wider">{referralCode}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}