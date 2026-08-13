# 공개 사이트 통합 콘텐츠 작성기 설계

- 상태: 설계 승인본.
- 작성일: 2026-08-13.
- 대상: study-blog 공개 사이트의 관리자 작성 흐름.

## 1. 목표

관리자가 별도 콘텐츠 관리 화면으로 이동하지 않고 공개 사이트에서 `글`, `아이디어`, `프로젝트`를 생성하고 수정한다.

사이트 상단의 단일 `작성` 진입점과 각 상세 화면의 `수정` 진입점은 같은 작성 모달을 사용한다. 저장, 발행, 경로 변경, 권한 검증은 콘텐츠 유형에 관계없이 하나의 서버 경계에서 처리한다.

## 2. 확정된 제품 결정

- 관리자 로그인 후 로그인 전 공개 페이지로 돌아간다.
- 사이트 상단의 `관리자` 링크는 로그인 후 `작성` 버튼으로 바뀐다.
- `작성` 버튼은 현재 페이지 위에 통합 작성 모달을 연다.
- 새 콘텐츠 작성 시 `글 | 아이디어 | 프로젝트` 유형을 먼저 선택한다.
- 각 콘텐츠 상세 화면은 관리자에게만 `수정` 버튼을 표시한다.
- 생성과 수정은 같은 모달과 저장 경계를 사용한다.
- 초안 저장과 발행을 세 유형 모두 지원한다.
- 가설은 `content_items` 콘텐츠가 아닌 독립 도메인이므로 이 작성기에 포함하지 않는다.
- `/admin/import`는 유지보수 URL로 남기고 일반 작성 UI에서는 노출하지 않는다.
- 기존 `/admin/posts/*` 작성 URL은 통합 작성기로 redirect한다.
- 기존 `/admin` 콘텐츠 관리 화면은 공개 홈으로 redirect한다.

이 문서는 `docs/superpowers/specs/2026-08-13-hypothesis-tracking-design.md`의 가설 도메인 설계를 변경하지 않는다. 다만 해당 문서 5.1의 `글 관리 | 가설 관리` 통합 관리자 작업 영역 중 글 관리 부분은 이 문서의 인라인 작성 흐름으로 대체한다. 향후 가설 관리자 화면은 `/admin/hypotheses/*`를 직접 사용하며, 콘텐츠 작성 진입점과 결합하지 않는다.

## 3. 범위

### 포함한다

- `post | idea | project` 유형 선택.
- 세 유형의 생성, 초안 저장, 수정, 발행.
- 발행 후 다음 수정용 초안 자동 생성.
- 관리자 전용 작성·수정 진입점.
- 로그인 전 공개 페이지 복귀.
- 유형별 canonical path 생성과 308 redirect 보존.
- 프로젝트 전용 메타데이터 저장.
- 아이디어의 선택적 상위 아이디어 연결.
- 기존 글 작성 URL의 호환 redirect.
- 기존 글 저장 RPC를 공통 저장 RPC로 교체.
- DB, Server Action, UI, E2E 검증.

### 포함하지 않는다

- 가설 생성이나 수정.
- 콘텐츠 삭제 UI 재설계.
- 카테고리·태그 자체를 작성 모달에서 생성하는 기능.
- 예약 발행, 자동 저장, 협업 편집, 변경 이력 비교.
- Markdown 미리보기나 새로운 에디터 패키지 도입.
- `/admin/import` 제거 또는 import RPC 변경.
- 공개되지 않은 초안의 별도 목록 화면.

## 4. 사용자 흐름

### 4.1 새 콘텐츠 작성

```text
공개 사이트에서 작성 선택
→ 글 | 아이디어 | 프로젝트 선택
→ 유형별 폼 입력
→ 초안 저장 또는 발행
→ 초안 저장이면 같은 작성 모달 유지
→ 발행이면 canonical 공개 URL로 이동
```

유형을 선택하기 전에는 공통 입력 폼을 렌더링하지 않는다. 작성 중 유형을 바꾸면 입력 손실이 발생할 수 있으므로 값이 없는 경우에만 즉시 전환하고, 입력이 있으면 확인 후 초기화한다.

### 4.2 기존 콘텐츠 수정

