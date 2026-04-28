<!--
blog-draft 스킬이 works 카테고리 글을 쓸 때마다 먼저 읽는 톤·구조 reference.
실제 발행되지 않으며 빌드에 포함되지 않는다 (.claude/ 하위라 src/data/blog 글롭에 안 잡힘).
새 글의 어미·문장 길이·회고 비중·코드 블록 위치를 이 파일에 맞춘다.
-->

---
title: "Astro + GitHub Pages + 텔레그램 봇 — 이 블로그를 만든 구조"
description: "정체성을 코드로 풀어내려고 고른 스택과 핵심 결정. Astro content collection, 카테고리 4종 enum, 텔레그램 자동 초안 파이프라인을 정리합니다."
pubDate: YYYY-MM-DDTHH:mm:ss+09:00
category: works
tags: ["Astro", "GitHub Pages", "Automation"]
demoUrl: https://chakki-the-potato.github.io/Hard_Working/
repoUrl: https://github.com/chakki-the-potato/Hard_Working
role: Solo developer
period: 2026.04 ~
---

이전 글에서 "학습, 포트폴리오, 그리고 생각을 한 공간에 모은다"는 블로그의 정체성을 먼저 정의해 보았는데요. 이번 글은 그 정체성을 어떻게 실제 코드와 폴더 구조로 풀어냈는지 정리해 본 빌드로그입니다. 블로그를 구축하면서 내렸던 결정들을 잊어버리기 전에 차근차근 기록해 두려고 합니다.

## 스택 선택

큰 줄기는 꽤 단순합니다.

- **Astro** — Content collections를 통해 마크다운을 타입 안전하게 다룰 수 있고, 무엇보다 정적 빌드라서 호스팅 비용이 들지 않습니다.
- **GitHub Pages** — 저장소 자체가 하나의 콘텐츠 데이터베이스가 되고, push 한 번이면 배포가 끝납니다.
- **TypeScript + Zod 스키마** — Frontmatter를 빌드 타임에 꼼꼼하게 검증해 줍니다.

이전에 Next.js로 블로그를 시도해본 적이 있으나, 동적 기능이 거의 없는 텍스트 기반 사이트에 SSR 인프라를 붙이는 것은 과하다는 느낌을 받았습니다. 반면에, Astro는 기본적으로 정적(Static) 사이트 생성에 최적화되어 있어, 오롯이 글에 집중할 때 발생하는 마찰이 적었습니다.

## 카테고리 4종으로 갈래 나누기

블로그의 정체성을 코드로 옮기면서 가장 먼저 한 일은 카테고리 enum을 고정하는 것이었습니다.

**src/lib/categories.ts**

```ts
export const CATEGORIES = ['programming', 'design', 'thinking', 'works'] as const;
export type Category = (typeof CATEGORIES)[number];
```

Frontmatter 스키마는 이 enum을 그대로 가져와서 사용합니다.

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

폴더 구조는 `src/data/blog/{category}/{year}/{slug}.md` 형태로 정리했습니다. 처음에는 `{slug}.md` 파일들만 평평하게 깔아두고 frontmatter의 `category` 필드만 바라보게 했었는데요, 글이 늘어날수록 에디터에서 폴더를 열었을 때 혼란이 커지더라고요.

그래서 카테고리 폴더로 1차 분리를 해주니 디렉터리 트리만 봐도 어디에 어떤 글이 있는지 한눈에 파악하기 좋았습니다. 대신 URL은 year를 빼고 `{category}/{slug}`로 평평하게 유지했습니다. 디렉터리는 '정리용', URL은 '안정성용'으로 책임을 확실히 분리한 셈이죠.

## works 카테고리 전용 메타

works 카테고리는 다른 카테고리들과는 약간 결이 다릅니다. 글 자체가 포트폴리오 역할을 해야 하므로 데모 URL, 저장소 링크, 역할, 진행 기간, 성과 같은 구체적인 메타데이터가 필요하거든요. 그래서 frontmatter에 5개의 선택(Optional) 필드를 따로 두었습니다.

```yaml
demoUrl: https://...
repoUrl: https://github.com/...
role: Solo developer
period: 2026.04 ~
outcome: 본선 진출
```

