# Git Workflow Rules

바이브 코딩에서 버전 관리는 생명줄입니다. AI가 예상치 못한 변경을 할 때 롤백할 수 있어야 합니다.

---

## Branch Strategy (브랜치 전략)

### 기본 원칙
- main/master 브랜치에서 직접 작업 금지
- 모든 작업은 feature 브랜치에서 진행
- 브랜치 이름은 작업 내용을 명확히 표현

### 브랜치 네이밍
```
feature/기능명     - 새 기능 개발
fix/버그명         - 버그 수정
refactor/대상     - 리팩토링
experiment/실험명 - 실험적 시도
```

### 예시
```bash
# 새 기능 시작
git checkout -b feature/user-login

# 버그 수정
git checkout -b fix/login-validation

# 실험 (AI에게 대담한 변경 요청 시)
git checkout -b experiment/new-architecture
```

---

## Checkpoint System (체크포인트)

### 체크포인트 생성 시점
```
✅ 체크포인트 필요한 때:
- 새로운 기능 구현 시작 전
- 작동하는 상태에 도달했을 때
- 큰 리팩토링 시작 전
- AI에게 "이것 좀 바꿔줘" 요청 전
- 실험적 변경 시도 전
```

### 빠른 체크포인트 명령
```bash
# 현재 상태 빠르게 저장
git add -A && git commit -m "checkpoint: 작업 설명"

# 또는 WIP(Work In Progress) 커밋
git add -A && git commit -m "WIP: 진행 중인 작업"
```

### 롤백 방법
```bash
# 마지막 커밋으로 되돌리기 (변경사항 유지)
git reset --soft HEAD~1

# 마지막 커밋으로 되돌리기 (변경사항 버림)
git reset --hard HEAD~1

# 특정 커밋으로 되돌리기
git log --oneline  # 커밋 확인
git reset --hard <commit-hash>
```

---

## Commit Convention (커밋 컨벤션)

### 커밋 메시지 형식
```
<type>: <간단한 설명>

타입:
- feat: 새 기능
- fix: 버그 수정
- refactor: 리팩토링
- docs: 문서 수정
- style: 포맷팅 (코드 변경 없음)
- test: 테스트 추가/수정
- chore: 빌드, 설정 변경
- checkpoint: 임시 저장점
- WIP: 진행 중인 작업
```

### 좋은 커밋 메시지 예시
```
feat: 사용자 로그인 기능 추가
fix: 로그인 시 빈 비밀번호 검증 누락 수정
refactor: 인증 로직을 AuthService로 분리
checkpoint: 로그인 UI 완성, API 연동 전
```

### 나쁜 커밋 메시지 예시
```
❌ "수정"
❌ "fix"
❌ "asdf"
❌ "작업 중"
```

---

## Before Making Changes (변경 전 확인)

### 변경 전 체크리스트
```bash
# 1. 현재 상태 확인
git status

# 2. 변경되지 않은 파일이 있는지 확인
git diff

# 3. 현재 브랜치 확인
git branch

# 4. 필요시 체크포인트 생성
git add -A && git commit -m "checkpoint: 변경 전 상태"
```

### AI에게 변경 요청 전
```
큰 변경 요청 시:
1. git status로 현재 상태 확인
2. 변경사항 있으면 커밋 또는 stash
3. 필요시 새 브랜치 생성
4. 그 후 AI에게 요청
```

---

## Recovery Scenarios (복구 시나리오)

### AI가 코드를 망쳤을 때
```bash
# 커밋 전이라면
git checkout -- .  # 모든 변경 취소
git checkout -- <file>  # 특정 파일만 취소

# 이미 커밋했다면
git reset --hard HEAD~1  # 마지막 커밋 취소

# 여러 커밋 전으로 돌아가야 한다면
git log --oneline  # 돌아갈 지점 찾기
git reset --hard <commit-hash>
```

### Stash 활용
```bash
# 현재 작업 임시 저장
git stash

# AI 작업 후 문제 있으면 복원
git stash pop

# stash 목록 확인
git stash list
```

### 실험 브랜치 활용
```bash
# 위험한 변경 시도 전
git checkout -b experiment/risky-change

# 실패하면 브랜치 버리기
git checkout main
git branch -D experiment/risky-change

# 성공하면 머지
git checkout main
git merge experiment/risky-change
```

---

## .gitignore 필수 항목

### 프로젝트 생성 시 확인
```gitignore
# 환경 설정
.env
.env.local
.env.*.local

# 의존성
node_modules/
venv/
__pycache__/

# IDE
.idea/
.vscode/
*.swp

# 빌드
dist/
build/
*.pyc

# OS
.DS_Store
Thumbs.db

# 로그
*.log
logs/
```

---

## Git 관련 AI 요청 시

### 요청 예시
```
✅ 좋은 요청:
"현재 git status 확인해줘"
"변경 전에 체크포인트 만들어줘"
"feature/login 브랜치 만들고 거기서 작업해줘"

❌ 나쁜 요청:
"git push 해줘" (검토 없이)
"main에 바로 커밋해줘"
"force push 해줘"
```

### AI가 제안해야 할 것
- 큰 변경 전: "체크포인트를 먼저 만들까요?"
- main 브랜치 감지 시: "feature 브랜치를 만들어서 작업할까요?"
- 여러 파일 수정 시: "작업 전 현재 상태를 커밋해둘까요?"
