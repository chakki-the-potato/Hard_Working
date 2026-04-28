---
title: "Astro + GitHub Pages + 텔레그램 봇 — 이 블로그를 만든 구조"
description: "정체성을 코드로 풀어내려고 고른 스택과 핵심 결정. Astro content collection, 카테고리 4종 enum, 텔레그램 자동 초안 파이프라인을 정리합니다."
pubDate: 2026-04-28T20:50:30+09:00
category: works
tags: ["Astro"]
demoUrl: https://chakki-the-potato.github.io/Hard_Working/
repoUrl: https://github.com/chakki-the-potato/Hard_Working
role: Solo developer
period: 2026.04 ~
---

앞 글에서 "학습·포트폴리오·생각을 한 공간에 모은다"는 정체성을 적었습니다. 이번 글은 그 정체성을 어떻게 코드와 폴더 구조로 풀어냈는지에 대한 빌드로그입니다. 만들면서 내린 결정을 잊기 전에 적어둡니다.

## 스택 선택

큰 줄기는 단순합니다.

- **Astro** — content collections로 마크다운을 타입 안전하게 다룰 수 있고, 정적 빌드라 호스팅 비용이 0
- **GitHub Pages** — 저장소 자체가 콘텐츠고, push 한 번으로 배포가 끝남
- **TypeScript + Zod 스키마** — frontmatter를 빌드 타임에 검증

이전에 Next.js로 블로그를 시도해본 적이 있는데, 동적 기능이 거의 없는 글 사이트에 SSR 인프라가 붙어 있는 게 과한 느낌이었습니다. Astro는 기본이 정적이라 글에 집중할 때 마찰이 적습니다.

## 카테고리 4종으로 갈래 나누기

정체성을 코드로 옮길 때 가장 먼저 한 일이 카테고리 enum을 박는 것이었습니다.

**src/lib/categories.ts**

```ts
export const CATEGORIES = ['programming', 'design', 'thinking', 'works'] as const;
export type Category = (typeof CATEGORIES)[number];
```

frontmatter 스키마는 이 enum을 그대로 받습니다.

**src/content.config.ts** (발췌)

```ts
schema: z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  category: z.enum(CATEGORIES),
  tags: z.array(z.string()).default([]),
  // works 전용 optional 필드들...
})
```

폴더 구조는 `src/data/blog/{category}/{year}/{slug}.md`로 정리했습니다. 처음에는 `{slug}.md`만 평평하게 두고 frontmatter의 `category` 필드만 봤는데, 글이 늘어날수록 폴더를 열었을 때 혼란이 컸습니다. 카테고리 폴더로 1차 분리하니 디렉터리 트리만 봐도 어디에 무엇이 있는지 보입니다. URL은 year를 빼고 `{category}/{slug}`로 평평하게 유지했습니다 — 디렉터리는 정리용, URL은 안정성용으로 책임을 분리했습니다.

## works 카테고리 전용 메타

works는 다른 카테고리와 결이 다릅니다. 글이 곧 포트폴리오라서 데모 URL, 저장소, 역할, 기간, 성과 같은 메타가 필요합니다. 그래서 frontmatter에 5개 선택 필드를 둡니다.

```yaml
demoUrl: https://...
repoUrl: https://github.com/...
role: Solo developer
period: 2025.11 ~ 2026.02
outcome: 본선 진출
```

선택 필드라 다른 카테고리 글에는 영향이 없습니다. PostLayout이 이 값을 감지해 글 상단에 메타 블록으로 렌더링합니다. 한 번 깔아두면 works 글마다 같은 포맷으로 노출되니, 매번 손으로 카드를 만들 필요가 없습니다.

## 텔레그램 → 자동 초안 파이프라인

초안을 자주 띄우려면 마찰을 줄여야 합니다. 가장 큰 마찰은 "에디터 열고 → 새 파일 만들고 → frontmatter 채우고 → 빈 페이지 바라보기"의 컨텍스트 스위치였습니다.

그래서 텔레그램 봇으로 주제를 던지면, Claude Code가 받아서 카테고리를 추론하고 마크다운을 만들어 main에 커밋하도록 파이프라인을 짰습니다. 두 개의 스킬이 입구를 나눕니다.

- `.claude/skills/blog-draft` — 일반 메시지를 받아 정식 초안 글로 작성
- `.claude/skills/idea-listing` — `아이디어:` 또는 `idea:` prefix가 붙은 메시지는 `src/data/ideas/`로 짧게 라우팅

스킬 안에 카테고리 분류 가이드, frontmatter 스키마, 코드 블록 규칙, 커밋 컨벤션까지 다 적어뒀습니다. 모델이 매번 같은 결과를 내도록 룰을 한 곳에 묶은 셈입니다. "잘 쓰는 것보다 계속 쓰는 것"이 운영 원칙이라면, 그 원칙을 코드로 박아둔 부분이 여기입니다.

## 시도하고 되돌린 것

모든 결정이 한 번에 자리 잡지는 않았습니다. 두 개만 적습니다.

- **Supabase 댓글** — 공급자 락인과 운영 부담에 비해 글이 아직 댓글을 받을 단계가 아니라, 추가 직후 되돌렸습니다 (`dd21389` → `a92de07`)
- **aurora 배경** — 부드러운 그라디언트 배경을 깔았다가 블로그 톤과 맞지 않아 터미널 로그 데코로 교체했습니다 (`72c5293`)

빨리 넣고, 안 맞으면 빨리 뺐습니다. 정적 사이트라 되돌리는 비용이 거의 0이라는 점을 활용했습니다.

## 앞으로 손볼 것

글이 더 쌓여야 윤곽이 잡히는 영역만 남겨뒀습니다.

- 검색 — 글이 30편 넘으면 손댈 예정
- 태그 페이지 — 어떤 태그가 자주 쓰이는지 데이터가 모이면 결정
- RSS — 구독 요청이 들어오면 추가

지금 단계에서 미리 깔지 않는 이유는 단순합니다. 사용 패턴 없이 만든 기능은 거의 항상 다시 만듭니다.
