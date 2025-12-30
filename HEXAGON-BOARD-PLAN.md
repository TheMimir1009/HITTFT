# 육각형 보드 변환 구현 계획

## 목표

현재 4×4 정사각형 그리드(16칸)를 **19개 육각형 그리드**로 변환
- **Pointy-top** 육각형 (뾰족한 꼭지점이 위/아래)
- **상하 영역 구분** 유지 (상단=적, 하단=플레이어)
- **새로운 밸런스** 설계 (더 많은 유닛 배치 가능)

---

## 육각형 그리드 설계

### 좌표 시스템: Axial Coordinates (q, r)

```
19개 육각형 배치 (3-4-5-4-3 패턴):

        [-2,-2] [-1,-2] [ 0,-2]           ← Enemy Zone (3개)
      [-2,-1] [-1,-1] [ 0,-1] [ 1,-1]     ← Enemy Zone (4개)
    [-2, 0] [-1, 0] [ 0, 0] [ 1, 0] [ 2, 0]  ← Neutral Zone (5개)
      [-2, 1] [-1, 1] [ 0, 1] [ 1, 1]     ← Player Zone (4개)
        [-2, 2] [-1, 2] [ 0, 2]           ← Player Zone (3개)
```

**영역 분배:**
- Enemy Zone: r ≤ -1 (7개 육각형: 3+4)
- Neutral Zone: r = 0 (5개 육각형)
- Player Zone: r ≥ 1 (7개 육각형: 4+3)

**배치 규칙:**
- 플레이어 배치 가능: r ≥ 0 (12개: neutral 5 + player 7)
- 적 스폰: r ≤ 0 (12개: enemy 7 + neutral 5)
- Neutral 영역은 전투 중 양쪽 진입 가능

---

## 📊 현재 진행 상황 (2025-12-29 업데이트)

### ✅ 완료된 작업
1. ✅ **hexUtils.js 생성** - 육각형 좌표 시스템 구현
2. ✅ **CSS 렌더링** - 19개 육각형 시각화 완료
3. ✅ **Board 핵심 메서드** - 9개 함수 육각형 좌표로 변환
4. ✅ **적 배치 시스템** - placeEnemies(), clearEnemyZone() 수정
5. ✅ **드래그 이벤트 설정** - setupDragAndDrop() 육각형 대응
6. ✅ **Step 3.2 완료** - row/col → q/r 좌표 통합 (game.js, board.js, unit.js)
   - `handleUnitDrop()` 매개변수명 변경
   - `performMerge()` 좌표 수정
   - `autoPlaceUnits()` 좌표 수정
   - `restorePlayerUnits()` 전체 수정
   - `removeUnit()` 좌표 수정
7. ✅ **Step 5 완료** - 전투 시스템 육각형 좌표 적용
   - `findNextMoveCell()` - 6방향 이동으로 변경
   - `moveUnit()` - Map 기반 cells 접근
   - `calculateDistance()` - hexDistance() 사용
8. ✅ **Step 6.1 완료** - levelData 업데이트 (최대 8유닛, Lv7/Lv8 추가)
9. ✅ **버그 수정** - 전투 중 유닛 겹침 (2단계 이동 처리로 해결)
   - `tick()` 함수 리팩토링
   - `collectMoveIntent()` 함수 추가
   - `resolveCollisions()` 함수 추가
   - `processAttack()` 함수 추가
10. ✅ **버그 수정** - 자동 배치 시 유닛 겹침
    - `autoPlaceUnits()` 매번 빈 셀 확인하도록 수정
    - `placeUnit()` 스왑 불가 시 배치 거부 로직 추가
11. ✅ **버그 수정** - 전투 종료 시 툴팁 잔류
    - `processBattleResult()` 시작 시 `hideUnitTooltip()` 호출

### ⏸️ 현재 상태
- 단계 6 게임 로직 통합 거의 완료 ✅
- 전체 게임 플로우 테스트 필요

### 🔜 다음 단계
**Step 6.3**: 전체 게임 플로우 테스트 (1→10 라운드)

### 📋 남은 작업 목록
1. **Step 6.3**: 전체 게임 플로우 테스트 (1→10 라운드)
2. **Step 7**: 최적화 & 폴리시 (반응형, 성능, 버그 수정)

**예상 남은 시간**: 1-2시간

---

## 점진적 구현 순서 (작은 단위로 진행)

### 단계 0: 기초 작업 ✅ **완료**
- [x] **Step 0.1**: `js/hexUtils.js` 파일 생성 (좌표 수학)
- [x] **Step 0.2**: `index.html`에 스크립트 태그 추가
- [x] **Step 0.3**: 브라우저 콘솔에서 hexUtils 함수 테스트
  - ✅ Distance 값: 1 (정상)
  - ✅ Total hexagons: 19 (정상)

### 단계 1: 시각적 렌더링 ✅ **완료**
- [x] **Step 1.1**: CSS 변수 추가 (--hex-size 등)
- [x] **Step 1.2**: `.hex-cell` CSS 스타일 추가
- [x] **Step 1.3**: `board.js` - `createGrid()` 수정 (19개 육각형 렌더링)
- [x] **Step 1.4**: 브라우저 테스트 - 육각형 19개 확인
- [x] **Step 1.5**: 기존 `.board-cell` CSS 제거

### 단계 2: Board 기본 메서드 ✅ **완료**
- [x] **Step 2.1**: `board.js` - `placeUnit()` 수정 (q, r 좌표)
- [x] **Step 2.2**: `board.js` - `removeUnitFromCell()` 수정
- [x] **Step 2.3**: `board.js` - `getPlayerUnits()`, `getEnemyUnits()` 수정
- [x] **Step 2.4**: `board.js` - `findEmptyPlayerCell()`, `getEmptyPlayerSlots()` 수정
- [x] **Step 2.5**: `board.js` - `getCell()` 수정

