// 유닛 클래스 정의

class Unit {
    constructor(unitData, starLevel = 1) {
        this.id = generateUUID();
        this.unitId = unitData.id;
        this.name = unitData.name;
        this.cost = unitData.cost;
        this.weapon = unitData.weapon;
        this.race = unitData.race;
        this.skill = deepClone(unitData.skill);
        this.icon = unitData.icon;
        this.starLevel = starLevel;

        // 기본 스탯 (별 등급에 따라 증가)
        this.baseStats = deepClone(unitData.stats);
        this.calculateStats();

        // 전투 상태
        this.currentHp = this.stats.hp;
        this.currentMana = this.stats.mana;
        this.isAlive = true;
        this.position = null; // { q, r } - 육각형 좌표
        this.target = null;

        // 버프/디버프
        this.buffs = [];
        this.debuffs = [];

        // 시너지 적용 상태
        this.appliedSynergies = {
            race: null,
            weapon: null
        };

        // 전투 통계
        this.battleStats = {
            damageDealt: 0,
            damageTaken: 0,
            healing: 0,
            kills: 0
        };

        // 이벤트 리스너 참조 저장 (메모리 누수 방지)
        this.eventListeners = {
            mouseenter: null,
            mouseleave: null,
            dragstart: null,
            dragend: null,
            dblclick: null
        };

        // DOM 요소
        this.element = null;
    }

    /**
     * 스탯 계산 (별 등급 반영)
     */
    calculateStats() {
        const multipliers = {
            1: { hp: 1.0, attack: 1.0, skillPower: 1.0 },
            2: { hp: 1.8, attack: 1.8, skillPower: 1.5 },
            3: { hp: 3.2, attack: 3.2, skillPower: 2.0 }
        };

        const mult = multipliers[this.starLevel];

        this.stats = {
            hp: Math.floor(this.baseStats.hp * mult.hp),
            attack: Math.floor(this.baseStats.attack * mult.attack),
            attackSpeed: this.baseStats.attackSpeed,
            range: this.baseStats.range,
            defense: this.baseStats.defense,
            mana: this.baseStats.mana,
            maxMana: this.baseStats.maxMana,
            moveSpeed: this.baseStats.moveSpeed || 1.0,
            skillPower: mult.skillPower,
            critChance: 0,
            critDamage: 150, // 기본 치명타 피해 150%
            evasion: 0,
            lifesteal: 0,
            damageReduction: 0
        };
    }

    /**
     * 시너지 효과 적용
     */
    applySynergyEffects(effects, synergyId, type) {
        if (type === 'race') {
            this.appliedSynergies.race = synergyId;
        } else {
            this.appliedSynergies.weapon = synergyId;
        }

        // 각 효과 적용
        if (effects.hp) this.stats.hp += effects.hp;
        if (effects.attack) this.stats.attack = Math.floor(this.stats.attack * (1 + effects.attack / 100));
        if (effects.defense) this.stats.defense += effects.defense;
        if (effects.attackSpeed) this.stats.attackSpeed *= (1 + effects.attackSpeed / 100);
        if (effects.range) this.stats.range += effects.range;
        if (effects.critChance) this.stats.critChance += effects.critChance;
        if (effects.critDamage) this.stats.critDamage += effects.critDamage;
        if (effects.evasion) this.stats.evasion += effects.evasion;
        if (effects.lifesteal) this.stats.lifesteal += effects.lifesteal;
        if (effects.lifestealOnHit) this.stats.lifesteal += effects.lifestealOnHit;
        if (effects.damageReduction) this.stats.damageReduction += effects.damageReduction;
        if (effects.skillPower) this.stats.skillPower *= (1 + effects.skillPower / 100);
        if (effects.manaRegen) this.manaRegenBonus = (this.manaRegenBonus || 0) + effects.manaRegen;
        if (effects.startingMana) this.stats.mana += effects.startingMana;

        // 현재 체력도 업데이트
        this.currentHp = this.stats.hp;
        if (effects.startingMana) {
            this.currentMana = this.stats.mana;
        }
    }

    /**
     * 시너지 효과 초기화
     */
    resetSynergyEffects() {
        this.appliedSynergies = { race: null, weapon: null };
        this.manaRegenBonus = 0;
        this.calculateStats();
        this.currentHp = this.stats.hp;
        this.currentMana = this.stats.mana;
    }

