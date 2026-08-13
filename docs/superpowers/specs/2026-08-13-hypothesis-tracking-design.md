# 가설 검증 기록 기능 설계

- 상태: 설계 승인본.
- 작성일: 2026-08-13.
- 대상: study-blog 관리자와 공개 사이트.

## 1. 목표

프로젝트나 독립적인 문제에 대해 무엇을 믿었고, 무엇을 실행했으며, 어떤 증거로 판단했고, 다음 가설로 어떻게 이어졌는지를 구조화해 기록한다.

가설 기록은 기존 글의 초안·발행 생명주기와 분리한다. 대신 기존 CMS의 프로젝트, 카테고리, 태그 식별자를 참조해 동일한 분류 체계를 사용한다.

가설마다 `private | public`을 선택한다. 기본값은 `private`이며, 공개 가설은 가설 본문뿐 아니라 검토를 마친 활동과 증거까지 공개한다.

## 2. 확정된 제품 결정

- 가설은 `content_items.kind`에 추가하지 않는 독립 도메인이다.
- 프로젝트는 `content_items.id` 중 `kind = 'project'`인 행을 참조한다.
- 카테고리는 `categories.id`, 태그는 `tags.id`를 재사용한다.
- 프로젝트가 없는 독립 가설도 허용하며 공개할 수 있다.
- 가설 공개 여부는 진행 상태와 판정에서 독립된 `private | public` 값이다.
- 가설을 비공개로 바꾸면 공개 페이지, 목록, 프로젝트 화면에서 즉시 숨긴다.
- 공개 가설에는 검토를 마친 활동과 증거를 모두 노출한다.
- 공개된 가설에 새로 추가하거나 수정한 활동·증거는 검토 대기 상태가 된다.
- 관리자가 `변경 내용 공개`를 실행하면 해당 가설의 검토 대기 활동·증거를 한 번에 공개한다.
- 다시 비공개로 바꿔도 가설과 활동·증거의 최초 공개 시각은 보존한다. 재공개 시 기존 목록 위치와 과거 공개 항목은 복원되고 검토 대기 항목은 계속 숨긴다.
- 모든 공개 가설은 `/hypotheses/[slug]`를 canonical URL로 사용한다.
- 공개 목록 `/hypotheses`를 제공한다.
- 프로젝트 연결 가설은 `/projects/[slug]`에도 표시한다.
- 공개 사이트의 전역 상단 메뉴, 홈 피드, RSS, 기존 검색, 기존 프로젝트의 글 개수에는 초기 버전에서 가설을 합치지 않는다.

## 3. 범위

### 포함한다

- 가설 생성과 수정.
- 프로젝트, 카테고리, 태그 연결.
- 성공 기준, 측정 방법, 초기 확신도, 검토 예정일 기록.
- 활동과 증거 누적.
- 지지, 기각, 판단 보류, 피봇 판정 이력.
- 후속, 피봇, 재시도, 구체화 가설 관계.
- 관리자 대시보드 요약과 `글 관리 | 가설 관리` 탭.
- 가설 단위 공개·비공개 전환.
- 공개 전 검토와 공개 후 변경 내용 재검토.
- 공개 가설 목록, 상세, 프로젝트 내 가설 섹션.
- DB 제약, RLS, 공개 projection, pgTAP, E2E 검증.

### 포함하지 않는다

- 가설을 기존 글처럼 Markdown 콘텐츠로 발행하는 기능.
- 활동·증거마다 영구적인 개별 공개 여부를 선택하는 기능.
- 가설별 협업자나 다중 작성자 권한.
- 댓글, 좋아요, 알림, 구독.
- 증거 파일 업로드. 초기 버전은 텍스트, URL, 기존 콘텐츠 연결을 지원한다.
- 공개 가설을 홈, RSS, 전역 검색, 기존 카테고리 통계에 합치는 기능.
- 이미 공개된 가설 URL의 redirect 관리. 공개 후 slug는 변경할 수 없다.
- 가설 삭제. 잘못된 기록은 `abandoned`와 `private`으로 보존한다.

## 4. 사용자 흐름

