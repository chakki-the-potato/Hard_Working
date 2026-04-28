---
title: "Python 기초 — 데이터 다루기와 실용 문법 정리"
description: "Python의 핵심 문법과 데이터 처리에 자주 쓰이는 패턴을 정리합니다. 리스트 컴프리헨션, 딕셔너리, 함수, 클래스까지 실용 예제 중심으로 다룹니다."
pubDate: 2026-02-25
category: programming
tags: ["Backend"]
---

## Python을 배워야 하는 이유

- AI/ML 분야의 사실상 표준 언어
- 데이터 분석, 자동화, 웹 개발 모두 가능
- 코드가 간결해서 생산성이 높음
- 방대한 라이브러리 생태계

## 핵심 자료형

```python
# 숫자
age = 25
pi = 3.14

# 문자열
name = "철수"
greeting = f"안녕하세요, {name}님!"  # f-string

# 리스트 (mutable)
fruits = ["사과", "바나나", "딸기"]
fruits.append("포도")

# 튜플 (immutable)
point = (10, 20)

# 딕셔너리
user = {
    "name": "철수",
    "age": 25,
    "skills": ["Python", "SQL"]
}

# 집합
unique_tags = {"Python", "ML", "Python"}  # {"Python", "ML"}
```

## 리스트 컴프리헨션

Python의 강력한 기능 중 하나.

```python
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# 기본
squares = [n**2 for n in numbers]
# [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]

# 조건 필터
evens = [n for n in numbers if n % 2 == 0]
# [2, 4, 6, 8, 10]

# 딕셔너리 컴프리헨션
word_lengths = {word: len(word) for word in ["python", "java", "go"]}
# {"python": 6, "java": 4, "go": 2}
```

## 함수

```python
# 기본 함수
def greet(name: str, formal: bool = False) -> str:
    prefix = "안녕하세요" if formal else "안녕"
    return f"{prefix}, {name}!"

# *args, **kwargs
def log(*args, **kwargs):
    print(args)    # 위치 인수들 (튜플)
    print(kwargs)  # 키워드 인수들 (딕셔너리)

# 람다
square = lambda x: x ** 2

# 데코레이터
def timer(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"실행 시간: {time.time() - start:.4f}초")
        return result
    return wrapper

@timer
def slow_function():
    import time
    time.sleep(1)
```

## 클래스

```python
class Animal:
    def __init__(self, name: str, sound: str):
        self.name = name
        self.sound = sound

    def speak(self) -> str:
        return f"{self.name}: {self.sound}!"

    def __repr__(self) -> str:
        return f"Animal(name={self.name!r})"


class Dog(Animal):
    def __init__(self, name: str):
        super().__init__(name, "멍멍")

    def fetch(self, item: str) -> str:
        return f"{self.name}가 {item}을 가져왔어요!"


dog = Dog("바둑이")
print(dog.speak())        # 바둑이: 멍멍!
print(dog.fetch("공"))    # 바둑이가 공을 가져왔어요!
```

## 파일 & 예외 처리

```python
# 파일 읽기 (with 구문으로 자동 닫기)
with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()

# JSON 다루기
import json

with open("config.json", "r") as f:
    config = json.load(f)

with open("output.json", "w", encoding="utf-8") as f:
    json.dump(config, f, ensure_ascii=False, indent=2)

# 예외 처리
try:
    result = 10 / 0
except ZeroDivisionError as e:
    print(f"오류: {e}")
except (TypeError, ValueError) as e:
    print(f"타입/값 오류: {e}")
finally:
    print("항상 실행됨")
```

## 유용한 표준 라이브러리

```python
from pathlib import Path
from datetime import datetime
from collections import Counter, defaultdict
import itertools

# 경로 다루기
p = Path("data") / "logs" / "app.log"
p.parent.mkdir(parents=True, exist_ok=True)

# 날짜
today = datetime.now()
formatted = today.strftime("%Y년 %m월 %d일")

# 빈도 카운트
words = ["python", "java", "python", "go", "python"]
counter = Counter(words)
# Counter({'python': 3, 'java': 1, 'go': 1})
```

## 자주 쓰는 외부 라이브러리

| 라이브러리 | 용도 |
|-----------|------|
| `pandas` | 데이터 분석 |
| `numpy` | 수치 계산 |
| `requests` | HTTP 요청 |
| `FastAPI` | 웹 API 서버 |
| `SQLAlchemy` | ORM |
| `pytest` | 테스트 |
