import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from URL hash or query params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const errorDescription = hashParams.get("error_description");

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        // If we have tokens in the hash, set the session
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
        }

        // Check if we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          setStatus("success");

          // Handle referral if present
          const referralCode = searchParams.get("ref") || localStorage.getItem("referral_code");
          if (referralCode) {
            try {
              // Process referral bonus via Edge Function
              await supabase.functions.invoke("process-referral", {
                body: { referral_code: referralCode },
              });
              localStorage.removeItem("referral_code");
            } catch (refError) {
              console.warn("Referral processing failed:", refError);
            }
          }

          // Redirect after a short delay
          setTimeout(() => {
            const redirectTo = searchParams.get("redirect") || "/clienthome";
            navigate(redirectTo, { replace: true });
          }, 1500);
        } else {
          throw new Error("인증에 실패했습니다.");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setStatus("error");
        setError(err.message || "인증 처리 중 오류가 발생했습니다.");
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-3xl shadow-xl border-0 overflow-hidden">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                로그인 처리 중...
              </h2>
              <p className="text-gray-500">잠시만 기다려주세요.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                로그인 성공!
              </h2>
              <p className="text-gray-500">페이지로 이동합니다...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                인증 실패
              </h2>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                로그인 페이지로 돌아가기
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
