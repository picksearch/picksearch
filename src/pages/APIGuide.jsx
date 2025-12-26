import React, { useState } from "react";
import { auth } from "@/api/auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, Code, Terminal, Key, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function APIGuide() {
  const [copied, setCopied] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await auth.me();
      } catch (error) {
        return null;
      }
    },
  });

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const apiUrl = `${window.location.origin}/api/externalSurveyAPI`;
  const apiKey = "YOUR_EXTERNAL_API_KEY"; // 사용자가 설정한 키

  const examples = [
    {
      title: "1. 설문조사 생성",
      method: "POST",
      endpoint: `${apiUrl}?action=create`,
      description: "새로운 설문조사를 생성합니다. 타겟 설정, 랜딩페이지 연결 등 모든 옵션 지원.",
      code: `curl -X POST "${apiUrl}?action=create" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_email": "customer@example.com",
    "title": "20대 여성 화장품 선호도 조사",
    "description": "신제품 출시를 위한 시장 조사",
    "purpose": "타겟 고객의 화장품 구매 패턴 분석",
    "questions": [
      {
        "question_text": "가장 선호하는 브랜드는?",
        "question_type": "multiple_choice",
        "options": ["A브랜드", "B브랜드", "C브랜드", "D브랜드"]
      }
    ],
    "target_settings": {
      "cells": [{
        "id": "CELL_1",
        "name": "타겟그룹",
        "targets": {
          "DEMO": {
            "gender": "F",
            "age_10s": ["AGE_20S"]
          },
          "INTEREST": {
            "interest_category": ["INT_FASHION_BEAUTY"]
          }
        }
      }]
    },
    "start_date": "2025-01-01",
    "end_date": "2025-01-31",
    "slot_count": 2,
    "use_landing_page": true,
    "landing_page_url": "https://yoursite.com/event",
    "auto_start": false
  }'`,
      response: `{
  "success": true,
  "survey_id": "abc123",
  "secret_key": "xyz789",
  "survey_url": "https://picksearch.ai/TakeSurvey?key=xyz789",
  "status": "draft"
}`
    },
    {
      title: "2. 타겟 설정 업데이트",
      method: "PUT",
      endpoint: `${apiUrl}?action=update_targets`,
      description: "설문조사의 타겟 설정을 업데이트합니다.",
      code: `curl -X PUT "${apiUrl}?action=update_targets" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "survey_id": "abc123",
    "target_settings": {
      "cells": [{
        "id": "CELL_1",
        "name": "메인타겟",
        "targets": {
          "DEMO": {
            "gender": "F",
            "age_10s": ["AGE_20S", "AGE_30S"]
          },
          "SPENDING": {
            "spending_power": "HIGH"
          }
        }
      }],
      "customAppText": "올리브영, 무신사",
      "customLocationText": "강남역, 홍대입구"
    }
  }'`,
      response: `{
  "success": true,
  "survey_id": "abc123",
  "target_settings": {...}
}`
    },
    {
      title: "3. 설문 수정",
      method: "PUT",
      endpoint: `${apiUrl}?action=update`,
      description: "설문 제목, 설명, 기간 등을 수정합니다.",
      code: `curl -X PUT "${apiUrl}?action=update" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "survey_id": "abc123",
    "title": "수정된 제목",
    "description": "수정된 설명",
    "end_date": "2025-02-28"
  }'`,
      response: `{
  "success": true,
  "survey_id": "abc123",
  "updated_fields": ["title", "description", "end_date"]
}`
    },
    {
      title: "4. 질문 추가",
      method: "POST",
      endpoint: `${apiUrl}?action=add_questions`,
      description: "기존 설문에 새로운 질문을 추가합니다.",
      code: `curl -X POST "${apiUrl}?action=add_questions" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "survey_id": "abc123",
    "questions": [
      {
        "question_text": "추가 질문입니다",
        "question_type": "short_answer"
      }
    ]
  }'`,
      response: `{
  "success": true,
  "survey_id": "abc123",
  "created_question_ids": ["q456", "q789"]
}`
    },
    {
      title: "5. 설문 시작",
      method: "POST",
      endpoint: `${apiUrl}?action=start`,
      description: "생성된 설문조사를 시작합니다.",
      code: `curl -X POST "${apiUrl}?action=start" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "survey_id": "abc123"
  }'`,
      response: `{
  "success": true,
  "survey_id": "abc123",
  "status": "live"
}`
    },
    {
      title: "6. 상태 조회",
      method: "GET",
      endpoint: `${apiUrl}?action=status&survey_id=abc123`,
      description: "설문 진행 상태와 응답 현황을 확인합니다.",
      code: `curl -X GET "${apiUrl}?action=status&survey_id=abc123" \\
  -H "x-api-key: ${apiKey}"`,
      response: `{
  "survey_id": "abc123",
  "title": "고객 만족도 조사",
  "status": "live",
  "total_responses": 150,
  "completed_responses": 142,
  "start_date": "2025-01-01",
  "end_date": "2025-01-31"
}`
    },
    {
      title: "7. 통계 데이터 조회",
      method: "GET",
      endpoint: `${apiUrl}?action=statistics&survey_id=abc123`,
      description: "질문별 응답 분포, 평균, 통계 등을 조회합니다.",
      code: `curl -X GET "${apiUrl}?action=statistics&survey_id=abc123" \\
  -H "x-api-key: ${apiKey}"`,
      response: `{
  "survey_id": "abc123",
  "title": "고객 만족도 조사",
  "total_responses": 150,
  "completed_responses": 142,
  "completion_rate": 94,
  "question_statistics": [
    {
      "question_id": "q1",
      "question_text": "만족도는?",
      "question_type": "multiple_choice",
      "total_responses": 142,
      "answer_distribution": {
        "매우 만족": 45,
        "만족": 67,
        "보통": 20,
        "불만족": 8,
        "매우 불만족": 2
      }
    }
  ]
}`
    },
    {
      title: "8. AI 리포트 생성",
      method: "POST",
      endpoint: `${apiUrl}?action=generate_report`,
      description: "AI가 응답 데이터를 분석한 리포트를 생성합니다.",
      code: `curl -X POST "${apiUrl}?action=generate_report" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "survey_id": "abc123",
    "report_type": "hyper_precision"
  }'`,
      response: `{
  "success": true,
  "survey_id": "abc123",
  "report_type": "hyper_precision",
  "report": "# 설문조사 분석 리포트\\n\\n## 핵심 발견사항\\n1. 전반적 만족도 높음 (79%)\\n..."
}`
    },
    {
      title: "9. 상세 결과 조회",
      method: "GET",
      endpoint: `${apiUrl}?action=results&survey_id=abc123`,
      description: "모든 응답 데이터를 가져옵니다.",
      code: `curl -X GET "${apiUrl}?action=results&survey_id=abc123" \\
  -H "x-api-key: ${apiKey}"`,
      response: `{
  "survey": {...},
  "questions": [...],
  "responses": [
    {
      "id": "r1",
      "answers": [
        {"question_id": "q1", "answer": "만족"},
        {"question_id": "q2", "answer": "좋았습니다"}
      ],
      "created_date": "2025-01-15T10:30:00Z"
    }
  ]
}`
    },
    {
      title: "10. 설문 목록 조회",
      method: "GET",
      endpoint: `${apiUrl}?action=list&user_email=user@example.com&status=live`,
      description: "특정 사용자의 설문 목록을 조회합니다.",
      code: `curl -X GET "${apiUrl}?action=list&user_email=user@example.com&status=live&limit=10" \\
  -H "x-api-key: ${apiKey}"`,
      response: `{
  "total": 3,
  "surveys": [
    {
      "id": "abc123",
      "title": "설문1",
      "status": "live",
      "created_date": "2025-01-01T00:00:00Z",
      "total_responses": 50,
      "completed_responses": 45
    }
  ]
}`
    },
    {
      title: "11. 설문 종료",
      method: "POST",
      endpoint: `${apiUrl}?action=close`,
      description: "진행 중인 설문을 종료합니다.",
      code: `curl -X POST "${apiUrl}?action=close" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "survey_id": "abc123"
  }'`,
      response: `{
  "success": true,
  "survey_id": "abc123",
  "status": "closed"
}`
    },
    {
      title: "12. 설문 삭제",
      method: "DELETE",
      endpoint: `${apiUrl}?action=delete&survey_id=abc123`,
      description: "설문과 관련 데이터를 완전히 삭제합니다.",
      code: `curl -X DELETE "${apiUrl}?action=delete&survey_id=abc123" \\
  -H "x-api-key: ${apiKey}"`,
      response: `{
  "success": true,
  "survey_id": "abc123",
  "deleted": {
    "questions": 5,
    "responses": 142
  }
}`
    }
  ];

  const questionTypes = [
    { type: "multiple_choice", label: "객관식", desc: "단일 선택" },
    { type: "multiple_select", label: "다중선택", desc: "여러 개 선택 가능" },
    { type: "short_answer", label: "주관식", desc: "텍스트 입력" },
    { type: "ranking", label: "순위형", desc: "항목 순위 매기기" },
    { type: "numeric_rating", label: "수치평정", desc: "0-10점 척도" },
    { type: "likert_scale", label: "리커트척도", desc: "5점 척도" },
    { type: "image_choice", label: "이미지선택", desc: "이미지 2개 중 선택" },
    { type: "image_banner", label: "이벤트배너", desc: "이미지 노출용" }
  ];

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">관리자만 접근 가능합니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">픽서치 API 가이드</h1>
            <p className="text-gray-600 mt-1">외부 플랫폼에서 픽서치를 연동하는 방법</p>
          </div>
        </div>

        {/* API Key Setup */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Key className="w-5 h-5" />
              API 키 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-blue-800 mb-3">
                외부 플랫폼에서 API를 사용하려면 먼저 관리자 대시보드에서 <code className="bg-blue-100 px-2 py-1 rounded">EXTERNAL_API_KEY</code> 시크릿을 설정해야 합니다.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>관리자 설정 → 시스템 설정으로 이동</li>
                <li>Environment Variables 섹션에서 <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">EXTERNAL_API_KEY</code> 추가</li>
                <li>복잡한 문자열 값 입력 (예: <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">pk_live_abc123xyz789...</code>)</li>
              </ol>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-gray-600 mb-2">API Base URL</p>
              <div className="flex items-center gap-2">
                <Input
                  value={apiUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(apiUrl, 'url')}
                >
                  {copied === 'url' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <div className="space-y-4">
          {examples.map((example, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{example.title}</CardTitle>
                  <Badge variant={example.method === 'GET' ? 'default' : 'destructive'}>
                    {example.method}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2">{example.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      요청 예시
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(example.code, `code-${index}`)}
                    >
                      {copied === `code-${index}` ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{example.code}</code>
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      응답 예시
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(example.response, `response-${index}`)}
                    >
                      {copied === `response-${index}` ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="bg-green-50 text-green-900 p-4 rounded-lg overflow-x-auto text-xs border border-green-200">
                    <code>{example.response}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Question Types Reference */}
        <Card>
          <CardHeader>
            <CardTitle>질문 타입 참조</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {questionTypes.map((qt, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Badge variant="outline" className="font-mono text-xs">
                    {qt.type}
                  </Badge>
                  <div>
                    <div className="font-semibold text-sm">{qt.label}</div>
                    <div className="text-xs text-gray-500">{qt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Target Settings Reference */}
        <Card>
          <CardHeader>
            <CardTitle>타겟 설정 참조</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              <code className="bg-gray-100 px-2 py-1 rounded">target_settings</code> 객체 구조:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "cells": [{
    "id": "CELL_1",
    "name": "타겟그룹명",
    "targets": {
      "DEMO": {
        "gender": "F",           // M, F
        "age_10s": ["AGE_20S", "AGE_30S"],
        "household_type": ["HH_SINGLE"],
        "kids_stage": ["NO_KIDS"]
      },
      "SPENDING": {
        "spending_power": "HIGH" // LOW, MID, HIGH, PREMIUM
      },
      "OCCUPATION": {
        "occupation_type": ["OFFICE_WORKER", "FREELANCER"]
      },
      "INTEREST": {
        "interest_category": ["INT_FASHION_BEAUTY", "INT_TRAVEL"]
      },
      "BEHAVIOR": {
        "shopping_category": "SHOP_FASHION"
      },
      "LOCATION": {
        "residence_region": ["SEOUL", "GYEONGGI"]
      }
    }
  }],
  "customAppText": "앱1, 앱2",           // 특정 앱 설치자 타겟
  "customLocationText": "강남역, 홍대"   // 특정 위치 검색자 타겟
}`}
            </pre>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-900">⚠️ 주의사항</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-orange-800">
            <p>• API 키는 절대 외부에 노출하지 마세요.</p>
            <p>• <code className="bg-orange-100 px-1.5 py-0.5 rounded">user_email</code>은 픽서치에 가입된 이메일이어야 합니다.</p>
            <p>• 설문조사 생성 시 <code className="bg-orange-100 px-1.5 py-0.5 rounded">auto_start: true</code>로 설정하면 즉시 시작됩니다.</p>
            <p>• 타겟 설정은 할증 비용이 발생할 수 있습니다 (조건당 3-5%).</p>
            <p>• AI 리포트 생성은 응답이 1개 이상일 때만 가능합니다.</p>
            <p>• <code className="bg-orange-100 px-1.5 py-0.5 rounded">report_type</code>: "standard" 또는 "hyper_precision"</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}