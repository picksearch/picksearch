import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { auth } from "@/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Kakao Icon Component
const KakaoIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#000000"
      d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"
    />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    // Check if already logged in
    const checkAuth = async () => {
      try {
        const isAuth = await auth.isAuthenticated();
        if (isAuth) {
          navigate(redirectTo);
        }
      } catch (err) {
        // Ignore CORB/network errors during auth check
        console.log('Auth check skipped:', err.message);
      }
    };
    checkAuth();
  }, [navigate, redirectTo]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await auth.signIn(email, password);
      navigate(redirectTo);
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await auth.signInWithProvider("google");
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google 로그인 중 오류가 발생했습니다.");
    }
  };

  const handleKakaoLogin = async () => {
    setError("");
    try {
      await auth.signInWithProvider("kakao");
    } catch (err) {
      console.error("Kakao login error:", err);
      setError("카카오 로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white rounded-3xl shadow-xl border-0 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-orange-500 to-pink-500" />

          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              픽서치 로그인
            </CardTitle>
            <p className="text-gray-500 text-sm mt-2">
              정밀 타겟 데이터 수집 설문 플랫폼
            </p>
          </CardHeader>

          <CardContent className="p-6 pt-4 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-medium"
              >
                <GoogleIcon />
                <span className="ml-2">Google로 계속하기</span>
              </Button>

              {/* 카카오 로그인은 추후 활성화 예정
              <Button
                type="button"
                onClick={handleKakaoLogin}
                className="w-full h-12 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] text-black font-medium"
              >
                <KakaoIcon />
                <span className="ml-2">카카오로 계속하기</span>
              </Button>
              */}
            </div>

            <div className="relative py-4">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-gray-400">
                또는
              </span>
            </div>

            {/* Email Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  이메일
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일을 입력하세요"
                    className="pl-12 h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-12 pr-12 h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-gray-500 text-sm">
                계정이 없으신가요?{" "}
                <Link
                  to="/signup"
                  className="text-orange-600 hover:text-orange-700 font-bold"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
