# Public Site Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 Astro 공개 사이트의 화면, URL, 검색, 키보드 조작, 애니메이션을 Next.js 공개 사이트에서 동일하게 제공하고 콘텐츠와 관리자 기능만 Supabase 기반으로 유지한다.

**Architecture:** `src/layouts/*.astro`와 `src/components/*.astro`는 수정하지 않고 시각·동작 기준본으로 사용한다. Next.js 공개 영역은 동일한 `qt-*` DOM 구조와 디자인 토큰을 책임별 React 컴포넌트와 CSS 파일로 이식하며, 데이터는 `src/lib/content/public-queries.ts`의 Supabase 조회 결과로 주입한다. `/admin`은 기존에 없던 화면이므로 현재 디자인을 유지하고 공개 사이트 CSS와 분리한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, Fuse.js, Playwright.

## Global Constraints

- 공개 사이트의 데스크톱 1440px·모바일 390px 화면은 기존 Astro 기준 화면과 동일해야 한다.
- 기존 공개 URL은 정상 화면 또는 명시적인 영구 리다이렉트로 연결되어야 하며 404로 바뀌면 안 된다.
- 콘텐츠 원본은 Supabase이며 Markdown 파일은 마이그레이션 기준본으로만 사용한다.
- `/admin` 디자인과 인증 흐름은 이번 시각 동일화 범위에서 제외한다.
- Astro 파일은 로컬 동일화 검증까지 비교 기준으로 유지하고 최종 교체 단계에서 삭제한다.
- 새 런타임 의존성은 추가하지 않는다.
- `@playwright/test`는 devDependency로만 추가하며 클라이언트 번들 크기에 영향을 주지 않는다.
- 모든 공개 UI는 `prefers-reduced-motion`을 준수한다.
- `.agents/`, `.claude/worktrees/`, `output/`, `supabase/backups/`는 커밋하지 않는다.

---

### Task 1: 공개 URL 호환성 계약

**Files:**
- Create: `app/api/search.json/route.ts`
- Create: `app/(site)/ideas/works/page.tsx`
- Create: `app/(site)/posts/versions/[...path]/page.tsx`
- Modify: `src/lib/content/public-queries.ts`
- Modify: `src/lib/content/public-types.ts`
- Create: `tests/e2e/public-routes.spec.ts`
- Create: `playwright.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: 현재 공개 콘텐츠, 카테고리, 태그, `content_versions` 데이터.
- Produces: `listSearchIndex()`, `listWorksIdeaGroups()`, `getVersionHistoryPage()`, 기존 URL 상태 계약.

- [x] **Step 1: Playwright 개발 의존성 추가 승인을 확인한다.**

실행 전 사용자 승인 범위에 `@playwright/test` 추가가 포함되어 있는지 확인한다. 이 패키지는 테스트 전용이며 프로덕션 번들에는 포함되지 않는다.

- [x] **Step 2: 기존 URL 실패를 재현하는 E2E 테스트를 작성한다.**

```ts
import { expect, test } from "@playwright/test";

