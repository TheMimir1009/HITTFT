// 이동 시스템 클래스

class MovementSystem {
    constructor() {
        // 이동 타이머 (유닛별)
        this.moveTimers = new Map();
        // 이동 방향 이력 (유닛별) - 진동 방지용
        this.lastMoveDirection = new Map();
        // 보드 참조
        this.board = null;
    }

    /**
     * 초기화
     */
    init(board) {
        this.board = board;
        this.moveTimers.clear();
        this.lastMoveDirection.clear();
    }

    /**
     * 유닛 이동 타이머 등록
     */
    registerUnit(unitId) {
        this.moveTimers.set(unitId, 0);
    }

    /**
     * 이동 의도 수집 (실제 이동 없음)
     */
    collectMoveIntent(unit, enemies, allies, deltaTime) {
        if (!unit.position) return null;

        // 타겟이 없거나 유효하지 않음
        if (!unit.target || !unit.target.isAlive || !unit.target.position) {
            return null;
        }

        // 사거리 체크
        const distance = calculateDistance(unit.position, unit.target.position);

        // 사거리 내면 이동 불필요
        if (distance <= unit.stats.range) return null;

        // 이동 쿨다운 체크
        const moveTimer = this.moveTimers.get(unit.id) || 0;
        const newMoveTimer = moveTimer + deltaTime;
        const moveCooldown = 1 / (unit.stats.moveSpeed || 1.0);

        if (newMoveTimer >= moveCooldown) {
            const allUnits = [...allies, ...enemies];
            const nextCell = this.findNextMoveCell(unit, unit.target, allUnits);
            this.moveTimers.set(unit.id, 0);
            return nextCell;
        } else {
            this.moveTimers.set(unit.id, newMoveTimer);
            return null;
        }
    }

    /**
     * 이동 충돌 해결 - 같은 셀로 이동하려는 유닛 중 1개만 허용
     */
    resolveCollisions(moveIntents) {
        const targetCells = new Map(); // "q,r" → [{ unit, target }, ...]

        // 같은 셀을 목표로 하는 유닛들 그룹화
        moveIntents.forEach(({ unit, target }, unitId) => {
            const key = `${target.q},${target.r}`;
            if (!targetCells.has(key)) targetCells.set(key, []);
            targetCells.get(key).push({ unit, target });
        });

        // 충돌 해결
        const resolved = [];
        targetCells.forEach((units, key) => {
            // 이미 점유된 셀인지 확인
            const cell = this.board.cells.get(key);
            if (cell && cell.unit && cell.unit.isAlive) {
                // 이미 점유된 셀 - 아무도 이동하지 않음
                return;
            }

            if (units.length === 1) {
                // 충돌 없음 - 그대로 이동
                resolved.push(units[0]);
            } else {
                // 충돌! 첫 번째 유닛만 이동 (배열 순서 = 처리 순서)
                resolved.push(units[0]);
                // 나머지는 이동 취소 (다음 tick에서 재시도)
            }
        });

        return resolved;
    }

    /**
     * 다음 이동 셀 찾기 (타겟에 가장 가까운 빈 인접 셀, 육각형 6방향)
     */
    findNextMoveCell(unit, target, allUnits) {
        // 육각형 6방향
        const directions = [
            { q: +1, r:  0, dir: 0 }, // E
            { q: +1, r: -1, dir: 1 }, // NE
            { q:  0, r: -1, dir: 2 }, // NW
            { q: -1, r:  0, dir: 3 }, // W
            { q: -1, r: +1, dir: 4 }, // SW
            { q:  0, r: +1, dir: 5 }  // SE
        ];

        const currentPos = unit.position;
        const targetPos = target.position;
        const lastDir = this.lastMoveDirection.get(unit.id);

        // 후보 셀 수집
        const candidates = [];

        for (const d of directions) {
            const newQ = currentPos.q + d.q;
            const newR = currentPos.r + d.r;
            const key = `${newQ},${newR}`;

            // 보드 범위 체크 (cells Map에 존재하는지)
            if (!this.board || !this.board.cells.has(key)) {
                continue;
            }

            // 다른 유닛이 점유 중인지 체크
            const boardCell = this.board.cells.get(key);
            const isOccupied = boardCell.unit &&
                              boardCell.unit.isAlive &&
                              boardCell.unit.id !== unit.id;

            if (isOccupied) {
                continue;
            }

            // 타겟까지의 거리 계산 (육각형 거리)
            const distance = hexDistance(
                { q: newQ, r: newR },
                targetPos
            );

            candidates.push({ q: newQ, r: newR, distance, dir: d.dir });
        }

        if (candidates.length === 0) return null;

        // 최소 거리 찾기
        const minDistance = Math.min(...candidates.map(c => c.distance));
        const bestCandidates = candidates.filter(c => c.distance === minDistance);

        // 최적 후보가 여러 개면 이전과 다른 방향 우선 (진동 방지)
        let selected;
        if (bestCandidates.length > 1 && lastDir !== undefined) {
            // 반대 방향이 아닌 것 선택 (반대 방향 = (dir + 3) % 6)
            const oppositeDir = (lastDir + 3) % 6;
            const differentDir = bestCandidates.find(c => c.dir !== oppositeDir);
            selected = differentDir || bestCandidates[0];
        } else {
            selected = bestCandidates[0];
        }

        // 이동 방향 기록
        this.lastMoveDirection.set(unit.id, selected.dir);

        return { q: selected.q, r: selected.r };
    }

    /**
     * 유닛 이동 (육각형 좌표 시스템)
     */
    moveUnit(unit, newPosition) {
        const oldPosition = unit.position;
        const newKey = `${newPosition.q},${newPosition.r}`;
        const oldKey = `${oldPosition.q},${oldPosition.r}`;

        // 보드 셀 업데이트
        if (this.board && this.board.cells.has(newKey)) {
            const newCell = this.board.cells.get(newKey);

            // 이동 전 목표 셀 점유 체크 (경쟁 조건 방지)
            if (newCell.unit && newCell.unit.isAlive && newCell.unit.id !== unit.id) {
                return; // 이미 점유됨, 이동 취소
            }

            // 이전 셀에서 유닛 제거
            if (this.board.cells.has(oldKey)) {
                const oldCell = this.board.cells.get(oldKey);
                oldCell.unit = null;
                oldCell.element.classList.remove('occupied');
            }

            // 새 셀에 유닛 배치
            newCell.unit = unit;
            newCell.element.classList.add('occupied');

            // 유닛 위치 업데이트
            unit.position = { q: newPosition.q, r: newPosition.r };

            // DOM 요소 이동
            if (unit.element) {
                // 타겟 셀에 죽은 유닛 DOM 제거 (레이아웃 충돌 방지)
                const deadUnits = newCell.element.querySelectorAll('.unit.dead');
                deadUnits.forEach(el => el.remove());

                // 이동 애니메이션 클래스 추가
                unit.element.classList.add('moving');
                newCell.element.appendChild(unit.element);

                // 애니메이션 후 클래스 제거
                setTimeout(() => {
                    unit.element.classList.remove('moving');
                }, 300);
            }
        }
    }

    /**
     * 리셋
     */
    reset() {
        this.moveTimers.clear();
        this.lastMoveDirection.clear();
        this.board = null;
    }
}
