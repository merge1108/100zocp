# Codex 작업 기록 및 참고 사항

작성일: 2025-11-04

## 개요
인터넷 기반 분양 마케팅(구글·메타·틱톡·당근) 중심의 랜딩/브랜딩 사이트를 Astro로 구성하고, CMS(Decap)와 운영 흐름(리드·태깅·보고)을 반영했습니다. 메뉴는 5개 페이지(홈/솔루션/패키지/성과/상담문의)로 축소·병합했습니다.

## 최종 정보구조(메뉴 5개)
- 홈: `/`
- 솔루션: `/solutions`
- 패키지: `/packages`
- 성과(지표+사례): `/results`
- 상담문의: `/contact`

보조: 관리자 콘솔 `/admin` (로컬/운영용 Decap UI)

## 주요 변경 요약
- 디자인 토큰 리팩토링(웜블랙+쿨화이트)
  - `public/styles/theme.css`: 색상/버튼/히어로 오버레이 조정, `.panel-dark`/`.ico`/`.box-h` 추가, 모바일 하단 고정 CTA 추가
- 히어로 견적 계산기 추가(홈)
  - 입력: 월 매체비(만원), 목표 CPL(만원), 채널(구글/메타/틱톡/당근)
  - 출력: 예상 리드/권장 패키지/예상 운영비 → 상담문의로 파라미터 전달(`/contact?budget=...&cpl=...&channels=...&pkg=...`)
- 상담문의 연계/요약
  - `src/pages/contact.astro`: 쿼리 파라미터 자동 파싱(요약 표시 + 히든 필드); Make.com Webhook으로 제출
- 페이지 병합
  - `results`에 사례 스냅샷(기존 포트폴리오 카드) 포함
  - `about/services/process/portfolio/neo` 제거 및 컨텐츠는 각 잔존 페이지로 흡수
  - 리다이렉션: `public/_redirects`
- CMS(Decap) 연결 정비
  - `public/admin/config.yml` + `public/config.yml` 추가
  - `/admin` 라우트: `src/pages/admin/index.astro` (로컬/운영 접속)
  - Content Collections 스키마 정리: `src/content/config.ts` (cases: title/kicker/image/alt/summary)
- SEO/메타/사이트맵
  - `@astrojs/sitemap` 추가, `astro.config.mjs` `site: https://100zocp.pages.dev`
  - 레이아웃 OG/Twitter 메타, canonical, `public/og-default.svg`, `public/robots.txt`
- 아이콘 시스템
  - `src/components/Icon.astro` (target/zap/funnel/layers/bar/shield/cursor/share/calendar/phone/pie/cog/check/x)
  - 솔루션/패키지/성과의 모든 박스 헤더에 적용
- 모바일 UX
  - 하단 고정 CTA(무료상담/전화) 추가: `src/layouts/BaseLayout.astro`

## 파일/폴더 주요 포인터
- 스타일 토큰/컴포넌트: `public/styles/theme.css`
- 레이아웃: `src/layouts/BaseLayout.astro` (헤더/푸터 포함, 메타/OG/Sticky CTA)
- 아이콘: `src/components/Icon.astro`
- 홈: `src/pages/index.astro` (히어로 계산기 포함)
- 솔루션: `src/pages/solutions.astro`
- 패키지: `src/pages/packages.astro`
- 성과: `src/pages/results.astro`
- 상담문의: `src/pages/contact.astro`
- CMS UI: `src/pages/admin/index.astro`
- CMS 설정: `public/admin/config.yml`, `public/config.yml`
- 콘텐츠(샘플): `src/content/home.json`, `src/content/cases/*`
- 리다이렉트: `public/_redirects`

## 빌드/미리보기
- 개발: `npm run dev` → `http://localhost:4321`
- CMS 로컬 프록시(Decap): `npx decap-server` → `http://localhost:4321/admin`
- 빌드: `npm run build` → `dist/`

## 운영(Cloudflare Pages 가정)
- `astro.config.mjs`의 `site`는 `https://100zocp.pages.dev`
- `_redirects` 지원(Cloudflare Pages/Netlify 호환)
- OG 기본 이미지는 `public/og-default.svg` (PNG/JPG로 교체 가능)

