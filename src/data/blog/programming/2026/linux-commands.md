---
title: "개발자를 위한 Linux 명령어 치트시트"
description: "서버 작업할 때마다 검색하는 Linux 명령어를 한 곳에 정리했습니다. 파일 관리, 프로세스, 네트워크, 권한까지 실무에서 자주 쓰는 명령어 모음."
pubDate: 2026-01-18
category: programming
tags: ["DevOps"]
---

## 파일 & 디렉토리

```bash
# 탐색
ls -lah               # 상세 목록 (숨김 파일 포함, 용량 단위 표시)
tree -L 2             # 트리 구조로 2단계까지 보기
find . -name "*.log" -mtime -7  # 7일 이내 수정된 .log 파일 찾기

# 복사/이동/삭제
cp -r src/ dest/      # 디렉토리 복사
mv old.txt new.txt    # 이름 변경 또는 이동
rm -rf ./temp/        # 강제 삭제 (주의!)

# 내용 보기
cat file.txt          # 전체 출력
less file.txt         # 페이지 단위 보기
tail -f app.log       # 실시간 로그 추적
grep -rn "ERROR" ./logs/  # 재귀적으로 ERROR 검색
```

## 프로세스 관리

```bash
ps aux                # 전체 프로세스 목록
top                   # 실시간 프로세스 모니터링
htop                  # 개선된 top (설치 필요)

kill -9 PID           # 강제 종료
pkill -f "node app"   # 이름으로 종료

# 백그라운드 실행
nohup node server.js &
disown                # 터미널 닫아도 계속 실행

# 포트 사용 프로세스 찾기
lsof -i :3000
ss -tulpn | grep 3000
```

## 권한

```bash
# 권한 변경
chmod 755 script.sh   # rwxr-xr-x
chmod +x deploy.sh    # 실행 권한 추가

# 소유자 변경
chown ubuntu:ubuntu -R /var/www/

# sudo 없이 docker 사용
sudo usermod -aG docker $USER
```

## 네트워크

```bash
curl -I https://example.com          # 헤더만 확인
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"철수"}' http://localhost:3000/api

wget https://example.com/file.tar.gz # 파일 다운로드

netstat -tulpn        # 리스닝 포트 확인
ping -c 4 google.com  # 연결 확인
```

## 유용한 조합

```bash
# 로그에서 에러만 추출해서 파일로
grep "ERROR" app.log | tail -100 > recent_errors.txt

# 디스크 사용량 TOP 10
du -sh /* 2>/dev/null | sort -rh | head -10

# CPU/메모리 한 줄 요약
free -h && df -h

# 특정 포트 즉시 죽이기
kill -9 $(lsof -t -i:3000)
```
