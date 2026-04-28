---
title: "쉽게 쓸 수 있는 BaaS 서비스 비교: Supabase, Firebase, Appwrite"
description: "백엔드를 직접 구축하지 않고 빠르게 서비스를 만들 때 유용한 BaaS 도구들을 비교합니다. Supabase, Firebase, Appwrite, PocketBase의 특징과 선택 기준을 정리합니다."
pubDate: 2026-04-28
category: programming
tags: ["Tools", "Backend"]
---

사이드 프로젝트나 MVP를 빠르게 개발할 때 백엔드 서버를 처음부터 구축하면 시간이 오래 걸립니다. BaaS(Backend-as-a-Service)는 인증, 데이터베이스, 파일 스토리지, 실시간 기능 같은 백엔드 기능을 API로 제공해 개발 속도를 크게 높여줍니다. 2026년 기준 가장 많이 쓰이는 서비스를 정리합니다.

## 서비스 한눈에 비교

| 서비스 | DB 종류 | 오픈소스 | 셀프 호스팅 | 무료 플랜 |
|---|---|---|---|---|
| Firebase | NoSQL (Firestore) | X | X | O (Spark) |
| Supabase | PostgreSQL | O | O | O |
| Appwrite | SQL (MariaDB 기반) | O | O | O (Cloud) |
| PocketBase | SQLite | O | O | - (셀프 호스팅만) |

## Firebase

Google이 운영하는 가장 오래된 BaaS입니다. Firestore(NoSQL)와 Realtime Database 두 가지 DB 옵션을 제공하며, Google Analytics, FCM 등 Google 생태계와 자연스럽게 연동됩니다.

**장점**
- 레퍼런스와 커뮤니티가 가장 풍부
- 실시간 데이터 동기화 기본 내장
- Google 생태계 연동 (Analytics, AdMob, FCM 등)
- iOS / Android / Web SDK 완비

**단점**
- 복잡한 쿼리에 취약 (JOIN, 트랜잭션 제한)
- 트래픽 증가 시 비용이 예측하기 어렵게 증가
- 벤더 락인 강함 (오픈소스 X, 셀프 호스팅 불가)

```js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

await setDoc(doc(db, 'users', 'uid123'), { name: 'Alice' });
```

## Supabase

"오픈소스 Firebase 대안"을 표방하며 PostgreSQL을 기반으로 합니다. SQL을 그대로 쓸 수 있고 Row Level Security(RLS)로 세밀한 접근 제어가 가능합니다. 현재 가장 빠르게 성장하는 BaaS입니다.

**장점**
- PostgreSQL 풀 지원: 복잡한 쿼리, JOIN, 트랜잭션 가능
- 오픈소스, 셀프 호스팅 가능
- Postgres 확장 (pgvector, PostGIS 등) 활용 가능
- Edge Functions (Deno 기반) 내장
- 실시간 구독 지원

**단점**
- Firebase보다 초기 설정이 복잡
- 무료 플랜은 7일 비활성 시 프로젝트 일시 정지

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true);
```

## Appwrite

오픈소스 백엔드 플랫폼으로 Docker 기반 셀프 호스팅이 주 형태이며 Appwrite Cloud도 제공합니다. 인증, DB, 스토리지, Functions, 메시지까지 올인원으로 제공합니다.

**장점**
- Docker 한 줄로 셀프 호스팅 가능
- 멀티 플랫폼 SDK (Web, Flutter, Swift, Kotlin 등)
- Admin 콘솔 UI가 잘 만들어져 있음
- 셀프 호스팅 시 비용 제어 용이

**단점**
- Supabase만큼 SQL 기능을 직접 활용하기 어려움
- Cloud 무료 한도가 Firebase / Supabase보다 제한적

```bash
docker run -it --rm \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
  appwrite/install
```

## PocketBase

Go로 만들어진 단일 바이너리 BaaS입니다. 별도 서버 없이 실행 파일 하나만 있으면 되며, SQLite를 사용합니다. 소규모 프로젝트나 프로토타입에 적합합니다.

**장점**
- 단일 실행 파일로 즉시 실행 가능
- 관리 UI 기본 내장
- 매우 가벼움 (저사양 VPS 1대로 운영 가능)
- JavaScript / TypeScript로 백엔드 로직 확장 가능

**단점**
- 클라우드 관리형 서비스 없음 (직접 서버 관리 필요)
- SQLite 특성상 수평 확장에 불리
- 상대적으로 작은 커뮤니티

## 선택 기준

| 상황 | 추천 |
|---|---|
| Google 생태계 필수, 모바일 앱 | Firebase |
| SQL이 필요한 실서비스, 빠른 성장 예상 | Supabase |
| 셀프 호스팅 올인원 솔루션 | Appwrite |
| 작은 사이드 프로젝트, 프로토타입 | PocketBase |

## 주의사항

- **비용 예측**: Firebase는 읽기/쓰기 단위로 과금하므로 트래픽이 늘면 비용이 급증할 수 있습니다. Supabase는 행 수와 스토리지 기준이라 예측이 쉽습니다.
- **벤더 락인**: Firebase는 오픈소스가 아니라 마이그레이션이 어렵습니다. Supabase와 Appwrite는 셀프 호스팅 전환이 가능합니다.
- **RLS 설정**: Supabase는 Row Level Security를 반드시 설정해야 합니다. 누락하면 anon key로 모든 데이터에 접근할 수 있습니다.
