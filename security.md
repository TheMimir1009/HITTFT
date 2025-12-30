---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.py"
  - "**/*.cs"
  - "**/*.java"
  - "**/*.go"
  - "**/*.rb"
  - "**/*.php"
---

# Security Rules for Vibe Coding

AI 생성 코드의 45%가 보안 취약점을 포함합니다. 이 규칙을 반드시 준수하세요.

---

## Input Validation (입력 검증)

### 필수 검증 항목
- 모든 사용자 입력은 서버 측에서 검증
- 클라이언트 검증만으로 의존 금지
- 화이트리스트 방식 선호 (허용된 것만 통과)

### SQL Injection 방지
```
✅ DO: 파라미터화된 쿼리, ORM 사용
❌ DON'T: 문자열 연결로 쿼리 생성

# Bad
query = f"SELECT * FROM users WHERE id = {user_id}"

# Good  
query = "SELECT * FROM users WHERE id = ?"
cursor.execute(query, (user_id,))
```

### XSS 방지
- 출력 시 HTML 이스케이프 처리
- innerHTML 대신 textContent 사용
- 사용자 입력을 URL/스크립트에 직접 삽입 금지

### Path Traversal 방지
- 파일 경로에 사용자 입력 사용 시 정규화 + 검증
- `..` 패턴 필터링
- 허용된 디렉토리 범위 체크

---

## Secrets Management (시크릿 관리)

### 절대 금지
- ❌ 코드에 API 키/비밀번호 하드코딩
- ❌ 시크릿을 로그에 출력
- ❌ 시크릿을 에러 메시지에 포함
- ❌ .env 파일을 git에 커밋

### 필수 사항
- ✅ 환경 변수로 시크릿 관리
- ✅ .env.example 파일로 필요한 변수 문서화
- ✅ .gitignore에 .env 포함 확인

### 예시
```
# Bad
api_key = "sk-1234567890abcdef"

# Good
import os
api_key = os.environ.get("API_KEY")
if not api_key:
    raise ValueError("API_KEY environment variable required")
```

---

## Authentication & Authorization (인증/권한)

### 핵심 원칙
- 인증/권한 코드는 새로 작성하지 않음
- 검증된 라이브러리/프레임워크 기능 사용
- 세션/토큰 관리는 프레임워크 기본 기능 활용

### 사용 권장
```
JavaScript/Node: passport.js, next-auth, auth0
Python: django-auth, flask-login, authlib  
Java: Spring Security
C#: ASP.NET Identity
```

### 직접 구현 금지 항목
- 비밀번호 해싱 알고리즘
- JWT 서명/검증 로직
- OAuth 플로우
- 세션 토큰 생성

---

## Package Security (패키지 보안)

### 패키지 환각(Hallucination) 주의
- AI가 제안한 패키지가 실제 존재하는지 확인
- npm, pip 등에서 직접 검색 후 설치
- 유사한 이름의 악성 패키지(typosquatting) 주의

### 설치 전 확인
```
확인 체크리스트:
□ 패키지 이름 정확한지 확인
□ 공식 저장소에 존재하는지 확인
□ 다운로드 수, 최근 업데이트 확인
□ 알려진 취약점 확인 (npm audit, pip-audit)
```

### 의존성 관리
- 버전 고정 (lock 파일 사용)
- 정기적인 보안 업데이트
- 사용하지 않는 패키지 제거

---

## Serialization (직렬화)

### 안전하지 않은 직렬화 금지
```
❌ 금지:
- Python: pickle (임의 코드 실행 가능)
- Java: ObjectInputStream (신뢰할 수 없는 데이터)
- PHP: unserialize (객체 인젝션)

✅ 권장:
- JSON (모든 언어)
- Protocol Buffers
- MessagePack
```

### 네트워크 데이터 처리
- 외부에서 받은 데이터는 항상 불신
- 역직렬화 전 스키마 검증
- 크기 제한 설정 (DoS 방지)

---

## Error Handling (에러 처리)

### 안전한 에러 처리
```
❌ Bad: 상세 에러를 사용자에게 노출
catch (error) {
    res.send(error.stack);  // 내부 경로, 버전 노출
}

✅ Good: 일반적 메시지 + 내부 로깅
catch (error) {
    logger.error(error);  // 상세 내용은 로그에만
    res.status(500).send("Internal server error");
}
```

### 에러 메시지 원칙
- 사용자에게는 일반적인 메시지
- 상세 스택트레이스는 로그에만
- 프로덕션에서 디버그 모드 비활성화

---

## Security Checklist (보안 체크리스트)

코드 생성 후 확인:

```
□ 사용자 입력 검증 있음
□ SQL 쿼리 파라미터화됨
□ 시크릿이 코드에 없음
□ 에러 메시지에 민감 정보 없음
□ 인증 로직은 검증된 라이브러리 사용
□ 새 패키지는 실제 존재 확인됨
□ pickle/eval 등 위험 함수 미사용
□ 파일 경로 처리 시 검증 있음
```

---

## 보안 관련 코드 수정 시

보안 관련 코드 변경 요청 시:
1. 변경의 보안 영향 먼저 설명
2. 잠재적 위험 요소 명시
3. 더 안전한 대안이 있으면 제안
4. 테스트 방법 안내