    /**
     * 전투 초기화
     */
    initBattle() {
        this.currentHp = this.stats.hp;
        this.currentMana = this.stats.mana;
        this.isAlive = true;
        this.target = null;
        this.buffs = [];
        this.debuffs = [];
        this.battleStats = {
            damageDealt: 0,
            damageTaken: 0,
            healing: 0,
            kills: 0
        };
        this.hasUsedFirstDodge = false;
        this.killAttackSpeedBonus = 0;
    }

    /**
     * 피해 입기
     */
    takeDamage(damage, attacker, isTrueDamage = false) {
        if (!this.isAlive) return 0;

        // 회피 체크
        if (this.checkEvasion()) {
            this.showFloatingText('회피!', 'dodge');
            return 0;
        }

        // 방어력 계산 (고정 피해가 아닌 경우)
        let actualDamage = damage;
        if (!isTrueDamage) {
            actualDamage = Math.max(1, damage - this.stats.defense);
        }

        // 피해 감소 적용
        if (this.stats.damageReduction > 0) {
            actualDamage = Math.floor(actualDamage * (1 - this.stats.damageReduction / 100));
        }

        this.currentHp -= actualDamage;
        this.battleStats.damageTaken += actualDamage;

        // 마나 획득 (피격 시)
        this.gainMana(10);

        // 사망 체크
        if (this.currentHp <= 0) {
            // 부활 스킬 체크
            if (this.skill.effect === 'resurrect' && !this.hasResurrected) {
                this.hasResurrected = true;
                this.currentHp = Math.floor(this.stats.hp * (this.skill.value / 100));
                this.showFloatingText('부활!', 'resurrect');
            } else {
                this.die(attacker);
            }
        }

        this.updateBars();
        return actualDamage;
    }

    /**
     * 회피 체크
     */
    checkEvasion() {
        // 첫 공격 회피 (키키 3시너지)
        if (!this.hasUsedFirstDodge && this.firstAttackDodge) {
            this.hasUsedFirstDodge = true;
            return true;
        }

        return Math.random() * 100 < this.stats.evasion;
    }

    /**
     * 공격 실행
     */
    attack(target) {
        if (!this.isAlive || !target || !target.isAlive) return;

        let damage = this.stats.attack;

        // 치명타 체크
        const isCrit = Math.random() * 100 < this.stats.critChance;
        if (isCrit) {
            damage = Math.floor(damage * (this.stats.critDamage / 100));
        }

        // 처치 시 공격속도 보너스 적용
        if (this.killAttackSpeedBonus > 0) {
            // 이미 적용됨
        }

        const actualDamage = target.takeDamage(damage, this);
        this.battleStats.damageDealt += actualDamage;

        // 마나 획득 (공격 시)
        const manaGain = 10 * (1 + (this.manaRegenBonus || 0) / 100);
        this.gainMana(manaGain);

        // 흡혈
        if (this.stats.lifesteal > 0 && actualDamage > 0) {
            const healAmount = Math.floor(actualDamage * (this.stats.lifesteal / 100));
            this.heal(healAmount);
        }

        // 처치 체크
        if (!target.isAlive) {
            this.battleStats.kills++;

            // 처치 시 공격속도 보너스 (쌍검 3시너지)
            if (this.killAttackSpeedBonusEnabled) {
                this.killAttackSpeedBonus += 20;
                this.stats.attackSpeed *= 1.2;
            }
        }

        // 시각 효과
        this.showAttackAnimation();
        if (isCrit) {
            target.showFloatingText(actualDamage, 'crit');
        } else {
            target.showFloatingText(actualDamage, 'damage');
        }

        return actualDamage;
    }