### Decap + GitHub OAuth (Cloudflare Pages Functions)
- OAuth 엔드포인트 구현: `functions/oauth/authorize.ts`, `functions/oauth/callback.ts`
- 환경변수(Cloudflare Pages → 프로젝트 → Settings → Environment variables)
  - `GITHUB_CLIENT_ID`: GitHub OAuth App의 Client ID
  - `GITHUB_CLIENT_SECRET`: GitHub OAuth App의 Client Secret
- GitHub OAuth App 설정
  - Authorization callback URL: `https://100zocp.pages.dev/oauth/callback`
- CMS 설정(`public/admin/config.yml`, `public/config.yml`)
  - `backend.name: github`
  - `repo: merge1108/100zocp`, `branch: main`
  - `base_url: https://100zocp.pages.dev`
  - `auth_endpoint: /oauth/authorize`
- 동작 방식: /admin → GitHub 로그인 → 토큰 교환 → popup이 parent에 `postMessage('authorization:github:success:{token}')`

## 리드 수집 플로우
- 폼 Action: Make.com Webhook (FORM_ENDPOINT)
- 전달 파라미터: phone, route, budget, cpl, channels, pkg
- 상담문의 페이지에서 요약 패널로 표시 및 히든 필드 동시 전송

## 접근성/성능 메모
- `prefers-reduced-motion` 대응(주요 전환 애니메이션 무효화)
- 이미지/폰트는 CDN/최적화 고려(@astrojs/image 도입 여지)
- 키보드 포커스 스타일 유지(`:focus-visible`)

## TODO 제안(선택)
- 페이지별 OG 타이틀/이미지 개별화(현재 공통 기본 사용)
- `contact` 폼 스팸 방지(허니팟/간단 퀴즈/reCAPTCHA)
- GA4/CAPI 태깅 스크립트 삽입 및 QA 체크리스트 적용
- CMS 컬렉션 확장(FAQ/자료실) — 현재 메뉴 축소로 비노출 상태
- 사례/성과 실데이터 반영(모자이크/익명 처리)

## 변경 이력(핵심)
- 메뉴 5개로 축소 및 페이지 병합
- 다크 톤 강화(웜블랙/쿨화이트), 히어로 계산기 추가
- CMS/SEO/사이트맵/robots/OG 정비
- 아이콘 시스템 도입 및 박스 UI 개선

---
본 문서(codex.md)는 제작/운영 인수인계를 위한 요약입니다. 변경/추가 요청은 이 문서 하단 TODO에 기록 후 이슈 트래킹으로 이어가길 권장합니다.

## 이슈 추적 로그(CMS/OAuth/Access)

### 증상·원인·조치 타임라인
- /admin 404(config.yml) → 원인: CMS 설정 경로 부재. 조치: `public/config.yml` 추가, `src/pages/admin/index.astro` 생성, `window.CMS_CONFIG_PATH="/admin/config.yml"` 명시.
- GitHub 로그인 버튼 후 Not Found → 원인: Netlify 경로(기본)로 시도. 조치: Cloudflare Pages Functions로 `/oauth/authorize`, `/oauth/callback` 구현. `base_url`, `auth_endpoint`를 CMS 설정에 반영.
- Invalid state/흰 화면 → 원인: state 쿠키 불일치/팝업 흐름 문제 가능. 조치: 콜백 디버그 모드 추가(`?debug=1`), state 검사/결과 출력. `/oauth*`는 우선 보호 안 함 권장, 브라우저 쿠키/스토리지 초기화 후 재시도.
- Token exchange failed(incorrect_client_credentials) → 원인: GITHUB_CLIENT_ID/SECRET 오입력 또는 재배포 누락. 조치: GitHub OAuth App에서 Callback https 확인, 새 Client Secret 발급 → CF Pages 환경변수(Production) 저장 → Save & Deploy(또는 빈 커밋 푸시)로 재배포. 이후 `authorize?debug=1`→`callback?debug=1`에서 step: success 확인.
- CMS message success지만 전환 안 됨(네트워크에 api.github.com 없음) → 원인: Decap CMS 본체 스크립트 미로드. 조치: `src/pages/admin/index.astro`에 `https://unpkg.com/decap-cms@3.3.0/dist/decap-cms.js` 명시적 로드. 하드 리로드/시크릿 모드 권장.
- 여전히 전환 지연/304 응답 → 설명: 정적 자산(config.yml, _astro js) 304는 정상(캐시 적중). 전환 판단은 api.github.com 호출 여부로 확인해야 함.

