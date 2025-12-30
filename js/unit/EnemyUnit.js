// 적 유닛 클래스

class EnemyUnit {
    constructor(enemyData) {
        this.id = generateUUID();
        this.unitId = enemyData.id;
        this.name = enemyData.name;
        this.icon = enemyData.icon;
        this.isBoss = enemyData.isBoss || false;

        // 스탯 초기화
        this.stats = deepClone(enemyData.stats);
        this.stats.critChance = 0;
        this.stats.critDamage = 150;
        this.stats.evasion = 0;
        this.stats.lifesteal = 0;
        this.stats.damageReduction = 0;

        // 전투 상태
        this.currentHp = this.stats.hp;
        this.isAlive = true;
        this.position = null;
        this.target = null;

        // 버프/디버프 시스템
        this.debuffs = [];
        this.isStunned = false;

        // DOM 요소
        this.element = null;
    }

    /**
     * 피해 입기
     */
    takeDamage(damage, attacker, isTrueDamage = false) {
        if (!this.isAlive) return 0;

        let actualDamage = damage;
        if (!isTrueDamage) {
            actualDamage = Math.max(1, damage - this.stats.defense);
        }

        this.currentHp -= actualDamage;

        if (this.currentHp <= 0) {
            this.die(attacker);
        }

        this.updateBars();
        return actualDamage;
    }

    /**
     * 공격 실행
     */
    attack(target) {
        if (!this.isAlive || !target || !target.isAlive) return;

        const damage = this.stats.attack;
        target.takeDamage(damage, this);

        this.showAttackAnimation();
        target.showFloatingText(damage, 'damage');
    }

    /**
     * 사망 처리
     */
    die(killer) {
        if (!this.isAlive) return; // 중복 호출 방지

        this.isAlive = false;
        this.currentHp = 0;

        // DOM 요소에 dead 클래스 추가
        UnitRenderer.markAsDead(this.element);

        debugConsole.log('Unit', `${this.name} 사망 (적)`, { position: this.position });
    }

    /**
     * DOM 요소 생성
     */
    createElement() {
        this.element = UnitRenderer.createEnemyElement(this);
        return this.element;
    }

    /**
     * 체력바 업데이트
     */
    updateBars() {
        UnitRenderer.updateBars(this.element, this.currentHp, this.stats.hp);
    }

    /**
     * 플로팅 텍스트 표시
     */
    showFloatingText(text, type) {
        UnitRenderer.showFloatingText(this.element, text, type);
    }

    /**
     * 공격 애니메이션
     */
    showAttackAnimation() {
        UnitRenderer.showAttackAnimation(this.element);
    }

    /**
     * 디버프 추가
     */
    addDebuff(type, value, duration) {
        this.debuffs.push({ type, value, duration, startTime: Date.now() });

        switch (type) {
            case 'attack':
                this.stats.attack = Math.floor(this.stats.attack * (1 - value / 100));
                break;
            case 'stun':
                this.isStunned = true;
                break;
        }
    }

    /**
     * 버프/디버프 업데이트
     */
    updateBuffsAndDebuffs() {
        const now = Date.now();

        this.debuffs = this.debuffs.filter(debuff => {
            const elapsed = (now - debuff.startTime) / 1000;
            if (elapsed >= debuff.duration) {
                // 디버프 효과 제거
                if (debuff.type === 'stun') {
                    this.isStunned = false;
                }
                return false;
            }
            return true;
        });
    }
}