### 4.1 관리자 흐름

```text
가설 생성
→ 프로젝트·카테고리·태그와 성공 기준 설정
→ planned 또는 running으로 시작
→ 활동과 증거 반복 기록
→ supported, rejected, inconclusive, pivoted 판정
→ 후속·피봇 가설 생성
```

관리자는 가설을 언제든 공개 검토로 보낼 수 있다. 공개 검토 화면은 공개될 가설 정보, 현재 판정, 활동, 증거를 한 화면에 보여준다. 공개 조건을 충족하면 가설과 현재 활동·증거를 원자적으로 공개한다.

공개된 가설에 새 활동이나 증거를 저장하면 그 항목은 즉시 공개되지 않는다. 상세 화면에 검토 대기 개수를 표시하고, `변경 내용 공개`가 모든 대기 항목을 한 번에 공개한다.

이미 공개된 활동이나 증거를 수정하면 해당 항목의 `published_at`을 비워 검토 대기로 되돌리고 공개 화면에서 임시로 숨긴다. 공개 가설의 본문, 성공 기준, 진행 상태, 공개 요약, 현재 판정 수정은 저장 즉시 공개 화면에 반영되므로 관리자 UI에서 이를 명시적으로 경고한다.

### 4.2 공개 독자 흐름

- `/hypotheses`에서 공개 가설을 최초 공개 시각 역순으로 탐색한다. 비공개 후 재공개해도 최초 공개 시각과 목록 위치는 유지한다.
- 각 항목은 진행 상태, 카테고리, 프로젝트, 현재 판정, 공개 요약을 표시한다.
- `/hypotheses/[slug]`에서 가설, 성공 기준, 측정 방법, 활동, 증거, 현재 판정, 공개된 후속 관계를 읽는다.
- 프로젝트 연결 가설은 `/projects/[slug]`의 `HYPOTHESES` 섹션에서도 찾을 수 있다.
- 공개 가설이 없는 프로젝트에는 해당 섹션을 렌더링하지 않는다.
- 비공개 가설 slug 요청은 존재 여부를 드러내지 않고 `notFound()`로 처리한다.

## 5. 정보 구조와 화면

### 5.1 관리자 작업 영역

현재 `app/admin/layout.tsx`는 로그인 화면도 감싼다. 공통 관리자 탭을 로그인에 노출하지 않도록 URL을 바꾸지 않는 route group을 도입한다.

```text
app/admin/layout.tsx
app/admin/login/*
app/admin/(workspace)/layout.tsx
app/admin/(workspace)/page.tsx
app/admin/(workspace)/posts/*
app/admin/(workspace)/import/*
app/admin/(workspace)/hypotheses/*
```

`(workspace)/layout.tsx`는 `글 관리 | 가설 관리` 탭과 관리자 세션 경계를 담당한다. 기존 `/admin`, `/admin/posts/*`, `/admin/import` URL은 유지한다.

관리자 메인 `/admin`은 기존 글 목록을 유지하면서 다음 가설 요약을 상단에 추가한다.

- 진행 중 가설 수.
- 검토 예정일이 지난 가설 수.
- 공개 검토 대기 활동·증거 수.
- 최근 판정한 가설.

전체 가설 목록은 `/admin/hypotheses`에서만 제공한다. 목록 필터는 상태, 프로젝트, 카테고리, 공개 여부다.

### 5.2 가설 관리자 화면

```text
/admin/hypotheses
/admin/hypotheses/new
/admin/hypotheses/[id]
/admin/hypotheses/[id]/publish
```

- 목록은 가설, 프로젝트, 상태, 공개 여부, 검토 예정일, 대기 변경 수를 표시한다.
- 생성 화면은 slug, 가설, 근거, 성공 기준, 측정 방법, 프로젝트, 카테고리, 태그, 초기 확신도, 검토일을 받는다.
- 상세 화면은 가설 요약, 활동·증거 타임라인, 현재 판정, 후속 가설, 공개 상태를 조립한다.
- 공개 검토 화면은 public RPC와 동일한 projection serializer를 쓰는 관리자 전용 preview RPC로 익명 독자에게 보일 내용을 미리 보여주고 공개 mutation을 실행한다.
- 후속 가설과 피봇 가설은 `/admin/hypotheses/new?parent={id}&relation={relation}`으로 시작하며 프로젝트, 카테고리, 태그를 기본값으로 이어받는다.

