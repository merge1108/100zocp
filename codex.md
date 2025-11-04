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
