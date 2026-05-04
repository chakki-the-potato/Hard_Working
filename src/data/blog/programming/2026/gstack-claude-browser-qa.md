---
title: "Claude Code에서 브라우저를 열다: garrytan/gstack"
description: "헤드리스 Chromium을 Claude Code 스킬로 감싼 gstack — /scrape, /skillify, /browse로 QA 자동화와 사이트 검증을 어떻게 처리하는지 정리했습니다."
pubDate: 2026-05-04T11:02:52+09:00
category: programming
tags: ["Tools"]
version: "v1.0"
---

Claude Code로 프론트엔드를 수정한 뒤 "동작하는지 확인해줘"라고 하면 보통은 코드를 정적으로 분석하는 것으로 끝납니다. 실제 브라우저에서 직접 확인하지는 못하기 때문입니다. [garrytan/gstack](https://github.com/garrytan/gstack)은 이 공백을 채우는 도구입니다. 헤드리스 Chromium 데몬을 Claude Code 스킬로 감싸서, 실제 브라우저 동작을 Claude가 직접 실행하고 결과를 확인할 수 있게 합니다.

## 핵심 특징

**제로 컨텍스트 오버헤드**: 브라우저 CLI가 plain text를 stdout으로 출력하는 방식이라, 브라우저 조작 결과가 Claude의 컨텍스트 윈도우를 점유하지 않습니다. 호출당 100~200ms 속도입니다.

**70가지 이상의 명령어**: 페이지 탐색, 요소 클릭, 폼 입력, 스크린샷 캡처, 다이얼로그 처리, 반응형 레이아웃 확인 등 일반적인 QA 흐름을 모두 커버합니다.

**코드화(skillify)**: 반복 작업을 탐색한 뒤 `/skillify`로 결정적인 Playwright 스크립트로 변환합니다. 이후 동일한 흐름은 다시 탐색 없이 200ms 만에 실행됩니다.

## 기본 사용법

```bash
# 브라우저 CLI 경로 지정 (한 번만)
B=~/.claude/skills/gstack/browse/dist/browse

# 페이지 이동
$B goto https://example.com

# 인터랙티브 스냅샷 (클릭 가능한 @ref 번호 부여)
$B snapshot -i

# 특정 요소 클릭
$B click @e30

# 페이지 텍스트 추출
$B text

# 스크린샷 저장
$B screenshot /tmp/result.png
```

Claude가 이 명령어들을 시퀀스로 실행하면서 실제 브라우저 동작을 검증합니다.

## 생산성 루프: scrape → skillify

가장 강력한 기능은 탐색 → 코드화 루프입니다.

```text
/scrape 최신 포스트 목록 확인    # Claude가 페이지를 탐색하며 흐름 파악
/skillify                        # 탐색 결과를 재현 가능한 스크립트로 저장
/scrape 최신 포스트 목록 확인    # 두 번째 호출은 저장된 스크립트로 ~200ms 실행
```

처음 실행은 Claude가 직접 탐색하기 때문에 30초 정도 걸립니다. 하지만 `/skillify` 이후에는 동일 작업을 200ms로 반복 실행할 수 있어서, 회귀 테스트처럼 활용할 수 있습니다.

## 스킬 목록

- `/gstack` — 메인 QA 스킬. 사이트를 열고, 상태를 확인하고, 버그 증거를 캡처합니다
- `/browse` — 빠른 브라우저 탐색 전용. 단일 페이지 확인에 씁니다
- `/open-gstack-browser` — 헤드 모드로 Chromium을 열고 Chrome Side Panel에 Claude PTY를 연결합니다
- `/gstack-upgrade` — gstack 업데이트
- `/qa` / `/qa-only` — 전체 QA 워크플로우 실행

## 실제 활용 시나리오

**배포 검증**: 배포 후 `/browse https://my-app.vercel.app`으로 주요 페이지들이 정상 렌더링되는지 확인합니다.

**반응형 확인**: 뷰포트를 바꿔가며 레이아웃 깨짐을 스크린샷으로 캡처합니다.

**폼 플로우 테스트**: 입력 → 제출 → 결과 확인까지 전체 흐름을 자동화합니다.

**버그 증거 수집**: 재현된 버그를 스크린샷과 함께 캡처해서 이슈에 첨부합니다.

## 설치

```bash
claude plugins install gstack
```

또는 GitHub에서 직접 클론 후 `bun install && bun run build`로 브라우저 바이너리를 빌드합니다. 빌드 결과물은 `browse/dist/browse`에 생성됩니다 (약 58MB).

## 참고 자료

- GitHub: https://github.com/garrytan/gstack