### 5.3 공개 화면

```text
/hypotheses
/hypotheses/[slug]
/projects/[slug]의 HYPOTHESES 섹션
```

공개 목록에는 독립 가설과 프로젝트 연결 가설을 모두 표시한다. 프로젝트 화면에서는 해당 프로젝트에 연결된 공개 가설만 표시한다. 프로젝트 카드의 기존 숫자는 계속 공개 글 수만 의미한다.

가설이 비공개 프로젝트에 연결되어 있어도 가설 자체는 공개할 수 있다. 이 경우 공개 목록과 상세에서는 프로젝트 제목, slug, 링크를 완전히 생략하며 독립 가설처럼 표시한다. 연결된 프로젝트가 공개된 뒤에는 같은 projection 규칙에 따라 프로젝트 정보와 프로젝트 상세의 가설 섹션이 나타난다.

## 6. 데이터 모델

### 6.1 `hypotheses`

| 컬럼 | 타입 | 규칙 |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `slug` | `text` | 전역 unique, 소문자 영숫자·하이픈 |
| `project_item_id` | `uuid` | nullable, `content_items.id`, `ON DELETE RESTRICT` |
| `category_id` | `uuid` | not null, `categories.id`, `ON DELETE RESTRICT` |
| `parent_hypothesis_id` | `uuid` | nullable self FK, `ON DELETE RESTRICT` |
| `parent_relation` | `text` | `follow_up`, `pivot`, `retry`, `refinement` |
| `statement` | `text` | not blank |
| `rationale` | `text` | 기본 빈 문자열 |
| `success_criteria` | `text` | not blank |
| `measurement_plan` | `text` | 기본 빈 문자열 |
| `status` | `text` | `draft`, `planned`, `running`, `concluded`, `abandoned` |
| `visibility` | `text` | `private`, `public`, 기본 `private` |
| `public_summary` | `text` | 공개 시 not blank |
| `confidence_before` | `smallint` | nullable, 0..100 |
| `started_at` | `timestamptz` | nullable |
| `review_due_at` | `timestamptz` | nullable |
| `concluded_at` | `timestamptz` | 종료 상태와 일치 |
| `published_at` | `timestamptz` | 최초 공개 시각, 비공개 전환 시 보존 |
| `created_by` | `uuid` | `auth.users.id`, `ON DELETE SET NULL` |
| `created_at` | `timestamptz` | 기본 `now()` |
| `updated_at` | `timestamptz` | `private.set_updated_at()` |

추가 제약은 다음과 같다.

- `parent_hypothesis_id`와 `parent_relation`은 둘 다 NULL이거나 둘 다 존재한다.
- 직접 자기참조를 금지한다.
- 부모 관계는 생성 후 변경하지 않는다. 이 규칙으로 계보 변경과 순환 생성 범위를 제한한다.
- `visibility = 'public'`이면 `public_summary`와 `published_at`이 존재해야 한다.
- `concluded`, `abandoned`이면 `concluded_at`이 존재하고 나머지 상태에서는 NULL이다.
- 한 번이라도 공개한 가설은 slug를 변경할 수 없다.
- `project_item_id`가 존재하면 대상 `content_items.kind`가 `project`인지 private trigger로 검증한다.
- 가설이 참조하는 동안 해당 프로젝트의 kind 변경을 반대 방향 trigger로 금지한다.
- 프로젝트 연결은 관리자 원본 관계다. 가설 공개 가능 여부와 분리하며, 공개 projection은 해당 프로젝트의 published version이 존재할 때만 프로젝트 메타데이터를 반환한다.

상태 전이는 다음만 허용한다.

```text
draft → planned | running | abandoned
planned → running | abandoned
running → concluded | abandoned
concluded, abandoned → terminal
```

