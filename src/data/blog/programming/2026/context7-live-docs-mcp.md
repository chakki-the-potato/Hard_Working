---
title: "학습 데이터가 낡았다면: upstash/context7로 최신 공식 문서 참조"
description: "LLM 훈련 컷오프 이후 달라진 API를 context7이 어떻게 해결하는지 — resolve-library-id와 query-docs 두 도구로 항상 최신 문서를 컨텍스트에 주입하는 방식을 정리했습니다."
pubDate: 2026-05-04T11:00:43+09:00
category: programming
tags: ["Tools"]
version: "v1.0"
---

Claude에게 React 최신 API를 물어보면 오래된 패턴을 알려주는 경우가 있습니다. 훈련 데이터의 컷오프 이후 릴리즈된 변경사항은 모르기 때문입니다. 특히 빠르게 바뀌는 라이브러리 — Next.js App Router, Prisma v6, shadcn/ui — 는 버전마다 API 형식이 달라집니다. [upstash/context7](https://github.com/upstash/context7)은 이 문제를 해결하는 MCP 서버입니다.

## 동작 원리

두 단계로 동작합니다.

**1단계 — 라이브러리 ID 해석**

```text
사용자: "React hooks 사용법 알려줘"
Claude: resolve-library-id("react") 호출
       → 라이브러리 키: /facebook/react
```

**2단계 — 문서 청크 조회**

```text
query-docs(libraryId: "/facebook/react", query: "hooks useState")
→ 공식 문서에서 관련 섹션 추출 → 컨텍스트에 주입
→ Claude가 최신 공식 문서 기반으로 답변
```

context7은 주요 라이브러리의 공식 문서를 주기적으로 크롤링하고 인덱싱합니다. 따라서 Claude의 훈련 데이터 컷오프와 무관하게 현재 버전의 API를 참조할 수 있습니다.

## 지원 라이브러리

현재 수천 개의 라이브러리를 지원합니다. 자주 쓰는 것들을 나열하면:

- **프론트엔드**: React, Next.js, Vue, Svelte, SvelteKit, Astro, Remix
- **스타일링**: Tailwind CSS, shadcn/ui
- **백엔드**: Express, Fastify, NestJS, FastAPI, Django
- **데이터**: Prisma, Drizzle ORM, TypeORM, SQLAlchemy
- **인프라**: Docker, Kubernetes, Terraform, AWS CDK

`resolve-library-id`에 패키지 이름을 넣으면 지원 여부를 확인할 수 있습니다.

## CLAUDE.md에 규칙 추가하기

context7의 효과를 제대로 보려면 CLAUDE.md에 자동 적용 규칙을 추가해야 합니다.

```md
## Tools

- 라이브러리·프레임워크·SDK·API 관련 질문이나 코드 작성 시 항상
  context7 MCP를 사용해 최신 공식 문서를 참조할 것. 별도 요청 없어도 자동 적용.
```

이 규칙이 있으면 Claude가 라이브러리 관련 질문을 감지할 때마다 자동으로 context7을 호출합니다. 매번 "context7 써줘"라고 말하지 않아도 됩니다.

## 언제 특히 유용한가

**버전 마이그레이션**: Next.js 14에서 15로 올리거나 Prisma를 메이저 버전 업그레이드할 때, 낡은 패턴 대신 현재 공식 마이그레이션 가이드를 참조합니다.

**새 라이브러리 도입**: 처음 쓰는 라이브러리일수록 context7이 효과적입니다. Claude의 사전 지식이 옛날 버전 기준일 수 있기 때문입니다.

**에러 디버깅**: `useFormState` → `useActionState` 같은 deprecated API 변경처럼, 에러 메시지만으로는 원인을 찾기 어려울 때 최신 문서가 직접적인 답을 줍니다.

반대로, 안정적인 라이브러리(lodash, moment 등)나 언어 자체(JS, Python 기본 문법)는 context7이 없어도 Claude가 잘 압니다. 변화가 잦은 프레임워크에서 가치가 큽니다.

## 설치

```bash
claude mcp add context7 -- npx -y @upstash/context7
```

설치 후 바로 동작합니다. CLAUDE.md에 자동 적용 규칙만 추가하면 세팅이 끝납니다.

## 참고 자료

- GitHub: https://github.com/upstash/context7
