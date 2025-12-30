// UI 업데이트 관리 클래스

class UIController {
    constructor() {
        // 외부 의존성
        this.gameState = null;
        this.board = null;
        this.bench = null;
        this.shop = null;
        this.unitManager = null;

        // DOM 요소 캐싱
        this.elements = {};
    }

    /**
     * 초기화
     */
    init(dependencies) {
        this.gameState = dependencies.gameState;
        this.board = dependencies.board;
        this.bench = dependencies.bench;
        this.shop = dependencies.shop;
        this.unitManager = dependencies.unitManager;

        // DOM 요소 캐싱
        this.elements = {
            hp: document.getElementById('player-hp'),
            gold: document.getElementById('player-gold'),
            level: document.getElementById('player-level'),
            xp: document.getElementById('player-xp'),
            xpNeeded: document.getElementById('xp-needed'),
            round: document.getElementById('current-round'),
            placedUnits: document.getElementById('placed-units'),
            maxUnits: document.getElementById('max-units'),
            streakDisplay: document.getElementById('streak-display')
        };
    }

    /**
     * 전체 UI 업데이트
     */
    updateAll() {
        this.updateHP();
        this.updateGold();
        this.updateLevel();
        this.updateRound();
        this.updateUnitCount();
        this.updateStreak();
        this.updateShopButtons();
        this.updateMergeHighlights();
    }

    /**
     * HP 업데이트
     */
    updateHP() {
        if (this.elements.hp) {
            this.elements.hp.textContent = this.gameState.hp;
        }
    }

    /**
     * 골드 업데이트
     */
    updateGold() {
        if (this.elements.gold) {
            this.elements.gold.textContent = this.gameState.gold;
        }
    }

    /**
     * 레벨/경험치 업데이트
     */
    updateLevel() {
        if (this.elements.level) {
            this.elements.level.textContent = this.gameState.level;
        }
        if (this.elements.xp) {
            this.elements.xp.textContent = this.gameState.xp;
        }
        if (this.elements.xpNeeded) {
            this.elements.xpNeeded.textContent = this.gameState.getXpNeeded();
        }
    }

    /**
     * 라운드 업데이트
     */
    updateRound() {
        if (this.elements.round) {
            this.elements.round.textContent = this.gameState.round;
        }
    }

    /**
     * 배치 유닛 수 업데이트
     */
    updateUnitCount() {
        const placedCount = this.board ? this.board.getPlacedUnitCount() : 0;
        const maxUnits = this.gameState.getMaxUnits();

        if (this.elements.placedUnits) {
            this.elements.placedUnits.textContent = placedCount;
        }
        if (this.elements.maxUnits) {
            this.elements.maxUnits.textContent = maxUnits;
        }
    }

    /**
     * 연승/연패 표시 업데이트
     */
    updateStreak() {
        const streakDisplay = this.elements.streakDisplay;
        if (!streakDisplay) return;

        if (this.gameState.winStreak >= 2) {
            streakDisplay.textContent = `🔥 ${this.gameState.winStreak}연승`;
            streakDisplay.className = 'win-streak';
        } else if (this.gameState.loseStreak >= 2) {
            streakDisplay.textContent = `💔 ${this.gameState.loseStreak}연패`;
            streakDisplay.className = 'lose-streak';
        } else {
            streakDisplay.textContent = '';
            streakDisplay.className = '';
        }
    }

    /**
     * 상점 버튼 상태 업데이트
     */
    updateShopButtons() {
        if (this.shop) {
            const isBattle = this.gameState.phase === 'battle';
            this.shop.updateButtons(this.gameState.gold, isBattle);
        }
    }

    /**
     * 합성 가능 유닛 하이라이트
     */
    updateMergeHighlights() {
        if (!this.unitManager || !this.board) return;

        const counts = this.unitManager.getUnitCounts();
        this.board.highlightMergeable(counts);

        if (this.bench) {
            this.bench.highlightMergeable(counts);
        }
    }

    /**
     * 배치 가능 여부 체크
     */
    canPlaceMoreUnits() {
        const placedCount = this.board ? this.board.getPlacedUnitCount() : 0;
        const maxUnits = this.gameState.getMaxUnits();
        return placedCount < maxUnits;
    }
}
