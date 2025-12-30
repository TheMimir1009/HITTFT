// 유닛 관리 클래스 (구매/판매/합성)

class UnitManager {
    constructor() {
        // 모든 유닛 관리 (합성 추적용)
        this.allUnits = new Map(); // unitId -> [Unit 배열]

        // 판매가 데이터
        this.sellPrices = null;

        // 외부 의존성 (init에서 설정)
        this.gameState = null;
        this.board = null;
        this.bench = null;
        this.shop = null;
        this.initialPositions = null;

        // 콜백 함수들
        this.onUpdateUI = () => {};
        this.onUpdateSynergies = () => {};
        this.onHideTooltip = () => {};
    }

    /**
     * 초기화
     */
    init(dependencies) {
        this.gameState = dependencies.gameState;
        this.board = dependencies.board;
        this.bench = dependencies.bench;
        this.shop = dependencies.shop;

        this.onUpdateUI = dependencies.onUpdateUI || (() => {});
        this.onUpdateSynergies = dependencies.onUpdateSynergies || (() => {});
        this.onHideTooltip = dependencies.onHideTooltip || (() => {});
    }

    /**
     * initialPositions 참조 설정 (전투 시작 시)
     */
    setInitialPositions(map) {
        this.initialPositions = map;
    }

    /**
     * 판매가 데이터 로드
     */
    async loadSellPrices() {
        try {
            const response = await fetch('js/data/sellPrices.json');
            const data = await response.json();
            this.sellPrices = data.prices;
            debugConsole.log('UnitManager', '판매가 데이터 로드 완료', this.sellPrices);
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
     * 유닛 구매
     */
    buyUnit(shopSlot) {
        const unitData = this.shop.getUnitData(shopSlot);
        if (!unitData) return false;

        // 골드 체크
        if (this.gameState.gold < unitData.cost) {
            debugConsole.log('UnitManager', '골드 부족');
            return false;
        }

        // 벤치 공간 체크
        if (this.bench.isFull()) {
            debugConsole.log('UnitManager', '벤치가 가득 참');
            return false;
        }

        // 구매 실행
        const unit = this.shop.buyUnit(shopSlot);
        if (unit) {
            this.gameState.spendGold(unitData.cost);
            this.bench.addUnit(unit);
            this.registerUnit(unit);
            this.onUpdateUI();
            this.checkMerge(unit.unitId);
            return true;
        }
        return false;
    }

    /**
     * 유닛 등록 (합성 추적용)
     */
    registerUnit(unit) {
        if (!this.allUnits.has(unit.unitId)) {
            this.allUnits.set(unit.unitId, []);
        }
        this.allUnits.get(unit.unitId).push(unit);
        debugConsole.log('UnitManager', `유닛 등록: ${unit.name} (총 ${this.allUnits.get(unit.unitId).length}개)`);
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
                debugConsole.log('UnitManager', `유닛 해제: ${unit.name}`);
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
        this.onUpdateSynergies();
        this.onUpdateUI();

        // 연쇄 합성 체크
        this.checkMerge(newUnit.unitId);

        debugConsole.log('UnitManager', `${newUnit.name} ★${newStarLevel} 합성 완료!`);
    }

    /**
     * 유닛 판매
     */
    sellUnit(unit, source, index) {
        // 판매 가격
        const sellPrice = this.getSellPrice(unit);

        // 툴팁 숨기기
        this.onHideTooltip();

        // 유닛 제거
        if (source === 'board') {
            this.board.removeUnit(unit);
            // initialPositions에서도 제거
            if (this.initialPositions) {
                this.initialPositions.delete(unit.id);
            }
        } else if (source === 'bench') {
            this.bench.removeUnitByIndex(index);
        }

        this.unregisterUnit(unit);

        // 골드 추가
        this.gameState.addGold(sellPrice);

        // 시너지 업데이트
        this.onUpdateSynergies();
        this.onUpdateUI();

        debugConsole.log('UnitManager', `${unit.name} 판매 (+${sellPrice}G)`);
    }

    /**
     * 합성 가능 유닛 개수 (하이라이트용)
     */
    getUnitCounts() {
        const counts = {};
        this.allUnits.forEach((units, unitId) => {
            counts[unitId] = units.length;
        });
        return counts;
    }

    /**
     * 특정 유닛 ID의 개수
     */
    getUnitCount(unitId) {
        return this.allUnits.get(unitId)?.length || 0;
    }

    /**
     * 모든 유닛 정리
     */
    clear() {
        this.allUnits.clear();
        debugConsole.log('UnitManager', '모든 유닛 정리됨');
    }

    /**
     * 리셋
     */
    reset() {
        this.clear();
        this.initialPositions = null;
    }
}