```text
공개 상세 화면에서 수정 선택
→ 현재 draft 로드
→ 유형은 고정
→ 수정 후 초안 저장 또는 발행
→ 초안 저장이면 같은 작성 모달 유지
→ 발행이면 갱신된 canonical 공개 URL로 이동
```

수정할 항목에 draft가 없으면 서버가 오류를 반환한다. 클라이언트가 published version을 복제해 draft를 만들지 않는다.

### 4.3 로그인 복귀

비로그인 사용자가 상단 `관리자`를 선택하면 현재 pathname과 query를 내부 return path로 전달한다. 로그인 성공 후 검증된 내부 경로로만 복귀한다. 외부 URL과 protocol-relative URL은 기존 return-path 정책으로 차단한다.

## 5. 정보 구조와 URL

### 5.1 작성 URL

```text
/write
/write/[id]
```

공개 사이트 내부 탐색에서는 Next.js intercepted route가 위 URL을 모달로 표시한다. 직접 접근과 새로고침에서는 동일 컴포넌트를 독립 페이지 fallback으로 표시한다.

새 작성 URL은 query parameter `kind=post|idea|project`를 선택적으로 받는다. 값이 없으면 유형 선택 화면을 표시한다. 지원하지 않는 값은 유형 미선택 상태로 처리하고 저장 경계에서는 거부한다.

수정 URL의 유형은 DB의 `content_items.kind`로 결정한다. query parameter로 기존 항목의 유형을 바꿀 수 없다.

### 5.2 기존 관리자 URL

```text
/admin/posts/new  → /write
/admin/posts/[id] → /write/[id]
/admin            → /
```

redirect는 영구 redirect가 아닌 애플리케이션 호환 redirect로 시작한다. 브라우저와 외부 링크에서 기존 작성 경로가 더 이상 사용되지 않는 것이 확인된 뒤 영구화 여부를 별도로 결정한다.

`/admin/import`와 `/admin/hypotheses/*`는 redirect 대상이 아니다.

### 5.3 Canonical 콘텐츠 URL

- 글: `/posts/{categorySlug}/{slug}`.
- 최상위 아이디어: `/ideas/{categorySlug}/{slug}`.
- 하위 아이디어: `{parentIdea.path}/{slug}`.
- 프로젝트: `/projects/{slug}`.

경로는 클라이언트 입력을 신뢰하지 않고 RPC에서 category와 parent item을 조회해 계산한다.

## 6. 작성 필드

### 6.1 공통 필드

- `title`. 필수, trim 후 1~200자.
- `slug`. 필수, 영문 소문자·숫자·하이픈, 최대 120자.
- `description`. 선택, 최대 500자.
- `bodyMarkdown`. 초안에서는 비어 있을 수 있고 발행 시 필수, 최대 500,000자.

### 6.2 글

- `categoryId`. 필수.

글의 저장 계약은 기존 `save_post_draft`의 검증과 동작을 그대로 보존한다.

### 6.3 아이디어

- `categoryId`. 최상위 아이디어에서는 필수.
- `parentItemId`. 선택.

`parentItemId`가 있으면 대상은 반드시 `kind = 'idea'`여야 한다. 하위 아이디어의 category는 부모와 같아야 하며, 폼에서는 부모 선택 후 category를 부모 category로 고정한다. 자기 자신, 자신의 하위 항목, 존재하지 않는 항목은 부모로 선택할 수 없다.

### 6.4 프로젝트

- `categoryId`. 선택.
- `summary`. 필수, 공개 프로젝트 목록 요약.
- `status`. `active | paused | archived`, 기본값 `active`.
- `sortOrder`. 0 이상의 정수, 기본값 0.
- `period`. 선택.
- `role`. 선택.
- `outcome`. 선택.
- `demoUrl`. 선택, `https:` URL만 허용.
- `repositoryUrl`. 선택, `https:` URL만 허용.

프로젝트 전용 값은 `content_versions`와 `project_version_details`에 같은 트랜잭션으로 저장한다.

## 7. 저장 경계

### 7.1 공통 RPC

새 migration은 `public.save_content_draft(...)` RPC를 추가한다. 입력은 명시적인 SQL 파라미터를 사용하며 임의 JSON payload를 받지 않는다.

RPC는 다음 순서로 실행한다.

