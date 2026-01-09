# PickSearch

SK플래닛 데이터 기반의 타겟 설문조사 플랫폼입니다.

## 기술 스택

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth)
- **API**: Vercel Serverless Functions
- **UI Components**: Radix UI + shadcn/ui

## 시작하기

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정합니다:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 5173)
npm run dev

# Vercel API 로컬 실행 (포트 3000)
npx vercel dev
```

### 빌드

```bash
npm run build
```

## 프로젝트 구조

```
├── api/                    # Vercel Serverless Functions
│   └── v1/
│       ├── surveys/        # 설문 관련 API
│       ├── users/          # 사용자 API
│       ├── targets/        # 타겟 옵션 API
│       └── ai/             # AI 생성 API
├── lib/
│   └── utils/              # API 공통 유틸리티 (auth, supabase, response)
├── src/
│   ├── api/                # 프론트엔드 API 클라이언트
│   ├── components/         # React 컴포넌트
│   │   ├── admin/          # 관리자 컴포넌트
│   │   ├── referral/       # 추천 시스템 컴포넌트
│   │   └── ui/             # shadcn/ui 컴포넌트
│   ├── pages/              # 페이지 컴포넌트
│   └── lib/                # 프론트엔드 유틸리티 함수
├── supabase/               # Supabase 스키마
└── scripts/                # 유틸리티 스크립트
```

## 주요 기능

- **설문 생성**: 일반 설문 및 무료 설문 생성
- **타겟 설정**: 성별, 연령, 지역 등 응답자 타겟팅
- **AI 질문 생성**: AI 기반 설문 질문 자동 생성
- **결과 분석**: 설문 결과 시각화 및 분석
- **관리자 대시보드**: 설문 관리 및 통계
- **외부 API**: 파트너 연동을 위한 REST API

## 페이지 구성 (src/pages)

### 인증 관련
| 파일 | 경로 | 설명 |
|------|------|------|
| `Login.jsx` | `/login` | 이메일/소셜 로그인 페이지 |
| `Signup.jsx` | `/signup` | 회원가입 페이지 (이메일/Google) |
| `AuthCallback.jsx` | `/auth/callback` | OAuth 인증 콜백 처리 |
| `ForgotPassword.jsx` | `/forgot-password` | 비밀번호 재설정 요청 페이지 |

### 메인 페이지
| 파일 | 경로 | 설명 |
|------|------|------|
| `LandingPage.jsx` | `/` | 서비스 소개 랜딩 페이지 |
| `Home.jsx` | `/home` | 홈 페이지 (로그인 전) |
| `ClientHome.jsx` | `/clienthome` | 클라이언트 홈 (로그인 후 메인 대시보드) |
| `Layout.jsx` | - | 공통 레이아웃 (헤더, 네비게이션) |

### 설문 생성
| 파일 | 경로 | 설명 |
|------|------|------|
| `CreateSurvey.jsx` | `/createsurvey` | 타겟 설문 생성 (유료, 타겟팅 기능 포함) |
| `CreateFreeSurvey.jsx` | `/createfreesurvey` | 무료 설문 생성 (간단한 설문) |
| `TargetSettings.jsx` | `/targetsettings` | 설문 타겟 옵션 설정 (성별, 연령, 지역 등) |
| `AIQuestionGenerator.jsx` | `/ai-question-generator` | AI 기반 설문 질문 자동 생성 |

### 설문 관리
| 파일 | 경로 | 설명 |
|------|------|------|
| `MySurveys.jsx` | `/mysurveys` | 내가 생성한 설문 목록 조회 |
| `SurveyDetail.jsx` | `/surveydetail` | 설문 상세 정보 및 수정 |
| `TakeSurvey.jsx` | `/takesurvey` | 설문 참여 페이지 (응답자용) |

### 결과 분석
| 파일 | 경로 | 설명 |
|------|------|------|
| `SurveyResults.jsx` | `/surveyresults` | 타겟 설문 결과 분석 (AI 분석, 차트, PDF) |
| `FreeSurveyResults.jsx` | `/freesurveyresults` | 무료 설문 결과 분석 |

### 결제
| 파일 | 경로 | 설명 |
|------|------|------|
| `PaymentPage.jsx` | `/payment` | 서치코인 충전 결제 페이지 |
| `PaymentConfirmation.jsx` | `/payment-confirmation` | 결제 완료 확인 페이지 |

### 관리자
| 파일 | 경로 | 설명 |
|------|------|------|
| `AdminDashboard.jsx` | `/admin` | 관리자 대시보드 (통계, 현황) |
| `AdminSettings.jsx` | `/adminsettings` | 관리자 설정 (시스템 설정) |
| `OrderManagement.jsx` | `/ordermanagement` | 주문/설문 관리 (승인, 거절, 종료) |

### 사용자
| 파일 | 경로 | 설명 |
|------|------|------|
| `MyPage.jsx` | `/mypage` | 마이페이지 (프로필, 코인, 설문 내역) |
| `Support.jsx` | `/support` | 고객지원 (문의하기, FAQ) |

### 정보 페이지
| 파일 | 경로 | 설명 |
|------|------|------|
| `Guide.jsx` | `/guide` | 서비스 이용 가이드 |
| `UseCases.jsx` | `/usecases` | 활용 사례 소개 |
| `APIGuide.jsx` | `/api-guide` | 외부 API 연동 가이드 |
| `TermsOfService.jsx` | `/terms` | 이용약관 |
| `PrivacyPolicy.jsx` | `/privacy` | 개인정보처리방침 |

### 기타
| 파일 | 경로 | 설명 |
|------|------|------|
| `PicketingIntegration.jsx` | `/picketing` | 피케팅 서비스 연동 |
| `index.jsx` | - | 페이지 라우팅 설정 |

## API 문서

외부 파트너 연동을 위한 API가 제공됩니다. 자세한 내용은 `/api-guide` 페이지를 참조하세요.

### 주요 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/users/link` | 외부 사용자 연동 |
| GET | `/api/v1/users/me` | 사용자 정보 조회 |
| GET/POST | `/api/v1/surveys` | 설문 목록 조회 / 생성 |
| GET/PATCH/DELETE | `/api/v1/surveys/:id` | 설문 조회 / 수정 / 삭제 |
| POST | `/api/v1/surveys/:id/questions` | 질문 추가 |
| PUT | `/api/v1/surveys/:id/questions/reorder` | 질문 순서 변경 |
| PATCH | `/api/v1/surveys/:id/target` | 타겟 설정 |
| POST | `/api/v1/surveys/:id/deploy` | 설문 배포 |
| GET | `/api/v1/surveys/:id/responses` | 응답 목록 조회 |
| GET | `/api/v1/targets/options` | 타겟 옵션 목록 |
| POST | `/api/v1/ai/generate` | AI 텍스트 생성 |

## 배포

Vercel을 통해 자동 배포됩니다.

```bash
# 프로덕션 배포
npx vercel --prod
```

## 라이선스

Private - All rights reserved
