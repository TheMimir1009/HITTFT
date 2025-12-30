// 메인 게임 클래스

class Game {
    constructor() {
        // 게임 상태
        this.state = {
            hp: 100,
            gold: 10,
            level: 1,
            xp: 0,
            round: 1,
            maxRound: 10,
            phase: 'preparation', // preparation, battle
            winStreak: 0,
            loseStreak: 0
        };

        // 레벨별 필요 경험치 및 배치 가능 유닛 수
        this.levelData = {
            1: { xpNeeded: 2, maxUnits: 1 },
            2: { xpNeeded: 6, maxUnits: 2 },
            3: { xpNeeded: 10, maxUnits: 3 },
            4: { xpNeeded: 20, maxUnits: 4 },
            5: { xpNeeded: 36, maxUnits: 5 },
            6: { xpNeeded: 56, maxUnits: 6 },
            7: { xpNeeded: 80, maxUnits: 7 },
            8: { xpNeeded: Infinity, maxUnits: 8 }
        };

        // 컴포넌트
        this.board = null;
        this.bench = null;
        this.shop = null;
        this.synergyManager = null;
        this.combatManager = null;

        // 모든 유닛 관리 (합성용)
        this.allUnits = new Map(); // unitId -> [Unit 배열]

        // 툴팁 요소
        this.tooltip = null;

        // 타이머 관련
        this.prepTimer = null;
        this.prepTimeRemaining = 30;
        this.battleStartTime = 0;
        this.battleTimer = null;

        // 판매가 데이터
        this.sellPrices = null;
    }

    /**
     * 게임 초기화
     */
    async init() {
        // 판매가 데이터 로드
        await this.loadSellPrices();

        // 컴포넌트 초기화
        this.board = new Board();
        this.bench = new Bench();
        this.shop = new Shop();
        this.synergyManager = new SynergyManager();
        this.combatManager = new CombatManager();

        this.tooltip = document.getElementById('unit-tooltip');

        // UI 초기화
        this.updateUI();
        this.shop.refresh(this.state.level);
        this.synergyManager.render();

        // 모달 버튼 이벤트
        document.getElementById('btn-continue').addEventListener('click', () => {
            this.closeBattleResultModal();
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            this.restart();
        });

        // 준비 페이즈 타이머 시작
        this.startPrepTimer();

        console.log('게임이 초기화되었습니다.');
    }

    /**
     * 판매가 데이터 로드
     */
    async loadSellPrices() {
        try {
            const response = await fetch('js/data/sellPrices.json');
            const data = await response.json();
            this.sellPrices = data.prices;
            console.log('판매가 데이터 로드 완료:', this.sellPrices);
        } catch (error) {
            console.error('판매가 데이터 로드 실패:', error);
            // 기본값 설정
            this.sellPrices = { "1": 1, "2": 2, "3": 3 };
        }
    }

    /**
     * 유닛 판매가 계산
     */
    getSellPrice(unit) {
        const costKey = String(unit.cost);
        return this.sellPrices?.[costKey] ?? unit.cost;
    }

    /**
     * UI 업데이트
     */
    updateUI() {
        document.getElementById('player-hp').textContent = this.state.hp;
        document.getElementById('player-gold').textContent = this.state.gold;
        document.getElementById('player-level').textContent = this.state.level;
        document.getElementById('player-xp').textContent = this.state.xp;
        document.getElementById('xp-needed').textContent = this.levelData[this.state.level].xpNeeded;
        document.getElementById('current-round').textContent = this.state.round;

        // 배치 유닛 수 표시
        const placedCount = this.board ? this.board.getPlacedUnitCount() : 0;
        const maxUnits = this.levelData[this.state.level].maxUnits;
        document.getElementById('placed-units').textContent = placedCount;
        document.getElementById('max-units').textContent = maxUnits;

        // 연승/연패 표시
        const streakDisplay = document.getElementById('streak-display');
        if (this.state.winStreak >= 2) {
            streakDisplay.textContent = `🔥 ${this.state.winStreak}연승`;
            streakDisplay.className = 'win-streak';
        } else if (this.state.loseStreak >= 2) {
            streakDisplay.textContent = `💔 ${this.state.loseStreak}연패`;
            streakDisplay.className = 'lose-streak';
        } else {
            streakDisplay.textContent = '';
            streakDisplay.className = '';
        }

        // 버튼 상태 업데이트
        this.shop.updateButtons(this.state.gold, this.state.phase === 'battle');

        // 합성 가능 유닛 하이라이트
        this.updateMergeHighlights();
    }