1. `auth.uid()`와 JWT `app_metadata.role = 'admin'`을 검증한다.
2. `kind`, 공통 필드, 유형별 필드를 검증한다.
3. category와 parent item을 잠그고 유형·계층 규칙을 검증한다.
4. 서버에서 canonical path를 계산한다.
5. 새 항목이면 `content_items`와 revision 1 draft를 만든다.
6. 기존 항목이면 동일 kind의 item과 draft를 `for update`로 잠근다.
7. 공통 version 값과 프로젝트 상세 값을 저장한다.
8. path가 바뀌면 이전 path에 308 redirect를 upsert한다.
9. 발행 요청이면 `publish_content_version`을 호출하고 새 draft를 반환한다.
10. item, draft version, published version, canonical path를 반환한다.

모든 단계는 한 DB 트랜잭션에서 실행한다. 부분 저장 fallback은 제공하지 않는다.

### 7.2 RPC 결과

```text
item_id uuid
kind text
draft_version_id uuid
published_version_id uuid | null
canonical_path text
```

Server Action은 반환된 `kind`와 `canonical_path`를 사용해 revalidation과 이동 대상을 결정한다.

### 7.3 기존 RPC 전환

1. 공통 RPC와 pgTAP을 먼저 추가한다.
2. 기존 글 작성 action을 공통 RPC로 전환하고 회귀 검증한다.
3. 아이디어와 프로젝트 UI를 연결한다.
4. 모든 호출자가 전환된 migration에서 `save_post_draft` 실행 권한과 함수를 제거한다.

기존 함수를 먼저 제거하지 않는다.

## 8. 권한과 보안

- RPC는 `security invoker`와 빈 `search_path`를 유지한다.
- `public`과 `anon`의 실행 권한을 철회하고 `authenticated`에만 부여한다.
- RPC 내부에서 관리자 JWT를 다시 확인한다.
- Server Action도 `requireAdminSession()`으로 관리자 세션을 확인한다.
- item id, category id, parent id는 UUID 형식과 DB 존재 여부를 모두 검증한다.
- 기존 항목 수정 시 DB kind와 요청 kind가 다르면 거부한다.
- URL은 `https:`만 허용하고 빈 문자열은 `null`로 정규화한다.
- canonical path와 redirect target은 서버에서만 계산한다.
- return path는 기존 내부 경로 검증을 재사용한다.

## 9. 애플리케이션 구조

현재 `PostWriter`와 post 전용 admin 모듈에 세 유형의 책임을 누적하지 않는다.

### 9.1 조립 계층

- `ContentWriter`. 세션, draft 조회, category·parent 선택 데이터 로드, 결과 메시지 조립.
- `ContentEditorForm`. 유형 선택과 공통 제출 상태 관리.
- `WriterOverlay`. 기존 모달·독립 페이지 표현 유지.

### 9.2 유형별 필드

- `PostFields`.
- `IdeaFields`.
- `ProjectFields`.

유형별 컴포넌트는 해당 필드 렌더링만 담당한다. DB 호출, navigation, 권한 검증을 포함하지 않는다.

### 9.3 도메인 모듈

- `content-editor-types`. discriminated union 기반 입력·상태 타입.
- `content-editor-validation`. FormData 파싱과 유형별 검증.
- `content-editor-queries`. draft와 선택 옵션 조회.
- `content-editor-actions`. 관리자 확인, RPC 호출, revalidation, redirect.

기존 `admin-actions.ts`, `admin-types.ts`, `admin-validation.ts`, `admin-queries.ts`의 post 작성 책임은 새 모듈로 이동한다. import와 asset 책임은 기존 모듈에 유지한다.

## 10. 오류 처리

- 필드 오류는 해당 입력 아래에 표시하고 모달을 유지한다.
- 전역 저장 오류는 폼 상단 `role="alert"`에 표시한다.
- 중복 path, 잘못된 parent, kind 불일치는 구분 가능한 메시지로 반환한다.
- Supabase mutation은 비멱등 호출이므로 애플리케이션 계층에서 자동 retry하지 않는다.
- DB 예외의 사용자 메시지와 구조화 로그를 분리한다.
- 로그에는 operation, kind, itemId, PostgREST code, details, hint를 필드로 기록한다.
- 저장 실패 시 입력값을 action state에 보존한다.
- draft 조회 실패나 존재하지 않는 id는 `notFound()`로 처리하되 비관리자에게 항목 존재 여부를 노출하지 않는다.

