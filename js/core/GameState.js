// 게임 상태 관리 클래스

class GameState {
    constructor() {
        // 플레이어 상태
        this.hp = 100;
        this.gold = 10;
        this.level = 1;
        this.xp = 0;
        this.round = 1;
        this.maxRound = 10;
        this.phase = 'preparation'; // preparation, battle
        this.winStreak = 0;
        this.loseStreak = 0;
    }

    // 레벨별 데이터 (정적)
    static LEVEL_DATA = {
        1: { xpNeeded: 2, maxUnits: 1 },
        2: { xpNeeded: 6, maxUnits: 2 },
        3: { xpNeeded: 10, maxUnits: 3 },
        4: { xpNeeded: 20, maxUnits: 4 },
        5: { xpNeeded: 36, maxUnits: 5 },
        6: { xpNeeded: 56, maxUnits: 6 },
        7: { xpNeeded: 80, maxUnits: 7 },
        8: { xpNeeded: Infinity, maxUnits: 8 }
    };

    /**
     * 골드 추가
     */
    addGold(amount) {
        this.gold += amount;
        debugConsole.log('GameState', `골드 추가: +${amount} (현재: ${this.gold})`);
    }

    /**
     * 골드 사용
     * @returns {boolean} 사용 성공 여부
     */
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            debugConsole.log('GameState', `골드 사용: -${amount} (현재: ${this.gold})`);
            return true;
        }
        return false;
    }

    /**
     * 경험치 추가 및 레벨업 체크
     * @returns {boolean} 레벨업 여부
     */
    addXp(amount) {
        this.xp += amount;
        debugConsole.log('GameState', `경험치 추가: +${amount} (현재: ${this.xp})`);

        // 레벨업 체크
        const levelData = GameState.LEVEL_DATA[this.level];
        if (levelData && this.xp >= levelData.xpNeeded && this.level < 8) {
            this.xp -= levelData.xpNeeded;
            this.level++;
            debugConsole.log('GameState', `레벨 업! (현재: ${this.level})`);
            return true;
        }
        return false;
    }

    /**
     * 데미지 받기
     * @returns {boolean} 게임 오버 여부
     */
    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        debugConsole.log('GameState', `데미지 받음: -${amount} (현재 HP: ${this.hp})`);
        return this.hp <= 0;
    }

    /**
     * 승리 연승 업데이트
     */
    recordWin() {
        this.winStreak++;
        this.loseStreak = 0;
        debugConsole.log('GameState', `승리! (연승: ${this.winStreak})`);
    }

    /**
     * 패배 연패 업데이트
     */
    recordLoss() {
        this.loseStreak++;
        this.winStreak = 0;
        debugConsole.log('GameState', `패배! (연패: ${this.loseStreak})`);
    }

    /**
     * 다음 라운드로 진행
     * @returns {boolean} 최종 라운드 도달 여부
     */
    nextRound() {
        this.round++;
        return this.round > this.maxRound;
    }

    /**
     * 현재 레벨의 최대 유닛 수
     */
    getMaxUnits() {
        return GameState.LEVEL_DATA[this.level]?.maxUnits || 1;
    }

    /**
     * 현재 레벨의 필요 경험치
     */
    getXpNeeded() {
        return GameState.LEVEL_DATA[this.level]?.xpNeeded || Infinity;
    }

    /**
     * 연승 보너스 골드 계산
     */
    getStreakBonus() {
        if (this.winStreak >= 5) return 3;
        if (this.winStreak >= 3) return 2;
        if (this.winStreak >= 2) return 1;
        if (this.loseStreak >= 5) return 3;
        if (this.loseStreak >= 3) return 2;
        if (this.loseStreak >= 2) return 1;
        return 0;
    }

    /**
     * 이자 골드 계산 (10골드당 1골드, 최대 5골드)
     */
    getInterestGold() {
        return Math.min(Math.floor(this.gold / 10), 5);
    }

    /**
     * 게임 상태 초기화
     */
    reset() {
        this.hp = 100;
        this.gold = 10;
        this.level = 1;
        this.xp = 0;
        this.round = 1;
        this.phase = 'preparation';
        this.winStreak = 0;
        this.loseStreak = 0;
        debugConsole.log('GameState', '상태 초기화 완료');
    }
}