    /**
     * 유닛 구매
     */
    buyUnit(shopSlot) {
        const unitData = this.shop.getUnitData(shopSlot);
        if (!unitData) return;

        // 골드 체크
        if (this.state.gold < unitData.cost) {
            console.log('골드가 부족합니다.');
            return;
        }

        // 벤치 공간 체크
        if (this.bench.isFull()) {
            console.log('벤치가 가득 찼습니다.');
            return;
        }

        // 구매 실행
        const unit = this.shop.buyUnit(shopSlot);
        if (unit) {
            this.state.gold -= unitData.cost;
            this.bench.addUnit(unit);
            this.registerUnit(unit);
            this.updateUI();
            this.checkMerge(unit.unitId);
        }
    }

    /**
     * 유닛 등록 (합성 추적용)
     */
    registerUnit(unit) {
        if (!this.allUnits.has(unit.unitId)) {
            this.allUnits.set(unit.unitId, []);
        }
        this.allUnits.get(unit.unitId).push(unit);
    }

    /**
     * 유닛 등록 해제
     */
    unregisterUnit(unit) {
        const units = this.allUnits.get(unit.unitId);
        if (units) {
            const index = units.findIndex(u => u.id === unit.id);
            if (index !== -1) {
                units.splice(index, 1);
            }
        }
    }

    /**
     * 합성 체크
     */
    checkMerge(unitId) {
        const units = this.allUnits.get(unitId);
        if (!units) return;

        // 같은 별 등급의 유닛 3개 찾기
        const starGroups = {};
        units.forEach(unit => {
            if (!starGroups[unit.starLevel]) {
                starGroups[unit.starLevel] = [];
            }
            starGroups[unit.starLevel].push(unit);
        });

        // 합성 가능한 그룹 찾기
        for (const [starLevel, group] of Object.entries(starGroups)) {
            if (group.length >= 3 && parseInt(starLevel) < 3) {
                this.performMerge(group.slice(0, 3));
                break;
            }
        }
    }

    /**
     * 합성 실행
     */
    performMerge(units) {
        if (units.length !== 3) return;

        const baseUnit = units[0];
        const newStarLevel = baseUnit.starLevel + 1;

        // 새 유닛 생성
        const unitData = UNITS_DATA[baseUnit.unitId];
        const newUnit = new Unit(unitData, newStarLevel);

        // 기존 유닛 위치 저장
        let position = null;
        let location = null; // 'board' or 'bench'
        let benchSlot = -1;

        // 기존 유닛 제거
        units.forEach(unit => {
            if (unit.position) {
                position = unit.position;
                location = 'board';
                this.board.removeUnit(unit);
                // initialPositions에서도 제거 (라운드 복구 시 충돌 방지)
                if (this.initialPositions) {
                    this.initialPositions.delete(unit.id);
                }
            } else {
                const slot = this.bench.getUnitSlot(unit);
                if (slot !== -1) {
                    if (!position) {
                        location = 'bench';
                        benchSlot = slot;
                    }
                    this.bench.removeUnit(unit);
                }
            }
            this.unregisterUnit(unit);
        });

        // 새 유닛 배치
        this.registerUnit(newUnit);

        if (location === 'board' && position) {
            this.board.placeUnit(newUnit, position.q, position.r);
        } else {
            this.bench.addUnit(newUnit, benchSlot);
        }

        // 시너지 업데이트
        this.updateSynergies();
        this.updateUI();

        // 연쇄 합성 체크
        this.checkMerge(newUnit.unitId);

        console.log(`${newUnit.name} ★${newStarLevel} 합성 완료!`);
    }

