---
title: "결정 1 — Railway+FastAPI에서 Cloudflare Workers + Routine으로 피봇한 이유"
description: "Phase 0에서는 Python+FastAPI를 Railway에 띄울 계획이었는데, Railway 2026 무료 티어 변화로 한 번 막혔습니다. 자체 서버 0개로 가는 Cloudflare Workers + Claude Code Routine 조합으로 피봇한 이야기입니다."
pubDate: 2026-05-02T16:05:00+09:00
category: works
tags: ["Cloudflare Worker", "Railway"]
project: "blog-draft-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/blog-draft-bot/blog-draft-bot-decision-platform-pivot/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/blog-draft-bot/blog-draft-bot-decision-platform-pivot/hero.png" 추가
     3. 이 주석 삭제 -->

처음에는 Railway에 FastAPI를 띄워서 돌리려고 했어요. Python은 LLM API를 호출하는 스택으로 가장 자연스럽고, Railway는 당시 기준으로 무료 티어가 있었거든요.

## 처음 안 — Railway + FastAPI

계획한 흐름은 이랬습니다.

```text
Telegram → FastAPI(Railway) → Anthropic SDK → Git → GitHub Pages
```

Python + FastAPI + python-telegram-bot + Anthropic SDK + GitPython의 5컴포넌트 조합을 Phase 1~5로 나눠 만들어갈 계획이었어요. 서버가 persistent하게 떠있고 webhook을 받아 LLM API를 직접 호출하는 구조입니다.

## 무엇이 막았나 — Railway 2026 무료 티어 변화

문제는 Railway의 정책이 바뀌어있었다는 거예요. 2026년 기준으로 영구적인 무료 호스팅이 아니라 일회성 크레딧만 지원하는 구조였습니다. 개인 자동화 프로젝트를 *비용 없이 영구 운영*하는 목적에는 맞지 않았어요.

<!-- 여기에 before/after 인프라 비교 다이어그램 삽입 (예: public/images/posts/blog-draft-bot/blog-draft-bot-decision-platform-pivot/infra-before-after.png) -->

## Cloudflare Workers + Claude Code Routine으로 피봇

그래서 방향을 틀었습니다.

```text
Telegram → Cloudflare Worker → Claude Code Routine → Git → GitHub Pages
```

Cloudflare Workers는 월 10만 요청까지 무료 영구 호스팅이고, Claude Code Routine은 Anthropic 클라우드에서 실행돼서 별도 서버가 불필요합니다. *자체 서버 0개*로 파이프라인이 완성됐어요. 유지보수할 인프라가 없으니까 처음엔 "오버엔지니어링 아닌가" 싶었는데, 실제로 쓰다 보니 "내 서버를 만들지 않는 게 가장 좋은 서버"라는 게 이 조합이 가져온 결론이었습니다.

## 정리

외부 조건이 바뀌어서 피봇한 케이스지만, 결과적으로는 원래 계획보다 훨씬 가벼운 인프라로 정착했습니다. *무엇을 어디에 올릴지*보다 *어디에도 올리지 않는 방법*을 먼저 고민했던 결정이에요. 다음 글에서는 Routine vs raw API 선택의 트레이드오프를 다뤄보겠습니다.
