// 게임 컨트롤러 클래스 (중앙 조정자)

class GameController {
    constructor() {
        // 핵심 상태
        this.state = new GameState();

        // 매니저들
        this.timerManager = null;
        this.unitManager = null;
        this.uiController = null;
        this.tooltipManager = null;
        this.modalManager = null;

        // 컴포넌트들
        this.board = null;
        this.bench = null;
        this.shop = null;
        this.synergyManager = null;
        this.combatManager = null;

        // 전투 상태
        this.initialPositions = null;
    }

    /**
     * 게임 초기화
     */
    async init() {
        // 컴포넌트 초기화
        this.board = new Board();
        this.bench = new Bench();
        this.shop = new Shop();
        this.synergyManager = new SynergyManager();
        this.combatManager = new CombatManager();

        // 타이머 매니저 초기화
        this.timerManager = new TimerManager({
            onPrepEnd: () => this.onPrepTimerEnd(),
            onTick: (remaining) => this.onPrepTimerTick(remaining)
        });
        this.timerManager.init();

        // 유닛 매니저 초기화
        this.unitManager = new UnitManager();
        this.unitManager.init({
            gameState: this.state,
            board: this.board,
            bench: this.bench,
            shop: this.shop,
            onUpdateUI: () => this.updateUI(),
            onUpdateSynergies: () => this.updateSynergies(),
            onHideTooltip: () => this.tooltipManager.hide()
        });
        await this.unitManager.loadSellPrices();

        // UI 컨트롤러 초기화
        this.uiController = new UIController();
        this.uiController.init({
            gameState: this.state,
            board: this.board,
            bench: this.bench,
            shop: this.shop,
            unitManager: this.unitManager
        });

        // 툴팁 매니저 초기화
        this.tooltipManager = new TooltipManager();
        this.tooltipManager.init();

        // 모달 매니저 초기화
        this.modalManager = new ModalManager();
        this.modalManager.init({
            onContinue: () => {},
            onRestart: () => this.restart()
        });

        // 초기 UI 업데이트
        this.updateUI();
        this.shop.refresh(this.state.level);
        this.synergyManager.render();

        // 준비 페이즈 타이머 시작
        this.timerManager.startPrepTimer();

        debugConsole.log('GameController', '게임 초기화 완료');
    }

    /**
     * 전체 UI 업데이트
     */
    updateUI() {
        this.uiController.updateAll();
    }

    /**
     * 시너지 업데이트
     */
    updateSynergies() {
        const boardUnits = this.board.getPlayerUnits();
        this.synergyManager.calculate(boardUnits);
        this.synergyManager.applyToUnits(boardUnits);
        this.synergyManager.render();
    }

    /**
     * 준비 타이머 종료 콜백
     */
    onPrepTimerEnd() {
        this.autoPlaceUnits();
        this.startBattle();
    }

    /**
     * 준비 타이머 틱 콜백
     */
    onPrepTimerTick(remaining) {
        // 필요 시 추가 로직
    }

    /**
     * 유닛 구매
     */
    buyUnit(shopSlot) {
        return this.unitManager.buyUnit(shopSlot);
    }

    /**
     * 유닛 판매
     */
    sellUnit(unit, source, index) {
        this.unitManager.sellUnit(unit, source, index);
    }

    /**
     * 상점 리롤
     */
    rerollShop() {
        if (this.state.gold < 2) {
            debugConsole.log('GameController', '골드 부족 (리롤)');
            return;
        }

        this.state.spendGold(2);
        this.shop.refresh(this.state.level);
        this.updateUI();
    }

    /**
     * 경험치 구매
     */
    buyXP() {
        if (this.state.gold < 4) {
            debugConsole.log('GameController', '골드 부족 (XP)');
            return;
        }

        if (this.state.level >= 6) {
            debugConsole.log('GameController', '최대 레벨');
            return;
        }

        this.state.spendGold(4);
        this.state.addXp(4);
        this.updateUI();
    }

    /**
     * 유닛 드롭 처리 (보드로)
     */
    handleUnitDrop(unitId, sourceType, q, r) {
        let unit = null;

        if (sourceType === 'board') {
            unit = this.board.getUnitById(unitId);
        } else if (sourceType === 'bench') {
            unit = this.bench.getUnitById(unitId);
            if (unit) {
                // 배치 가능 유닛 수 체크
                const placedCount = this.board.getPlacedUnitCount();
                const maxUnits = this.state.getMaxUnits();

                if (placedCount >= maxUnits && !unit.position) {
                    debugConsole.log('GameController', `최대 ${maxUnits}개의 유닛만 배치 가능`);
                    return;
                }

                this.bench.removeUnit(unit);
            }
        }

        if (unit) {
            this.board.placeUnit(unit, q, r);
            this.updateSynergies();
            this.updateUI();
        }
    }