선택 필드이기 때문에 다른 카테고리의 글들에는 전혀 영향을 주지 않습니다. PostLayout 컴포넌트가 이 값을 감지해서 글 상단에 예쁜 메타 블록으로 렌더링하도록 처리해 두었습니다. 이렇게 한 번 깔아두면 앞으로 works 글을 쓸 때마다 동일한 포맷으로 깔끔하게 노출되니, 매번 손으로 요약 카드를 만들 필요가 없어져서 아주 편합니다.

## 텔레그램 → 자동 초안 파이프라인

글을 자주, 그리고 꾸준히 쓰려면 글쓰기를 시작할 때의 '마찰'을 줄여야 한다고 생각했습니다. 제게 가장 큰 마찰은 "에디터 열고 → 새 파일 만들고 → frontmatter 채우고 → 빈 페이지 바라보기"로 이어지는 컨텍스트 스위칭 과정이었어요.

그래서 텔레그램 봇으로 가볍게 주제를 툭 던지면, Claude Code가 이를 받아서 카테고리를 알아서 추론하고 마크다운 파일을 생성해 main 브랜치에 바로 커밋하도록 자동화 파이프라인을 구축해 보았습니다. 크게 두 가지 스킬(Skill)로 입구를 나누어 두었는데요.

- `.claude/skills/blog-draft` — 일반적인 메시지를 받으면 정식 초안 글로 작성해 줍니다.
- `.claude/skills/idea-listing` — `아이디어:` 또는 `idea:` prefix가 붙은 메시지는 `src/data/ideas/` 폴더로 짧게 라우팅해 줍니다.

스킬 내부에는 카테고리 분류 가이드부터 frontmatter 스키마, 코드 블록 작성 규칙, 그리고 커밋 컨벤션까지 꼼꼼하게 명시해 두었습니다. AI 모델이 매번 일관된 퀄리티의 결과를 내도록 룰을 한 곳에 잘 묶어둔 셈이죠. **"잘 쓰는 것보다 계속 쓰는 것"**이 제 블로그 운영 원칙이라면, 그 원칙을 코드로 직접 시스템화한 가장 핵심적인 부분이 아닐까 싶습니다.

## 시도하고 되돌린 것

물론 모든 결정이 한 번에 완벽하게 자리 잡은 것은 아닙니다. 도입했다가 다시 빼버린 대표적인 두 가지 사례도 적어볼게요.

- **Supabase 댓글** — 도입을 해봤지만 공급자 락인(Lock-in)과 운영 부담이 꽤 컸습니다. 게다가 아직 제 블로그가 적극적으로 댓글을 받을 단계는 아니라고 판단해서, 추가한 직후에 바로 롤백했습니다 (`dd21389` → `a92de07`).
- **Aurora 배경** — 처음엔 부드러운 그라디언트 배경을 예쁘게 깔아봤었는데요, 블로그의 전체적인 담백한 톤앤매너와 맞지 않는 것 같아 터미널 로그 데코로 교체했습니다 (`72c5293`).

빠르게 도입해 보고, 아니다 싶으면 빠르게 뺐습니다. 정적 사이트라서 기능을 넣고 빼고 되돌리는 비용이 거의 0에 가깝다는 점을 적극적으로 활용해 보았어요.

## 앞으로 손볼 것

글이 더 쌓여야지만 윤곽이 잡히는 영역들은 일부러 의도적으로 남겨두었습니다.

- 검색 기능 — 글이 한 30편 정도를 넘어가면 그때 도입을 고려해 볼 생각입니다.
- 태그 페이지 — 어떤 태그가 주로 많이 쓰이는지 데이터가 충분히 모이면, 그걸 바탕으로 설계하려고 합니다.
- RSS 피드 — 누군가 구독 요청을 주시면 그때 추가하려고요.

지금 단계에서 이런 기능들을 미리 구축하지 않는 이유는 단순합니다. 실제 사용 패턴이나 피드백 없이 지레짐작으로 미리 만들어둔 기능은 거의 항상 나중에 다시 만들게 되더라고요.
