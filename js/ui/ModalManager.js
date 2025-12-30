// 모달 관리 클래스

class ModalManager {
    constructor() {
        // 모달 요소
        this.battleResultModal = null;
        this.gameOverModal = null;

        // 콜백
        this.onContinue = () => {};
        this.onRestart = () => {};
    }

    /**
     * 초기화
     */
    init(callbacks = {}) {
        this.battleResultModal = document.getElementById('battle-result-modal');
        this.gameOverModal = document.getElementById('game-over-modal');

        this.onContinue = callbacks.onContinue || (() => {});
        this.onRestart = callbacks.onRestart || (() => {});

        // 버튼 이벤트 등록
        const continueBtn = document.getElementById('btn-continue');
        const restartBtn = document.getElementById('btn-restart');

        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.closeBattleResult();
                this.onContinue();
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.onRestart();
            });
        }
    }

    /**
     * 전투 결과 모달 표시
     */
    showBattleResult(result, goldEarned, damage, waveData, battleDuration) {
        if (!this.battleResultModal) return;

        const title = document.getElementById('battle-result-title');
        const message = document.getElementById('battle-result-message');
        const rewards = document.getElementById('battle-rewards');

        if (result.victory) {
            title.textContent = '🎉 승리!';
            title.style.color = '#4caf50';
            message.textContent = `${waveData.name}을(를) 물리쳤습니다!`;
        } else {
            title.textContent = '💔 패배';
            title.style.color = '#f44336';
            message.textContent = `${waveData.name}에게 패배했습니다.`;
        }

        rewards.innerHTML = `
            <div class="reward-item">
                <span>전투 시간</span>
                <span class="reward-value">${this.formatTime(battleDuration)}</span>
            </div>
            <div class="reward-item">
                <span>획득 골드</span>
                <span class="reward-value">+${goldEarned}G</span>
            </div>
            <div class="reward-item">
                <span>획득 경험치</span>
                <span class="reward-value">+2 XP</span>
            </div>
            ${damage > 0 ? `
            <div class="reward-item">
                <span>받은 피해</span>
                <span class="reward-value" style="color: #f44336">-${damage} HP</span>
            </div>
            ` : ''}
        `;

        this.battleResultModal.classList.remove('hidden');
    }

    /**
     * 전투 결과 모달 닫기
     */
    closeBattleResult() {
        if (this.battleResultModal) {
            this.battleResultModal.classList.add('hidden');
        }
    }

    /**
     * 게임 오버 모달 표시
     */
    showGameOver(victory, gameState) {
        if (!this.gameOverModal) return;

        const title = document.getElementById('game-over-title');
        const message = document.getElementById('game-over-message');
        const stats = document.getElementById('game-stats');

        if (victory) {
            title.textContent = '🏆 Victory!';
            title.style.color = '#ffd700';
            message.textContent = '모든 웨이브를 클리어했습니다!';
        } else {
            title.textContent = '💀 Game Over';
            title.style.color = '#f44336';
            message.textContent = '체력이 0이 되었습니다.';
        }

        stats.innerHTML = `
            <div class="stat-row">
                <span>도달 라운드</span>
                <span>${gameState.round} / ${gameState.maxRound}</span>
            </div>
            <div class="stat-row">
                <span>최종 레벨</span>
                <span>Lv.${gameState.level}</span>
            </div>
            <div class="stat-row">
                <span>남은 체력</span>
                <span>${Math.max(0, gameState.hp)} HP</span>
            </div>
        `;

        // 전투 결과 모달 닫기
        this.closeBattleResult();
        this.gameOverModal.classList.remove('hidden');
    }

    /**
     * 게임 오버 모달 닫기
     */
    closeGameOver() {
        if (this.gameOverModal) {
            this.gameOverModal.classList.add('hidden');
        }
    }

    /**
     * 모든 모달 닫기
     */
    closeAll() {
        this.closeBattleResult();
        this.closeGameOver();
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
}