### 6.2 `hypothesis_tags`

| 컬럼 | 타입 | 규칙 |
|---|---|---|
| `hypothesis_id` | `uuid` | `hypotheses.id`, cascade |
| `tag_id` | `uuid` | `tags.id`, restrict |
| `sort_order` | `integer` | 0 이상 |
| `created_at` | `timestamptz` | 기본 `now()` |

PK는 `(hypothesis_id, tag_id)`다. 기존 `content_version_tags`를 재사용하지 않고 기존 `tags` 사전만 공유한다.

### 6.3 `hypothesis_activities`

| 컬럼 | 타입 | 규칙 |
|---|---|---|
| `id` | `uuid` | PK |
| `hypothesis_id` | `uuid` | not null, cascade |
| `related_content_item_id` | `uuid` | nullable, `content_items.id`, `ON DELETE RESTRICT` |
| `activity_type` | `text` | `experiment`, `interview`, `build`, `launch`, `analysis`, `other` |
| `title` | `text` | not blank |
| `description` | `text` | 기본 빈 문자열 |
| `started_at` | `timestamptz` | not null |
| `completed_at` | `timestamptz` | nullable, 시작 이후 |
| `published_at` | `timestamptz` | NULL이면 검토 대기 |
| `created_by` | `uuid` | `auth.users.id` |
| `created_at` | `timestamptz` | 기본 `now()` |
| `updated_at` | `timestamptz` | 자동 갱신 |

연결 대상은 `post | idea`로 제한하고 private trigger로 kind를 검증한다. 참조 중인 콘텐츠의 kind 변경도 반대 방향 trigger로 금지한다. 공개 projection은 대상의 published version이 존재할 때만 제목, 공개 URL 같은 연결 메타데이터를 반환하며, 그렇지 않으면 관계 자체를 응답에서 생략한다.

공개된 활동을 수정하면 활동의 `published_at`만 NULL로 되돌린다. 자식 증거의 기존 `published_at`은 보존하지만, 공개 projection은 부모 활동과 증거의 `published_at`이 모두 존재할 때만 증거를 반환하므로 활동과 전체 증거가 함께 숨겨진다. `변경 내용 공개`로 활동을 다시 공개하면 수정하지 않은 기존 증거는 다시 나타나고, 별도로 수정되어 검토 대기 중인 증거는 계속 숨긴다.

### 6.4 `hypothesis_evidence`

| 컬럼 | 타입 | 규칙 |
|---|---|---|
| `id` | `uuid` | PK |
| `activity_id` | `uuid` | not null, cascade |
| `evidence_type` | `text` | `metric`, `observation`, `feedback`, `artifact`, `source`, `other` |
| `summary` | `text` | not blank |
| `details_markdown` | `text` | 기본 빈 문자열 |
| `source_url` | `text` | nullable, HTTP(S) 검증은 앱과 DB RPC에서 수행 |
| `observed_at` | `timestamptz` | not null |
| `published_at` | `timestamptz` | NULL이면 검토 대기 |
| `created_by` | `uuid` | `auth.users.id` |
| `created_at` | `timestamptz` | 기본 `now()` |
| `updated_at` | `timestamptz` | 자동 갱신 |

증거는 부모 활동이 공개되는 동일 transaction 안에서 또는 이미 공개된 부모 활동 아래에서만 공개할 수 있다. 공개된 증거를 수정하면 증거의 `published_at`을 NULL로 되돌린다.

### 6.5 `hypothesis_decisions`

| 컬럼 | 타입 | 규칙 |
|---|---|---|
| `id` | `uuid` | PK |
| `hypothesis_id` | `uuid` | not null, cascade |
| `verdict` | `text` | `supported`, `rejected`, `inconclusive`, `pivoted` |
| `reasoning` | `text` | not blank |
| `confidence_after` | `smallint` | nullable, 0..100 |
| `failure_type` | `text` | nullable |
| `is_current` | `boolean` | 기본 true |
| `decided_at` | `timestamptz` | not null |
| `created_by` | `uuid` | `auth.users.id` |
| `created_at` | `timestamptz` | 기본 `now()` |

