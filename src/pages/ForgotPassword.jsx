import React, { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "@/api/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await auth.resetPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error("Password reset error:", err);
      setError("비밀번호 재설정 메일 발송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white rounded-3xl shadow-xl border-0 overflow-hidden text-center">
            <CardContent className="p-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                메일이 발송되었습니다
              </h2>
              <p className="text-gray-500 mb-6">
                {email}로 비밀번호 재설정 링크가 발송되었습니다.
                <br />
                이메일을 확인해주세요.
              </p>
              <Link to="/login">
                <Button className="w-full h-12 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-bold">
                  로그인으로 돌아가기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
              <Mail className="w-8 h-8 text-orange-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              비밀번호 찾기
            </CardTitle>
            <p className="text-gray-500 text-sm mt-2">
              가입하신 이메일 주소를 입력해주세요
            </p>
          </CardHeader>

          <CardContent className="p-6 pt-4 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-orange-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    발송 중...
                  </>
                ) : (
                  "비밀번호 재설정 메일 발송"
                )}
              </Button>
            </form>

            <div className="text-center pt-4">
              <Link
                to="/login"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                로그인으로 돌아가기
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
