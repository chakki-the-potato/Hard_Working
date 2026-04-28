---
title: "JavaScript Map과 Object의 차이점과 선택 기준"
description: "ES6에 도입된 Map은 Object와 비슷해 보이지만 키 타입, 순서 보장, 성능, 직렬화 방식에서 뚜렷한 차이가 있습니다. 두 자료구조의 특징을 비교하고 상황에 따른 선택 기준을 정리합니다."
pubDate: 2026-04-25T00:54:14+09:00
category: programming
tags: ["JavaScript"]
---

JavaScript에서 키-값 쌍을 저장할 때 가장 먼저 떠오르는 것은 Object입니다. ES6에서 도입된 Map은 같은 역할을 하지만 동작 방식이 다릅니다. 둘의 차이를 모르면 잘못된 선택으로 버그나 성능 문제가 생길 수 있습니다.

## 핵심 차이점 요약

| 항목 | Object | Map |
|---|---|---|
| 키 타입 | string, Symbol만 | 모든 값 (객체, 함수 포함) |
| 키 순서 | 정수 키 먼저, 나머지는 삽입 순 | 삽입 순서 항상 보장 |
| 크기 확인 | `Object.keys(obj).length` | `map.size` |
| 기본 프로토타입 키 | 있음 (`toString`, `hasOwnProperty` 등) | 없음 |
| JSON 직렬화 | 기본 지원 | 별도 변환 필요 |
| 잦은 추가/삭제 성능 | 상대적으로 불리 | 최적화됨 |

## 키 타입의 차이

Object의 키는 내부적으로 항상 string(또는 Symbol)으로 변환됩니다. 숫자를 키로 써도 실제로는 문자열 `"1"`이 됩니다.

```js
const obj = {};
obj[1] = 'a';
console.log(Object.keys(obj)); // ["1"]
```

Map은 원시값뿐 아니라 객체도 키로 사용할 수 있습니다.

```js
const map = new Map();
const keyObj = { id: 1 };
map.set(keyObj, 'value');
map.get(keyObj); // 'value'
map.get({ id: 1 }); // undefined (다른 참조이므로)
```

## 순서 보장

Map은 삽입 순서를 항상 보장합니다. Object도 최신 명세에서는 대부분 삽입 순서를 따르지만, 정수 키는 숫자 오름차순으로 먼저 나옵니다.

```js
const obj = {};
obj['b'] = 1;
obj['a'] = 2;
obj[2] = 3;
obj[1] = 4;
console.log(Object.keys(obj)); // ["1", "2", "b", "a"]

const map = new Map();
map.set('b', 1);
map.set('a', 2);
map.set(2, 3);
map.set(1, 4);
console.log([...map.keys()]); // ["b", "a", 2, 1]
```

## 순회 방식

Map은 이터러블이라 `for...of`와 구조 분해를 바로 사용할 수 있습니다.

```js
const map = new Map([['name', 'Alice'], ['age', 30]]);

for (const [key, value] of map) {
  console.log(key, value);
}

[...map.entries()]; // [['name', 'Alice'], ['age', 30]]
```

Object는 `for...in`이나 `Object.entries()`를 사용합니다. `for...in`은 프로토타입 체인도 순회하므로 `hasOwnProperty` 체크가 필요한 경우도 있습니다.

## JSON 직렬화

Object는 `JSON.stringify`가 기본 지원됩니다. Map은 직접 변환해야 합니다.

```js
const map = new Map([['a', 1], ['b', 2]]);

// Map → JSON
JSON.stringify(Object.fromEntries(map)); // '{"a":1,"b":2}'

// JSON → Map
new Map(Object.entries(JSON.parse('{"a":1,"b":2}')));
```

## 선택 기준

- **Object 사용**: 고정된 구조의 데이터(설정값, DTO), JSON 직렬화가 잦은 경우, 코드 가독성 우선
- **Map 사용**: 동적으로 키를 추가/삭제하는 경우, 키 개수가 많고 성능이 중요한 경우, 객체를 키로 써야 하는 경우, 삽입 순서가 중요한 경우

## 주의사항

- `JSON.stringify(map)`은 `{}`를 반환합니다. 직렬화하려면 반드시 `Object.fromEntries(map)`을 먼저 호출해야 합니다.
- 키에 `__proto__` 같은 특수 이름을 사용해야 한다면 Object 대신 Map이 안전합니다.
- Map의 초기값은 `new Map([[key, value], ...])` 형식의 이터러블로 전달합니다.