test("legacy public routes remain available", async ({ request }) => {
  for (const path of [
    "/ideas/works",
    "/posts/versions/thinking/karpathy-claude-coding-notes",
    "/api/search.json",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});
```

- [x] **Step 3: 테스트가 현재 구현에서 실패하는지 확인한다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-routes.spec.ts
```

Expected: 세 URL이 현재 `404`여서 실패한다.

- [x] **Step 4: Supabase 공개 조회 인터페이스를 추가한다.**

```ts
export type SearchIndexItem = {
  path: string;
  title: string;
  description: string;
  category: string | null;
  categoryLabel: string;
  tags: string[];
  publishedAt: string;
};

export type WorksIdeaGroup = {
  slug: string;
  label: string;
  items: PublicContentItem[];
};

export type VersionHistoryPage = {
  current: PublicContentItem;
  versions: PublicContentVersion[];
};
```

`listSearchIndex()`는 공개된 post·idea·project만 반환한다. `listWorksIdeaGroups()`는 `ideas/works/{project}/{detail}` 경로의 두 번째 세그먼트로 묶는다. `getVersionHistoryPage()`는 현재 공개 버전과 공개 가능한 과거 버전만 반환한다.

- [x] **Step 5: 기존 세 URL을 구현한다.**

`/api/search.json`은 기존 필드 이름과 정렬을 유지한 JSON을 반환한다. `/ideas/works`는 프로젝트별 idea 그룹을 렌더링한다. `/posts/versions/[...path]`는 현재 버전과 공개 가능한 과거 버전 목록을 보여준다.

- [x] **Step 6: URL 계약 테스트를 통과시킨다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-routes.spec.ts
```

Expected: 세 URL과 현재 `/search?q=git`이 모두 `200`.

- [x] **Step 7: URL 호환성 변경을 커밋한다.**

```bash
rtk git add package.json package-lock.json playwright.config.ts tests/e2e/public-routes.spec.ts app/api/search.json/route.ts 'app/(site)/ideas/works/page.tsx' 'app/(site)/posts/versions/[...path]/page.tsx' src/lib/content/public-queries.ts src/lib/content/public-types.ts
rtk git commit -m "fix(cms): restore legacy public routes"
```

---

### Task 2: 공개 사이트 디자인 토큰과 기본 셸 이식

**Files:**
- Create: `app/(site)/styles/tokens.css`
- Create: `app/(site)/styles/shell.css`
- Create: `app/(site)/styles/responsive.css`
- Create: `src/components/site/public-shell.tsx`
- Modify: `src/components/site/site-header.tsx`
- Modify: `src/components/site/site-footer.tsx`
- Modify: `app/(site)/layout.tsx`
- Modify: `app/(site)/site.css`
- Test: `tests/e2e/public-shell.spec.ts`

**Interfaces:**
- Consumes: `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`.
- Produces: 모든 공개 페이지가 공유하는 기존 `qt-*` 셸과 디자인 토큰.

- [x] **Step 1: 공개 셸 구조 테스트를 작성한다.**

```ts
test("public shell keeps legacy structure", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".qt-header")).toBeVisible();
  await expect(page.locator(".qt-page")).toBeVisible();
  await expect(page.locator(".qt-footer")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".qt-header")).toBeVisible();
});
```

- [x] **Step 2: 현재 Next 셸에서 테스트가 실패하는지 확인한다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-shell.spec.ts
```

Expected: 기존 `qt-*` 셸이 없어 실패한다.

- [x] **Step 3: Astro 디자인 토큰을 `tokens.css`로 옮긴다.**

색상, 타이포그래피, 너비, 간격, 테두리, 그림자 변수를 이름과 값 변경 없이 옮긴다. Astro scoped selector는 옮기지 않고 공통 변수만 분리한다.

- [x] **Step 4: Header·Footer·BaseLayout DOM을 React로 옮긴다.**

`PublicShell`은 UI 조립만 담당하고 데이터 조회나 브라우저 이벤트를 포함하지 않는다. Header와 Footer는 기존 class, 링크 순서, 접근성 라벨을 유지한다.

- [x] **Step 5: 공개 CSS를 책임별 파일로 분리한다.**

현재 `site.css`에 새 책임을 더하지 않는다. 토큰은 `tokens.css`, 공통 셸은 `shell.css`, 반응형 규칙은 `responsive.css`가 소유한다. `admin.css`에는 영향을 주지 않는다.