`failure_type` 값은 다음으로 제한한다.

```text
hypothesis_error
experiment_design
execution_incomplete
insufficient_data
external_condition
```

판정 내용은 append-only다. 일반 테이블 권한으로 UPDATE와 DELETE를 허용하지 않으며, 판정 정정 RPC만 기존 current 행의 `is_current`를 false로 바꾸고 새 판정을 current로 추가한다. 이전 행의 판정 내용과 시각은 수정하지 않는다.

가설마다 `is_current = true`인 판정은 하나만 허용한다. `concluded` 상태에는 정확히 하나의 current 판정이 있고 그 밖의 상태에는 current 판정이 없도록 deferred constraint trigger로 검사한다. 최초 판정과 가설 종료, 판정 정정은 각각 하나의 원자적 RPC로 처리한다. 공개 projection은 current 판정만 반환한다.

### 6.6 인덱스

- 모든 FK 컬럼 인덱스.
- `hypotheses(project_item_id, visibility, published_at desc)`.
- `hypotheses(status, review_due_at)`.
- `hypotheses(category_id, visibility, published_at desc)`.
- `hypotheses(parent_hypothesis_id)`.
- `hypothesis_tags(tag_id, hypothesis_id)`.
- `hypothesis_activities(hypothesis_id, started_at desc)`.
- `hypothesis_activities(hypothesis_id, published_at)`.
- `hypothesis_evidence(activity_id, observed_at desc)`.
- `hypothesis_evidence(activity_id, published_at)`.
- `hypothesis_decisions(hypothesis_id, decided_at desc)`.
- `hypothesis_decisions(hypothesis_id) WHERE is_current` unique partial index.

## 7. 공개와 보안 모델

### 7.1 관리자 원본 데이터

모든 신규 원본 테이블은 RLS를 활성화한다. `authenticated`에는 SELECT만 명시적으로 부여하고, 기존 프로젝트와 같은 `app_metadata.role = 'admin'` 조건의 SELECT 정책만 만든다. 원본 테이블의 INSERT, UPDATE, DELETE 권한과 정책은 만들지 않는다. 따라서 관리자도 공개 상태, child `published_at`, 상태 전이, 태그 관계를 테이블 API로 우회해 바꿀 수 없다.

모든 변경은 관리자 JWT를 함수 내부에서 재검사하는 전용 `SECURITY DEFINER` mutation RPC만 수행한다. 가설 삭제 RPC는 만들지 않으며, raw DELETE도 허용하지 않아 가설과 cascade 대상 이력이 보존된다. mutation 함수도 `search_path = ''`, schema-qualified 객체 참조, 기본 `PUBLIC` 실행 권한 회수 원칙을 따른다.

가설 원본 테이블은 `anon`에 직접 SELECT 권한을 주지 않는다. RLS는 행을 제한할 뿐 컬럼을 감추지 못하므로, 공개 페이지가 원본 테이블을 직접 읽게 만들지 않는다.

### 7.2 공개 projection

공개 사이트는 공개 전용 RPC만 호출한다.

```text
list_public_hypotheses
get_public_hypothesis_by_slug
list_public_hypotheses_by_project
```

RPC는 다음 데이터만 반환한다.

- 가설 ID, slug, statement, success criteria, measurement plan.
- status, public summary, published/updated timestamps.
- published version이 존재하는 프로젝트·연결 콘텐츠 정보와 현재 공개 사이트가 이미 노출하는 카테고리·태그 표시 필드.
- `activity.published_at IS NOT NULL`인 활동과, 부모 활동 및 자신의 `published_at`이 모두 존재하는 증거.
- 현재 판정.
- 양쪽 모두 공개된 후속·피봇 관계.

공개 RPC는 공개 projection을 위한 의도적인 `SECURITY DEFINER` 경계다. `search_path = ''`를 고정하고 모든 객체를 schema-qualified로 참조한다. 기본 `PUBLIC` 실행 권한을 취소한 뒤 `anon`, `authenticated`에 필요한 함수만 부여한다. 함수 내부에서 `visibility = 'public'`, 부모·자식 `published_at`, 연결된 CMS 항목의 published version 존재 조건을 강제하고 private 컬럼을 반환 타입에 포함하지 않는다.

