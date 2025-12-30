// 전투 시스템 관리 클래스

class CombatManager {
    constructor() {
        this.isRunning = false;
        this.playerUnits = [];
        this.enemyUnits = [];
        this.combatTimer = null;
        this.tickInterval = 100; // 100ms마다 업데이트
        this.combatSpeed = 1; // 전투 속도 배율

        // 공격 타이머 (유닛별)
        this.attackTimers = new Map();
        // 이동 타이머 (유닛별)
        this.moveTimers = new Map();
        // 이동 방향 이력 (유닛별) - 진동 방지용
        this.lastMoveDirection = new Map();
        // 보드 참조
        this.board = null;
    }

    /**
     * 전투 시작
     */
    async start(playerUnits, enemyUnits, synergyManager, board) {
        this.isRunning = true;
        this.playerUnits = playerUnits;
        this.enemyUnits = enemyUnits;
        this.board = board;

        // 유닛 전투 초기화
        this.playerUnits.forEach(unit => {
            unit.initBattle();
            this.attackTimers.set(unit.id, 0);
            this.moveTimers.set(unit.id, 0);
        });

        this.enemyUnits.forEach(unit => {
            this.attackTimers.set(unit.id, 0);
            this.moveTimers.set(unit.id, 0);
        });

        // 이동 방향 이력 초기화
        this.lastMoveDirection.clear();

        // 벨루아 시너지 적 디버프 적용
        const enemyDebuffs = synergyManager.getEnemyDebuffs();
        if (enemyDebuffs.attackReduction > 0) {
            this.enemyUnits.forEach(enemy => {
                enemy.stats.attack = Math.floor(enemy.stats.attack * (1 - enemyDebuffs.attackReduction / 100));
            });
        }

        // 전투 루프 시작
        return new Promise((resolve) => {
            this.combatTimer = setInterval(() => {
                try {
                    this.tick();

                    // 전투 종료 체크
                    const result = this.checkBattleEnd();
                    if (result !== null) {
                        debugConsole.log('Combat', '전투 종료', result);
                        try {
                            this.stop();
                        } catch (stopError) {
                            debugConsole.log('Error', `stop() 에러: ${stopError.message}`);
                        }
                        debugConsole.log('Combat', 'resolve 호출 직전');
                        resolve(result);
                    }
                } catch (error) {
                    debugConsole.log('Error', `전투 오류: ${error.message}`, { stack: error.stack });
                    console.error('[Combat] tick 에러:', error);
                    // 에러 발생 시 강제 종료
                    this.stop();
                    resolve({
                        victory: false,
                        remainingPlayerUnits: 0,
                        remainingEnemyUnits: 0,
                        error: true
                    });
                }
            }, this.tickInterval);
        });
    }

    /**
     * 전투 틱 (매 프레임) - 2단계 이동 처리로 충돌 방지
     */
    tick() {
        if (!this.isRunning) return;

        const deltaTime = (this.tickInterval / 1000) * this.combatSpeed;

        // === 1단계: 이동 의도 수집 ===
        const moveIntents = new Map(); // unitId → { q, r }

        this.playerUnits.forEach(unit => {
            if (unit.isAlive && !unit.isStunned) {
                const intent = this.collectMoveIntent(unit, this.enemyUnits, this.playerUnits, deltaTime);
                if (intent) moveIntents.set(unit.id, { target: intent, unit });
            }
        });

        this.enemyUnits.forEach(unit => {
            if (unit.isAlive && !unit.isStunned) {
                const intent = this.collectMoveIntent(unit, this.playerUnits, this.enemyUnits, deltaTime);
                if (intent) moveIntents.set(unit.id, { target: intent, unit });
            }
        });

        // === 2단계: 충돌 해결 ===
        const resolvedMoves = this.resolveCollisions(moveIntents);

        // === 3단계: 안전한 이동만 실행 ===
        resolvedMoves.forEach(({ unit, target }) => {
            this.moveUnit(unit, target);
        });

        // === 4단계: 공격 및 버프 처리 ===
        this.playerUnits.forEach(unit => {
            if (unit.isAlive && !unit.isStunned) {
                this.processAttack(unit, this.enemyUnits, this.playerUnits, deltaTime);
            }
            unit.updateBuffsAndDebuffs();
        });

        this.enemyUnits.forEach(unit => {
            if (unit.isAlive && !unit.isStunned) {
                this.processAttack(unit, this.playerUnits, this.enemyUnits, deltaTime);
            }
            unit.updateBuffsAndDebuffs();
        });

        // 디버그: 매 10틱마다 생존 유닛 수 로깅
        this.tickCount = (this.tickCount || 0) + 1;
        if (this.tickCount % 10 === 0) {
            const alivePlayer = this.playerUnits.filter(u => u.isAlive).length;
            const aliveEnemy = this.enemyUnits.filter(u => u.isAlive).length;
            debugConsole.log('Combat', `tick ${this.tickCount}: 플레이어 ${alivePlayer}명, 적 ${aliveEnemy}명`);
        }

        // ★ 매 틱 후 사망자 정리 (셀 점유 해제, DOM 제거)
        this.cleanupDeadUnits();
    }