- [x] **Step 6: 데스크톱·모바일 셸 테스트를 통과시킨다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-shell.spec.ts
```

Expected: 1440px와 390px에서 Header, 본문, Footer가 모두 표시된다.

- [x] **Step 7: 기본 셸 이식을 커밋한다.**

```bash
rtk git add 'app/(site)/styles' 'app/(site)/layout.tsx' 'app/(site)/site.css' src/components/site/public-shell.tsx src/components/site/site-header.tsx src/components/site/site-footer.tsx tests/e2e/public-shell.spec.ts
rtk git commit -m "feat(site): restore legacy public shell"
```

---

### Task 3: 홈·목록·사이드바 화면 동일화

**Files:**
- Create: `src/components/site/home-view.tsx`
- Create: `src/components/site/list-view.tsx`
- Create: `src/components/site/post-list-row.tsx`
- Create: `src/components/site/sidebar-widgets.tsx`
- Create: `app/(site)/styles/home.css`
- Create: `app/(site)/styles/list.css`
- Modify: `app/(site)/page.tsx`
- Modify: `app/(site)/page/[page]/page.tsx`
- Modify: `app/(site)/posts/category/[category]/[[...page]]/page.tsx`
- Modify: `app/(site)/tags/[tag]/[[...page]]/page.tsx`
- Modify: `app/(site)/ideas/page.tsx`
- Modify: `app/(site)/ideas/works/page.tsx`
- Modify: `app/(site)/projects/page.tsx`
- Modify: `src/lib/content/public-queries.ts`
- Test: `tests/e2e/public-lists.spec.ts`

**Interfaces:**
- Consumes: `HomeLayout.astro`, `ListLayout.astro`, PostCard, PostListRow, SidebarAbout, SidebarActivity, SidebarCategoryStats, SidebarProjectStats, SidebarTagCloud, IdeasStrip의 구조와 Supabase 집계.
- Produces: 홈·목록·사이드바의 기존 DOM과 표시 데이터.

- [ ] **Step 1: 목록별 표시 계약 테스트를 작성한다.**

홈의 Hero, 최신 글, Ideas Strip, 사이드바 위젯과 카테고리·태그·Ideas·Projects 목록의 제목·건수·페이지 이동을 검사한다.

- [ ] **Step 2: 현재 Next 화면에서 `qt-*` 계약이 실패하는지 확인한다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-lists.spec.ts
```

- [ ] **Step 3: 필요한 공개 집계를 쿼리 계층에 추가한다.**

카테고리별 글 수, 태그별 글 수, 프로젝트 진행 정보, 최근 활동, 최신 Ideas를 하나의 페이지 조립 결과로 반환한다. 페이지 컴포넌트에서 개별 Supabase 쿼리를 조립하지 않는다.

- [ ] **Step 4: Astro 목록 구조를 책임별 React 컴포넌트로 옮긴다.**

`HomeView`는 홈 조립, `ListView`는 공통 목록 조립, `PostListRow`는 한 행, `SidebarWidgets`는 서버에서 받은 집계를 표시한다. 이벤트와 애니메이션은 포함하지 않는다.

- [ ] **Step 5: 홈·목록 CSS를 이식한다.**

Astro component style의 실제 값을 `home.css`와 `list.css`로 옮기고 기존 `qt-*` selector를 유지한다.

- [ ] **Step 6: 목록 기능 테스트를 통과시킨다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-lists.spec.ts
```

Expected: 홈, 페이지 2, 카테고리, 태그, Ideas, Ideas/Works, Projects가 데스크톱·모바일에서 통과한다.

- [ ] **Step 7: 홈·목록 동일화를 커밋한다.**

```bash
rtk git add 'app/(site)' src/components/site/home-view.tsx src/components/site/list-view.tsx src/components/site/post-list-row.tsx src/components/site/sidebar-widgets.tsx src/lib/content/public-queries.ts tests/e2e/public-lists.spec.ts
rtk git commit -m "feat(site): match legacy home and list views"
```

---

### Task 4: 게시글·프로젝트 상세 화면 동일화

**Files:**
- Modify: `src/components/site/article-view.tsx`
- Modify: `src/components/site/markdown-content.tsx`
- Create: `src/components/site/article-navigation.tsx`
- Create: `src/components/site/reading-progress.tsx`
- Create: `app/(site)/styles/article.css`
- Modify: `app/(site)/posts/[...path]/page.tsx`
- Modify: `app/(site)/ideas/[...path]/page.tsx`
- Modify: `app/(site)/projects/[slug]/page.tsx`
- Modify: `src/lib/content/public-queries.ts`
- Test: `tests/e2e/public-article.spec.ts`

**Interfaces:**
- Consumes: `PostLayout.astro`, ReadingProgress, 현재 공개 콘텐츠와 같은 종류의 이전·다음 콘텐츠.
- Produces: `getContentNeighbors()`와 기존 상세 화면·읽기 진행률.

- [ ] **Step 1: 상세 화면 회귀 테스트를 작성한다.**

```ts
test("article keeps legacy metadata and navigation", async ({ page }) => {
  await page.goto("/posts/programming/git-basics");
  await expect(page.locator(".qt-post-head")).toBeVisible();
  await expect(page.locator(".qt-reading-progress")).toBeAttached();
  await expect(page.locator(".qt-post-nav")).toBeVisible();
});
```

- [ ] **Step 2: 현재 상세 화면에서 테스트가 실패하는지 확인한다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-article.spec.ts
```