    /**
     * 유닛 드롭 처리 (벤치로)
     */
    handleBenchDrop(unitId, sourceType, slotIndex) {
        let unit = null;

        if (sourceType === 'board') {
            unit = this.board.getUnitById(unitId);
            if (unit) {
                this.board.removeUnit(unit);
                // initialPositions에서도 제거
                if (this.initialPositions) {
                    this.initialPositions.delete(unit.id);
                }
            }
        } else if (sourceType === 'bench') {
            unit = this.bench.getUnitById(unitId);
            if (unit) {
                const currentSlot = this.bench.getUnitSlot(unit);
                if (currentSlot !== slotIndex) {
                    this.bench.swapUnits(currentSlot, slotIndex);
                    return;
                }
            }
        }

        if (unit) {
            this.bench.addUnit(unit, slotIndex);
            this.updateSynergies();
            this.updateUI();
        }
    }

    /**
     * 전투 시작
     */
    async startBattle() {
        if (this.state.phase === 'battle') return;

        const playerUnits = this.board.getPlayerUnits();
        if (playerUnits.length === 0) {
            debugConsole.log('GameController', '전투 시작 불가: 유닛 없음');
            alert('유닛을 배치해주세요!');
            return;
        }

        // 타이머 전환
        this.timerManager.stopPrepTimer();
        this.state.phase = 'battle';
        this.timerManager.setPhase('battle');
        this.timerManager.startBattleTimer();

        this.shop.disable();
        this.updateUI();

        // 플레이어 유닛 초기 위치 저장
        this.initialPositions = new Map();
        playerUnits.forEach(unit => {
            if (unit.position) {
                this.initialPositions.set(unit.id, { ...unit.position });
            }
        });

        // UnitManager에 initialPositions 참조 전달
        this.unitManager.setInitialPositions(this.initialPositions);

        // 적 웨이브 생성
        const waveData = WAVES_DATA[this.state.round - 1];
        const enemies = this.createEnemyWave(waveData);

        // 적 배치
        this.board.placeEnemies(enemies);

        debugConsole.log('GameController', `라운드 ${this.state.round}: ${waveData.name}`);

        // 전투 실행
        const result = await this.combatManager.start(
            playerUnits,
            enemies,
            this.synergyManager,
            this.board
        );

        debugConsole.log('GameController', '전투 완료', result);

        // 전투 결과 처리
        this.processBattleResult(result, waveData);
    }

    /**
     * 적 웨이브 생성
     */
    createEnemyWave(waveData) {
        const enemies = [];

        waveData.enemies.forEach(enemyInfo => {
            const enemyData = ENEMY_UNITS_DATA[enemyInfo.type];
            for (let i = 0; i < enemyInfo.count; i++) {
                enemies.push(new EnemyUnit(enemyData));
            }
        });

        return enemies;
    }

    /**
     * 전투 결과 처리
     */
    processBattleResult(result, waveData) {
        debugConsole.log('GameController', 'processBattleResult 시작', result);

        try {
            // 툴팁 숨기기
            this.tooltipManager.hide();

            // 전투 타이머 정지
            this.timerManager.stopBattleTimer();
            const battleDuration = this.timerManager.getBattleElapsed();

            this.state.phase = 'preparation';
            this.timerManager.setPhase('preparation');

            // 전체 셀 강제 정리
            this.board.forceCleanupAllCells();

            // 적 영역 정리
            this.board.clearEnemyZone();

            // 플레이어 유닛 복원
            this.restorePlayerUnits();

            // 보상 계산
            let goldEarned = 5; // 기본 골드
            let damage = 0;

            if (result.victory) {
                this.state.recordWin();
                goldEarned += 1; // 승리 보너스
                goldEarned += this.state.getStreakBonus();
            } else {
                this.state.recordLoss();
                goldEarned += this.state.getStreakBonus();

                // 피해 계산
                damage = waveData.baseDamage + (result.remainingEnemyUnits * waveData.damagePerEnemy);
                this.state.takeDamage(damage);
            }

            // 이자 추가
            goldEarned += this.state.getInterestGold();

            // 골드 지급
            this.state.addGold(goldEarned);

            // 경험치 지급
            this.state.addXp(2);

            debugConsole.log('GameController', '보상 지급 완료', { goldEarned, damage });

            // 결과 모달 표시
            this.modalManager.showBattleResult(result, goldEarned, damage, waveData, battleDuration);

            // 게임 종료 체크
            if (this.state.hp <= 0) {
                debugConsole.log('GameController', '게임 오버 - HP 0');
                this.gameOver(false);
                return;
            }

            if (this.state.round >= this.state.maxRound && result.victory) {
                debugConsole.log('GameController', '게임 클리어!');
                this.gameOver(true);
                return;
            }

            // 다음 라운드 준비
            this.state.round++;

            this.shop.refresh(this.state.level);
            this.shop.enable();
            this.updateUI();

            // 새 준비 페이즈 타이머 시작
            this.timerManager.startPrepTimer();

            debugConsole.log('GameController', '다음 라운드 준비 완료', { round: this.state.round });

        } catch (error) {
            debugConsole.log('Error', `processBattleResult 에러: ${error.message}`, { stack: error.stack });
            console.error('processBattleResult 에러:', error);
        }
    }

