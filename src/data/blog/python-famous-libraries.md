---
title: "파이썬 필수 라이브러리 5선: NumPy, Pandas, Requests, FastAPI, Pytest"
description: "파이썬 생태계에서 가장 많이 사용되는 핵심 라이브러리 5가지를 분야별로 정리합니다. NumPy, Pandas, Requests, FastAPI, Pytest 각각의 역할과 대표적인 사용 패턴을 예제 코드와 함께 파악할 수 있습니다."
pubDate: 2026-04-27T18:56:32+09:00
tags: ["Programming", "Python"]
---

파이썬의 강점 중 하나는 풍부한 서드파티 라이브러리 생태계입니다. PyPI에는 수십만 개 이상의 패키지가 등록되어 있지만, 실무에서 자주 등장하는 핵심 라이브러리는 일부에 집중됩니다. 분야별로 대표적인 라이브러리 5개를 정리합니다.

## NumPy — 수치 계산의 기반

NumPy는 고성능 다차원 배열(ndarray)을 제공하는 수치 계산 라이브러리입니다. 과학 계산, 머신러닝, 데이터 분석의 대부분이 NumPy 배열 위에서 동작합니다.

```python
import numpy as np

a = np.array([1, 2, 3, 4, 5])
print(a * 2)        # [2 4 6 8 10]
print(a.mean())     # 3.0

mat = np.zeros((3, 3))
mat[1, 1] = 1
```

- 리스트 대비 연산 속도가 수십 배 빠름 (C 기반 구현)
- 벡터화 연산으로 반복문 없이 배열 전체를 한 번에 처리
- `shape`, `dtype`, 브로드캐스팅 등 핵심 개념을 익히면 활용 범위가 크게 넓어짐

## Pandas — 표 형태 데이터 분석

Pandas는 DataFrame이라는 표 형태 자료구조를 제공합니다. CSV, Excel, DB 쿼리 결과 등을 불러와 필터링, 집계, 변환하는 작업에 최적화되어 있습니다.

```python
import pandas as pd

df = pd.read_csv('data.csv')
print(df.head())
print(df['age'].describe())

# 조건 필터링
adults = df[df['age'] >= 18]

# 그룹 집계
df.groupby('country')['salary'].mean()
```

- `groupby`, `merge`, `pivot_table` 등으로 SQL에 준하는 집계 가능
- 결측값 처리: `fillna()`, `dropna()`
- 수백만 행 이상의 대용량 데이터는 Polars나 Dask 고려

## Requests — HTTP 클라이언트

Requests는 HTTP 요청을 간결하게 보낼 수 있는 라이브러리입니다. "HTTP for Humans"라는 슬로건처럼 표준 라이브러리 `urllib`에 비해 훨씬 직관적입니다.

```python
import requests

response = requests.get('https://api.example.com/users')
print(response.status_code)  # 200
data = response.json()

# POST 요청
r = requests.post(
    'https://api.example.com/users',
    json={'name': 'Alice', 'email': 'alice@example.com'},
    headers={'Authorization': 'Bearer token123'},
    timeout=5,
)
```

- 세션 관리: `requests.Session()`으로 쿠키, 헤더를 여러 요청에 걸쳐 유지
- `timeout` 파라미터는 실서비스에서 반드시 설정해야 무한 대기를 방지
- 비동기 HTTP가 필요하면 `httpx` 또는 `aiohttp`를 사용

## FastAPI — 현대적인 웹 프레임워크

FastAPI는 Python 타입 힌트를 기반으로 자동 문서화, 데이터 검증, 비동기 처리를 지원하는 웹 프레임워크입니다. Flask 대비 성능이 뛰어나고 개발 생산성이 높습니다.

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class User(BaseModel):
    name: str
    age: int

@app.get('/users/{user_id}')
async def get_user(user_id: int):
    return {'id': user_id, 'name': 'Alice'}

@app.post('/users')
async def create_user(user: User):
    return user
```

- `/docs` 경로에서 Swagger UI 자동 생성
- Pydantic 기반 요청·응답 데이터 자동 검증
- `async`/`await` 기반 비동기 처리로 높은 동시성 확보

## Pytest — 테스트 프레임워크

Pytest는 파이썬 표준 unittest보다 훨씬 간결한 문법으로 테스트를 작성할 수 있는 프레임워크입니다. 픽스처, 파라미터화, 풍부한 플러그인 생태계가 특징입니다.

```python
# test_calculator.py
def add(a, b):
    return a + b

def test_add():
    assert add(1, 2) == 3
    assert add(-1, 1) == 0

import pytest

@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (0, 0, 0),
    (-1, 1, 0),
])
def test_add_params(a, b, expected):
    assert add(a, b) == expected
```

```bash
pytest test_calculator.py -v
```

- `assert` 문만으로 테스트 작성 가능 — `assertEqual`, `assertTrue` 등 별도 메서드 불필요
- `conftest.py`에 픽스처를 정의해 공통 설정을 여러 테스트 파일에 공유
- `pytest-cov` 플러그인으로 코드 커버리지 측정 가능

## 정리

| 라이브러리 | 분야 | 설치 |
|---|---|---|
| NumPy | 수치 계산 | `pip install numpy` |
| Pandas | 데이터 분석 | `pip install pandas` |
| Requests | HTTP 클라이언트 | `pip install requests` |
| FastAPI | 웹 프레임워크 | `pip install fastapi` |
| Pytest | 테스트 | `pip install pytest` |

5개는 각각 다른 분야를 담당하며, 파이썬 프로젝트라면 대부분 이 중 두세 개 이상을 동시에 사용하게 됩니다. 공식 문서가 잘 정리되어 있으므로 기본 개념을 익힌 뒤 공식 문서를 참고하는 것을 권장합니다.
