// 상점 관리 클래스

class Shop {
    constructor() {
        this.slots = 5;
        this.units = []; // 현재 상점에 표시된 유닛들
        this.element = null;
        this.locked = false;

        // 카드별 리스너 참조 저장 (메모리 누수 방지)
        this.cardListeners = new Map(); // slot index -> {mouseenter, mouseleave, click}

        // 레벨별 유닛 등장 확률
        this.tierProbabilities = {
            1: { 1: 100, 2: 0, 3: 0 },
            2: { 1: 100, 2: 0, 3: 0 },
            3: { 1: 70, 2: 30, 3: 0 },
            4: { 1: 50, 2: 40, 3: 10 },
            5: { 1: 30, 2: 45, 3: 25 },
            6: { 1: 20, 2: 40, 3: 40 }
        };

        this.init();
    }

    /**
     * 상점 초기화
     */
    init() {
        this.element = document.getElementById('shop-units');
        this.createSlots();
        this.setupButtons();
    }

    /**
     * 슬롯 생성
     */
    createSlots() {
        this.element.innerHTML = '';
        this.units = new Array(this.slots).fill(null);

        for (let i = 0; i < this.slots; i++) {
            const card = createElement('div', 'shop-card');
            card.setAttribute('data-slot', i);

            card.addEventListener('click', () => {
                if (!this.units[i] || card.classList.contains('sold')) return;
                game.buyUnit(i);
            });

            this.element.appendChild(card);
        }
    }

    /**
     * 버튼 설정
     */
    setupButtons() {
        const rerollBtn = document.getElementById('btn-reroll');
        const buyXpBtn = document.getElementById('btn-buy-xp');
        const battleBtn = document.getElementById('btn-start-battle');

        rerollBtn.addEventListener('click', () => game.rerollShop());
        buyXpBtn.addEventListener('click', () => game.buyXP());
        battleBtn.addEventListener('click', () => game.startBattle());
    }

    /**
     * 상점 새로고침 (리롤)
     */
    refresh(playerLevel) {
        const probabilities = this.tierProbabilities[playerLevel] || this.tierProbabilities[6];

        for (let i = 0; i < this.slots; i++) {
            const unitData = this.rollUnit(probabilities);
            this.units[i] = unitData;
        }

        this.render();
    }

    /**
     * 유닛 롤
     */
    rollUnit(probabilities) {
        // 등급 결정
        const roll = Math.random() * 100;
        let tier = 1;

        if (roll < probabilities[1]) {
            tier = 1;
        } else if (roll < probabilities[1] + probabilities[2]) {
            tier = 2;
        } else {
            tier = 3;
        }

        // 해당 등급의 유닛 중 랜덤 선택
        const unitIds = UNITS_BY_COST[tier];
        const randomUnitId = randomChoice(unitIds);

        return {
            ...UNITS_DATA[randomUnitId],
            tier: tier
        };
    }

    /**
     * 상점 렌더링
     */
    render() {
        const cards = this.element.querySelectorAll('.shop-card');

        cards.forEach((card, index) => {
            // 기존 리스너 제거 (중복 방지)
            const oldListeners = this.cardListeners.get(index);
            if (oldListeners) {
                card.removeEventListener('mouseenter', oldListeners.mouseenter);
                card.removeEventListener('mouseleave', oldListeners.mouseleave);
            }

            const unitData = this.units[index];

            if (!unitData) {
                card.innerHTML = '';
                card.className = 'shop-card sold';
                this.cardListeners.delete(index);
                return;
            }

            card.className = `shop-card tier-${unitData.cost}`;

            card.innerHTML = `
                <div class="shop-card-icon">${unitData.icon}</div>
                <div class="shop-card-name">${unitData.name}</div>
                <div class="shop-card-cost">
                    <span>💰</span>
                    <span>${unitData.cost}</span>
                </div>
                <div class="shop-card-synergies">
                    <span class="shop-card-synergy">${RACE_ICONS[unitData.race]} ${RACE_NAMES[unitData.race]}</span>
                    <span class="shop-card-synergy">${WEAPON_ICONS[unitData.weapon]} ${WEAPON_NAMES[unitData.weapon]}</span>
                </div>
            `;

            // 새 리스너 생성 및 저장
            const newListeners = {
                mouseenter: (e) => {
                    if (unitData) {
                        game.showShopTooltip(unitData, e);
                    }
                },
                mouseleave: () => {
                    game.hideUnitTooltip();
                }
            };

            // 이벤트 리스너 등록
            card.addEventListener('mouseenter', newListeners.mouseenter);
            card.addEventListener('mouseleave', newListeners.mouseleave);

            // 참조 저장
            this.cardListeners.set(index, newListeners);
        });

        this.updateLockState();
    }

    /**
     * 유닛 구매
     */
    buyUnit(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots) return null;

        const unitData = this.units[slotIndex];
        if (!unitData) return null;

        // 유닛 생성
        const unit = new Unit(unitData);

        // 슬롯 비우기
        this.units[slotIndex] = null;

        // UI 업데이트
        const card = this.element.children[slotIndex];
        card.classList.add('sold');
        card.innerHTML = '<div class="shop-card-sold">판매됨</div>';

        return unit;
    }

    /**
     * 특정 슬롯의 유닛 데이터 가져오기
     */
    getUnitData(slotIndex) {
        return this.units[slotIndex];
    }

    /**
     * 상점 잠금 상태 업데이트
     */
    updateLockState() {
        if (this.locked) {
            this.element.classList.add('locked');
        } else {
            this.element.classList.remove('locked');
        }
    }

    /**
     * 상점 잠금/해제
     */
    toggleLock() {
        this.locked = !this.locked;
        this.updateLockState();
    }

    /**
     * 버튼 상태 업데이트
     */
    updateButtons(gold, isBattlePhase) {
        const rerollBtn = document.getElementById('btn-reroll');
        const buyXpBtn = document.getElementById('btn-buy-xp');
        const battleBtn = document.getElementById('btn-start-battle');

        rerollBtn.disabled = gold < 2 || isBattlePhase;
        buyXpBtn.disabled = gold < 4 || isBattlePhase;
        battleBtn.disabled = isBattlePhase;

        if (isBattlePhase) {
            battleBtn.querySelector('.btn-text').textContent = '전투 중...';
        } else {
            battleBtn.querySelector('.btn-text').textContent = '전투 시작';
        }
    }

    /**
     * 상점 비활성화 (전투 중)
     */
    disable() {
        const cards = this.element.querySelectorAll('.shop-card');
        cards.forEach(card => card.classList.add('locked'));
    }

    /**
     * 상점 활성화
     */
    enable() {
        const cards = this.element.querySelectorAll('.shop-card');
        cards.forEach(card => {
            if (!card.classList.contains('sold')) {
                card.classList.remove('locked');
            }
        });
    }
}
