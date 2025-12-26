import React, { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InAppBrowserCheck() {
  const [isInApp, setIsInApp] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // In-App Browser Detection
    const inAppSignatures = [
      "KAKAOTALK", "NAVER", "Instagram", "Daum", "Line", "FBAV", "FBAN"
    ];
    const isDetected = inAppSignatures.some(sig => userAgent.includes(sig));

    if (!isDetected) return;

    // OS Detection
    const isAndroid = /android/i.test(userAgent);
    const isIphone = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

    if (isAndroid) {
      // Android: Auto Redirect to Chrome
      const url = window.location.href.replace(/https?:\/\//i, '');
      const intentUrl = `intent://${url}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
    } else if (isIphone) {
      // iOS: Show Guide Modal
      setIsIOS(true);
      setIsInApp(true);
    } else {
      // Other OS with In-App (rare): Just show modal
      setIsInApp(true);
    }
  }, []);

  if (!isInApp) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("주소가 복사되었습니다. Safari 주소창에 붙여넣기 해주세요.");
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-4xl">
          {isIOS ? '🍎' : '🚨'}
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">
            외부 브라우저로 열어주세요
          </h2>
          <p className="text-gray-600 leading-relaxed text-sm break-keep">
            현재 접속하신 인앱 브라우저에서는<br/>
            Google 정책상 로그인이 제한됩니다.<br/>
            <br/>
            원활한 이용을 위해<br/>
            <span className="font-bold text-blue-600">Safari</span> 브라우저로 접속해주세요.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button 
            onClick={handleCopyUrl}
            className="w-full h-12 text-base font-bold bg-gray-900 text-white hover:bg-gray-800 rounded-xl shadow-lg"
          >
            <Copy className="w-4 h-4 mr-2" />
            주소 복사하기
          </Button>
          
          <div className="relative">
             <div className="absolute inset-0 flex items-center">
               <span className="w-full border-t border-gray-200" />
             </div>
             <div className="relative flex justify-center text-xs uppercase">
               <span className="bg-white px-2 text-gray-400">방법</span>
             </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 text-left space-y-2">
            <p className="flex items-center gap-2">
              <span className="bg-gray-200 text-gray-700 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">1</span> 
              오른쪽 상단/하단 <strong>메뉴(⋮ 또는 ···)</strong> 클릭
            </p>
            <p className="flex items-center gap-2">
              <span className="bg-gray-200 text-gray-700 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">2</span>
              <strong>'다른 브라우저로 열기'</strong> 선택
            </p>
             <p className="flex items-center gap-2">
              <span className="bg-gray-200 text-gray-700 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]">3</span>
              또는 <strong>'Safari로 열기'</strong> 선택
            </p>
          </div>
          
          <button 
            onClick={() => setIsInApp(false)}
            className="text-xs text-gray-400 hover:text-gray-600 underline mt-2 block w-full text-center"
          >
            알림 닫고 계속하기 (로그인 불가)
          </button>
        </div>
      </div>
    </div>
  );
}