    /**
     * 스킬 사용
     */
    useSkill(allies, enemies) {
        if (this.currentMana < this.stats.maxMana) return false;

        this.currentMana = 0;
        const skillPower = this.stats.skillPower;

        // 스킬 효과에 따른 처리
        switch (this.skill.effect) {
            case 'magic_damage':
                if (this.target && this.target.isAlive) {
                    const damage = Math.floor(this.skill.value * skillPower);
                    this.target.takeDamage(damage, this, true);
                    this.target.showFloatingText(damage, 'magic');
                }
                break;

            case 'aoe_damage':
                enemies.filter(e => e.isAlive).forEach(enemy => {
                    const damage = Math.floor(this.stats.attack * (this.skill.value / 100) * skillPower);
                    enemy.takeDamage(damage, this);
                });
                break;

            case 'aoe_magic_damage':
                enemies.filter(e => e.isAlive).forEach(enemy => {
                    const damage = Math.floor(this.skill.value * skillPower);
                    enemy.takeDamage(damage, this, true);
                });
                break;

            case 'heal':
                const healAmount = Math.floor(this.skill.value * skillPower);
                this.heal(healAmount);
                break;

            case 'defense_buff':
                this.addBuff('defense', this.skill.value, this.skill.duration);
                break;

            case 'evasion_buff':
                this.addBuff('evasion', this.skill.value, this.skill.duration);
                break;

            case 'ally_defense_buff':
                allies.filter(a => a.isAlive).forEach(ally => {
                    ally.addBuff('defense', this.skill.value, this.skill.duration);
                });
                break;

            case 'ally_buff':
                allies.filter(a => a.isAlive).forEach(ally => {
                    ally.addBuff('attack', this.skill.attackBuff, this.skill.duration);
                    ally.addBuff('attackSpeed', this.skill.attackSpeedBuff, this.skill.duration);
                });
                break;

            case 'enemy_attack_debuff':
                enemies.filter(e => e.isAlive).forEach(enemy => {
                    enemy.addDebuff('attack', this.skill.value, this.skill.duration);
                });
                break;

            case 'multi_attack':
                for (let i = 0; i < this.skill.value; i++) {
                    if (this.target && this.target.isAlive) {
                        this.attack(this.target);
                    }
                }
                break;

            case 'true_damage':
                if (this.target && this.target.isAlive) {
                    const damage = Math.floor(this.skill.value * skillPower);
                    this.target.takeDamage(damage, this, true);
                    this.target.showFloatingText(damage, 'true');
                }
                break;

            case 'backstab':
                // 후열 적 찾기
                const backlineEnemies = enemies.filter(e => e.isAlive && e.position.row === 0);
                if (backlineEnemies.length > 0) {
                    const target = randomChoice(backlineEnemies);
                    const damage = Math.floor(this.stats.attack * (this.skill.value / 100) * skillPower);
                    target.takeDamage(damage, this);
                    target.showFloatingText(damage, 'crit');
                }
                break;

            case 'stun':
                if (this.target && this.target.isAlive) {
                    const damage = Math.floor(this.skill.value * skillPower);
                    this.target.takeDamage(damage, this);
                    this.target.addDebuff('stun', 0, this.skill.duration);
                }
                break;

            case 'execute':
                if (this.target && this.target.isAlive) {
                    const damage = Math.floor(this.skill.value * skillPower);
                    this.target.takeDamage(damage, this);

                    // 즉사 확률
                    if (Math.random() * 100 < this.skill.executeChance) {
                        this.target.takeDamage(this.target.currentHp, this, true);
                        this.target.showFloatingText('즉사!', 'execute');
                    }
                }
                break;

            case 'resurrect':
                // 패시브 - 사망 시 자동 발동
                break;
        }

        this.showSkillAnimation();
        this.updateBars();
        return true;
    }

    /**
     * 마나 획득
     */
    gainMana(amount) {
        this.currentMana = Math.min(this.currentMana + amount, this.stats.maxMana);
        this.updateBars();
    }

    /**
     * 치유
     */
    heal(amount) {
        if (!this.isAlive) return;

        const actualHeal = Math.min(amount, this.stats.hp - this.currentHp);
        this.currentHp += actualHeal;
        this.battleStats.healing += actualHeal;

        if (actualHeal > 0) {
            this.showFloatingText('+' + actualHeal, 'heal');
        }

        this.updateBars();
    }

    /**
     * 버프 추가
     */
    addBuff(type, value, duration) {
        this.buffs.push({ type, value, duration, startTime: Date.now() });

        // 즉시 효과 적용
        switch (type) {
            case 'defense':
                this.stats.defense += value;
                break;
            case 'evasion':
                this.stats.evasion += value;
                break;
            case 'attack':
                this.stats.attack = Math.floor(this.stats.attack * (1 + value / 100));
                break;
            case 'attackSpeed':
                this.stats.attackSpeed *= (1 + value / 100);
                break;
        }
    }