- [ ] **Step 3: 이전·다음 콘텐츠 조회를 추가한다.**

동일한 kind 안에서 `published_at` 정렬을 사용하고 공개된 항목만 반환한다. 게시글, Ideas, Projects가 서로의 이웃으로 섞이지 않게 한다.

- [ ] **Step 4: PostLayout 구조와 CSS를 React로 이식한다.**

제목, 설명, 날짜, 카테고리, 태그, 프로젝트 메타데이터, 저장소·데모 링크, 버전 링크, Markdown 본문, 이전·다음 링크 순서를 유지한다.

- [ ] **Step 5: 읽기 진행률을 독립 Client Component로 구현한다.**

scroll과 resize listener는 mount 시 한 번 등록하고 unmount 시 제거한다. `requestAnimationFrame`으로 갱신하고 reduced motion에서는 transition을 제거한다.

- [ ] **Step 6: 상세 화면 테스트를 통과시킨다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-article.spec.ts
```

Expected: 게시글·Idea·Project 상세, 이전·다음 링크, 진행률, 외부 링크가 통과한다.

- [ ] **Step 7: 상세 화면 동일화를 커밋한다.**

```bash
rtk git add src/components/site/article-view.tsx src/components/site/markdown-content.tsx src/components/site/article-navigation.tsx src/components/site/reading-progress.tsx 'app/(site)/styles/article.css' 'app/(site)/posts/[...path]/page.tsx' 'app/(site)/ideas/[...path]/page.tsx' 'app/(site)/projects/[slug]/page.tsx' src/lib/content/public-queries.ts tests/e2e/public-article.spec.ts
rtk git commit -m "feat(site): restore legacy article experience"
```

---

### Task 5: 검색 페이지와 Cmd+K 동일화

**Files:**
- Create: `src/components/site/search-palette.tsx`
- Create: `src/components/site/search-page-client.tsx`
- Create: `app/(site)/styles/search.css`
- Modify: `app/(site)/layout.tsx`
- Modify: `app/(site)/search/page.tsx`
- Test: `tests/e2e/public-search.spec.ts`

**Interfaces:**
- Consumes: `/api/search.json`, Fuse.js, `CmdK.astro`, `search.astro`.
- Produces: 기존 threshold `0.35` 검색과 키보드 탐색.

- [ ] **Step 1: 검색 상호작용 테스트를 작성한다.**

Cmd/Ctrl+K 열기, ESC 닫기, 위·아래 선택, Enter 이동, 404 화면의 검색 버튼, 검색 페이지 입력 즉시 결과 갱신을 검사한다.

- [ ] **Step 2: 현재 Next 화면에서 테스트가 실패하는지 확인한다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-search.spec.ts
```

- [ ] **Step 3: 기존 Fuse.js 옵션을 그대로 이식한다.**

```ts
const fuse = new Fuse(items, {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "description", weight: 0.2 },
    { name: "tags", weight: 0.25 },
    { name: "categoryLabel", weight: 0.15 },
  ],
  threshold: 0.35,
});
```

- [ ] **Step 4: SearchPalette를 독립 Client Component로 구현한다.**

전역 keydown listener와 body scroll lock을 mount·unmount에 맞춰 정리한다. 결과 HTML 문자열 조립 대신 React 렌더링으로 XSS 경계를 제거한다.

- [ ] **Step 5: 검색 페이지를 실시간 검색으로 복원한다.**

서버 제출형 검색 결과는 최초 URL 진입 호환성을 위해 유지하고, 클라이언트 입력 시 동일 Fuse 인덱스로 즉시 결과를 갱신한다.

