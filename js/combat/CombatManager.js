// 전투 시스템 관리 클래스 (조정자)

class CombatManager {
    constructor() {
        this.isRunning = false;
        this.playerUnits = [];
        this.enemyUnits = [];
        this.combatTimer = null;
        this.tickInterval = 100; // 100ms마다 업데이트
        this.combatSpeed = 1; // 전투 속도 배율
        this.tickCount = 0;

        // 서브시스템
        this.movementSystem = new MovementSystem();
        this.attackSystem = new AttackSystem();

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
        this.tickCount = 0;

        // 서브시스템 초기화
        this.movementSystem.init(board);
        this.attackSystem.reset();

        // 유닛 전투 초기화
        this.playerUnits.forEach(unit => {
            unit.initBattle();
            this.movementSystem.registerUnit(unit.id);
            this.attackSystem.registerUnit(unit.id);
        });

        this.enemyUnits.forEach(unit => {
            this.movementSystem.registerUnit(unit.id);
            this.attackSystem.registerUnit(unit.id);
        });

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

        // === 1단계: 타겟 업데이트 ===
        this.playerUnits.forEach(unit => {
            if (unit.isAlive && !unit.isStunned) {
                this.attackSystem.updateTarget(unit, this.enemyUnits);
            }
        });

        this.enemyUnits.forEach(unit => {
            if (unit.isAlive && !unit.isStunned) {
                this.attackSystem.updateTarget(unit, this.playerUnits);
            }
        });

        // === 2단계: 이동 의도 수집 ===
        const moveIntents = new Map();

        this.playerUnits.forEach(unit => {
            if (unit.isAlive && !unit.isStunned) {
                const intent = this.movementSystem.collectMoveIntent(unit, this.enemyUnits, this.playerUnits, deltaTime);
                if (intent) moveIntents.set(unit.id, { target: intent, unit });
            }
        });

        this.enemyUnits.forEach(unit => {
            if (unit.isAlive && !unit.isStunned) {
                const intent = this.movementSystem.collectMoveIntent(unit, this.playerUnits, this.enemyUnits, deltaTime);
                if (intent) moveIntents.set(unit.id, { target: intent, unit });
            }
        });

        // === 3단계: 충돌 해결 ===
        const resolvedMoves = this.movementSystem.resolveCollisions(moveIntents);

        // === 4단계: 안전한 이동만 실행 ===
        resolvedMoves.forEach(({ unit, target }) => {
            this.movementSystem.moveUnit(unit, target);
        });

        // === 5단계: 공격 및 버프 처리 ===
        this.playerUnits.forEach(unit => {
            if (unit.isAlive && !unit.isStunned) {
                this.attackSystem.processAttack(unit, this.enemyUnits, this.playerUnits, deltaTime);
            }
            unit.updateBuffsAndDebuffs();
        });

        this.enemyUnits.forEach(unit => {
            if (unit.isAlive && !unit.isStunned) {
                this.attackSystem.processAttack(unit, this.playerUnits, this.enemyUnits, deltaTime);
            }
            unit.updateBuffsAndDebuffs();
        });

        // 디버그: 매 10틱마다 생존 유닛 수 로깅
        this.tickCount++;
        if (this.tickCount % 10 === 0) {
            const alivePlayer = this.playerUnits.filter(u => u.isAlive).length;
            const aliveEnemy = this.enemyUnits.filter(u => u.isAlive).length;
            debugConsole.log('Combat', `tick ${this.tickCount}: 플레이어 ${alivePlayer}명, 적 ${aliveEnemy}명`);
        }

        // === 6단계: 매 틱 후 사망자 정리 ===
        this.cleanupDeadUnits();
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
        debugConsole.log('Combat', `전투 중지 (총 ${this.tickCount} tick)`);
        this.isRunning = false;
        if (this.combatTimer) {
            clearInterval(this.combatTimer);
            this.combatTimer = null;
        }

        // 서브시스템 리셋
        this.movementSystem.reset();
        this.attackSystem.reset();

        this.tickCount = 0;
        this.board = null;
    }

    /**
     * 사망한 유닛들의 셀 정리 (매 틱 후 호출)
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