    /**
     * 이동 의도 수집 (실제 이동 없음)
     */
    collectMoveIntent(unit, enemies, allies, deltaTime) {
        if (!unit.position) return null;

        // 타겟 설정
        if (!unit.target || !unit.target.isAlive || !unit.target.position) {
            unit.target = this.findTarget(unit, enemies);
        }

        if (!unit.target || !unit.target.position) return null;

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
     * 공격 처리 (이동과 분리)
     */
    processAttack(unit, enemies, allies, deltaTime) {
        if (!unit.position) return;

        // 타겟 설정
        if (!unit.target || !unit.target.isAlive || !unit.target.position) {
            unit.target = this.findTarget(unit, enemies);
        }

        if (!unit.target || !unit.target.position) return;

        // 사거리 체크
        const distance = calculateDistance(unit.position, unit.target.position);

        if (distance <= unit.stats.range) {
            // 사거리 내: 공격 처리
            const currentTimer = this.attackTimers.get(unit.id) || 0;
            const newTimer = currentTimer + deltaTime;
            const attackCooldown = 1 / unit.stats.attackSpeed;

            if (newTimer >= attackCooldown) {
                unit.attack(unit.target);

                // 스킬 사용 체크 (플레이어 유닛만)
                if (unit.currentMana >= unit.stats.maxMana) {
                    unit.useSkill(allies, enemies);
                }

                this.attackTimers.set(unit.id, 0);
            } else {
                this.attackTimers.set(unit.id, newTimer);
            }
        }
    }

    /**
     * 유닛 업데이트
     */
    updateUnit(unit, enemies, allies, deltaTime) {
        // 자신의 position null 체크
        if (!unit.position) return;

        // 타겟 설정 (타겟이 없거나, 죽었거나, 위치가 없으면 재탐색)
        if (!unit.target || !unit.target.isAlive || !unit.target.position) {
            unit.target = this.findTarget(unit, enemies);
        }

        // 타겟이 없거나 타겟 위치가 없으면 스킵
        if (!unit.target || !unit.target.position) return;

        // 사거리 체크
        const distance = calculateDistance(unit.position, unit.target.position);

        if (distance <= unit.stats.range) {
            // 사거리 내: 공격 처리
            const currentTimer = this.attackTimers.get(unit.id) || 0;
            const newTimer = currentTimer + deltaTime;
            const attackCooldown = 1 / unit.stats.attackSpeed;

            if (newTimer >= attackCooldown) {
                // 공격 실행
                unit.attack(unit.target);

                // 스킬 사용 체크
                if (unit.currentMana >= unit.stats.maxMana) {
                    unit.useSkill(allies, enemies);
                }

                this.attackTimers.set(unit.id, 0);
            } else {
                this.attackTimers.set(unit.id, newTimer);
            }
        } else {
            // 사거리 밖: 이동 처리
            const moveTimer = this.moveTimers.get(unit.id) || 0;
            const newMoveTimer = moveTimer + deltaTime;
            const moveCooldown = 1 / (unit.stats.moveSpeed || 1.0);

            if (newMoveTimer >= moveCooldown) {
                const allUnits = [...allies, ...enemies];
                const nextCell = this.findNextMoveCell(unit, unit.target, allUnits);

                if (nextCell) {
                    this.moveUnit(unit, nextCell);
                }

                this.moveTimers.set(unit.id, 0);
            } else {
                this.moveTimers.set(unit.id, newMoveTimer);
            }
        }
    }

    /**
     * 적 유닛 업데이트
     */
    updateEnemyUnit(unit, targets, deltaTime) {
        // 자신의 position null 체크
        if (!unit.position) return;

        // 타겟 설정 (타겟이 없거나, 죽었거나, 위치가 없으면 재탐색)
        if (!unit.target || !unit.target.isAlive || !unit.target.position) {
            unit.target = this.findTarget(unit, targets);
        }

        // 타겟이 없거나 타겟 위치가 없으면 스킵
        if (!unit.target || !unit.target.position) return;

        // 사거리 체크
        const distance = calculateDistance(unit.position, unit.target.position);

        if (distance <= unit.stats.range) {
            // 사거리 내: 공격 처리
            const currentTimer = this.attackTimers.get(unit.id) || 0;
            const newTimer = currentTimer + deltaTime;
            const attackCooldown = 1 / unit.stats.attackSpeed;

            if (newTimer >= attackCooldown) {
                unit.attack(unit.target);
                this.attackTimers.set(unit.id, 0);
            } else {
                this.attackTimers.set(unit.id, newTimer);
            }
        } else {
            // 사거리 밖: 이동 처리
            const moveTimer = this.moveTimers.get(unit.id) || 0;
            const newMoveTimer = moveTimer + deltaTime;
            const moveCooldown = 1 / (unit.stats.moveSpeed || 1.0);

            if (newMoveTimer >= moveCooldown) {
                const allUnits = [...targets, ...this.enemyUnits];
                const nextCell = this.findNextMoveCell(unit, unit.target, allUnits);

                if (nextCell) {
                    this.moveUnit(unit, nextCell);
                }

                this.moveTimers.set(unit.id, 0);
            } else {
                this.moveTimers.set(unit.id, newMoveTimer);
            }
        }
    }

    /**
     * 타겟 찾기 (가장 가까운 적, 같으면 체력 낮은 적)
     */
    findTarget(unit, enemies) {
        const aliveEnemies = enemies.filter(e => e.isAlive && e.position);
        if (aliveEnemies.length === 0) return null;

        // 사거리 내 적 우선
        const inRangeEnemies = aliveEnemies.filter(e => {
            const distance = calculateDistance(unit.position, e.position);
            return distance <= unit.stats.range;
        });

        const targetPool = inRangeEnemies.length > 0 ? inRangeEnemies : aliveEnemies;

        // 거리순 정렬, 같으면 체력순
        targetPool.sort((a, b) => {
            const distA = calculateDistance(unit.position, a.position);
            const distB = calculateDistance(unit.position, b.position);

            if (distA !== distB) {
                return distA - distB;
            }

            return a.currentHp - b.currentHp;
        });

        return targetPool[0];
    }

    /**
     * 전투 종료 체크
     */
    checkBattleEnd() {
        const alivePlayerUnits = this.playerUnits.filter(u => u.isAlive);
        const aliveEnemyUnits = this.enemyUnits.filter(u => u.isAlive);

        if (aliveEnemyUnits.length === 0) {
            // 플레이어 승리
            return {
                victory: true,
                remainingPlayerUnits: alivePlayerUnits.length,
                remainingEnemyUnits: 0
            };
        }

        if (alivePlayerUnits.length === 0) {
            // 플레이어 패배
            return {
                victory: false,
                remainingPlayerUnits: 0,
                remainingEnemyUnits: aliveEnemyUnits.length
            };
        }

        return null; // 전투 계속
    }

    /**
     * 전투 중지
     */
    stop() {
        debugConsole.log('Combat', `전투 중지 (총 ${this.tickCount || 0} tick)`);
        this.isRunning = false;
        if (this.combatTimer) {
            clearInterval(this.combatTimer);
            this.combatTimer = null;
        }
        this.attackTimers.clear();
        this.moveTimers.clear();
        this.lastMoveDirection.clear();
        this.tickCount = 0;
        this.board = null;
    }

    /**
     * 사망한 유닛들의 셀 정리 (매 틱 후 호출)
     * - 보드 점유 삭제
     * - 보드 색상 원복
     * - 기물 DOM 제거
     */
    cleanupDeadUnits() {
        if (!this.board) return;

        const allUnits = [...this.playerUnits, ...this.enemyUnits];

        allUnits.forEach(unit => {
            // 사망했고 아직 position이 있는 유닛만 처리
            if (!unit.isAlive && unit.position) {
                const key = `${unit.position.q},${unit.position.r}`;
                const cell = this.board.cells.get(key);

                if (cell) {
                    // 1. 보드 점유 삭제
                    cell.unit = null;

                    // 2. 보드 색상 원복
                    cell.element.classList.remove('occupied');

                    debugConsole.log('Combat', `셀 정리: ${key}`);
                }

                // 3. 기물 제거 (DOM)
                if (unit.element && unit.element.parentNode) {
                    unit.element.parentNode.removeChild(unit.element);
                }

                // position 초기화 (재정리 방지)
                unit.position = null;
            }
        });
    }

    /**
     * 다음 이동 셀 찾기 (타겟에 가장 가까운 빈 인접 셀, 육각형 6방향)
     */
    findNextMoveCell(unit, target, allUnits) {
        // 육각형 6방향 (hexUtils.js의 hexNeighbors와 동일)
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
     * 전투 속도 설정
     */
    setSpeed(speed) {
        this.combatSpeed = speed;
    }

    /**
     * 전투 통계 가져오기
     */
    getBattleStats() {
        const playerStats = {
            totalDamage: 0,
            totalHealing: 0,
            totalKills: 0
        };

        this.playerUnits.forEach(unit => {
            playerStats.totalDamage += unit.battleStats.damageDealt;
            playerStats.totalHealing += unit.battleStats.healing;
            playerStats.totalKills += unit.battleStats.kills;
        });

        return playerStats;
    }
}
