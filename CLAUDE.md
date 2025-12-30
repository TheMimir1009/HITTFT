# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vibe Coding Rules

### Core Workflow

**Plan Before Code**
- 코드 작성 전 반드시 구현 계획을 먼저 제시
- 사용자 승인 없이 구현 시작 금지
- 복잡한 작업은 단계별로 분해하여 제안

**One Thing at a Time**
- 한 번에 하나의 기능/파일만 수정
- 여러 기능을 동시에 구현하지 않음
- 각 단계 완료 후 테스트 가능한 상태 유지

**Checkpoint First**
- 코드 변경 전 git status 확인
- 의미 있는 변경마다 커밋 권장
- 큰 변경 전 현재 상태 백업 제안

### Safety Rules

**Security Critical**
- 인증/권한/암호화 코드는 새로 작성하지 않음 → 기존 검증된 코드 재사용
- 사용자 입력은 반드시 검증 로직 포함
- API 키/시크릿은 환경변수로만 관리
- pickle 등 안전하지 않은 직렬화 사용 금지 → JSON 사용

**Code Quality**
- 생성한 코드의 동작 원리를 간단히 설명
- 잠재적 위험이나 주의사항 명시
- 외부 패키지 추가 시 반드시 사전 안내

### Do Not

- main/master 브랜치에 직접 작업 금지
- 한 프롬프트로 전체 앱 구현 시도 금지
- 테스트 없이 프로덕션 코드 대량 수정 금지
- .env, credentials, secrets 파일 내용 출력 금지
- node_modules, venv, build 폴더 수정 금지

### Communication Style

- 한국어로 응답
- 불확실한 부분은 먼저 질문
- 에러 발생 시 원인과 해결책 함께 제시
- 작업 완료 후 다음 단계 제안

---

## Project Overview

TFT(Teamfight Tactics) 스타일의 웹 기반 오토배틀러 미니게임. 유닛을 수집하고 4x4 그리드에 배치하여 10라운드의 적 웨이브를 물리치는 전략 게임.

**핵심 기능:**
- 유닛 합성 시스템 (동일 유닛 3개 → ★★, ★★ 3개 → ★★★)
- 시너지 시스템 (종족 3종 + 무기 5종)
- 경제 시스템 (골드/XP 관리, 상점 리롤)

## Running the Game

```bash
# 브라우저에서 직접 열기 (빌드 불필요)
start index.html
```

## File Structure

```
/
├── index.html              # 메인 HTML 파일
├── css/
│   └── style.css          # 모든 스타일 (단일 파일)
├── js/
│   ├── main.js            # 진입점 (Game 인스턴스 생성)
│   ├── game.js            # Game 클래스 (중앙 컨트롤러)
│   ├── board.js           # Board 클래스 (4x4 그리드)
│   ├── bench.js           # Bench 클래스 (8슬롯 대기석)
│   ├── shop.js            # Shop 클래스 (상점 시스템)
│   ├── unit.js            # Unit/EnemyUnit 클래스
│   ├── combat.js          # CombatManager 클래스
│   ├── synergy.js         # SynergyManager 클래스
│   ├── utils.js           # 유틸리티 함수들
│   ├── debug.js           # 디버그 콘솔
│   └── data/
│       ├── units.js       # UNITS_DATA, ENEMY_UNITS_DATA
│       ├── waves.js       # WAVES_DATA (10라운드)
│       ├── synergies.js   # SYNERGIES_DATA
│       └── sellPrices.json # 유닛 판매가 데이터
└── PRD.md / GLOSSARY.md / vibe-coding-core.md (문서들)
```

**중요**: 빌드 프로세스 없음. 모든 JS 파일은 index.html에서 순서대로 로드됨.

## Architecture

### Game Flow
```
main.js (Game 인스턴스 생성)
    → game.init() (모든 매니저 초기화)
    → 준비 페이즈 (상점/유닛 배치, 30초 타이머)
    → 전투 페이즈 (자동 전투)
    → 라운드 결과
    → 반복 (10라운드까지)
```

### Core Classes (`js/`)

