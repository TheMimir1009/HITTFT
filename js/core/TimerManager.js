// 타이머 관리 클래스

class TimerManager {
    constructor(callbacks = {}) {
        // 콜백 함수들
        this.onPrepEnd = callbacks.onPrepEnd || (() => {});
        this.onTick = callbacks.onTick || (() => {});

        // 준비 페이즈 타이머
        this.prepTimer = null;
        this.prepTimeRemaining = 30;
        this.prepDuration = 30;

        // 전투 타이머
        this.battleTimer = null;
        this.battleStartTime = 0;

        // 현재 페이즈
        this.currentPhase = 'preparation';

        // DOM 요소 캐싱
        this.timerDisplay = null;
        this.timerLabel = null;
    }

    /**
     * DOM 요소 초기화 (게임 시작 시 호출)
     */
    init() {
        this.timerDisplay = document.getElementById('timer-display');
        this.timerLabel = document.getElementById('timer-label');
    }

    /**
     * 페이즈 설정
     */
    setPhase(phase) {
        this.currentPhase = phase;
    }

    /**
     * 준비 페이즈 타이머 시작
     */
    startPrepTimer(duration = 30) {
        this.stopPrepTimer();
        this.prepDuration = duration;
        this.prepTimeRemaining = duration;
        this.currentPhase = 'preparation';
        this.updateDisplay();

        this.prepTimer = setInterval(() => {
            this.prepTimeRemaining--;
            this.updateDisplay();
            this.onTick(this.prepTimeRemaining);

            if (this.prepTimeRemaining <= 0) {
                this.stopPrepTimer();
                this.onPrepEnd();
            }
        }, 1000);

        debugConsole.log('Timer', `준비 타이머 시작 (${duration}초)`);
    }

    /**
     * 준비 페이즈 타이머 정지
     */
    stopPrepTimer() {
        if (this.prepTimer) {
            clearInterval(this.prepTimer);
            this.prepTimer = null;
        }
    }

    /**
     * 전투 타이머 시작
     */
    startBattleTimer() {
        this.battleStartTime = Date.now();
        this.currentPhase = 'battle';
        this.updateDisplay();

        this.battleTimer = setInterval(() => {
            this.updateDisplay();
        }, 1000);

        debugConsole.log('Timer', '전투 타이머 시작');
    }

    /**
     * 전투 타이머 정지
     */
    stopBattleTimer() {
        if (this.battleTimer) {
            clearInterval(this.battleTimer);
            this.battleTimer = null;
        }
    }

    /**
     * 모든 타이머 정지
     */
    stopAll() {
        this.stopPrepTimer();
        this.stopBattleTimer();
    }

    /**
     * 전투 경과 시간 (초)
     */
    getBattleElapsed() {
        if (this.battleStartTime === 0) return 0;
        return Math.floor((Date.now() - this.battleStartTime) / 1000);
    }

    /**
     * 타이머 UI 업데이트
     */
    updateDisplay() {
        if (!this.timerDisplay || !this.timerLabel) {
            this.init();
        }

        if (this.currentPhase === 'preparation') {
            this.timerDisplay.textContent = this.prepTimeRemaining;
            this.timerLabel.textContent = '준비';
            this.timerDisplay.className = 'value preparation';

            if (this.prepTimeRemaining <= 5) {
                this.timerDisplay.classList.add('danger');
            } else if (this.prepTimeRemaining <= 10) {
                this.timerDisplay.classList.add('warning');
            }
        } else {
            const elapsed = this.getBattleElapsed();
            this.timerDisplay.textContent = this.formatTime(elapsed);
            this.timerLabel.textContent = '전투 중';
            this.timerDisplay.className = 'value battle';
        }
    }

    /**
     * 시간 포맷팅
     */
    formatTime(seconds) {
        if (seconds < 60) {
            return seconds + '초';
        }
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 남은 준비 시간 반환
     */
    getPrepTimeRemaining() {
        return this.prepTimeRemaining;
    }

    /**
     * 리셋
     */
    reset() {
        this.stopAll();
        this.prepTimeRemaining = this.prepDuration;
        this.battleStartTime = 0;
        this.currentPhase = 'preparation';
    }
}