`private.build_hypothesis_public_projection(hypothesis_id, include_pending)`가 공개 DTO의 필드, 정렬, 연결 정보 생략 규칙을 한 곳에서 소유한다. public RPC는 `include_pending = false`로 호출한다. 관리자 전용 `preview_hypothesis_publication` RPC는 관리자 JWT를 확인한 뒤 `include_pending = true`로 같은 serializer를 호출한다. 따라서 미리보기와 실제 공개 응답의 차이는 검토 대기 child 포함 여부뿐이다.

Supabase database advisor로 함수 권한과 RLS를 검증한다.

### 7.3 관리자 mutation

다음 mutation은 전용 RPC로만 허용하며, 여러 테이블이나 공개 상태를 바꾸는 작업은 하나의 transaction으로 원자화한다.

- 가설 생성·수정과 태그 동기화.
- 활동 생성·수정. 공개 시각은 입력받지 않고 DB가 검토 대기로 설정한다.
- 증거 생성·수정. 공개 시각은 입력받지 않고 DB가 검토 대기로 설정한다.
- 판정 생성과 가설 종료.
- 최초 공개와 현재 활동·증거 승인.
- 검토 대기 활동·증거 일괄 공개.
- 비공개 전환.
- 후속 가설 생성.

가설이나 기록을 삭제하는 mutation은 초기 범위에 없다. Server Action도 `requireAdminSession()`을 호출해 DB 함수의 권한 검사와 별도로 페이지 경계에서 관리자 세션을 확인한다.

## 8. 애플리케이션 책임 경계

기존 `src/lib/content/admin-queries.ts`, `admin-actions.ts`, `public-queries.ts`, 글 편집 폼에는 가설 로직을 추가하지 않는다. 이 파일들은 이미 글, 공개 콘텐츠, migration 책임을 맡고 있어 가설 워크플로를 추가하면 monolith가 된다.

```text
src/lib/hypotheses/admin-types.ts
src/lib/hypotheses/admin-validation.ts
src/lib/hypotheses/admin-queries.ts
src/lib/hypotheses/admin-actions.ts
src/lib/hypotheses/public-types.ts
src/lib/hypotheses/public-queries.ts

src/components/hypotheses/hypothesis-form.tsx
src/components/hypotheses/activity-form.tsx
src/components/hypotheses/evidence-form.tsx
src/components/hypotheses/decision-form.tsx
src/components/hypotheses/hypothesis-timeline.tsx
src/components/hypotheses/hypothesis-publication-review.tsx
src/components/hypotheses/hypothesis-admin.css
```

- route page는 인증, 조회, 컴포넌트 조립만 담당한다.
- client form은 입력과 `useActionState`만 담당한다.
- validation은 FormData 정규화와 필드 오류만 담당한다.
- Server Action은 인증, 검증, RPC, `revalidatePath`, `redirect`만 담당한다.
- public query는 공개 RPC 응답 검증과 UI 타입 매핑만 담당한다.

## 9. 데이터 흐름

### 9.1 가설 생성

```text
폼 제출
→ Server Action에서 관리자 확인
→ FormData 검증
→ create_hypothesis RPC
→ hypotheses + hypothesis_tags 원자 저장
→ /admin/hypotheses/[id] 재검증 및 이동
```

### 9.2 활동·증거 추가

```text
상세 폼 제출
→ 관리자 확인과 검증
→ 원본 행 저장
→ published_at = NULL
→ 상세 타임라인 갱신
→ 공개 가설이면 검토 대기 개수 증가
```

### 9.3 판정과 후속 가설

```text
판정 제출
→ 기존 current 판정을 historical로 변경
→ 새 current 판정 생성
→ 가설 상태와 concluded_at 갱신
→ 필요 시 parent relation이 있는 새 가설 명시적 생성
```

피봇 판정만으로 새 가설을 자동 생성하지 않는다.

### 9.4 공개

