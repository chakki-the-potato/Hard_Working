---
title: "GitHub 협업에서 자주 발생하는 문제와 해결 방법 정리"
description: "팀 단위로 GitHub를 사용하다 보면 머지 충돌, 잘못된 브랜치 전략, 민감 파일 노출 등 반복적인 문제들을 마주하게 됩니다. 상황별 원인과 빠른 해결 방법을 정리합니다."
pubDate: 2026-04-25T01:10:09+09:00
tags: ["Programming", "Git"]
---

팀 프로젝트에서 GitHub를 사용하다 보면 비슷한 실수가 반복됩니다. 개인 작업과 달리 여러 사람이 같은 저장소를 공유하는 만큼, 한 명의 실수가 전체 팀에 영향을 줄 수 있습니다. 자주 발생하는 문제와 대처법을 항목별로 정리합니다.

## 1. 머지 충돌 (Merge Conflict)

같은 파일의 같은 줄을 두 사람이 동시에 수정하면 Git이 어느 쪽을 선택할지 판단하지 못해 충돌이 발생합니다.

**주요 원인**
- 오래된 브랜치를 main에서 최신화하지 않고 장기간 작업
- 같은 파일을 여러 명이 동시에 수정

**해결 방법**

```bash
git fetch origin
git rebase origin/main   # 또는 git merge origin/main
# 충돌 파일 수동 수정 후
git add .
git rebase --continue    # rebase 사용 시
```

PR을 자주, 작게 올리면 충돌 빈도가 크게 줄어듭니다.

## 2. 민감 파일 커밋

`.env`, API 키, 비밀번호가 포함된 파일이 실수로 원격에 올라가는 경우입니다.

**예방 — `.gitignore` 미리 설정**

```bash
.env
.env.local
*.pem
config/secrets.yaml
```

**이미 올라간 경우**

```bash
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "remove .env from tracking"
git push
```

이미 원격에 올라간 비밀값은 즉시 폐기하고 재발급해야 합니다. 커밋 기록에서 지워도 캐시나 GitHub 스냅샷에 남을 수 있습니다.

## 3. main 브랜치에 직접 Push

보호되지 않은 `main`에 직접 커밋하면 리뷰 없이 코드가 반영되어 배포 문제로 이어질 수 있습니다.

**GitHub 브랜치 보호 설정 경로**

Settings → Branches → Branch protection rules에서:

- `Require a pull request before merging` 활성화
- `Require approvals` (1인 이상)
- `Do not allow bypassing the above settings` 체크

## 4. Force Push로 히스토리 손상

`git push --force`는 원격 커밋 히스토리를 덮어씁니다. 다른 팀원이 이미 pull한 상태라면 심각한 혼선이 생깁니다.

| 명령어 | 위험도 | 권장 상황 |
|---|---|---|
| `git push` | 낮음 | 일반 푸시 |
| `git push --force-with-lease` | 중간 | 내 브랜치를 rebase한 후 |
| `git push --force` | 높음 | 사용 지양 |

`--force-with-lease`는 원격에 내가 모르는 커밋이 있으면 push를 거부하므로 훨씬 안전합니다.

## 5. 커밋 메시지 규칙 불일치

팀마다 형식이 다르면 히스토리 추적과 자동화 도구 연동이 어려워집니다.

**Conventional Commits 형식 예시**

```
feat: 로그인 페이지 추가
fix: 사용자 이름 유효성 검사 오류 수정
docs: API 문서 업데이트
chore: 의존성 버전 업그레이드
refactor: 인증 로직 분리
```

`.gitmessage` 템플릿을 공유하거나 `commitlint`로 자동 검증하면 효과적으로 통일할 수 있습니다.

## 6. PR이 너무 커서 리뷰가 어려움

변경 파일이 수십 개를 넘는 PR은 리뷰어가 맥락을 파악하기 어렵고 버그를 놓칠 가능성이 높습니다.

**권장 기준**

| 항목 | 기준 |
|---|---|
| 변경 파일 수 | 10개 이하 |
| 코드 라인 변경 | 400줄 이하 |
| PR 범위 | 기능 하나 또는 버그 픽스 하나 |

기능이 크다면 작업 단위를 나눠 여러 PR로 분리하는 것이 좋습니다.

## 주의사항

- 공유 브랜치(`main`, `develop`)에는 `--force` 옵션을 절대 사용하지 않습니다.
- `.gitignore`는 프로젝트 시작 시점에 팀 전체가 합의하고 먼저 설정합니다.
- 원격에 올라간 민감 정보는 삭제가 아닌 무효화(재발급)로 대응해야 합니다.
