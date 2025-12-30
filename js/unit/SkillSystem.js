// 스킬 시스템 클래스

class SkillSystem {
    /**
     * 스킬 실행
     * @param {Unit} unit - 스킬 사용자
     * @param {Unit[]} allies - 아군 목록
     * @param {Unit[]} enemies - 적군 목록
     * @returns {boolean} 스킬 사용 여부
     */
    static execute(unit, allies, enemies) {
        if (unit.currentMana < unit.stats.maxMana) return false;

        unit.currentMana = 0;
        const skillPower = unit.stats.skillPower;
        const skill = unit.skill;

        switch (skill.effect) {
            case 'magic_damage':
                this.executeMagicDamage(unit, skillPower);
                break;

            case 'aoe_damage':
                this.executeAoeDamage(unit, enemies, skillPower);
                break;

            case 'aoe_magic_damage':
                this.executeAoeMagicDamage(unit, enemies, skillPower);
                break;

            case 'heal':
                this.executeHeal(unit, skillPower);
                break;

            case 'defense_buff':
                this.executeDefenseBuff(unit);
                break;

            case 'evasion_buff':
                this.executeEvasionBuff(unit);
                break;

            case 'ally_defense_buff':
                this.executeAllyDefenseBuff(unit, allies);
                break;

            case 'ally_buff':
                this.executeAllyBuff(unit, allies);
                break;

            case 'enemy_attack_debuff':
                this.executeEnemyAttackDebuff(unit, enemies);
                break;

            case 'multi_attack':
                this.executeMultiAttack(unit);
                break;

            case 'true_damage':
                this.executeTrueDamage(unit, skillPower);
                break;

            case 'backstab':
                this.executeBackstab(unit, enemies, skillPower);
                break;

            case 'stun':
                this.executeStun(unit, skillPower);
                break;

            case 'execute':
                this.executeExecute(unit, skillPower);
                break;

            case 'resurrect':
                // 패시브 - 사망 시 자동 발동
                break;

            default:
                debugConsole.log('SkillSystem', `알 수 없는 스킬 효과: ${skill.effect}`);
                break;
        }

        // 스킬 애니메이션
        if (unit.element) {
            UnitRenderer.showSkillAnimation(unit.element, skill.effect);
        }

        unit.updateBars();
        return true;
    }

    /**
     * 마법 피해 스킬
     */
    static executeMagicDamage(unit, skillPower) {
        if (unit.target && unit.target.isAlive) {
            const damage = Math.floor(unit.skill.value * skillPower);
            unit.target.takeDamage(damage, unit, true);
            unit.target.showFloatingText(damage, 'magic');
        }
    }

    /**
     * 광역 물리 피해 스킬
     */
    static executeAoeDamage(unit, enemies, skillPower) {
        enemies.filter(e => e.isAlive).forEach(enemy => {
            const damage = Math.floor(unit.stats.attack * (unit.skill.value / 100) * skillPower);
            enemy.takeDamage(damage, unit);
        });
    }

    /**
     * 광역 마법 피해 스킬
     */
    static executeAoeMagicDamage(unit, enemies, skillPower) {
        enemies.filter(e => e.isAlive).forEach(enemy => {
            const damage = Math.floor(unit.skill.value * skillPower);
            enemy.takeDamage(damage, unit, true);
        });
    }

    /**
     * 자가 치유 스킬
     */
    static executeHeal(unit, skillPower) {
        const healAmount = Math.floor(unit.skill.value * skillPower);
        unit.heal(healAmount);
    }

    /**
     * 방어력 버프 스킬
     */
    static executeDefenseBuff(unit) {
        unit.addBuff('defense', unit.skill.value, unit.skill.duration);
    }

    /**
     * 회피 버프 스킬
     */
    static executeEvasionBuff(unit) {
        unit.addBuff('evasion', unit.skill.value, unit.skill.duration);
    }

    /**
     * 아군 방어력 버프 스킬
     */
    static executeAllyDefenseBuff(unit, allies) {
        allies.filter(a => a.isAlive).forEach(ally => {
            ally.addBuff('defense', unit.skill.value, unit.skill.duration);
        });
    }

    /**
     * 아군 공격력/공격속도 버프 스킬
     */
    static executeAllyBuff(unit, allies) {
        allies.filter(a => a.isAlive).forEach(ally => {
            ally.addBuff('attack', unit.skill.attackBuff, unit.skill.duration);
            ally.addBuff('attackSpeed', unit.skill.attackSpeedBuff, unit.skill.duration);
        });
    }

    /**
     * 적 공격력 디버프 스킬
     */
    static executeEnemyAttackDebuff(unit, enemies) {
        enemies.filter(e => e.isAlive).forEach(enemy => {
            enemy.addDebuff('attack', unit.skill.value, unit.skill.duration);
        });
    }

    /**
     * 다중 공격 스킬
     */
    static executeMultiAttack(unit) {
        for (let i = 0; i < unit.skill.value; i++) {
            if (unit.target && unit.target.isAlive) {
                unit.attack(unit.target);
            }
        }
    }

    /**
     * 고정 피해 스킬
     */
    static executeTrueDamage(unit, skillPower) {
        if (unit.target && unit.target.isAlive) {
            const damage = Math.floor(unit.skill.value * skillPower);
            unit.target.takeDamage(damage, unit, true);
            unit.target.showFloatingText(damage, 'true');
        }
    }

    /**
     * 백스탭 스킬 (후열 공격)
     */
    static executeBackstab(unit, enemies, skillPower) {
        // 후열 적 찾기
        const backlineEnemies = enemies.filter(e => e.isAlive && e.position && e.position.row === 0);
        if (backlineEnemies.length > 0) {
            const target = randomChoice(backlineEnemies);
            const damage = Math.floor(unit.stats.attack * (unit.skill.value / 100) * skillPower);
            target.takeDamage(damage, unit);
            target.showFloatingText(damage, 'crit');
        }
    }

    /**
     * 기절 스킬
     */
    static executeStun(unit, skillPower) {
        if (unit.target && unit.target.isAlive) {
            const damage = Math.floor(unit.skill.value * skillPower);
            unit.target.takeDamage(damage, unit);
            unit.target.addDebuff('stun', 0, unit.skill.duration);
        }
    }

    /**
     * 처형 스킬 (즉사 확률)
     */
    static executeExecute(unit, skillPower) {
        if (unit.target && unit.target.isAlive) {
            const damage = Math.floor(unit.skill.value * skillPower);
            unit.target.takeDamage(damage, unit);

            // 즉사 확률
            if (Math.random() * 100 < unit.skill.executeChance) {
                unit.target.takeDamage(unit.target.currentHp, unit, true);
                unit.target.showFloatingText('즉사!', 'execute');
            }
        }
    }

    /**
     * 부활 체크 (패시브)
     */
    static checkResurrect(unit) {
        if (unit.skill.effect === 'resurrect' && !unit.hasResurrected) {
            unit.hasResurrected = true;
            unit.currentHp = Math.floor(unit.stats.hp * (unit.skill.value / 100));
            unit.isAlive = true;
            unit.showFloatingText('부활!', 'resurrect');
            return true;
        }
        return false;
    }
}