```text
공개 검토
→ 필수 공개 정보와 child 목록 확인
→ publish_hypothesis RPC
→ visibility = public
→ 최초 published_at 기록
→ 현재 검토 대상 활동·증거 published_at 기록
→ /hypotheses, /hypotheses/[slug], 연결 프로젝트 경로 재검증
```

비공개 전환은 `visibility`만 바꾼다. child `published_at`은 감사 이력과 재공개를 위해 보존한다.

## 10. 오류 처리

- 지원하지 않는 상태, 판정, relation, failure type은 앱과 DB 양쪽에서 거부한다.
- 프로젝트가 아닌 `content_items.id` 연결은 DB trigger가 거부한다.
- 활동의 연결 콘텐츠가 `post | idea`가 아니면 DB trigger가 거부한다.
- 공개 필수 정보가 비어 있거나 활동·증거 관계가 잘못되면 공개 RPC 전체를 rollback한다.
- 비공개 프로젝트와 unpublished 연결 콘텐츠는 가설 공개를 막지 않지만 공개 projection에서 식별 정보와 링크를 반환하지 않는다.
- 비공개 또는 존재하지 않는 slug는 동일하게 404로 처리한다.
- 중복 slug는 필드 오류로 반환한다.
- 외부 URL은 HTTP(S)만 허용한다.
- DB 오류는 operation, entity ID, Postgres code, detail, hint를 구조화해 기록하고 사용자에게 내부 정보를 노출하지 않는다.
- 기존 재시도 계층이 없는 멱등 공개 조회만 현재 public query retry 정책과 동일하게 최대 3회 재시도한다. mutation은 자동 재시도하지 않는다.

## 11. 테스트 전략

### 11.1 DB 통합 테스트

`supabase/tests/hypothesis_tracking.test.sql`에 pgTAP 테스트를 추가한다.

- 프로젝트가 아닌 content item 연결 거부.
- 참조 중인 project kind 변경 거부.
- confidence 범위와 enum CHECK.
- parent와 relation 동시성, 직접 자기참조, 관계 불변성.
- 중복 태그 거부.
- 상태 전이와 concluded_at 일치.
- 가설마다 current 판정 하나만 허용.
- concluded 상태의 current 판정 정확히 하나와 판정 내용 append-only 보장.
- 판정과 종료 원자성.
- 증거가 부모 활동보다 먼저 공개되지 않음.
- 공개 활동 수정 후 기존 공개 증거까지 함께 비노출되고, 활동 재공개 후 검토 상태에 맞게 복원됨.
- 관리자는 원본 테이블을 조회할 수 있고 일반 authenticated 사용자는 조회할 수 없음.
- 관리자 mutation RPC는 허용되고 원본 테이블의 직접 INSERT, UPDATE, DELETE는 관리자에게도 거부됨.
- 가설 DELETE 경로가 없고 cascade 이력이 보존됨.
- 일반 authenticated 사용자의 private 원본 접근 거부.
- anon의 원본 테이블 접근 거부.
- 공개 RPC가 private 가설과 pending child를 반환하지 않음.
- 공개 RPC가 비공개 프로젝트와 unpublished 연결 콘텐츠의 ID, 제목, slug, 링크를 반환하지 않음.
- 각 `SECURITY DEFINER` 공개 함수의 익명 직접 호출이 선언된 공개 컬럼만 반환함.
- 관리자 preview와 실제 공개 RPC의 projection이 pending 포함 여부를 제외하고 일치함.
- 비공개 전환과 재공개 시 child 공개 시각 보존.

### 11.2 애플리케이션 E2E

```text
tests/e2e/admin-hypotheses.spec.ts
tests/e2e/public-hypotheses.spec.ts
```

관리자 테스트는 생성, 활동·증거 추가, 판정, 후속 가설, 최초 공개, 공개 후 변경 대기, 일괄 공개, 비공개 전환을 검증한다.

공개 테스트는 목록, 독립 상세, 프로젝트 상세 섹션, pending child 비노출, 활동 수정 시 자식 증거 비노출, 비공개 CMS 연결 정보 비노출, private 404, 모바일 레이아웃을 검증한다.

