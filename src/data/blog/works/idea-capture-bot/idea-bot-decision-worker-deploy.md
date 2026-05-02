---
title: "결정 2 — Cloudflare Worker를 대시보드에서 직접 deploy한 이유"
description: "Worker를 GitHub repo와 연결해 자동 배포하려다 블로그 빌드와 충돌이 났습니다. 결국 단일 파일은 단일 파일답게 — 대시보드에서 직접 붙여넣고 deploy하는 방식이 가장 깔끔했어요."
pubDate: 2026-05-02T15:36:10+09:00
category: works
tags: ["Cloudflare Worker", "DevOps"]
project: "idea-capture-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/idea-capture-bot/idea-bot-decision-worker-deploy/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/idea-capture-bot/idea-bot-decision-worker-deploy/hero.png" 추가
     3. 이 주석 삭제 -->

세 번째 결정은 작은 인프라 결정인데, *작은 코드는 작은 코드답게* 두는 게 답이었습니다. 처음에는 "당연히 GitHub repo에 연결해서 자동 배포해야지"라고 생각했는데, 막상 해보니 결이 안 맞았어요.

## 처음 안 — repo 연결 자동 배포

Cloudflare Worker는 GitHub repo와 연결하면 push할 때마다 자동으로 빌드·배포하도록 묶을 수 있습니다. CI/CD의 정석이고, 보통은 이게 답이에요.

그래서 블로그 repo(`Hard_Working`)에 Worker 코드를 한 폴더(`worker/`) 안에 넣고 연결하려고 시도했습니다.

## 충돌 — 블로그 빌드를 Worker로 올리려는 시도

문제는 *연결한 repo가 블로그 repo*였다는 점이에요. Cloudflare가 자동 빌드를 시도할 때 repo 루트를 보고 "어, Astro 프로젝트네?" 하면서 *블로그 빌드*를 Worker에 올리려고 했습니다.

당연히 깨졌습니다. Worker는 단일 JS 파일이 도는 환경이고, Astro의 dist 빌드 산출물은 정적 사이트 파일 묶음이라 형태가 완전히 달랐거든요. 빌드 설정을 만져서 `worker/` 하위만 보게 하는 방법도 있었지만, 그 정도 힘을 쏟을 만큼 Worker 코드가 큰 것도 아니었어요.

<!-- 여기에 repo 연결 충돌 다이어그램 삽입 (예: public/images/posts/idea-capture-bot/idea-bot-decision-worker-deploy/conflict.png) -->

## 대시보드 직접 deploy로 정착

결국 가장 단순한 방식으로 갔습니다.

- Worker 코드는 *단일 파일* — 라우팅·인증·webhook 처리 다 합쳐서 200줄 안 됨
- Cloudflare 대시보드의 에디터에 붙여넣고 Deploy 버튼 클릭
- 시크릿은 대시보드에서 직접 등록 (`TELEGRAM_BOT_TOKEN`, `ROUTINE_TOKEN`, `GITHUB_WEBHOOK_SECRET` 등)
- GitHub repo와는 *연결 없음*. Worker 코드는 별도 gist에 백업만

처음엔 "수동 배포라니, 좀 옛날 방식 아닌가" 싶었어요. 근데 실제로 운영하면서 느낀 게, 이 Worker는 *건드릴 일이 거의 없습니다*. 일주일에 한 번 알림 메시지 포맷 손볼까 말까 수준이라, 매번 git commit + push + CI 통과를 기다리는 비용이 오히려 더 컸어요.

## 정리

자동화는 *코드를 자주 바꿀 때*가 진가가 있더라고요. 거의 안 바뀌는 작은 코드는 단순 deploy가 더 가볍습니다. "이걸 자동화해야 하나?"는 *바뀌는 빈도*로 판단하는 게 좋다는 걸 작은 사례로 배웠어요. 다음 글에서는 지침과 SKILL.md를 가르는 휴리스틱 한 줄을 다뤄보겠습니다.