    /**
     * 게임 종료
     */
    gameOver(victory) {
        // 모든 타이머 정지
        this.timerManager.stopAll();

        // 툴팁 숨기기
        this.tooltipManager.hide();

        // 모달 표시
        this.modalManager.showGameOver(victory, this.state);
    }

    /**
     * 게임 재시작
     */
    restart() {
        // 타이머 정리
        this.timerManager.stopAll();

        // 상태 초기화
        this.state.reset();

        // 컴포넌트 초기화
        this.board.clearAll();
        this.bench.clear();
        this.unitManager.reset();
        this.synergyManager.reset();

        // 툴팁 숨기기
        this.tooltipManager.hide();

        // UI 초기화
        this.shop.refresh(this.state.level);
        this.updateUI();

        // 모달 닫기
        this.modalManager.closeAll();

        // 준비 페이즈 타이머 시작
        this.timerManager.startPrepTimer();

        debugConsole.log('GameController', '게임 재시작 완료');
    }

    /**
     * 벤치 유닛 자동 배치
     */
    autoPlaceUnits() {
        const benchUnits = this.bench.getAllUnits();
        if (benchUnits.length === 0) return;

        const maxUnits = this.state.getMaxUnits();
        let placedCount = 0;

        for (const unit of benchUnits) {
            const currentCount = this.board.getPlacedUnitCount();
            if (currentCount >= maxUnits) break;

            const emptySlot = this.board.findEmptyPlayerCell();
            if (!emptySlot) break;

            this.bench.removeUnit(unit);
            this.board.placeUnit(unit, emptySlot.q, emptySlot.r);
            placedCount++;
        }

        if (placedCount > 0) {
            this.updateSynergies();
            this.updateUI();
            debugConsole.log('GameController', `${placedCount}개 유닛 자동 배치`);
        }
    }

    /**
     * 플레이어 유닛 초기 위치로 복원
     */
    restorePlayerUnits() {
        if (!this.initialPositions) return;

        const unitsToRemove = [];

        this.initialPositions.forEach((initialPos, unitId) => {
            const unit = this.board.units.get(unitId);
            if (!unit) return;

            // 사망한 유닛은 영구 제거
            if (!unit.isAlive) {
                unitsToRemove.push(unit);
                return;
            }

            // 위치 복원 필요 여부 체크
            const needsRestore = !unit.position ||
                unit.position.q !== initialPos.q ||
                unit.position.r !== initialPos.r;

            if (needsRestore) {
                // 현재 셀에서 유닛 정보 제거
                if (unit.position) {
                    const currentKey = `${unit.position.q},${unit.position.r}`;
                    const currentCell = this.board.cells.get(currentKey);
                    if (currentCell) {
                        currentCell.unit = null;
                        currentCell.element.classList.remove('occupied');
                    }
                }

                // 초기 위치 셀에 유닛 배치
                const targetKey = `${initialPos.q},${initialPos.r}`;
                const targetCell = this.board.cells.get(targetKey);
                if (targetCell) {
                    targetCell.unit = unit;
                    targetCell.element.classList.add('occupied');
                    unit.position = { q: initialPos.q, r: initialPos.r };

                    // DOM 요소 이동
                    if (unit.element) {
                        if (unit.element.parentNode) {
                            unit.element.parentNode.removeChild(unit.element);
                        }
                        targetCell.element.appendChild(unit.element);
                    }
                }
            }

            // 체력/마나 복구
            unit.currentHp = unit.stats.hp;
            unit.currentMana = unit.stats.mana;
            unit.target = null;

            if (unit.element) {
                unit.updateBars();
            }

            // 드래그 이벤트 재등록
            this.board.setupUnitDrag(unit);
        });

        // 사망 유닛 영구 제거
        unitsToRemove.forEach(unit => {
            this.board.units.delete(unit.id);
            this.unitManager.unregisterUnit(unit);
            debugConsole.log('GameController', `${unit.name} 영구 제거됨`);
        });

        // 초기 위치 맵 정리
        this.initialPositions.clear();

        // 시너지 업데이트
        if (unitsToRemove.length > 0) {
            this.updateSynergies();
            this.updateUI();
        }
    }

    // ========== 툴팁 메서드 (하위 호환성) ==========

    /**
     * 유닛 툴팁 표시
     */
    showUnitTooltip(unit, event) {
        this.tooltipManager.show(unit, event);
    }

    /**
     * 상점 유닛 툴팁 표시
     */
    showShopTooltip(unitData, event) {
        this.tooltipManager.showShop(unitData, event);
    }

    /**
     * 적 유닛 툴팁 표시
     */
    showEnemyTooltip(enemy, event) {
        this.tooltipManager.showEnemy(enemy, event);
    }

    /**
     * 툴팁 숨기기
     */
    hideUnitTooltip() {
        this.tooltipManager.hide();
    }
}

// 전역 게임 인스턴스
let game;
