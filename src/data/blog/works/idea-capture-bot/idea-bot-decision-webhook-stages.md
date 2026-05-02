---
title: "결정 7 — push와 workflow_run을 분리해 만든 알림 3단계"
description: "처음엔 push 알림 하나로 끝냈는데, 빌드 실패는 알 수 없었어요. push와 workflow_run webhook을 별도 endpoint로 갈라 알림을 3단계(commit → 게시 → 실패)로 쪼갰습니다."
pubDate: 2026-05-02T15:36:50+09:00
category: works
tags: ["GitHub Actions", "Cloudflare Worker"]
project: "idea-capture-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/idea-capture-bot/idea-bot-decision-webhook-stages/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/idea-capture-bot/idea-bot-decision-webhook-stages/hero.png" 추가
     3. 이 주석 삭제 -->

마지막 결정입니다. 알림을 *어디서 어떻게 쪼개느냐*에 따라 자동화의 체감 품질이 꽤 달라지더라고요. 처음엔 push 알림 하나면 충분할 줄 알았는데, 운영하면서 단계가 부족하다는 걸 느꼈어요.

## 처음 안 — push 알림 하나로 끝

초기에는 GitHub push webhook 하나만 받아서 텔레그램으로 알림을 쐈습니다.

```text
새 글이 push됐습니다
```

이거면 충분해 보였어요. commit이 들어왔다는 건 자동화가 정상적으로 돌았다는 뜻이니까요.

## 부족했던 점 — 빌드 실패는 알 수 없었음

며칠 운영하다 한 번 *빌드가 깨진 적*이 있었어요. frontmatter에서 enum이 아닌 카테고리 값이 들어가서 zod 스키마 검증이 실패한 케이스였는데요.

문제는 push 알림은 정상으로 떴다는 거였습니다. commit은 무사히 들어갔으니까요. 그런데 GitHub Actions에서 Astro 빌드가 깨지는 바람에 사이트는 업데이트되지 않았습니다. 폰으로 알림을 보고 "오 게시됐네" 하고 끝났는데, 막상 며칠 뒤 사이트를 보니 그 글이 안 올라가 있었어요.

*commit이 들어간 시점*과 *실제로 사이트에 게시되는 시점*은 다른 사건이라는 걸 그때 알았습니다.

## push와 workflow_run을 분리

해결은 webhook을 두 개로 나누는 거였어요.

- `/github` endpoint — GitHub push webhook 수신. *commit 시점* 알림
- `/workflow-run` endpoint — GitHub Actions workflow_run webhook 수신. *빌드/배포 종료 시점* 알림 (성공·실패 모두)

같은 Worker 안의 두 endpoint로 나눈 이유는 *수신 주기와 처리 로직이 다르기 때문*이에요. push는 즉시, workflow_run은 빌드가 끝난 뒤(보통 30~60초 후) 들어옵니다. 한 endpoint에서 둘을 다루려면 분기 로직이 복잡해지는데, 분리하니까 각각 짧고 단순해졌어요.

<!-- 여기에 알림 3단계 시퀀스 도식 삽입 (예: public/images/posts/idea-capture-bot/idea-bot-decision-webhook-stages/sequence.png) -->

## 알림 3단계로 정착

최종적으로 텔레그램으로 들어오는 알림은 이렇게 3단계가 됐습니다.

```text
[1] 커밋 완료
    Programming / Backend ─ Promise.allSettled 활용하기
[2] 게시됨
    https://chakki-the-potato.github.io/Hard_Working/posts/...
```

또는 빌드가 깨졌을 때:

```text
[1] 커밋 완료
[2] 빌드 실패 — Astro 빌드 에러
    https://github.com/.../actions/runs/...
```

각 단계가 자기 책임만 갖습니다. 1단계는 "Routine이 글을 썼고 push까지 완료"를 알려주고, 2단계는 "빌드·배포가 어떻게 끝났는지"를 알려줍니다. 단계가 둘로 쪼개지니 *어디서 깨졌는지*가 명확해졌어요.

## 정리

알림은 *한 번에 다 보여주려 하지 않는 게* 좋더라고요. 사건의 자연스러운 단계대로 쪼개면 사용자(이 경우엔 저)는 *어디서 깨졌는지*를 추론하지 않아도 알게 됩니다. 자동화의 마무리는 알림이고, 알림의 품질이 결국 *시스템을 신뢰할 수 있느냐*를 결정해요.

이걸로 시리즈 7편이 모두 끝났습니다. 한 줄 요약 → 컴포넌트 분리 → 결정 7개. 처음에 한 글로 풀려다가 *결정 단위로 쪼개니까 각각이 더 독립적인 회고가 되더라고요*. 비슷한 자동화를 시도하시는 분들께 작은 참고가 되었으면 합니다.