    /**
     * 디버프 추가
     */
    addDebuff(type, value, duration) {
        this.debuffs.push({ type, value, duration, startTime: Date.now() });

        // 즉시 효과 적용
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

        // 버프 체크
        this.buffs = this.buffs.filter(buff => {
            const elapsed = (now - buff.startTime) / 1000;
            if (elapsed >= buff.duration) {
                // 버프 효과 제거
                switch (buff.type) {
                    case 'defense':
                        this.stats.defense -= buff.value;
                        break;
                    case 'evasion':
                        this.stats.evasion -= buff.value;
                        break;
                }
                return false;
            }
            return true;
        });

        // 디버프 체크
        this.debuffs = this.debuffs.filter(debuff => {
            const elapsed = (now - debuff.startTime) / 1000;
            if (elapsed >= debuff.duration) {
                // 디버프 효과 제거
                switch (debuff.type) {
                    case 'stun':
                        this.isStunned = false;
                        break;
                }
                return false;
            }
            return true;
        });
    }

    /**
     * 사망 처리
     * - 셀 정리는 CombatManager.cleanupDeadUnits()가 담당
     * - position은 유지 (CombatManager가 정리 후 null로 설정)
     */
    die(killer) {
        if (!this.isAlive) return; // 중복 호출 방지

        this.isAlive = false;
        this.currentHp = 0;

        // DOM 요소에 dead 클래스 추가 (시각적 표시)
        if (this.element) {
            this.element.classList.add('dead');
        }

        debugConsole.log('Unit', `${this.name} 사망`, { position: this.position });
    }

    /**
     * DOM 요소 생성
     */
    createElement() {
        const unit = createElement('div', `unit ${getTierClass(this.cost)}`);
        unit.setAttribute('data-unit-id', this.id);
        unit.draggable = true;

        // 별 표시
        const stars = createElement('div', 'unit-stars', getStarsString(this.starLevel));
        unit.appendChild(stars);

        // 종족 아이콘
        const raceIcon = createElement('div', 'unit-race-icon');
        raceIcon.textContent = RACE_ICONS[this.race];
        unit.appendChild(raceIcon);

        // 유닛 아이콘
        const icon = createElement('div', 'unit-icon', this.icon);
        unit.appendChild(icon);

        // 유닛 이름
        const name = createElement('div', 'unit-name', this.name);
        unit.appendChild(name);

        // 무기 아이콘
        const weaponIcon = createElement('div', 'unit-weapon-icon', WEAPON_ICONS[this.weapon]);
        unit.appendChild(weaponIcon);

        // 체력바, 마나바 (전투 중 표시)
        const bars = createElement('div', 'unit-bars');
        bars.innerHTML = `
            <div class="hp-bar"><div class="hp-bar-fill" style="width: 100%"></div></div>
            <div class="mana-bar"><div class="mana-bar-fill" style="width: 0%"></div></div>
        `;
        unit.appendChild(bars);

        this.element = unit;
        return unit;
    }

    /**
     * 체력바/마나바 업데이트
     */
    updateBars() {
        if (!this.element) return;

        const hpFill = this.element.querySelector('.hp-bar-fill');
        const manaFill = this.element.querySelector('.mana-bar-fill');

        if (hpFill) {
            const hpPercent = (this.currentHp / this.stats.hp) * 100;
            hpFill.style.width = `${Math.max(0, hpPercent)}%`;
        }

        if (manaFill) {
            const manaPercent = (this.currentMana / this.stats.maxMana) * 100;
            manaFill.style.width = `${Math.min(100, manaPercent)}%`;
        }
    }

    /**
     * 플로팅 텍스트 표시
     */
    showFloatingText(text, type) {
        if (!this.element) return;

        const floating = createElement('div', `damage-number ${type}`);
        floating.textContent = text;

        const rect = this.element.getBoundingClientRect();
        floating.style.left = `${rect.left + rect.width / 2}px`;
        floating.style.top = `${rect.top}px`;

        document.body.appendChild(floating);

        setTimeout(() => floating.remove(), 1000);
    }