### 11.3 검증 명령

```bash
supabase db reset --local --no-seed
supabase test db supabase/tests/hypothesis_tracking.test.sql --local
supabase db advisors --local --type all --fail-on error
supabase db diff --local --schema public,private
supabase db push --dry-run --linked
npm run typecheck:next
npm run build
npm run test:e2e -- tests/e2e/admin-hypotheses.spec.ts tests/e2e/public-hypotheses.spec.ts
```

원격 DB 적용은 별도 승인 전까지 하지 않는다. UI는 데스크톱과 모바일에서 관리자 golden path와 공개·비공개 edge case를 브라우저로 확인한다.

### 11.4 롤백 전략

원격 적용 전에는 migration dry-run 결과, 로컬 pgTAP, 공개 RPC 권한과 반환 컬럼 검사를 승인 근거로 남긴다. 운영 DB는 직접 수정하지 않는다.

원격 적용 뒤 실제 가설 데이터가 아직 없다면 forward rollback migration으로 공개 함수의 `anon`, `authenticated` 실행 권한을 먼저 회수하고 함수, 정책, trigger, 테이블을 의존성 역순으로 제거한다. UI와 공개 route는 같은 배포에서 feature entry를 제거한다.

실제 가설 데이터가 생긴 뒤에는 파괴적 rollback을 하지 않는다. 먼저 공개 함수 권한과 공개 route를 비활성화하고 모든 가설을 private로 전환한 뒤 데이터를 내보낸다. 이후 원인을 고치는 forward migration을 만들고 dry-run과 로컬 복원 검증을 거쳐 별도 승인 후 적용한다.

## 12. 구현 단계

### 단계 1. 데이터베이스 기반

- 새 migration으로 테이블, 제약, 인덱스, trigger, RPC, RLS를 추가한다.
- pgTAP으로 무결성과 공개 projection을 검증한다.
- 원격에는 적용하지 않고 local reset과 dry-run까지만 수행한다.

성공 기준은 가설 생명주기와 공개 규칙이 앱 없이도 DB에서 원자적으로 보장되는 것이다.

### 단계 2. 가설 관리자 도메인

- 전용 types, validation, queries, actions를 만든다.
- 관리자 workspace route group과 탭을 추가한다.
- 목록, 생성, 상세, 활동, 증거, 판정, 후속 가설 흐름을 구현한다.

성공 기준은 관리자가 비공개 가설의 전체 생명주기를 완료할 수 있는 것이다.

### 단계 3. 공개 검토

- 공개 검토 화면과 최초 공개, 변경 내용 공개, 비공개 전환을 구현한다.
- 대시보드에 진행 중, 기한 초과, 공개 검토 대기 요약을 추가한다.

성공 기준은 공개 전 확인과 공개 후 변경 검토가 명확히 분리되는 것이다.

### 단계 4. 공개 사이트

- `/hypotheses`, `/hypotheses/[slug]`를 추가한다.
- 프로젝트 상세에 공개 가설 섹션을 조립한다.
- 공개 query를 기존 콘텐츠 query와 분리한다.

성공 기준은 공개 가설과 승인된 child만 익명 사용자에게 보이고 기존 공개 콘텐츠 동작이 변하지 않는 것이다.

### 단계 5. 통합 검증

- DB, 타입체크, 빌드, E2E, 데스크톱·모바일 브라우저 검증을 완료한다.
- 기존 공개 parity 테스트도 다시 실행한다.

성공 기준은 신규 가설 흐름과 기존 글·프로젝트 흐름이 함께 통과하는 것이다.

## 13. 향후 확장 경계

다음 기능은 실제 사용 패턴이 확인된 뒤 별도 설계한다.

- 활동·증거별 영구 공개 선택.
- 증거 파일 업로드와 자산 권한.
- 공개 가설 검색, RSS, 홈 피드, 상단 메뉴.
- 가설 협업자와 사용자별 소유권.
- 공개 revision과 변경 이력 비교.
- 가설 데이터 내보내기와 분석 대시보드.