    /**
     * 유닛 판매
     */
    sellUnit(unit, source, index) {
        // 판매 가격 (JSON 데이터 참조)
        const sellPrice = this.getSellPrice(unit);

        // 툴팁 숨기기 (판매 시 툴팁 제거)
        this.hideUnitTooltip();

        // 유닛 제거
        if (source === 'board') {
            this.board.removeUnit(unit);
            // initialPositions에서도 제거 (라운드 간 겹침 방지)
            if (this.initialPositions) {
                this.initialPositions.delete(unit.id);
            }
        } else if (source === 'bench') {
            this.bench.removeUnitByIndex(index);
        }

        this.unregisterUnit(unit);

        // 골드 추가
        this.state.gold += sellPrice;

        // 시너지 업데이트
        this.updateSynergies();
        this.updateUI();

        console.log(`${unit.name} 판매 (+${sellPrice}G)`);
    }

    /**
     * 상점 리롤
     */
    rerollShop() {
        if (this.state.gold < 2) {
            console.log('골드가 부족합니다.');
            return;
        }

        this.state.gold -= 2;
        this.shop.refresh(this.state.level);
        this.updateUI();
    }

    /**
     * 경험치 구매
     */
    buyXP() {
        if (this.state.gold < 4) {
            console.log('골드가 부족합니다.');
            return;
        }

        if (this.state.level >= 6) {
            console.log('최대 레벨입니다.');
            return;
        }

        this.state.gold -= 4;
        this.gainXP(4);
        this.updateUI();
    }