### 현재 동작 설정(요약)
- OAuth Functions: `functions/oauth/authorize.ts`, `functions/oauth/callback.ts` (state 쿠키, token 교환, postMessage 전달, 디버그 모드 지원)
- 환경변수: CF Pages Production → `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`(정확 입력·재배포 필요)
- CMS 설정: `public/admin/config.yml`, `public/config.yml`
  - backend.name: github
  - repo: merge1108/100zocp, branch: main
  - base_url: https://100zocp.pages.dev
  - auth_endpoint: /oauth/authorize?scope=repo
  - local_backend: (프로덕션 비활성)
- Access(Zero Trust): 100zocp.pages.dev/admin* 만 Allow(+Include 편집자 이메일, Require MFA 등). `/oauth*`는 먼저 보호 해제·정상화 확인 후 필요 시 추가.

### 운영 Runbook(A→Z)
1) GitHub OAuth App
   - Callback: `https://100zocp.pages.dev/oauth/callback`
   - Client ID/Secret 확인(필요 시 새 Secret 발급)
2) CF Pages 환경변수
   - Production에 `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` 저장 → Save & Deploy
3) 디버그로 토큰 교환 확인
   - `…/oauth/authorize?scope=repo&debug=1` → 승인 → `…/oauth/callback?debug=1`
   - step: success, ok: true 확인
4) /admin 로그인
   - `…/admin` → “Login with GitHub”
   - 콘솔에서 수신 확인: `authorization:github:success:{token}`
   - 네트워크에 `api.github.com/user`, `…/repos/merge1108/100zocp` 호출 등장(200)
5) 권한 확인(편집/저장 막힐 때)
   - 승인한 GitHub 계정이 저장소에 Write 권한인지(개인 저장소는 Collaborator 초대/수락)
   - 콘솔 테스트:
     - `fetch('https://api.github.com/user',{headers:{Authorization:'Bearer TOKEN'}})` → 200
     - `fetch('https://api.github.com/repos/merge1108/100zocp',{headers:{Authorization:'Bearer TOKEN'}})` → 200
     - `…then(j=>j.permissions)` → `push: true`
6) 문제시 공통 조치
   - 브라우저: `localStorage.clear(); sessionStorage.clear();` + `oauth_state` 쿠키 제거 + 강력 새로고침
   - 팝업 차단 해제, 시크릿 모드 재시도
   - `/admin/config.yml` 200 확인(backend 설정 일치)

### 자주 발생 이슈와 해결
- incorrect_client_credentials: Client Secret/ID 불일치 또는 재배포 잊음 → 새 Secret 발급·환경변수 저장·재배포
- Invalid state: 쿠키/세션 꼬임 또는 `/oauth*`에 Access 인증 개입 → 쿠키/스토리지 초기화, `/oauth*` 보호 해제 후 재시도
- success 메시지인데 전환 X: CMS 본체 미로드/캐시 → `decap-cms.js` 로드 확인, 하드 리로드, 시크릿 모드
- 401/403/404(API): 토큰/권한 이슈 → 올바른 계정으로 재승인, 저장소 Write 권한(협업자 초대/수락)
- 토큰 노출: GitHub → Settings → Applications → Authorized OAuth Apps에서 해당 앱 `Revoke access` 후 재승인

### 확인 체크리스트(요약)
- [ ] `…/oauth/callback?debug=1` → step: success
- [ ] /admin 콘솔에 success 메시지 수신
- [ ] 네트워크에 api.github.com 호출 200
- [ ] 저장소 permissions.push === true
- [ ] `/admin/config.yml` 200 + backend 설정 일치