| 클래스 | 파일 | 역할 |
|--------|------|------|
| `Game` | `game.js` | 중앙 컨트롤러. 상태, 라운드 진행, 유닛 구매/판매/합성 관리 |
| `Board` | `board.js` | 4x4 그리드. 플레이어 영역(rows 2-3), 적 영역(rows 0-1) |
| `Bench` | `bench.js` | 8슬롯 유닛 대기석 |
| `Shop` | `shop.js` | 유닛 구매, 레벨별 확률 풀 관리 |
| `CombatManager` | `combat.js` | 자동 전투 시뮬레이션 (100ms 틱 기반) |
| `SynergyManager` | `synergy.js` | 종족/무기 시너지 계산 및 적용 |
| `Unit` / `EnemyUnit` | `unit.js` | 유닛 클래스. 스탯, 스킬, 전투 로직 |

### Data Files (`js/data/`)

- `units.js` - 플레이어 유닛 16종 + 적 유닛 정의
- `synergies.js` - 종족(Kiki, Velua, Elf) + 무기(Greatsword, Staff, Bow, Twin Blades, Gauntlet) 시너지
- `waves.js` - 10라운드 적 웨이브 구성

### Key Implementation Details

**전역 변수:**
- `game`: Game 클래스의 전역 인스턴스 (main.js에서 생성)
- `UNITS_DATA`: 플레이어 유닛 16종 정의 (data/units.js)
- `ENEMY_UNITS_DATA`: 적 유닛 정의 (data/units.js)
- `WAVES_DATA`: 10라운드 웨이브 구성 (data/waves.js)
- `SYNERGIES_DATA`: 시너지 효과 정의 (data/synergies.js)
- `debugConsole`: 디버그 콘솔 인스턴스 (debug.js)

**유닛 시스템:**
- `unitId`: 유닛 타입 식별자 (예: 'kiki_guardian')
- `id`: 유닛 인스턴스 고유 ID (UUID)
- 별 등급: 1→2→3, 스탯 배율 1x → 1.8x → 3.2x
- 합성 추적: `Game.allUnits` Map (unitId → Unit[])
- 판매가: `js/data/sellPrices.json` 파일에서 코스트별 환불 금액 정의

**유닛 합성 메커니즘:**
1. 유닛 구매/생성 시 `Game.registerUnit()` 호출 → `allUnits` Map에 추가
2. `Game.checkMerge(unitId)` 호출 → 같은 unitId + 같은 starLevel의 유닛 3개 탐색
3. 3개 발견 시 `Game.performMerge()` → 기존 3개 제거 + 새 ★+1 유닛 생성
4. 새 유닛은 첫 번째 유닛의 위치 상속 (보드 또는 벤치)
5. 연쇄 합성 체크 (★★ 3개 → ★★★ 자동)
6. `initialPositions` Map으로 전투 후 원래 위치 복원 추적

**드래그 앤 드롭 이벤트 흐름:**
- 유닛 드래그 시작 → `event.dataTransfer.setData('unitId', ...)`
- 보드 셀/벤치 슬롯에 드롭 → `Game.handleUnitDrop()` / `Game.handleBenchDrop()`
- 배치 가능 유닛 수 체크 (`levelData[level].maxUnits`)
- 시너지 자동 업데이트 (`Game.updateSynergies()`)

**전투 시스템:**
- `CombatManager.start()` → Promise 반환 (승/패 결과)
- 100ms 간격 틱 기반 업데이트
- 타겟팅: 가장 가까운 적 → 같은 거리면 체력 낮은 적
- 전투 전 플레이어 유닛 위치를 `initialPositions` Map에 저장
- 전투 후 `Game.restorePlayerUnits()`로 위치/체력/마나 복구

**시너지 시스템:**
- 보드 변경 시 `Game.updateSynergies()` 호출
- `SynergyManager.calculate()` → `applyToUnits()` → `render()`
- 보드의 플레이어 유닛만 시너지 계산 (벤치는 제외)
- 종족(3종) + 무기(5종) = 총 8종 시너지

**렌더링:**
- DOM 기반 (Canvas 아님)
- 드래그 앤 드롭으로 유닛 배치
- 체력바/마나바는 인라인 스타일로 동적 업데이트
- 합성 가능 유닛은 CSS 클래스 `mergeable`로 발광 표시

### Debugging

- **F9** 또는 **`** 키: 디버그 콘솔 토글
- `debugConsole.log(category, message, data)`: 디버그 로깅

## Language

게임 UI와 PRD는 한국어. 코드 변수명/주석은 주로 영어 (일부 한국어 문자열 포함).
