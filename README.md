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
│   ├── v1/
│   │   ├── surveys/        # 설문 관련 API
│   │   ├── users/          # 사용자 API
│   │   └── targets/        # 타겟 옵션 API
│   └── utils/              # API 유틸리티
├── src/
│   ├── api/                # 프론트엔드 API 클라이언트
│   ├── components/         # React 컴포넌트
│   │   ├── admin/          # 관리자 컴포넌트
│   │   ├── referral/       # 추천 시스템 컴포넌트
│   │   └── ui/             # shadcn/ui 컴포넌트
│   ├── pages/              # 페이지 컴포넌트
│   └── lib/                # 유틸리티 함수
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

## API 문서

외부 파트너 연동을 위한 API가 제공됩니다. 자세한 내용은 `/api-guide` 페이지를 참조하세요.

### 주요 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/health` | 서버 상태 확인 |
| POST | `/api/v1/users/link` | 사용자 연동 |
| POST | `/api/v1/surveys` | 설문 생성 |
| POST | `/api/v1/surveys/:id/questions` | 질문 추가 |
| POST | `/api/v1/surveys/:id/target` | 타겟 설정 |
| POST | `/api/v1/surveys/:id/deploy` | 설문 배포 |

## 배포

Vercel을 통해 자동 배포됩니다.

```bash
# 프로덕션 배포
npx vercel --prod
```

## 라이선스

Private - All rights reserved