- [ ] **Step 6: 검색 E2E 테스트를 통과시킨다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-search.spec.ts
```

- [ ] **Step 7: 검색 동일화를 커밋한다.**

```bash
rtk git add src/components/site/search-palette.tsx src/components/site/search-page-client.tsx 'app/(site)/styles/search.css' 'app/(site)/layout.tsx' 'app/(site)/search/page.tsx' tests/e2e/public-search.spec.ts
rtk git commit -m "feat(search): restore live search and command palette"
```

---

### Task 6: 배경·Hero·스크롤 효과 동일화

**Files:**
- Create: `src/components/site/background-effects.tsx`
- Create: `src/components/site/ambient-logs.tsx`
- Create: `src/components/site/hero-drift-background.tsx`
- Create: `src/components/site/home-scroll-effects.tsx`
- Create: `app/(site)/styles/effects.css`
- Modify: `src/components/site/public-shell.tsx`
- Modify: `src/components/site/home-view.tsx`
- Test: `tests/e2e/public-effects.spec.ts`

**Interfaces:**
- Consumes: BackgroundFx, AmbientLogs, HeroDriftBg, HomeLayout의 기존 브라우저 동작.
- Produces: reduced-motion을 지키는 독립 Client Components.

- [ ] **Step 1: 효과의 존재와 접근성 테스트를 작성한다.**

기본 환경에서는 효과 요소가 렌더링되고, reduced motion 환경에서는 움직임용 style 값이 갱신되지 않는지 검사한다.

- [ ] **Step 2: 현재 Next 화면에서 테스트가 실패하는지 확인한다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-effects.spec.ts
```

- [ ] **Step 3: 각 효과를 독립 컴포넌트로 이식한다.**

배경, 로그, Hero drift, 홈 스크롤 복원은 서로 상태나 listener를 공유하지 않는다. 각 컴포넌트가 자신이 등록한 listener와 animation frame을 직접 정리한다.

- [ ] **Step 4: 기존 CSS와 반응형 조건을 이식한다.**

색상, opacity, blur, 위치, breakpoint를 기존 값 그대로 사용한다.

- [ ] **Step 5: 효과 E2E 테스트를 통과시킨다.**

Run:

```bash
rtk npx playwright test tests/e2e/public-effects.spec.ts
```

- [ ] **Step 6: 시각 효과 동일화를 커밋한다.**

```bash
rtk git add src/components/site/background-effects.tsx src/components/site/ambient-logs.tsx src/components/site/hero-drift-background.tsx src/components/site/home-scroll-effects.tsx src/components/site/public-shell.tsx src/components/site/home-view.tsx 'app/(site)/styles/effects.css' tests/e2e/public-effects.spec.ts
rtk git commit -m "feat(site): restore legacy motion effects"
```

---

### Task 7: SEO·전체 로컬 회귀 검증

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/sitemap.ts`
- Modify: `app/rss.xml/route.ts`
- Modify: `app/(site)/not-found.tsx`
- Create: `tests/e2e/public-seo.spec.ts`
- Create: `tests/e2e/public-visual-smoke.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: 기존 BaseHead metadata, 공개 route inventory, Tasks 1~6의 UI.
- Produces: 최종 URL·metadata·브라우저 회귀 검증 결과.

- [ ] **Step 1: SEO와 출력 계약 테스트를 작성한다.**

title, description, canonical, Open Graph, RSS 항목 수, sitemap URL, 404 검색 버튼, 주요 영구 리다이렉트를 검사한다.

- [ ] **Step 2: 시각 스모크 대상을 고정한다.**

홈, 글 상세, 카테고리, 태그, Ideas, Ideas/Works, Projects, 검색, 404를 1440×1000과 390×844에서 캡처한다. 캡처는 `output/playwright/parity/`에 저장하고 커밋하지 않는다.

- [ ] **Step 3: 전체 로컬 검증을 실행한다.**

```bash
rtk npm run typecheck:next
rtk env NEXT_PUBLIC_SUPABASE_URL=https://vqwxifxhrjhotqxbmljo.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" npm run build
rtk npx playwright test
```

Expected: 타입 오류 0, build exit 0, Playwright 실패 0.

- [ ] **Step 4: 기존 Astro 기준 화면과 캡처를 나란히 비교한다.**

Header, Hero, 글 목록, 사이드바, 본문 너비, 타이포그래피, Footer, 모바일 줄바꿈과 간격 차이가 없을 때만 통과로 기록한다.

- [ ] **Step 5: SEO·회귀 변경을 커밋한다.**

```bash
rtk git add app/layout.tsx app/sitemap.ts app/rss.xml/route.ts 'app/(site)/not-found.tsx' tests/e2e/public-seo.spec.ts tests/e2e/public-visual-smoke.spec.ts package.json
rtk git commit -m "test(site): cover public parity workflows"
```

- [ ] **Step 6: 전체 로컬 검증 결과를 기록한다.**

