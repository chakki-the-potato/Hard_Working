---
title: "pandas로 데이터 분석 시작하기 — 실전 예제 모음"
description: "Python 데이터 분석의 핵심 라이브러리 pandas를 활용해 데이터를 불러오고, 정제하고, 집계하는 방법을 실전 예제와 함께 정리합니다."
pubDate: 2026-02-05
tags: ["Programming", "Backend"]
---

## pandas 설치

```bash
pip install pandas numpy matplotlib
```

## DataFrame 기초

```python
import pandas as pd

# CSV 불러오기
df = pd.read_csv('sales.csv')

# 기본 정보 확인
print(df.shape)        # (행, 열) 수
print(df.dtypes)       # 각 컬럼 타입
print(df.describe())   # 수치형 통계 요약
print(df.head(5))      # 상위 5행
```

## 데이터 정제

```python
# 결측값 처리
df.isnull().sum()                    # 컬럼별 결측값 수
df.dropna(subset=['price'])          # 특정 컬럼 결측행 제거
df['age'].fillna(df['age'].mean())   # 평균으로 채우기

# 중복 제거
df.drop_duplicates(subset=['user_id'], keep='last')

# 타입 변환
df['date'] = pd.to_datetime(df['date'])
df['price'] = df['price'].astype(float)

# 문자열 정제
df['name'] = df['name'].str.strip().str.lower()
```

## 필터링과 선택

```python
# 조건 필터링
high_value = df[df['price'] > 10000]
recent = df[df['date'] >= '2025-01-01']

# 복합 조건
filtered = df[(df['category'] == 'tech') & (df['price'] > 5000)]

# 컬럼 선택
subset = df[['name', 'price', 'category']]

# loc / iloc
df.loc[df['city'] == '서울', 'discount'] = 0.1
df.iloc[0:10, 2:5]  # 행 0~9, 열 2~4
```

## 집계와 그룹화

```python
# 기본 집계
df['sales'].sum()
df['price'].mean()

# groupby
monthly = df.groupby(df['date'].dt.month)['sales'].agg(['sum', 'mean', 'count'])

# pivot table
pivot = df.pivot_table(
    values='sales',
    index='category',
    columns='month',
    aggfunc='sum',
    fill_value=0
)
```

## 간단한 시각화

```python
import matplotlib.pyplot as plt

# 막대 그래프
df.groupby('category')['sales'].sum().plot(kind='bar', figsize=(10, 5))
plt.title('카테고리별 매출')
plt.tight_layout()
plt.savefig('sales_by_category.png', dpi=150)
```