### 단계 3: 드래그 앤 드롭 ⏸️ **진행 중**
- [x] **Step 3.1**: `board.js` - `setupDragAndDrop()` 수정 ✅
- [x] **Step 3.2**: `game.js` - `handleUnitDrop(row, col)` → `handleUnitDrop(q, r)` 시그니처 변경 ✅
  - `performMerge()`, `autoPlaceUnits()`, `restorePlayerUnits()`, `removeUnit()` 좌표 수정 포함
- [ ] **Step 3.3**: 브라우저 테스트 - 벤치에서 보드로 드래그 가능한지 확인 ⬅️ **다음**

**커밋 예정**: "feat: 육각형 보드 드래그 앤 드롭 구현"

### 단계 4: 적 배치 ✅ **완료**
- [x] **Step 4.1**: `board.js` - `placeEnemies()` 수정
- [x] **Step 4.2**: `board.js` - `clearEnemyZone()` 수정
- [x] **Step 4.3**: 브라우저 테스트 - 적이 육각형에 스폰됨 확인

### 단계 5: 전투 시스템 ✅ **완료**
- [x] **Step 5.1**: `utils.js` - `calculateDistance()` 함수 수정 (hexDistance 사용) ✅
- [x] **Step 5.2**: `combat.js` - `findNextMoveCell()` 수정 (6방향) ✅
- [x] **Step 5.3**: `combat.js` - `moveUnit()` 수정 (q, r 좌표) ✅
- [x] **Step 5.4**: 브라우저 테스트 - 전투 중 이동 확인 ✅

**커밋 예정**: "feat: 육각형 보드 전투 시스템 구현"

### 단계 6: 게임 로직 통합 ⏸️ **부분 완료**
- [ ] **Step 6.1**: `game.js` - `levelData` 업데이트 (최대 유닛 수)
- [x] **Step 6.2**: `game.js` - `restorePlayerUnits()` 수정 (q, r 좌표) ✅
- [ ] **Step 6.3**: 전체 게임 플로우 테스트 (1→10 라운드)

**커밋 예정**: "feat: 육각형 보드 게임 로직 완성"

### 단계 7: 최적화 & 폴리시 ⏳ **대기 중**

#### Step 7.1: 반응형 CSS 개선 ✅ **기본 완료**
- [x] **768px 브레이크포인트** - 적용됨
- [x] **480px 브레이크포인트** - 적용됨
- [x] **`--hex-size` 반응형** - 40px → 30px → 24px
- [x] **시너지 패널 모바일 대응** - `position: static`
- [x] **게임 보드 크기 축소** - 600px → 450px → 350px

**선택적 추가 개선 (필요시):**
- [ ] 게임 보드 크기 변수화 (`--game-board-width`)
- [ ] 320px 브레이크포인트 (초소형 화면)
- [ ] 디버그 콘솔 반응형 크기

#### Step 7.2: 성능 최적화 (필요시)
- [ ] 불필요한 DOM 업데이트 확인
- [ ] 이벤트 리스너 누수 점검

#### Step 7.3: 추가 버그 수정
- [ ] 테스트 중 발견되는 버그 수정

**최종 커밋**: "polish: 육각형 보드 최적화 완료"

---

## 수정 파일 요약

### 새 파일
1. **`js/hexUtils.js`** - 육각형 좌표 시스템 (101 라인)

### 수정 파일
2. **`index.html`** - hexUtils.js 스크립트 추가 (1 라인)
3. **`css/style.css`** - 육각형 레이아웃 (CSS 변수, .hex-cell 스타일, 반응형)
4. **`js/board.js`** - Map 기반 셀, 육각형 좌표 (10개 메서드 수정)
5. **`js/combat.js`** - 6방향 이동, 육각형 거리 (대기 중)
6. **`js/game.js`** - 육각형 좌표 처리, 레벨 데이터 (대기 중)
7. **`js/utils.js`** - hexDistance 사용 (대기 중)

### 변경 불필요
- `js/unit.js` - position은 추상적, 좌표 시스템 독립적
- `js/bench.js` - 공간 로직 없음
- `js/shop.js` - 공간 로직 없음
- `js/synergy.js` - 위치 정보 사용 안 함
- `js/data/*` - 데이터 파일

---

## 예상 소요 시간

- **Phase 1 (기초)**: ✅ 완료
- **Phase 2 (렌더링)**: ✅ 완료
- **Phase 3 (보드)**: ✅ 대부분 완료 (드래그 앤 드롭 1개 함수 남음)
- **Phase 4 (전투)**: ⏳ 5-7시간
- **Phase 5 (게임)**: ⏳ 3-4시간
- **Phase 6 (테스트)**: ⏳ 2-3시간

**총 남은 시간: 8-12시간**

---

## 주의사항

⚠️ **좌표 시스템 완전 교체**
- 모든 `{ row, col }` → `{ q, r }`로 변경
- `cells[row][col]` → `cells.get("q,r")`로 변경

⚠️ **거리 계산 변경**
- Manhattan 거리 → 육각형 거리
- 유닛 밸런스 재조정 필요할 수 있음

⚠️ **DOM 인덱싱 제거**
- `index = row * 4 + col` 공식 사용 불가
- Map 기반 접근만 사용

⚠️ **영역 개념 변경**
- 행 번호 기반 → 육각형 r 좌표 기반
- 중립 영역 추가 (r=0)
