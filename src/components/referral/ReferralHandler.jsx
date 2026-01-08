import { useEffect, useRef } from "react";
import { auth } from "@/api/auth";
import { processReferral } from "@/api/functions";
import { useQueryClient } from "@tanstack/react-query";

// 리퍼럴 보상 구조:
// - 신규 가입자: 3 서치코인
// - 추천 코드로 가입 시: 가입자 13코인 (3+10), 추천인 3코인

export default function ReferralHandler() {
  const queryClient = useQueryClient();
  const processedRef = useRef(false);

  // Step 1: URL에서 추천 코드 저장
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (!refCode) return;

    localStorage.setItem('pending_referral_code', refCode);
    
    // URL 정리 (쿼리파라미터만 제거)
    const newUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }, []);

  // Step 2: 가입/로그인 후 보너스 처리 (백엔드 함수 호출)
  useEffect(() => {
    const processReferral = async () => {
      if (processedRef.current) return;
      
      try {
        const isAuthenticated = await auth.isAuthenticated();
        if (!isAuthenticated) {
          return;
        }

        const currentUser = await auth.me();

        // 이미 referred_by가 실제로 설정된 경우 스킵 (existing_user 제외)
        if (currentUser.referred_by && currentUser.referred_by !== 'existing_user') {
          localStorage.removeItem('pending_referral_code');
          return;
        }

        // 이미 코인을 받은 경우 스킵
        if ((currentUser.search_coins || 0) > 0) {
          localStorage.removeItem('pending_referral_code');
          return;
        }

        processedRef.current = true;

        const pendingRefCode = localStorage.getItem('pending_referral_code');

        // 백엔드 함수 호출
        await processReferral({
          referralCode: pendingRefCode || null
        });

        localStorage.removeItem('pending_referral_code');
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      } catch (error) {
        processedRef.current = false;
      }
    };

    // 초기 실행 + 지연 실행 (로그인 완료 대기)
    processReferral();
    const timer = setTimeout(processReferral, 2000);
    return () => clearTimeout(timer);
  }, [queryClient]);

  return null;
}