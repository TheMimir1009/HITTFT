// 공격 시스템 클래스

class AttackSystem {
    constructor() {
        // 공격 타이머 (유닛별)
        this.attackTimers = new Map();
    }

    /**
     * 유닛 공격 타이머 등록
     */
    registerUnit(unitId) {
        this.attackTimers.set(unitId, 0);
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
     * 타겟 업데이트 (없거나 죽었으면 재탐색)
     */
    updateTarget(unit, enemies) {
        if (!unit.target || !unit.target.isAlive || !unit.target.position) {
            unit.target = this.findTarget(unit, enemies);
        }
    }

    /**
     * 공격 처리
     */
    processAttack(unit, enemies, allies, deltaTime) {
        if (!unit.position) return;

        // 타겟 업데이트
        this.updateTarget(unit, enemies);

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
                if (unit.currentMana !== undefined && unit.currentMana >= unit.stats.maxMana) {
                    unit.useSkill(allies, enemies);
                }

                this.attackTimers.set(unit.id, 0);
            } else {
                this.attackTimers.set(unit.id, newTimer);
            }
        }
    }

    /**
     * 리셋
     */
    reset() {
        this.attackTimers.clear();
    }
}
