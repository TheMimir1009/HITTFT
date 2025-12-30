// 툴팁 관리 클래스

class TooltipManager {
    constructor() {
        this.tooltip = null;
    }

    /**
     * 초기화
     */
    init() {
        this.tooltip = document.getElementById('unit-tooltip');
    }

    /**
     * 유닛 툴팁 표시
     */
    show(unit, event) {
        if (!this.tooltip) return;

        this.tooltip.querySelector('.unit-name').textContent =
            `${unit.name} ${getStarsString(unit.starLevel)}`;
        this.tooltip.querySelector('.unit-cost').textContent = `${unit.cost}G`;

        this.tooltip.querySelector('.unit-stats').innerHTML = `
            <div class="stat-item"><span class="stat-label">체력</span><span>${unit.stats.hp}</span></div>
            <div class="stat-item"><span class="stat-label">공격력</span><span>${unit.stats.attack}</span></div>
            <div class="stat-item"><span class="stat-label">공격속도</span><span>${unit.stats.attackSpeed.toFixed(2)}</span></div>
            <div class="stat-item"><span class="stat-label">사거리</span><span>${unit.stats.range}</span></div>
            <div class="stat-item"><span class="stat-label">방어력</span><span>${unit.stats.defense}</span></div>
            <div class="stat-item"><span class="stat-label">마나</span><span>${unit.currentMana}/${unit.stats.maxMana}</span></div>
        `;

        this.tooltip.querySelector('.unit-skill').innerHTML = `
            <div class="skill-name">${unit.skill.name}</div>
            <div class="skill-desc">${unit.skill.description}</div>
        `;

        this.tooltip.querySelector('.unit-synergies').innerHTML = `
            <span class="synergy-tag">${RACE_ICONS[unit.race]} ${RACE_NAMES[unit.race]}</span>
            <span class="synergy-tag">${WEAPON_ICONS[unit.weapon]} ${WEAPON_NAMES[unit.weapon]}</span>
        `;

        this.positionTooltip(event);
        this.tooltip.classList.remove('hidden');
    }

    /**
     * 상점 유닛 툴팁 표시
     */
    showShop(unitData, event) {
        if (!this.tooltip) return;

        this.tooltip.querySelector('.unit-name').textContent = unitData.name;
        this.tooltip.querySelector('.unit-cost').textContent = `${unitData.cost}G`;

        this.tooltip.querySelector('.unit-stats').innerHTML = `
            <div class="stat-item"><span class="stat-label">체력</span><span>${unitData.stats.hp}</span></div>
            <div class="stat-item"><span class="stat-label">공격력</span><span>${unitData.stats.attack}</span></div>
            <div class="stat-item"><span class="stat-label">공격속도</span><span>${unitData.stats.attackSpeed}</span></div>
            <div class="stat-item"><span class="stat-label">사거리</span><span>${unitData.stats.range}</span></div>
            <div class="stat-item"><span class="stat-label">방어력</span><span>${unitData.stats.defense}</span></div>
            <div class="stat-item"><span class="stat-label">마나</span><span>0/${unitData.stats.maxMana}</span></div>
        `;

        this.tooltip.querySelector('.unit-skill').innerHTML = `
            <div class="skill-name">${unitData.skill.name}</div>
            <div class="skill-desc">${unitData.skill.description}</div>
        `;

        this.tooltip.querySelector('.unit-synergies').innerHTML = `
            <span class="synergy-tag">${RACE_ICONS[unitData.race]} ${RACE_NAMES[unitData.race]}</span>
            <span class="synergy-tag">${WEAPON_ICONS[unitData.weapon]} ${WEAPON_NAMES[unitData.weapon]}</span>
        `;

        this.positionTooltip(event);
        this.tooltip.classList.remove('hidden');
    }

    /**
     * 적 유닛 툴팁 표시
     */
    showEnemy(enemy, event) {
        if (!this.tooltip) return;

        const namePrefix = enemy.isBoss ? '[보스] ' : '';
        this.tooltip.querySelector('.unit-name').textContent = `${namePrefix}${enemy.name}`;
        this.tooltip.querySelector('.unit-cost').textContent = '적';

        this.tooltip.querySelector('.unit-stats').innerHTML = `
            <div class="stat-item"><span class="stat-label">체력</span><span>${enemy.currentHp}/${enemy.stats.hp}</span></div>
            <div class="stat-item"><span class="stat-label">공격력</span><span>${enemy.stats.attack}</span></div>
            <div class="stat-item"><span class="stat-label">공격속도</span><span>${enemy.stats.attackSpeed.toFixed(2)}</span></div>
            <div class="stat-item"><span class="stat-label">사거리</span><span>${enemy.stats.range}</span></div>
            <div class="stat-item"><span class="stat-label">방어력</span><span>${enemy.stats.defense}</span></div>
        `;

        this.tooltip.querySelector('.unit-skill').innerHTML = `
            <div class="skill-desc" style="color: #888;">스킬 없음</div>
        `;

        this.tooltip.querySelector('.unit-synergies').innerHTML = '';

        this.positionTooltip(event);
        this.tooltip.classList.remove('hidden');
    }

    /**
     * 툴팁 위치 계산
     */
    positionTooltip(event) {
        if (!event || !event.target) return;

        const rect = event.target.getBoundingClientRect();
        this.tooltip.style.left = `${rect.right + 10}px`;
        this.tooltip.style.top = `${rect.top}px`;
    }

    /**
     * 툴팁 숨기기
     */
    hide() {
        if (this.tooltip) {
            this.tooltip.classList.add('hidden');
        }
    }
}