Tasks 1~7의 URL, 상호작용, SEO, 데스크톱·모바일 캡처 결과가 모두 통과했는지 확인한다. Astro 제거는 이 결과가 통과한 경우에만 진행한다.

---

### Task 8: Astro 완전 제거와 Vercel Preview 검증

**Files:**
- Delete: `astro.config.mjs`
- Delete: `src/pages/`
- Delete: `src/layouts/`
- Delete: `src/components/*.astro`
- Delete: `src/components/widgets/`
- Delete: `src/content.config.ts`
- Delete: `src/styles/global.css`
- Delete: `.github/workflows/deploy.yml`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Tasks 1~7에서 검증된 Next.js 공개 사이트와 Supabase 콘텐츠.
- Produces: Astro 런타임, 빌드 스크립트, GitHub Pages 배포가 없는 Next.js 전용 저장소.

- [ ] **Step 1: Astro 참조가 남아 있는지 검사한다.**

Run:

```bash
rtk rg -n "astro|@astrojs|astro:" package.json tsconfig.json src .github
```

Expected: 삭제 대상과 Astro 전용 설정만 출력된다.

- [ ] **Step 2: Astro 런타임과 공개 페이지 소스를 제거한다.**

Next.js가 사용하는 `src/lib`, `src/components/site`, `app`, `public`, Supabase 마이그레이션은 유지한다. Astro 전용 config, page, layout, component, GitHub Pages workflow만 삭제한다.

- [ ] **Step 3: Astro 의존성과 스크립트를 제거한다.**

`astro`, `@astrojs/rss`, `@astrojs/sitemap`, `@tailwindcss/vite`, Astro 전용 `dev:astro`, `build:astro`, `preview`, `astro` 스크립트를 제거한다. Next.js `dev`, `build`, `start`, `typecheck:next`는 유지한다.

- [ ] **Step 4: Astro 참조가 0개인지 확인한다.**

Run:

```bash
rtk rg -n "astro|@astrojs|astro:" package.json tsconfig.json src .github
```

Expected: exit 1과 출력 0줄.

- [ ] **Step 5: Next.js 전체 검증을 다시 실행한다.**

```bash
rtk npm run typecheck:next
rtk env NEXT_PUBLIC_SUPABASE_URL=https://vqwxifxhrjhotqxbmljo.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" npm run build
rtk npx playwright test
```

Expected: 타입 오류 0, build exit 0, Playwright 실패 0.

- [ ] **Step 6: Astro 제거를 커밋한다.**

```bash
rtk git add astro.config.mjs src/pages src/layouts src/components src/content.config.ts src/styles/global.css .github/workflows/deploy.yml package.json package-lock.json tsconfig.json .gitignore
rtk git commit -m "refactor(site): replace Astro runtime with Next.js"
```

- [ ] **Step 7: Vercel Preview 배포 전 승인을 받는다.**

현재 브랜치의 커밋 목록, 최종 staged·unstaged 상태, 전체 검증 결과를 제시한다. 사용자가 푸시를 승인한 경우에만 원격 브랜치로 푸시한다.

- [ ] **Step 8: Preview에서 운영 환경 변수를 사용해 재검증한다.**

Vercel 배포 상태가 `READY`인지 확인한 뒤 Tasks 1~8의 URL과 브라우저 흐름을 Preview URL에서 반복한다. Preview 검증이 통과하기 전에는 production alias나 main merge를 진행하지 않는다.

## Self-Review

- 공개 URL, 홈, 목록, 상세, 검색, 키보드, 효과, SEO, 데스크톱·모바일 검증이 각각 Task 1~7에 연결되어 있다.
- 관리자 화면은 명시적으로 범위에서 제외됐다.
- Astro 파일은 동일화 기준으로 사용된 뒤 Task 8에서 런타임과 함께 제거된다.
- 새 런타임 의존성은 없으며 Playwright는 사용자 승인 후 devDependency로만 추가된다.
- 각 작업은 실패 테스트, 최소 구현, 통과 테스트, 독립 커밋 순서로 구성됐다.
- 현재 확인된 `/ideas/works`, `/posts/versions/...`, `/api/search.json`의 404가 Task 1에서 먼저 차단된다.
- 최종 저장소에서 Astro 의존성, 페이지, 설정, GitHub Pages workflow가 제거된다.
