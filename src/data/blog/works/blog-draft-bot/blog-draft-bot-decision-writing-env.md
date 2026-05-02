---
title: "결정 3 — 글쓰기 환경 세팅 — 디자인 토큰 먼저 잡고 SKILL.md로 흐름을 고정한 이유"
description: "보통은 콘텐츠를 먼저 써보고 디자인을 잡는데 순서를 거꾸로 갔습니다. 토스 그레이 + 딥 그린 토큰으로 렌더링 톤을 먼저 고정하고, SKILL.md의 7단계 흐름과 Zod 스키마 강제로 Claude가 frontmatter를 어기지 못하게 막은 이야기입니다."
pubDate: 2026-05-02T16:05:20+09:00
category: works
tags: ["Design System", "Claude Code"]
project: "blog-draft-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/blog-draft-bot/blog-draft-bot-decision-writing-env/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/blog-draft-bot/blog-draft-bot-decision-writing-env/hero.png" 추가
     3. 이 주석 삭제 -->

글쓰기 자동화를 만들기 전에, *어떤 글이 나와야 하는지*를 먼저 고정해야 했어요. 그게 디자인 토큰과 SKILL.md를 만드는 일이었습니다.

## 디자인 토큰 먼저 — 렌더링 톤이 정해져야 분량이 잡힌다

보통은 콘텐츠를 먼저 써보고 디자인을 다듬는데, 여기서는 거꾸로 갔어요. 디자인 시스템이 정해져 있지 않으면 Claude가 글을 쓸 때 분량·이미지 위치·코드 블록 사용 빈도가 즉흥적이 됩니다. *렌더링된 모습*이 머릿속에 없으면 글의 리듬이 안 잡혀요.

결정한 토큰은 이렇습니다.

- 폰트 3종: 본문 Pretendard / 로고 한나는 열한살체 / 코드 JetBrains Mono
- 색상: 토스 스타일 그레이 스케일 + 딥 그린(#15803D) 단일 액센트
- 라이트모드 전용 (다크 모드 미지원)
- 폰트 셀프호스팅: Pretendard·JetBrains Mono는 `@fontsource`, 한나는 열한살체는 woff2 직접 변환

<!-- 여기에 디자인 토큰 팔레트/타입 스케일 이미지 삽입 (예: public/images/posts/blog-draft-bot/blog-draft-bot-decision-writing-env/tokens.png) -->

## SKILL.md의 7단계 작업 흐름

글쓰기 환경의 두 번째 축은 SKILL.md예요. Claude Code Routine이 메시지를 받으면 이 파일을 직접 읽고 작업 흐름을 따라갑니다.

```text
1. 메시지 분석 — 주제, 분량, 카테고리 힌트 파악
2. 카테고리 결정 — programming / design / thinking / works 중 선택
3. 조사 판단 — 외부 자료 검색 필요 여부 판단
4. slug 생성 — 충돌 검사 포함
5. frontmatter + 본문 작성 — Zod 스키마 강제
6. 파일 저장 — 경로 규칙 준수
7. 커밋 + 푸시 — Conventional Commits 컨벤션
```

## frontmatter 스키마는 Zod로 강제

`src/content.config.ts`의 Astro content collection 스키마가 Zod로 정의되어 있어요. Claude가 잘못된 frontmatter를 작성하면 `npm run build`가 깨지면서 글이 사이트에 올라가지 않습니다.

예를 들어 `category: "Work"` (대소문자 오류)를 넣으면 Zod enum 검증에서 바로 걸려요. 이 메커니즘 덕분에 SKILL.md에서 "꼭 소문자 works를 써라"고 수십 줄로 강조하지 않아도 됩니다.

<!-- 여기에 7단계 작업 흐름 도식 삽입 (예: public/images/posts/blog-draft-bot/blog-draft-bot-decision-writing-env/seven-steps.png) -->

## 정리

글쓰기 환경은 Claude를 위한 제약 설계예요. 어느 정도까지 자유를 주고, 어디서부터는 강제로 막을지를 결정하는 작업이었습니다. 다음 글에서는 main에 직접 push하는 결정을 다뤄보겠습니다.
