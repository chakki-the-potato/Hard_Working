---
title: "결정 5 — HMAC 양방향 검증과 Telegram secret_token 이중 인증으로 webhook을 단단히 묶은 법"
description: "public webhook endpoint 3개를 다층으로 잠가야 했습니다. Telegram secret_token 1차, HMAC SHA256 양방향 2차, ALLOWED_CHAT_ID 화이트리스트 3차. 시크릿 7종이 어떤 방향으로 짝지어 검증하는지 정리했습니다."
pubDate: 2026-05-02T16:05:40+09:00
category: works
tags: ["Security", "Cloudflare Worker"]
project: "blog-draft-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/blog-draft-bot/blog-draft-bot-decision-hmac-and-webhooks/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/blog-draft-bot/blog-draft-bot-decision-hmac-and-webhooks/hero.png" 추가
     3. 이 주석 삭제 -->

Cloudflare Worker의 `blog-agent-proxy` endpoint는 public URL입니다. 누구나 접근할 수 있는 주소에 *아무 요청이나 받으면 Routine을 호출하는* 구조가 되면 안 되니까, 다층 인증으로 잠갔어요.

## 위협 모델 — 누가 어떻게 들어올 수 있나

크게 세 가지 위협이 있었어요. 첫째는 텔레그램이 아닌 곳에서 `/telegram` endpoint를 직접 호출하는 경우, 둘째는 Worker가 아닌 곳에서 Claude Code Routine을 직접 호출하는 경우, 셋째는 GitHub가 아닌 곳에서 `/github` endpoint를 위조 POST하는 경우입니다.

## Telegram secret_token으로 1차 잠금

Telegram에 webhook을 등록할 때 `secret_token`을 같이 등록해 두면, 텔레그램이 매 요청 헤더에 그 토큰을 담아서 보냅니다. Worker에서 이 헤더를 검증하면 텔레그램이 아닌 요청은 1차에서 걸립니다.

```text
curl -X POST ".../setWebhook" \
  -d url=https://blog-agent-proxy.chanhee2468.workers.dev/telegram \
  -d secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

## HMAC SHA256 양방향 검증으로 2차 잠금

Worker에서 Routine을 호출할 때는 `ROUTINE_HMAC_SECRET`으로 서명한 헤더를 함께 보냅니다. Routine 쪽이 같은 시크릿으로 서명을 검증하면 Worker에서 온 요청만 통과돼요.

GitHub → Worker 방향도 동일합니다. GitHub Actions 워크플로우가 Worker에 POST할 때 `GITHUB_WEBHOOK_SECRET`으로 서명한 `X-Hub-Signature-256` 헤더를 붙입니다. Worker에서 이걸 검증합니다.

```text
Worker → Routine:  ROUTINE_HMAC_SECRET 양쪽에서 공유
GitHub → Worker:   GITHUB_WEBHOOK_SECRET 양쪽에서 공유
```

<!-- 여기에 시크릿 7종 흐름도 삽입 (예: public/images/posts/blog-draft-bot/blog-draft-bot-decision-hmac-and-webhooks/secrets-flow.png) -->

## ALLOWED_CHAT_ID로 3차 잠금

텔레그램 채널 ID 화이트리스트입니다. secret_token 검증을 통과한 요청이라도 `chat_id`가 허용 목록에 없으면 무시해요. 봇이 다른 채팅방에 추가되거나 다른 사람이 봇에 메시지를 보내도 Routine 호출로 이어지지 않습니다.

## 정리

시크릿이 7종이다 보니 처음엔 복잡해 보였는데, 각 쌍을 어디서 어떤 방향으로 쓰는지 정리해 두니 명확해졌어요. *어느 시크릿이 어느 경계를 지키는가*를 하나씩 매핑하면서 보안 모델이 잡혔습니다.

이걸로 시리즈 6편이 모두 끝났습니다. 각 결정에 흩어져 있던 "왜 이렇게 됐지?" 하는 순간들을 글로 정리해 두니 시스템이 훨씬 명확하게 보이더라고요. Phase A (raw API 직접 구현) 단계의 변화가 생기면 별도 시리즈로 이어갈 예정입니다.
