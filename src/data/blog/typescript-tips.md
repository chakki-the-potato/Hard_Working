---
title: "TypeScript 실전 팁 — 타입을 제대로 쓰는 방법"
description: "any를 남발하지 않고 TypeScript를 제대로 활용하는 실전 패턴들. 제네릭, 유틸리티 타입, 타입 가드까지 실무에서 바로 쓸 수 있는 예제로 정리합니다."
pubDate: 2026-02-08
tags: ["Programming", "Frontend"]
---

## any는 TypeScript를 포기하는 것

`any`를 쓰는 순간 TypeScript의 이점이 사라집니다. 대신 이걸 쓰세요.

## 유틸리티 타입 마스터하기

```ts
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// 일부 필드만 필요할 때
type UserPreview = Pick<User, 'id' | 'name'>;

// 민감한 필드 제외
type PublicUser = Omit<User, 'password'>;

// 모든 필드 선택적으로
type UserDraft = Partial<User>;

// 모든 필드 필수로
type StrictUser = Required<User>;

// 읽기 전용
type ImmutableUser = Readonly<User>;
```

## 제네릭으로 재사용 가능한 타입 만들기

```ts
// API 응답 래퍼
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

async function fetchUser(id: number): Promise<ApiResponse<User>> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

// 제네릭 훅
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  });
  return [value, setValue] as const;
}
```

## 타입 가드

```ts
interface Cat { meow(): void; }
interface Dog { bark(): void; }

// 타입 가드 함수
function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal;
}

function makeSound(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow(); // 여기서는 Cat으로 좁혀짐
  } else {
    animal.bark(); // 여기서는 Dog
  }
}
```

## satisfies 연산자 (TS 4.9+)

```ts
const palette = {
  red: [255, 0, 0],
  green: '#00ff00',
} satisfies Record<string, string | number[]>;

// 타입 추론은 유지하면서 타입 검사도 됨
palette.red.map(v => v * 2); // OK, red는 number[]로 추론됨
```
