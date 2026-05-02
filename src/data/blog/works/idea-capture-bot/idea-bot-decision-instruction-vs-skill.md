---
title: "결정 3 — 지침과 SKILL.md를 가르는 한 줄짜리 휴리스틱"
description: "처음에는 둘을 섞어 써서 헷갈렸어요. \"터미널에서 직접 호출해도 이 규칙이 적용되어야 하나?\"라는 한 줄 테스트로 자동 로드와 필요 시 로드를 깔끔하게 갈랐습니다."
pubDate: 2026-05-02T15:36:20+09:00
category: works
tags: ["Claude Code", "Documentation"]
project: "idea-capture-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/idea-capture-bot/idea-bot-decision-instruction-vs-skill/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/idea-capture-bot/idea-bot-decision-instruction-vs-skill/hero.png" 추가
     3. 이 주석 삭제 -->

이 결정은 작아 보이는데 *나중에 가장 자주 도움이 됐던 룰*이에요. Claude Code Routine을 굴리다 보면 "이 규칙은 어디에 적어야 하지?" 하는 순간이 자주 옵니다. 시스템 프롬프트(지침)에 박아야 할까, 아니면 SKILL.md에 적어야 할까.

## 처음에는 둘을 섞어 썼어요

처음엔 명확한 기준 없이 "더 중요해 보이는 건 지침에, 자세한 건 SKILL.md에" 정도로 갈랐습니다. 그러다 보니 같은 정보가 두 곳에 중복으로 들어가거나, 한쪽만 갱신해서 두 문서가 어긋나는 일이 생겼어요.

특히 frontmatter 스키마가 SKILL.md에 자세히 적혀 있는데 지침에도 짧게 요약이 들어가 있다 보니, 스키마를 바꿀 때마다 *어느 쪽을 진실의 출처로 봐야 하나*가 헷갈렸습니다.

## 한 줄 테스트 — "터미널에서 직접 호출해도 적용되어야 하나"

정리하다가 발견한 휴리스틱은 이거였어요.

> 이 규칙이 *Routine을 통하지 않고 터미널에서 `/blog-draft`로 직접 호출해도 똑같이 적용되어야 하는가?*

YES면 SKILL.md, NO면 지침입니다.

이렇게 가르고 나니 두 문서의 책임이 명확해졌어요.

- **지침** = *작업 흐름* (어떻게 돌릴 것인가) — main에 직접 push, claude/... 브랜치 금지, SCOPE 가드레일 같은 *인프라 정책*
- **SKILL.md** = *결과물 가이드* (무엇을 만들 것인가) — frontmatter 스키마, 카테고리 분류, 본문 톤·구조, 커밋 메시지 형식

<!-- 여기에 두 문서의 책임 분리 다이어그램 삽입 (예: public/images/posts/idea-capture-bot/idea-bot-decision-instruction-vs-skill/responsibility.png) -->

## 자동 로드와 필요 시 로드의 차이

이 분리가 자연스러운 또 다른 이유는 *로드되는 방식 자체가 다르다*는 점입니다.

지침은 Routine이 깨어날 때마다 *자동으로* 컨텍스트에 들어가요. 즉 매 호출에서 보장되는 룰이라 무겁게 쓰면 안 되고, *없으면 안 되는 정책*만 적습니다.

반면 SKILL.md는 Claude가 *필요할 때 직접 읽는* 문서예요. 길어도 OK입니다. 본문 작성 직전에 파일을 직접 열어 보고 톤을 모방하거든요. 그래서 카테고리별 본문 가이드, 코드 블록 alias 목록, 분류 예시 표 같은 *세부 매뉴얼*이 들어가도 무리가 없습니다.

## 정리

지침과 SKILL.md를 가르는 한 줄 테스트만 정해두면, 새 룰이 나올 때마다 "어디에 넣지?"로 고민하지 않아도 됩니다. 자동 로드되는 정책이라면 지침, 결과물 정의라면 SKILL.md. 다음 글에서는 한 번 사고를 겪고 추가한 SCOPE 가드레일 이야기를 풀어볼게요.