## 11. 공개 화면 연결

- `AdminWriteAction`은 로그인 전 `관리자`, 로그인 후 `작성`을 표시한다.
- 작성 링크는 현재 경로를 배경으로 유지하면서 `/write` intercepted route를 연다.
- 글·아이디어·프로젝트 상세의 관리자 전용 action은 `/write/[id]`를 연다.
- admin status 조회 실패 시 기존처럼 비관리자 표시를 유지하고 오류를 기록한다.
- 작성 모달을 닫으면 작성 전 공개 페이지와 scroll context로 돌아간다.
- 발행 성공 후 canonical path로 이동하고 공개 쿼리를 revalidate한다.

## 12. 테스트 전략

### 12.1 pgTAP

- 비로그인·일반 authenticated 사용자의 RPC 실행 거부.
- 세 유형의 새 draft 생성.
- 세 유형의 기존 draft 수정.
- 세 유형의 발행과 다음 draft 생성.
- 요청 kind와 기존 item kind 불일치 거부.
- 필수 필드, 길이, slug, URL, project status, sort order 검증.
- 글·아이디어 category 규칙.
- 아이디어 parent kind, 자기 참조, 순환 참조 거부.
- 네 종류의 canonical path 계산.
- 경로 변경 시 308 redirect 생성.
- redirect 충돌 시 전체 트랜잭션 롤백.
- 프로젝트 version detail의 draft·published 복제.

### 12.2 애플리케이션 통합 테스트

- FormData가 세 유형의 discriminated union으로 파싱된다.
- 유형별 오류가 입력값과 함께 action state에 남는다.
- 발행 결과가 유형별 공개 경로를 revalidate한다.
- 기존 관리자 작성 URL이 새 URL로 redirect한다.
- 로그인 return path가 내부 경로만 허용한다.

### 12.3 E2E와 브라우저 검증

- 비로그인 상태에서 `관리자`가 보이고 로그인 후 원래 페이지로 복귀한다.
- 관리자 상태에서 `작성`이 보이고 현재 페이지 위에 모달이 열린다.
- 세 유형 선택 시 필요한 필드만 표시된다.
- 초안 저장 후 모달과 입력 상태가 유지된다.
- 각 상세 화면의 `수정`이 기존 draft를 연다.
- 일반 방문자에게 `작성`과 `수정`이 노출되지 않는다.
- 직접 `/write` 접근은 독립 페이지 fallback을 표시한다.
- `/admin/posts/*` 호환 redirect가 동작한다.

로컬 검증에서는 테스트 전용 관리자와 격리된 fixture를 사용한다. 프로덕션 배포 후에는 실제 콘텐츠를 생성하지 않고 로그인 복귀, 버튼 가시성, 유형 선택, 모달 렌더링까지만 확인한다.

## 13. Migration과 롤백

DB 변경은 migration 파일로만 수행한다.

1. 로컬 DB에 migration dry-run.
2. pgTAP 전체 통과.
3. 로컬 reset 후 기존 CMS migration과 함께 재적용.
4. 별도 rollback SQL로 공통 RPC와 관련 grant 제거를 검증.
5. 애플리케이션 전환 전까지 기존 `save_post_draft` 유지.
6. 배포 순서는 DB 확장 → 호환 애플리케이션 → 기존 RPC 제거다.

롤백은 애플리케이션을 기존 post 전용 저장기로 되돌린 뒤 공통 RPC를 제거하는 순서다. 새 RPC로 생성한 `idea`와 `project` 데이터는 삭제하지 않는다. 롤백 후 편집 UI만 비활성화하고 데이터를 보존한다.

## 14. 완료 기준

- 관리자는 공개 사이트 안에서 세 유형을 생성·수정할 수 있다.
- 일반 방문자에게 관리자 action이 노출되지 않는다.
- 세 유형의 초안·발행 생명주기가 같은 보안 경계를 통과한다.
- canonical path와 redirect가 DB 트랜잭션으로 보장된다.
- 기존 글 작성·발행 동작이 회귀하지 않는다.
- `/admin/import`와 가설 도메인은 영향을 받지 않는다.
- pgTAP, 애플리케이션 테스트, E2E, 타입체크, 프로덕션 빌드가 통과한다.
- migration dry-run과 rollback 검증 결과가 기록된다.
