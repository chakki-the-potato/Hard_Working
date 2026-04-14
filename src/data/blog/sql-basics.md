---
title: "SQL 핵심 문법 정리 — 실무에서 자주 쓰는 쿼리 모음"
description: "SELECT부터 JOIN, 서브쿼리, 윈도우 함수까지. 실무에서 반복적으로 쓰이는 SQL 패턴을 예제 중심으로 정리합니다."
pubDate: 2026-01-22
tags: ["Programming", "Backend"]
---

## 기본 SELECT

```sql
SELECT name, age, city
FROM users
WHERE age >= 20
  AND city = '서울'
ORDER BY age DESC
LIMIT 10;
```

## JOIN

```sql
-- INNER JOIN: 양쪽 모두 존재하는 행
SELECT u.name, o.product, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN: 왼쪽 기준, 오른쪽 없으면 NULL
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;
```

## 집계 함수

```sql
SELECT
  category,
  COUNT(*)           AS 상품수,
  AVG(price)         AS 평균가격,
  SUM(stock)         AS 총재고,
  MAX(price)         AS 최고가,
  MIN(price)         AS 최저가
FROM products
GROUP BY category
HAVING COUNT(*) >= 5
ORDER BY 평균가격 DESC;
```

## 서브쿼리

```sql
-- 평균보다 비싼 상품
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products);

-- 주문이 있는 사용자만
SELECT name FROM users
WHERE id IN (SELECT DISTINCT user_id FROM orders);
```

## 윈도우 함수

```sql
SELECT
  name,
  salary,
  department,
  RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank,
  AVG(salary) OVER (PARTITION BY department) AS dept_avg,
  SUM(salary) OVER (ORDER BY hire_date ROWS UNBOUNDED PRECEDING) AS running_total
FROM employees;
```

## 자주 쓰는 패턴

```sql
-- 중복 제거 후 카운트
SELECT COUNT(DISTINCT user_id) FROM orders;

-- NULL 처리
SELECT name, COALESCE(phone, '미등록') AS phone FROM users;

-- 날짜 필터
SELECT * FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- UPSERT (PostgreSQL)
INSERT INTO users (id, name, email)
VALUES (1, '철수', 'cs@example.com')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, email = EXCLUDED.email;
```
