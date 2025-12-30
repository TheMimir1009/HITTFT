// 유닛 렌더링 관련 유틸리티 클래스

class UnitRenderer {
    /**
     * 플레이어 유닛 DOM 요소 생성
     */
    static createPlayerElement(unit) {
        const element = createElement('div', `unit ${getTierClass(unit.cost)}`);
        element.setAttribute('data-unit-id', unit.id);
        element.draggable = true;

        // 별 표시
        const stars = createElement('div', 'unit-stars', getStarsString(unit.starLevel));
        element.appendChild(stars);

        // 종족 아이콘
        const raceIcon = createElement('div', 'unit-race-icon');
        raceIcon.textContent = RACE_ICONS[unit.race];
        element.appendChild(raceIcon);

        // 유닛 아이콘
        const icon = createElement('div', 'unit-icon', unit.icon);
        element.appendChild(icon);

        // 유닛 이름
        const name = createElement('div', 'unit-name', unit.name);
        element.appendChild(name);

        // 무기 아이콘
        const weaponIcon = createElement('div', 'unit-weapon-icon', WEAPON_ICONS[unit.weapon]);
        element.appendChild(weaponIcon);

        // 체력바, 마나바
        const bars = createElement('div', 'unit-bars');
        bars.innerHTML = `
            <div class="hp-bar"><div class="hp-bar-fill" style="width: 100%"></div></div>
            <div class="mana-bar"><div class="mana-bar-fill" style="width: 0%"></div></div>
        `;
        element.appendChild(bars);

        return element;
    }

    /**
     * 적 유닛 DOM 요소 생성
     */
    static createEnemyElement(enemy) {
        const element = createElement('div', 'unit enemy-unit');
        element.setAttribute('data-unit-id', enemy.id);

        if (enemy.isBoss) {
            element.classList.add('boss');
        }

        // 유닛 아이콘
        const icon = createElement('div', 'unit-icon', enemy.icon);
        element.appendChild(icon);

        // 유닛 이름
        const name = createElement('div', 'unit-name', enemy.name);
        element.appendChild(name);

        // 체력바
        const bars = createElement('div', 'unit-bars');
        bars.innerHTML = `
            <div class="hp-bar"><div class="hp-bar-fill" style="width: 100%"></div></div>
        `;
        element.appendChild(bars);

        return element;
    }

    /**
     * 체력바/마나바 업데이트
     */
    static updateBars(element, currentHp, maxHp, currentMana = null, maxMana = null) {
        if (!element) return;

        const hpFill = element.querySelector('.hp-bar-fill');
        if (hpFill) {
            const hpPercent = (currentHp / maxHp) * 100;
            hpFill.style.width = `${Math.max(0, hpPercent)}%`;
        }

        if (currentMana !== null && maxMana !== null) {
            const manaFill = element.querySelector('.mana-bar-fill');
            if (manaFill) {
                const manaPercent = (currentMana / maxMana) * 100;
                manaFill.style.width = `${Math.min(100, manaPercent)}%`;
            }
        }
    }

    /**
     * 플로팅 텍스트 표시
     */
    static showFloatingText(element, text, type) {
        if (!element) return;

        const floating = createElement('div', `damage-number ${type}`);
        floating.textContent = text;

        const rect = element.getBoundingClientRect();
        floating.style.left = `${rect.left + rect.width / 2}px`;
        floating.style.top = `${rect.top}px`;

        document.body.appendChild(floating);

        setTimeout(() => floating.remove(), 1000);
    }

    /**
     * 공격 애니메이션
     */
    static showAttackAnimation(element) {
        if (!element) return;
        element.classList.add('attacking');
        setTimeout(() => element.classList.remove('attacking'), 300);
    }

    /**
     * 스킬 애니메이션
     */
    static showSkillAnimation(element, skillType) {
        if (!element) return;
        // 스킬 이펙트는 추후 구현
        element.classList.add('casting');
        setTimeout(() => element.classList.remove('casting'), 500);
    }

    /**
     * 사망 표시
     */
    static markAsDead(element) {
        if (!element) return;
        element.classList.add('dead');
    }

    /**
     * 합성 가능 하이라이트
     */
    static setMergeable(element, isMergeable) {
        if (!element) return;
        if (isMergeable) {
            element.classList.add('mergeable');
        } else {
            element.classList.remove('mergeable');
        }
    }
}
