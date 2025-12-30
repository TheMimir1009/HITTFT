// 시너지 시스템 관리 클래스

class SynergyManager {
    constructor() {
        this.activeSynergies = new Map(); // synergyId -> { count, tier }
        this.element = null;

        this.init();
    }

    /**
     * 초기화
     */
    init() {
        this.element = document.getElementById('synergy-list');
    }

    /**
     * 시너지 계산
     */
    calculate(units) {
        // 시너지 카운트 초기화
        const counts = {};

        ALL_SYNERGY_IDS.forEach(id => {
            counts[id] = 0;
        });

        // 고유 유닛 타입별로 시너지 카운트 (동일 유닛 중복 배치 시 1번만 카운트)
        const countedUnitIds = new Set();

        units.forEach(unit => {
            // 이미 카운트된 유닛 타입이면 스킵
            if (countedUnitIds.has(unit.unitId)) {
                return;
            }
            countedUnitIds.add(unit.unitId);

            // 종족 시너지 (시너지 대상 종족만)
            if (SYNERGIES_BY_TYPE.race.includes(unit.race)) {
                counts[unit.race]++;
            }

            // 무기 시너지
            if (SYNERGIES_BY_TYPE.weapon.includes(unit.weapon)) {
                counts[unit.weapon]++;
            }
        });

        // 활성 시너지 결정
        this.activeSynergies.clear();

        Object.entries(counts).forEach(([synergyId, count]) => {
            if (count > 0) {
                const synergyData = SYNERGIES_DATA[synergyId];
                if (synergyData) {
                    // 달성한 가장 높은 티어 찾기
                    let activeTier = null;
                    for (let i = synergyData.tiers.length - 1; i >= 0; i--) {
                        if (count >= synergyData.tiers[i].required) {
                            activeTier = synergyData.tiers[i];
                            break;
                        }
                    }

                    this.activeSynergies.set(synergyId, {
                        count,
                        tier: activeTier,
                        data: synergyData
                    });
                }
            }
        });

        return this.activeSynergies;
    }

    /**
     * 유닛에 시너지 효과 적용
     */
    applyToUnits(units) {
        // 먼저 모든 유닛의 시너지 효과 초기화
        units.forEach(unit => {
            unit.resetSynergyEffects();
        });

        // 활성화된 시너지 효과 적용
        this.activeSynergies.forEach((synergy, synergyId) => {
            if (!synergy.tier) return; // 활성화되지 않은 시너지

            const effects = synergy.tier.effects;
            const synergyData = synergy.data;

            units.forEach(unit => {
                // 종족 시너지: 해당 종족에만 적용
                if (synergyData.type === 'race') {
                    if (unit.race === synergyId) {
                        unit.applySynergyEffects(effects, synergyId, 'race');

                        // 첫 공격 회피 (키키 3티어)
                        if (effects.firstAttackDodge) {
                            unit.firstAttackDodge = true;
                        }
                    }

                    // 벨루아 시너지: 적 공격력 감소는 전투 시스템에서 처리
                }

                // 무기 시너지: 해당 무기에만 적용
                if (synergyData.type === 'weapon') {
                    if (unit.weapon === synergyId) {
                        unit.applySynergyEffects(effects, synergyId, 'weapon');

                        // 처치 시 공격속도 보너스 활성화 (쌍검 3티어)
                        if (effects.killAttackSpeedBonus) {
                            unit.killAttackSpeedBonusEnabled = true;
                        }
                    }

                    // 지팡이 4티어: 모든 아군 스킬 위력 증가
                    if (synergyId === 'staff' && effects.allySkillPower) {
                        unit.stats.skillPower *= (1 + effects.allySkillPower / 100);
                    }
                }
            });
        });
    }

    /**
     * 벨루아 시너지 적 디버프 가져오기
     */
    getEnemyDebuffs() {
        const veluaSynergy = this.activeSynergies.get('velua');
        if (veluaSynergy && veluaSynergy.tier) {
            return {
                attackReduction: veluaSynergy.tier.effects.enemyAttackReduction || 0
            };
        }
        return { attackReduction: 0 };
    }

    /**
     * UI 렌더링
     */
    render() {
        this.element.innerHTML = '';

        // 모든 시너지 표시 (활성/비활성)
        ALL_SYNERGY_IDS.forEach(synergyId => {
            const synergyData = SYNERGIES_DATA[synergyId];
            const activeInfo = this.activeSynergies.get(synergyId);

            const item = createElement('div', 'synergy-item');

            if (activeInfo && activeInfo.tier) {
                item.classList.add('active');
            } else if (!activeInfo || activeInfo.count === 0) {
                item.classList.add('inactive');
            }

            // 아이콘
            const icon = createElement('div', 'synergy-icon');
            icon.textContent = synergyData.icon;
            item.appendChild(icon);

            // 정보
            const info = createElement('div', 'synergy-info');

            const name = createElement('div', 'synergy-name');
            name.textContent = synergyData.name;
            info.appendChild(name);

            const count = createElement('div', 'synergy-count');
            const currentCount = activeInfo ? activeInfo.count : 0;

            // 티어 요구치 표시
            const tierRequirements = synergyData.tiers.map(t => t.required);
            const tierDisplay = tierRequirements.map(req => {
                if (currentCount >= req) {
                    return `<span class="active">${req}</span>`;
                }
                return `<span>${req}</span>`;
            }).join('/');

            count.innerHTML = `${currentCount} / ${tierDisplay}`;
            info.appendChild(count);

            item.appendChild(info);

            // 툴팁 (호버 시)
            item.title = this.getSynergyTooltip(synergyData, activeInfo);

            this.element.appendChild(item);
        });
    }

    /**
     * 시너지 툴팁 텍스트 생성
     */
    getSynergyTooltip(synergyData, activeInfo) {
        let tooltip = `${synergyData.name}\n${synergyData.description}\n\n`;

        synergyData.tiers.forEach((tier, index) => {
            const isActive = activeInfo && activeInfo.count >= tier.required;
            const prefix = isActive ? '✓ ' : '○ ';
            tooltip += `${prefix}(${tier.required}): ${tier.description}\n`;
        });

        return tooltip;
    }

    /**
     * 활성 시너지 목록 반환
     */
    getActiveSynergies() {
        const active = [];
        this.activeSynergies.forEach((info, id) => {
            if (info.tier) {
                active.push({
                    id,
                    name: info.data.name,
                    count: info.count,
                    tier: info.tier
                });
            }
        });
        return active;
    }

    /**
     * 시너지 초기화
     */
    reset() {
        this.activeSynergies.clear();
        this.render();
    }
}
