---
title: "ccusage로 Claude 사용량 한눈에 파악하기"
description: "npx ccusage 명령어로 Claude Code 사용량을 일별·월별·세션별로 분석하는 방법을 정리했습니다. 필터 옵션과 실전 활용 예시까지 다룹니다."
pubDate: 2026-04-29T01:00:50+09:00
category: programming
tags: ["Tools"]
---

Claude Code를 본격적으로 쓰기 시작하면 자연스럽게 드는 궁금증이 하나 있습니다. "나 도대체 얼마나 쓰고 있는 거지?" 대시보드나 별도 모니터링 없이도 로컬 JSONL 로그만으로 사용량을 분석해주는 CLI 도구가 있더라고요. `ccusage`입니다.

설치도 필요 없이 `npx`로 바로 실행할 수 있어서, 주기적으로 확인하기에 딱입니다. 이 글에서는 자주 쓰는 명령어와 옵션을 실용적인 예시 중심으로 정리해봤습니다.

## 기본 명령어 구조

`ccusage`는 크게 네 가지 뷰를 제공합니다.

```bash
npx ccusage@latest              # 일별 리포트 (기본값, daily 생략 가능)
npx ccusage@latest daily        # 일별
npx ccusage@latest monthly      # 월별
npx ccusage@latest session      # 대화 세션별
npx ccusage@latest blocks       # 5시간 빌링 윈도우 단위
```

`@latest`를 붙이는 게 습관이 되면 좋습니다. 버전 업데이트가 꽤 잦은 편이라, 캐시된 구버전이 실행되면 컬럼 포맷이 달라 보이는 경우가 있더라고요.

## 날짜 범위와 프로젝트 필터

전체 기간 합산보다 특정 시점부터 얼마나 썼는지가 더 궁금할 때가 많습니다.

```bash
# 이번 달 초부터 오늘까지
npx ccusage@latest daily --since 20260401

# 특정 구간만
npx ccusage@latest daily --since 20260421 --until 20260428

# 특정 프로젝트만
npx ccusage@latest daily --project hard-working
```

`--since` / `--until`은 `YYYYMMDD` 형식입니다. 저는 월초 이후 추이를 볼 때 `--since`만 지정하고 `--until`은 생략하는 패턴을 주로 씁니다.

## 모델별·프로젝트별 세분화

단순 토큰 합계보다 어느 모델을 얼마나 썼는지, 어느 프로젝트에서 많이 소비했는지가 더 유용할 때도 있습니다.

```bash
# 모델별 비용 세분화
npx ccusage@latest monthly --breakdown

# 프로젝트별 그룹화
npx ccusage@latest daily --instances

# 두 옵션 같이 — 가장 상세한 뷰
npx ccusage@latest monthly --breakdown --instances
```

`--breakdown`을 붙이면 Opus / Sonnet / Haiku 각각 얼마나 들었는지가 컬럼으로 분리됩니다. 모델을 고정해서 쓰는 게 아니라 작업마다 다르게 쓴다면 이 옵션이 꽤 유용했습니다.

## 세션별 분석

어떤 대화가 특히 많이 소비했는지 볼 때는 `session` 뷰를 씁니다.

```bash
npx ccusage@latest session
npx ccusage@latest session --breakdown
```

긴 컨텍스트를 유지하며 작업하는 세션이 생각보다 많은 토큰을 쓰더라고요. 주기적으로 `/clear`를 치거나 컨텍스트를 압축하는 습관을 갖게 된 계기가 이 뷰였습니다.

## JSON 출력과 오프라인 모드

데이터를 다른 도구로 가져가거나 스크립트로 처리할 때는 `--json`이 편합니다.

```bash
npx ccusage@latest monthly --json
npx ccusage@latest daily --json --since 20260401 > april-usage.json
```

네트워크가 없는 환경이라면 `--offline`으로 캐시된 가격 데이터를 사용할 수 있습니다.

```bash
npx ccusage@latest daily --offline
```

## 실전 활용 패턴

제가 자주 쓰는 조합 몇 가지입니다.

```bash
# 이번 달 모델별 비용 전체 조망
npx ccusage@latest monthly --breakdown

# 지난주 일별 사용량 추이
npx ccusage@latest daily --since 20260421 --until 20260427

# 오늘까지의 세션 중 무거웠던 것 찾기
npx ccusage@latest session --since 20260428
```

자주 쓴다면 전역 설치도 나쁘지 않습니다.

```bash
npm install -g ccusage
ccusage monthly --breakdown
```

## 마치며

사용량 모니터링 자체가 목적이 되면 본말이 전도되지만, 가끔 한 번씩 돌려보면 "아, 이 작업에서 생각보다 많이 썼구나"를 파악하는 데 도움이 됩니다. 특히 `session` 뷰로 긴 대화 패턴을 확인하고 나서 작업 단위를 조금씩 나누게 됐는데, 체감상 응답 품질도 올라간 것 같더라고요.