    /**
     * 공격 애니메이션
     */
    showAttackAnimation() {
        if (!this.element) return;
        this.element.classList.add('attacking');
        setTimeout(() => this.element.classList.remove('attacking'), 300);
    }

    /**
     * 스킬 애니메이션
     */
    showSkillAnimation() {
        if (!this.element) return;
        // 스킬 이펙트는 추후 구현
    }

    /**
     * 유닛 정보 객체 반환
     */
    getInfo() {
        return {
            id: this.id,
            unitId: this.unitId,
            name: this.name,
            cost: this.cost,
            weapon: this.weapon,
            race: this.race,
            starLevel: this.starLevel,
            stats: { ...this.stats },
            skill: { ...this.skill },
            icon: this.icon
        };
    }

    /**
     * 모든 이벤트 리스너 제거 (메모리 누수 방지)
     */
    removeAllEventListeners() {
        if (!this.element) return;

        Object.entries(this.eventListeners).forEach(([event, listener]) => {
            if (listener) {
                this.element.removeEventListener(event, listener);
            }
        });

        // 참조 초기화
        this.eventListeners = {
            mouseenter: null,
            mouseleave: null,
            dragstart: null,
            dragend: null,
            dblclick: null
        };
    }
}

/**
 * 적 유닛 클래스
 */
class EnemyUnit {
    constructor(enemyData) {
        this.id = generateUUID();
        this.unitId = enemyData.id;
        this.name = enemyData.name;
        this.icon = enemyData.icon;
        this.isBoss = enemyData.isBoss || false;

        this.stats = deepClone(enemyData.stats);
        this.stats.critChance = 0;
        this.stats.critDamage = 150;
        this.stats.evasion = 0;
        this.stats.lifesteal = 0;
        this.stats.damageReduction = 0;

        this.currentHp = this.stats.hp;
        this.isAlive = true;
        this.position = null;
        this.target = null;

        // 버프/디버프 시스템
        this.debuffs = [];
        this.isStunned = false;

        this.element = null;
    }

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

    attack(target) {
        if (!this.isAlive || !target || !target.isAlive) return;

        const damage = this.stats.attack;
        target.takeDamage(damage, this);

        this.showAttackAnimation();
        target.showFloatingText(damage, 'damage');
    }

    /**
     * 사망 처리 (적 유닛)
     * - 셀 정리는 CombatManager.cleanupDeadUnits()가 담당
     */
    die(killer) {
        if (!this.isAlive) return; // 중복 호출 방지

        this.isAlive = false;
        this.currentHp = 0;

        // DOM 요소에 dead 클래스 추가 (시각적 표시)
        if (this.element) {
            this.element.classList.add('dead');
        }

        debugConsole.log('Unit', `${this.name} 사망 (적)`, { position: this.position });
    }

    createElement() {
        const unit = createElement('div', 'unit enemy-unit');
        unit.setAttribute('data-unit-id', this.id);

        if (this.isBoss) {
            unit.classList.add('boss');
        }

        const icon = createElement('div', 'unit-icon', this.icon);
        unit.appendChild(icon);

        const name = createElement('div', 'unit-name', this.name);
        unit.appendChild(name);

        const bars = createElement('div', 'unit-bars');
        bars.innerHTML = `
            <div class="hp-bar"><div class="hp-bar-fill" style="width: 100%"></div></div>
        `;
        unit.appendChild(bars);

        this.element = unit;
        return unit;
    }

    updateBars() {
        if (!this.element) return;

        const hpFill = this.element.querySelector('.hp-bar-fill');
        if (hpFill) {
            const hpPercent = (this.currentHp / this.stats.hp) * 100;
            hpFill.style.width = `${Math.max(0, hpPercent)}%`;
        }
    }

    showFloatingText(text, type) {
        if (!this.element) return;

        const floating = createElement('div', `damage-number ${type}`);
        floating.textContent = text;

        const rect = this.element.getBoundingClientRect();
        floating.style.left = `${rect.left + rect.width / 2}px`;
        floating.style.top = `${rect.top}px`;

        document.body.appendChild(floating);

        setTimeout(() => floating.remove(), 1000);
    }

    showAttackAnimation() {
        if (!this.element) return;
        this.element.classList.add('attacking');
        setTimeout(() => this.element.classList.remove('attacking'), 300);
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