    /**
     * 경험치 획득
     */
    gainXP(amount) {
        this.state.xp += amount;

        // 레벨업 체크
        while (this.state.level < 8 && this.state.xp >= this.levelData[this.state.level].xpNeeded) {
            this.state.xp -= this.levelData[this.state.level].xpNeeded;
            this.state.level++;
            console.log(`레벨 업! (Lv.${this.state.level})`);
        }
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
                const maxUnits = this.levelData[this.state.level].maxUnits;

                if (placedCount >= maxUnits && !unit.position) {
                    console.log(`최대 ${maxUnits}개의 유닛만 배치할 수 있습니다.`);
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
                // initialPositions에서도 제거 (라운드 간 겹침 방지)
                if (this.initialPositions) {
                    this.initialPositions.delete(unit.id);
                }
            }
        } else if (sourceType === 'bench') {
            unit = this.bench.getUnitById(unitId);
            if (unit) {
                const currentSlot = this.bench.getUnitSlot(unit);
                if (currentSlot !== slotIndex) {
                    // 슬롯 교환
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
     * 시너지 업데이트
     */
    updateSynergies() {
        const boardUnits = this.board.getPlayerUnits();
        this.synergyManager.calculate(boardUnits);
        this.synergyManager.applyToUnits(boardUnits);
        this.synergyManager.render();
    }

    /**
     * 합성 가능 유닛 하이라이트 업데이트
     */
    updateMergeHighlights() {
        const unitCounts = {};

        this.allUnits.forEach((units, unitId) => {
            // 같은 별 등급별로 카운트
            units.forEach(unit => {
                const key = `${unitId}_${unit.starLevel}`;
                unitCounts[key] = (unitCounts[key] || 0) + 1;
            });
        });

        // 3개 이상인 유닛 찾기
        const mergeableUnitIds = {};
        Object.entries(unitCounts).forEach(([key, count]) => {
            if (count >= 3) {
                const unitId = key.split('_')[0];
                mergeableUnitIds[unitId] = count;
            }
        });

        this.board.highlightMergeable(mergeableUnitIds);
        this.bench.highlightMergeable(mergeableUnitIds);
    }

    /**
     * 전투 시작
     */
    async startBattle() {
        if (this.state.phase === 'battle') return;

        const playerUnits = this.board.getPlayerUnits();
        if (playerUnits.length === 0) {
            // 유닛이 배치되지 않은 경우 전투 시작 불가
            debugConsole.log('Game', '전투 시작 불가: 유닛이 배치되지 않음');
            alert('유닛을 배치해주세요!');
            return;
        }

        // 타이머 전환
        this.stopPrepTimer();

        this.state.phase = 'battle';
        this.startBattleTimer();

        this.shop.disable();
        this.updateUI();

        // 플레이어 유닛 초기 위치 저장
        this.initialPositions = new Map();
        playerUnits.forEach(unit => {
            if (unit.position) {
                this.initialPositions.set(unit.id, { ...unit.position });
            }
        });

        // 적 웨이브 생성
        const waveData = WAVES_DATA[this.state.round - 1];
        const enemies = this.createEnemyWave(waveData);

        // 적 배치
        this.board.placeEnemies(enemies);

        // 전투 시작
        console.log(`라운드 ${this.state.round}: ${waveData.name}`);

        debugConsole.log('Game', '전투 시작, combatManager.start() 호출');

        const result = await this.combatManager.start(
            playerUnits,
            enemies,
            this.synergyManager,
            this.board
        );

        debugConsole.log('Game', 'combatManager.start() 완료, 결과:', result);

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
        debugConsole.log('Game', 'processBattleResult 호출됨', result);

        try {
            // 툴팁 숨기기 (hover 상태에서 전투 종료 시 툴팁 잔류 방지)
            this.hideUnitTooltip();

            // 전투 타이머 정지
            this.stopBattleTimer();
            debugConsole.log('Game', '1. 전투 타이머 정지 완료');

            this.state.phase = 'preparation';

            // ★ 전체 셀 강제 정리 (가장 먼저!)
            // - 죽은 유닛 DOM 제거
            // - 빈 셀 occupied 클래스 제거
            // - cell.unit 참조 정리
            this.board.forceCleanupAllCells();
            debugConsole.log('Game', '2. 전체 셀 강제 정리 완료');

            // 적 영역 정리 (남은 적 DOM 제거)
            this.board.clearEnemyZone();
            debugConsole.log('Game', '2.5. 적 영역 정리 완료');

            // 플레이어 유닛 초기 위치로 복원 및 체력 복구
            this.restorePlayerUnits();
            debugConsole.log('Game', '3. 유닛 위치/체력 복구 완료');

            let goldEarned = 5; // 기본 골드
            let damage = 0;

            if (result.victory) {
                // 승리
                this.state.winStreak++;
                this.state.loseStreak = 0;

                goldEarned += 1; // 승리 보너스

                // 연승 보너스
                if (this.state.winStreak >= 5) {
                    goldEarned += 3;
                } else if (this.state.winStreak >= 3) {
                    goldEarned += 2;
                } else if (this.state.winStreak >= 2) {
                    goldEarned += 1;
                }
            } else {
                // 패배
                this.state.loseStreak++;
                this.state.winStreak = 0;

                // 연패 보너스
                if (this.state.loseStreak >= 5) {
                    goldEarned += 3;
                } else if (this.state.loseStreak >= 3) {
                    goldEarned += 2;
                } else if (this.state.loseStreak >= 2) {
                    goldEarned += 1;
                }

                // 피해 계산
                damage = waveData.baseDamage + (result.remainingEnemyUnits * waveData.damagePerEnemy);
                this.state.hp -= damage;
            }

            // 골드 지급
            this.state.gold += goldEarned;

            // 경험치 지급
            this.gainXP(2);
            debugConsole.log('Game', '4. 보상 지급 완료', { goldEarned, damage });

            // 결과 모달 표시
            this.showBattleResultModal(result, goldEarned, damage, waveData);
            debugConsole.log('Game', '5. 모달 표시 완료');

            // 게임 종료 체크
            if (this.state.hp <= 0) {
                debugConsole.log('Game', '게임 오버 - HP 0');
                this.gameOver(false);
                return;
            }

            if (this.state.round >= this.state.maxRound && result.victory) {
                debugConsole.log('Game', '게임 클리어!');
                this.gameOver(true);
                return;
            }

            // 다음 라운드 준비
            this.state.round++;
            debugConsole.log('Game', '6. 다음 라운드 준비', { round: this.state.round });

            this.shop.refresh(this.state.level);
            this.shop.enable();
            this.updateUI();
            debugConsole.log('Game', '7. 상점/UI 업데이트 완료');

            // 새 준비 페이즈 타이머 시작
            this.startPrepTimer();
            debugConsole.log('Game', '8. 준비 타이머 시작 완료');

        } catch (error) {
            debugConsole.log('Error', `processBattleResult 에러: ${error.message}`, { stack: error.stack });
            console.error('processBattleResult 에러:', error);
        }
    }

    /**
     * 전투 결과 모달 표시
     */
    showBattleResultModal(result, goldEarned, damage, waveData) {
        const modal = document.getElementById('battle-result-modal');
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

        const battleDuration = Math.floor((Date.now() - this.battleStartTime) / 1000);

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

        modal.classList.remove('hidden');
    }

    /**
     * 전투 결과 모달 닫기
     */
    closeBattleResultModal() {
        document.getElementById('battle-result-modal').classList.add('hidden');
    }

    /**
     * 게임 종료
     */
    gameOver(victory) {
        // 모든 타이머 정지
        this.stopPrepTimer();
        this.stopBattleTimer();

        // 툴팁 숨기기
        this.hideUnitTooltip();

        const modal = document.getElementById('game-over-modal');
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
                <span>${this.state.round} / ${this.state.maxRound}</span>
            </div>
            <div class="stat-row">
                <span>최종 레벨</span>
                <span>Lv.${this.state.level}</span>
            </div>
            <div class="stat-row">
                <span>남은 체력</span>
                <span>${Math.max(0, this.state.hp)} HP</span>
            </div>
        `;

        document.getElementById('battle-result-modal').classList.add('hidden');
        modal.classList.remove('hidden');
    }

    /**
     * 게임 재시작
     */
    restart() {
        // 타이머 정리
        this.stopPrepTimer();
        this.stopBattleTimer();

        // 상태 초기화
        this.state = {
            hp: 100,
            gold: 10,
            level: 1,
            xp: 0,
            round: 1,
            maxRound: 10,
            phase: 'preparation',
            winStreak: 0,
            loseStreak: 0
        };

        // 컴포넌트 초기화
        this.board.clearAll();
        this.bench.clear();
        this.allUnits.clear();
        this.synergyManager.reset();

        // 툴팁 숨기기
        this.hideUnitTooltip();

        // UI 초기화
        this.shop.refresh(this.state.level);
        this.updateUI();

        // 모달 닫기
        document.getElementById('game-over-modal').classList.add('hidden');
        document.getElementById('battle-result-modal').classList.add('hidden');

        // 준비 페이즈 타이머 시작
        this.startPrepTimer();

        console.log('게임이 재시작되었습니다.');
    }

    /**
     * 유닛 툴팁 표시
     */
    showUnitTooltip(unit, event) {
        const tooltip = this.tooltip;

        tooltip.querySelector('.unit-name').textContent = `${unit.name} ${getStarsString(unit.starLevel)}`;
        tooltip.querySelector('.unit-cost').textContent = `${unit.cost}G`;

        tooltip.querySelector('.unit-stats').innerHTML = `
            <div class="stat-item"><span class="stat-label">체력</span><span>${unit.stats.hp}</span></div>
            <div class="stat-item"><span class="stat-label">공격력</span><span>${unit.stats.attack}</span></div>
            <div class="stat-item"><span class="stat-label">공격속도</span><span>${unit.stats.attackSpeed.toFixed(2)}</span></div>
            <div class="stat-item"><span class="stat-label">사거리</span><span>${unit.stats.range}</span></div>
            <div class="stat-item"><span class="stat-label">방어력</span><span>${unit.stats.defense}</span></div>
            <div class="stat-item"><span class="stat-label">마나</span><span>${unit.currentMana}/${unit.stats.maxMana}</span></div>
        `;

        tooltip.querySelector('.unit-skill').innerHTML = `
            <div class="skill-name">${unit.skill.name}</div>
            <div class="skill-desc">${unit.skill.description}</div>
        `;

        tooltip.querySelector('.unit-synergies').innerHTML = `
            <span class="synergy-tag">${RACE_ICONS[unit.race]} ${RACE_NAMES[unit.race]}</span>
            <span class="synergy-tag">${WEAPON_ICONS[unit.weapon]} ${WEAPON_NAMES[unit.weapon]}</span>
        `;

        // 위치 계산
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;

        tooltip.classList.remove('hidden');
    }

    /**
     * 상점 유닛 툴팁 표시
     */
    showShopTooltip(unitData, event) {
        const tooltip = this.tooltip;

        tooltip.querySelector('.unit-name').textContent = unitData.name;
        tooltip.querySelector('.unit-cost').textContent = `${unitData.cost}G`;

        tooltip.querySelector('.unit-stats').innerHTML = `
            <div class="stat-item"><span class="stat-label">체력</span><span>${unitData.stats.hp}</span></div>
            <div class="stat-item"><span class="stat-label">공격력</span><span>${unitData.stats.attack}</span></div>
            <div class="stat-item"><span class="stat-label">공격속도</span><span>${unitData.stats.attackSpeed}</span></div>
            <div class="stat-item"><span class="stat-label">사거리</span><span>${unitData.stats.range}</span></div>
            <div class="stat-item"><span class="stat-label">방어력</span><span>${unitData.stats.defense}</span></div>
            <div class="stat-item"><span class="stat-label">마나</span><span>0/${unitData.stats.maxMana}</span></div>
        `;

        tooltip.querySelector('.unit-skill').innerHTML = `
            <div class="skill-name">${unitData.skill.name}</div>
            <div class="skill-desc">${unitData.skill.description}</div>
        `;

        tooltip.querySelector('.unit-synergies').innerHTML = `
            <span class="synergy-tag">${RACE_ICONS[unitData.race]} ${RACE_NAMES[unitData.race]}</span>
            <span class="synergy-tag">${WEAPON_ICONS[unitData.weapon]} ${WEAPON_NAMES[unitData.weapon]}</span>
        `;

        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;

        tooltip.classList.remove('hidden');
    }

    /**
     * 적 유닛 툴팁 표시
     */
    showEnemyTooltip(enemy, event) {
        const tooltip = this.tooltip;

        const namePrefix = enemy.isBoss ? '[보스] ' : '';
        tooltip.querySelector('.unit-name').textContent = `${namePrefix}${enemy.name}`;
        tooltip.querySelector('.unit-cost').textContent = '적';

        tooltip.querySelector('.unit-stats').innerHTML = `
            <div class="stat-item"><span class="stat-label">체력</span><span>${enemy.currentHp}/${enemy.stats.hp}</span></div>
            <div class="stat-item"><span class="stat-label">공격력</span><span>${enemy.stats.attack}</span></div>
            <div class="stat-item"><span class="stat-label">공격속도</span><span>${enemy.stats.attackSpeed.toFixed(2)}</span></div>
            <div class="stat-item"><span class="stat-label">사거리</span><span>${enemy.stats.range}</span></div>
            <div class="stat-item"><span class="stat-label">방어력</span><span>${enemy.stats.defense}</span></div>
        `;

        tooltip.querySelector('.unit-skill').innerHTML = `
            <div class="skill-desc" style="color: #888;">스킬 없음</div>
        `;

        tooltip.querySelector('.unit-synergies').innerHTML = '';

        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;

        tooltip.classList.remove('hidden');
    }

    /**
     * 툴팁 숨기기
     */
    hideUnitTooltip() {
        this.tooltip.classList.add('hidden');
    }

    /**
     * 준비 페이즈 타이머 시작
     */
    startPrepTimer() {
        this.stopPrepTimer();
        this.prepTimeRemaining = 30;
        this.updateTimerDisplay();

        this.prepTimer = setInterval(() => {
            this.prepTimeRemaining--;
            this.updateTimerDisplay();

            if (this.prepTimeRemaining <= 0) {
                this.stopPrepTimer();
                this.autoPlaceUnits();
                this.startBattle();
            }
        }, 1000);
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
     * 전투 경과 시간 표시 시작
     */
    startBattleTimer() {
        this.battleStartTime = Date.now();
        this.updateTimerDisplay();

        this.battleTimer = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);
    }

    /**
     * 전투 경과 시간 표시 정지
     */
    stopBattleTimer() {
        if (this.battleTimer) {
            clearInterval(this.battleTimer);
            this.battleTimer = null;
        }
    }

    /**
     * 타이머 UI 업데이트
     */
    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        const timerLabel = document.getElementById('timer-label');

        if (this.state.phase === 'preparation') {
            timerDisplay.textContent = this.prepTimeRemaining;
            timerLabel.textContent = '준비';
            timerDisplay.className = 'value preparation';

            if (this.prepTimeRemaining <= 5) {
                timerDisplay.classList.add('danger');
            } else if (this.prepTimeRemaining <= 10) {
                timerDisplay.classList.add('warning');
            }
        } else {
            const elapsed = Math.floor((Date.now() - this.battleStartTime) / 1000);
            timerDisplay.textContent = this.formatTime(elapsed);
            timerLabel.textContent = '전투 중';
            timerDisplay.className = 'value battle';
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
     * 벤치 유닛 자동 배치
     */
    autoPlaceUnits() {
        const benchUnits = this.bench.getAllUnits();
        if (benchUnits.length === 0) return;

        const maxUnits = this.levelData[this.state.level].maxUnits;
        let placedCount = 0;

        for (const unit of benchUnits) {
            const currentCount = this.board.getPlacedUnitCount();
            if (currentCount >= maxUnits) break;

            // 매번 빈 셀을 새로 찾아서 겹침 방지
            const emptySlot = this.board.findEmptyPlayerCell();
            if (!emptySlot) break;

            this.bench.removeUnit(unit);
            this.board.placeUnit(unit, emptySlot.q, emptySlot.r);
            placedCount++;
        }

        if (placedCount > 0) {
            this.updateSynergies();
            this.updateUI();
            console.log(`${placedCount}개 유닛 자동 배치 완료`);
        }
    }

    /**
     * 플레이어 유닛 초기 위치로 복원 및 상태 초기화
     * 사망한 유닛은 영구 제거됨
     */
    restorePlayerUnits() {
        if (!this.initialPositions) return;

        // 제거할 유닛 목록 (forEach 중 삭제 방지)
        const unitsToRemove = [];

        this.initialPositions.forEach((initialPos, unitId) => {
            const unit = this.board.units.get(unitId);
            if (!unit) return;

            // 사망한 유닛은 영구 제거
            if (!unit.isAlive) {
                unitsToRemove.push(unit);
                return;
            }

            // === 생존 유닛만 복원 ===

            // 위치 복원 필요 여부
            const needsRestore = !unit.position ||
                unit.position.q !== initialPos.q ||
                unit.position.r !== initialPos.r;

            if (needsRestore) {
                // 현재 셀에서 유닛 정보 제거 (있는 경우)
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

                    // DOM 요소 이동 또는 재배치
                    if (unit.element) {
                        if (unit.element.parentNode) {
                            unit.element.parentNode.removeChild(unit.element);
                        }
                        targetCell.element.appendChild(unit.element);
                    }
                }
            }

            // 체력/마나 복구 및 상태 초기화
            unit.currentHp = unit.stats.hp;
            unit.currentMana = unit.stats.mana;
            unit.target = null;

            if (unit.element) {
                unit.updateBars();
            }

            // 드래그 이벤트 재등록 (die()에서 제거됨)
            this.board.setupUnitDrag(unit);
        });

        // 사망 유닛 영구 제거
        unitsToRemove.forEach(unit => {
            this.board.units.delete(unit.id);  // 보드에서 제거
            this.unregisterUnit(unit);          // allUnits에서 제거 (합성 추적)
            debugConsole.log('Game', `${unit.name} 영구 제거됨`);
        });

        // 초기 위치 맵 정리
        this.initialPositions.clear();

        // 시너지 업데이트 (유닛 제거로 인한 변경)
        if (unitsToRemove.length > 0) {
            this.updateSynergies();
            this.updateUI();
        }
    }
}

// 전역 게임 인스턴스
let game;
