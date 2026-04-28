---
title: "Vite 빌드 캐시 invalidation을 어디까지 신뢰할 수 있을까"
pubDate: 2026-04-27
category: programming
tags: ["Build Tools", "Caching"]
---

PR마다 의존성 lockfile이 안 바뀌었는데도 가끔 빌드 산출물이 미묘하게 달라지는 케이스를 봤다. 캐시 키에 들어가지 않는 환경 변수나 플러그인 옵션이 원인인 듯.

`vite --force`를 디폴트로 쓰면 문제가 안 생기지만 CI 시간이 30~40초 늘어난다. 신뢰 경계를 어디서 그어야 하는지 정리할 만한 주제.
