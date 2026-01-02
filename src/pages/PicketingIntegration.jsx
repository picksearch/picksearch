import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, Key, Code, Terminal, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function PicketingIntegration() {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const apiKey = "YOUR_EXTERNAL_API_KEY_HERE"; // 사용자가 설정한 키로 교체 필요

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("ClientHome")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">픽켓팅 - 픽서치 API 연동 가이드</h1>
            <p className="text-gray-600 mt-1">픽켓팅에서 픽서치 설문을 생성하고 관리하는 방법</p>
          </div>
        </div>

        {/* Step 1: API 키 설정 */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Key className="w-5 h-5" />
              1단계: Base44에서 API 키 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Base44 대시보드 접속 (https://app.base44.com)</li>
              <li>Settings → Environment Variables 메뉴 이동</li>
              <li>새 환경변수 추가:
                <div className="bg-white rounded-lg p-3 mt-2 font-mono text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">Key:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">EXTERNAL_API_KEY</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Value:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">pk_live_YOUR_SECRET_KEY_123abc</code>
                  </div>
                </div>
              </li>
              <li>Save 클릭하여 저장</li>
            </ol>
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 text-sm text-orange-800">
              ⚠️ <strong>중요:</strong> API 키는 복잡한 문자열로 설정하고, 절대 외부에 노출하지 마세요.
            </div>
          </CardContent>
        </Card>

        {/* Step 2: 픽켓팅 .env 설정 */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Terminal className="w-5 h-5" />
              2단계: 픽켓팅 프로젝트 .env 파일 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-purple-800">
              픽켓팅 프로젝트 루트의 <code className="bg-purple-100 px-2 py-1 rounded">.env</code> 파일에 다음을 추가:
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`# 픽서치 API 설정
VITE_PICKSEARCH_API_URL=https://survey-flow-6a9c9752.base44.app/api/apps/690ca08f00a852116a9c9752/functions/externalSurveyAPI
VITE_PICKSEARCH_API_KEY=6c23969f3cf34da888f2e9cf591d7d3e`}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 text-white hover:bg-white/10"
                onClick={() => copyToClipboard(`VITE_PICKSEARCH_API_URL=https://app.base44.com/api/externalSurveyAPI\nVITE_PICKSEARCH_API_KEY=pk_live_YOUR_SECRET_KEY_123abc`, 'env')}
              >
                {copied === 'env' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: React/JavaScript 샘플 코드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              3단계: React 컴포넌트 샘플 코드
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-bold text-sm mb-2">API 클라이언트 생성 (utils/picksearchApi.js)</h3>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`// utils/picksearchApi.js
const API_URL = import.meta.env.VITE_PICKSEARCH_API_URL;
const API_KEY = import.meta.env.VITE_PICKSEARCH_API_KEY;

export const picksearchApi = {
  // 설문 생성
  async createSurvey(data) {
    const response = await fetch(\`\${API_URL}?action=create\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': API_KEY
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // 설문 목록 조회
  async listSurveys(userEmail) {
    const response = await fetch(
      \`\${API_URL}?action=list&user_email=\${userEmail}\`,
      {
        headers: { 'api_key': API_KEY }
      }
    );
    return response.json();
  },

  // 설문 상태 조회
  async getSurveyStatus(surveyId) {
    const response = await fetch(
      \`\${API_URL}?action=status&survey_id=\${surveyId}\`,
      {
        headers: { 'api_key': API_KEY }
      }
    );
    return response.json();
  },

  // 설문 결과 조회
  async getSurveyResults(surveyId) {
    const response = await fetch(
      \`\${API_URL}?action=results&survey_id=\${surveyId}\`,
      {
        headers: { 'api_key': API_KEY }
      }
    );
    return response.json();
  },

  // 설문 시작
  async startSurvey(surveyId) {
    const response = await fetch(\`\${API_URL}?action=start\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': API_KEY
      },
      body: JSON.stringify({ survey_id: surveyId })
    });
    return response.json();
  },

  // 설문 종료
  async closeSurvey(surveyId) {
    const response = await fetch(\`\${API_URL}?action=close\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': API_KEY
      },
      body: JSON.stringify({ survey_id: surveyId })
    });
    return response.json();
  },

  // 설문 삭제
  async deleteSurvey(surveyId, userEmail) {
    const response = await fetch(\`\${API_URL}?action=delete\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': API_KEY
      },
      body: JSON.stringify({ survey_id: surveyId, user_email: userEmail })
    });
    return response.json();
  }
};`}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-white hover:bg-white/10"
                  onClick={() => copyToClipboard(document.querySelectorAll('pre')[2].textContent, 'api-client')}
                >
                  {copied === 'api-client' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-2">React 컴포넌트 사용 예제</h3>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`// components/PickSearchPage.jsx
import React, { useState } from 'react';
import { picksearchApi } from '../utils/picksearchApi';

export default function PickSearchPage() {
  const [loading, setLoading] = useState(false);
  const [surveyUrl, setSurveyUrl] = useState('');

  const handleCreateSurvey = async () => {
    setLoading(true);
    try {
      const result = await picksearchApi.createSurvey({
        user_email: 'customer@picketing.kr',
        title: '고객 만족도 조사',
        description: '서비스 개선을 위한 설문',
        survey_purpose: '고객 피드백 수집',
        usage_purpose: '서비스 품질 향상',
        questions: [
          {
            question_text: '서비스에 만족하십니까?',
            question_type: 'multiple_choice',
            options: ['매우 만족', '만족', '보통', '불만족', '매우 불만족']
          },
          {
            question_text: '개선이 필요한 부분을 자유롭게 작성해주세요',
            question_type: 'short_answer'
          }
        ],
        target_participants: 100,
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        slot_count: 1,
        auto_start: false
      });

      if (result.success) {
        setSurveyUrl(result.survey_url);
        alert('설문이 생성되었습니다!');
        
        // 바로 시작하려면
        // await picksearchApi.startSurvey(result.survey_id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('설문 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">픽서치 설문 생성</h1>
      
      <button
        onClick={handleCreateSurvey}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-2 rounded-lg"
      >
        {loading ? '생성 중...' : '설문 생성하기'}
      </button>

      {surveyUrl && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="font-bold text-green-800">설문이 생성되었습니다!</p>
          <a 
            href={surveyUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {surveyUrl}
          </a>
        </div>
      )}
    </div>
  );
}`}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-white hover:bg-white/10"
                  onClick={() => copyToClipboard(document.querySelectorAll('pre')[3].textContent, 'component')}
                >
                  {copied === 'component' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: API 엔드포인트 레퍼런스 */}
        <Card>
          <CardHeader>
            <CardTitle>4단계: API 엔드포인트 레퍼런스</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge>POST</Badge>
                  <code className="text-sm">?action=create</code>
                </div>
                <p className="text-sm text-gray-600">설문 생성</p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">GET</Badge>
                  <code className="text-sm">?action=list&user_email=XXX</code>
                </div>
                <p className="text-sm text-gray-600">설문 목록 조회</p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">GET</Badge>
                  <code className="text-sm">?action=status&survey_id=XXX</code>
                </div>
                <p className="text-sm text-gray-600">설문 상태 조회</p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">GET</Badge>
                  <code className="text-sm">?action=results&survey_id=XXX</code>
                </div>
                <p className="text-sm text-gray-600">설문 결과 조회</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge>POST</Badge>
                  <code className="text-sm">?action=start</code>
                </div>
                <p className="text-sm text-gray-600">설문 시작</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge>POST</Badge>
                  <code className="text-sm">?action=close</code>
                </div>
                <p className="text-sm text-gray-600">설문 종료</p>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="destructive">POST</Badge>
                  <code className="text-sm">?action=delete</code>
                </div>
                <p className="text-sm text-gray-600">설문 삭제</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 지원 정보 */}
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-gray-900">📞 지원 및 문의</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>• API 사용 중 문제가 발생하면 픽서치 고객센터로 문의해주세요.</p>
            <p>• 더 자세한 API 문서는 <Link to={createPageUrl("APIGuide")} className="text-blue-600 underline">API 가이드 페이지</Link>에서 확인하세요.</p>
            <p>• <code className="bg-gray-200 px-2 py-1 rounded">user_email</code>은 픽서치에 가입된 이메일이어야 합니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}