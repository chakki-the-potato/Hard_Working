---
title: "Promise.allSettled의 에러 처리 패턴 정리"
description: "Promise.all과 달리 모든 프로미스가 완료될 때까지 기다리는 Promise.allSettled의 동작 원리와 실전 에러 처리 패턴을 코드 예제와 함께 정리합니다."
pubDate: 2026-04-25T00:34:22+09:00
category: programming
tags: ["JavaScript"]
---

`Promise.all`은 하나라도 실패하면 즉시 reject됩니다. 나머지 결과가 필요 없을 때는 적합하지만, 여러 API를 병렬 호출하면서 각각의 성공/실패를 모두 처리해야 할 때는 맞지 않습니다. `Promise.allSettled`는 이 문제를 해결하기 위해 ES2020에 도입되었습니다.

## Promise.all vs Promise.allSettled

| | `Promise.all` | `Promise.allSettled` |
|---|---|---|
| 실패 시 동작 | 즉시 reject (나머지 무시) | 모든 프로미스 완료 후 반환 |
| 반환 타입 | `T[]` | `SettledResult<T>[]` |
| 주 용도 | 전부 성공이어야 의미 있는 경우 | 개별 결과를 모두 확인해야 하는 경우 |

## 결과 구조

각 결과는 `status` 필드로 구분됩니다.

```ts
type SettledResult<T> =
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: unknown };
```

```ts
const results = await Promise.allSettled([
  fetch('/api/users'),
  fetch('/api/posts'),
  fetch('/api/comments'),
]);

for (const result of results) {
  if (result.status === 'fulfilled') {
    console.log(result.value); // Response
  } else {
    console.error(result.reason); // Error
  }
}
```

## 성공/실패 분리 패턴

결과를 fulfilled와 rejected로 나누는 유틸 함수를 만들어 두면 재사용하기 편합니다.

```ts
function partition<T>(results: PromiseSettledResult<T>[]) {
  const fulfilled: T[] = [];
  const rejected: unknown[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      fulfilled.push(result.value);
    } else {
      rejected.push(result.reason);
    }
  }

  return { fulfilled, rejected };
}

// 사용
const results = await Promise.allSettled(requests);
const { fulfilled, rejected } = partition(results);

if (rejected.length > 0) {
  console.warn(`${rejected.length}개 요청 실패:`, rejected);
}
processAll(fulfilled);
```

## 인덱스 보존이 필요한 경우

요청과 결과를 대응시켜야 할 때는 인덱스를 활용합니다.

```ts
const ids = [1, 2, 3, 4, 5];
const results = await Promise.allSettled(
  ids.map(id => fetchUser(id))
);

const failed = results
  .map((result, i) => ({ result, id: ids[i] }))
  .filter(({ result }) => result.status === 'rejected')
  .map(({ id, result }) => ({
    id,
    reason: (result as PromiseRejectedResult).reason,
  }));

console.log('실패한 ID:', failed);
```

## 부분 실패 허용 전략

배치 작업에서 일정 비율 이상 실패하면 전체를 중단하는 패턴입니다.

```ts
async function batchWithThreshold<T>(
  tasks: Promise<T>[],
  maxFailRatio = 0.3
) {
  const results = await Promise.allSettled(tasks);
  const failCount = results.filter(r => r.status === 'rejected').length;

  if (failCount / tasks.length > maxFailRatio) {
    throw new Error(
      `실패율 초과: ${failCount}/${tasks.length} (허용: ${maxFailRatio * 100}%)`
    );
  }

  return results
    .filter((r): r is PromiseFulfilledResult<T> => r.status === 'fulfilled')
    .map(r => r.value);
}
```

## 주의사항

- `Promise.allSettled`는 절대 reject되지 않습니다. `await` 자체에서 에러가 나지 않으므로, 에러 처리를 결과 배열 순회 시점에 해야 합니다.
- `reason`의 타입은 `unknown`입니다. 사용 전 타입 좁히기(`instanceof Error` 등)가 필요합니다.
- 모든 프로미스를 끝까지 실행하므로, 빠른 실패가 필요한 경우에는 `Promise.all`이 적합합니다.
