// 게임 보드 관리 클래스

class Board {
    constructor() {
        this.cells = new Map(); // "q,r" -> cell object
        this.units = new Map(); // unitId -> Unit 객체
        this.element = null;

        this.init();
    }

    /**
     * 보드 초기화
     */
    init() {
        this.element = document.getElementById('game-board');
        this.createGrid();
    }

    /**
     * 그리드 생성 (육각형)
     */
    createGrid() {
        this.element.innerHTML = '';
        this.cells.clear();

        HEX_GRID.forEach(hex => {
            const cell = createElement('div', 'hex-cell');
            const zone = getZone(hex);
            cell.classList.add(`${zone}-zone`);

            // 픽셀 위치 계산
            const pos = hexToPixel(hex, HEX_SIZE, BOARD_CENTER);

            // 육각형 중심 정렬
            cell.style.left = `${pos.x - HEX_SIZE * Math.sqrt(3) / 2}px`;
            cell.style.top = `${pos.y - HEX_SIZE}px`;

            cell.setAttribute('data-q', hex.q);
            cell.setAttribute('data-r', hex.r);

            const cellData = {
                q: hex.q,
                r: hex.r,
                element: cell,
                unit: null,
                zone: zone
            };

            this.cells.set(hex.toKey(), cellData);
            this.element.appendChild(cell);
        });

        this.setupDragAndDrop();
    }

    /**
     * 드래그 앤 드롭 설정
     */
    setupDragAndDrop() {
        this.cells.forEach(cell => {
            // 플레이어/중립 영역만 드롭 허용
            if (cell.zone === 'player' || cell.zone === 'neutral') {
                cell.element.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    cell.element.classList.add('drag-over');
                });

                cell.element.addEventListener('dragleave', () => {
                    cell.element.classList.remove('drag-over');
                });

                cell.element.addEventListener('drop', (e) => {
                    e.preventDefault();
                    cell.element.classList.remove('drag-over');

                    const unitId = e.dataTransfer.getData('text/plain');
                    const sourceType = e.dataTransfer.getData('source-type');

                    if (unitId) {
                        game.handleUnitDrop(unitId, sourceType, cell.q, cell.r);
                    }
                });
            }
        });
    }

    /**
     * 유닛을 보드에 배치 (육각형 좌표)
     */
    placeUnit(unit, q, r) {
        const key = `${q},${r}`;
        if (!this.cells.has(key)) return false;

        // 기존 위치 저장 (스왑용)
        const oldPosition = unit.position ? { ...unit.position } : null;

        // 기존 위치에서 제거
        if (unit.position) {
            const oldKey = `${unit.position.q},${unit.position.r}`;
            if (this.cells.has(oldKey)) {
                const oldCell = this.cells.get(oldKey);
                oldCell.unit = null;
                oldCell.element.classList.remove('occupied');
            }
        }

        const cell = this.cells.get(key);

        // 이미 유닛이 있는 경우 스왑 또는 거부
        if (cell.unit) {
            const existingUnit = cell.unit;
            if (oldPosition) {
                // 스왑: 기존 유닛을 이전 위치로 이동
                const oldKey = `${oldPosition.q},${oldPosition.r}`;
                const oldCell = this.cells.get(oldKey);
                if (oldCell) {
                    oldCell.unit = existingUnit;
                    oldCell.element.appendChild(existingUnit.element);
                    existingUnit.position = { q: oldPosition.q, r: oldPosition.r };
                    oldCell.element.classList.add('occupied');
                }
            } else {
                // 스왑 불가 (벤치에서 오는 경우) - 배치 거부
                console.warn(`셀 (${q},${r})에 이미 유닛이 있어 배치 거부`);
                return false;
            }
        }

        cell.unit = unit;
        unit.position = { q, r };

        // DOM 업데이트
        if (!unit.element) {
            unit.createElement();
        }

        // 드래그 이벤트 설정
        this.setupUnitDrag(unit);

        cell.element.appendChild(unit.element);
        cell.element.classList.add('occupied');

        this.units.set(unit.id, unit);

        return true;
    }

    /**
     * 유닛 드래그 이벤트 설정
     */
    setupUnitDrag(unit) {
        // 기존 리스너 제거 (중복 방지)
        unit.removeAllEventListeners();

        // 드래그 이벤트 (참조 저장)
        unit.eventListeners.dragstart = (e) => {
            e.dataTransfer.setData('text/plain', unit.id);
            e.dataTransfer.setData('source-type', 'board');
            unit.element.classList.add('dragging');
        };

        unit.eventListeners.dragend = () => {
            unit.element.classList.remove('dragging');
        };

        // 판매를 위한 더블 클릭 (참조 저장)
        unit.eventListeners.dblclick = () => {
            if (game.state.phase === 'preparation') {
                game.sellUnit(unit, 'board');
            }
        };

        // 툴팁 이벤트 (참조 저장)
        unit.eventListeners.mouseenter = (e) => {
            game.showUnitTooltip(unit, e);
        };

        unit.eventListeners.mouseleave = () => {
            game.hideUnitTooltip();
        };

        // 이벤트 리스너 등록
        unit.element.addEventListener('dragstart', unit.eventListeners.dragstart);
        unit.element.addEventListener('dragend', unit.eventListeners.dragend);
        unit.element.addEventListener('dblclick', unit.eventListeners.dblclick);
        unit.element.addEventListener('mouseenter', unit.eventListeners.mouseenter);
        unit.element.addEventListener('mouseleave', unit.eventListeners.mouseleave);
    }

    /**
     * 셀에서 유닛 제거 (육각형 좌표)
     */
    removeUnitFromCell(q, r) {
        const key = `${q},${r}`;
        if (!this.cells.has(key)) return;

        const cell = this.cells.get(key);
        if (cell.unit) {
            // 이벤트 리스너 제거 (메모리 누수 방지)
            cell.unit.removeAllEventListeners();

            // DOM 요소 제거
            if (cell.unit.element && cell.unit.element.parentNode) {
                cell.unit.element.parentNode.removeChild(cell.unit.element);
            }
            cell.unit.position = null;
            cell.unit = null;
            cell.element.classList.remove('occupied');
        }
    }

    /**
     * 보드에서 유닛 제거
     */
    removeUnit(unit) {
        if (unit.position) {
            this.removeUnitFromCell(unit.position.q, unit.position.r);
        }
        this.units.delete(unit.id);
    }

    /**
     * ID로 유닛 찾기
     */
    getUnitById(unitId) {
        return this.units.get(unitId);
    }

    /**
     * 플레이어 영역의 유닛 목록 반환 (육각형)
     */
    getPlayerUnits() {
        const units = [];
        this.cells.forEach(cell => {
            if (cell.unit && (cell.zone === 'player' || cell.zone === 'neutral')) {
                units.push(cell.unit);
            }
        });
        return units;
    }

    /**
     * 적 영역의 유닛 목록 반환 (육각형)
     */
    getEnemyUnits() {
        const units = [];
        this.cells.forEach(cell => {
            if (cell.unit && cell.zone === 'enemy') {
                units.push(cell.unit);
            }
        });
        return units;
    }

    /**
     * 배치된 플레이어 유닛 수
     */
    getPlacedUnitCount() {
        return this.getPlayerUnits().length;
    }

    /**
     * 적 유닛 배치 (웨이브)
     */
    placeEnemies(enemies) {
        // 기존 적 제거
        this.clearEnemyZone();

        // 적 영역 육각형 목록
        const positions = [];
        this.cells.forEach(cell => {
            if (cell.zone === 'enemy' || cell.zone === 'neutral') {
                positions.push({ q: cell.q, r: cell.r });
            }
        });

        // 위치 셔플
        const shuffledPositions = shuffleArray(positions);

        enemies.forEach((enemy, index) => {
            if (index < shuffledPositions.length) {
                const pos = shuffledPositions[index];
                const key = `${pos.q},${pos.r}`;
                const cell = this.cells.get(key);

                enemy.position = { q: pos.q, r: pos.r };

                if (!enemy.element) {
                    enemy.createElement();
                }

                // 툴팁 이벤트
                enemy.element.addEventListener('mouseenter', (e) => {
                    game.showEnemyTooltip(enemy, e);
                });
                enemy.element.addEventListener('mouseleave', () => {
                    game.hideUnitTooltip();
                });

                cell.unit = enemy;
                cell.element.appendChild(enemy.element);
                cell.element.classList.add('occupied');
            }
        });
    }

    /**
     * 적 영역 정리 (전체 보드에서 적 유닛 제거)
     */
    clearEnemyZone() {
        // 전체 보드 순회
        this.cells.forEach(cell => {
            // 적 유닛인 경우 DOM 제거
            if (cell.unit && cell.unit.element &&
                cell.unit.element.classList.contains('enemy-unit')) {

                if (cell.unit.removeAllEventListeners) {
                    cell.unit.removeAllEventListeners();
                }

                if (cell.unit.element.parentNode) {
                    cell.unit.element.parentNode.removeChild(cell.unit.element);
                }
                cell.unit = null;
            }

            // ★ 핵심 수정: 유닛이 없는 셀에서 occupied 클래스 무조건 제거
            if (!cell.unit) {
                cell.element.classList.remove('occupied');
            }
        });

        // DOM 정리 (남은 적 DOM 요소 제거)
        const remainingEnemies = document.querySelectorAll('#game-board .enemy-unit');
        remainingEnemies.forEach(el => el.remove());
    }

    /**
     * 모든 셀 상태 강제 동기화 (전투 종료 후 안전장치)
     * - 유닛 없으면: occupied 제거, cell.unit = null
     * - 유닛 있으면: occupied 유지
     * - dead 클래스 가진 DOM 요소 제거
     */
    forceCleanupAllCells() {
        let cleanedCount = 0;

        this.cells.forEach((cell, key) => {
            // DOM 내 살아있는 유닛 요소 확인
            const unitElement = cell.element.querySelector('.unit:not(.dead)');

            if (!unitElement) {
                // 유닛 없음 - 강제 정리
                cell.unit = null;
                cell.element.classList.remove('occupied');
                cleanedCount++;
            } else if (cell.unit && !cell.unit.isAlive) {
                // 죽은 유닛 참조 - 정리
                cell.unit = null;
                cell.element.classList.remove('occupied');
                cleanedCount++;
            }

            // dead 클래스 가진 요소 제거
            const deadElements = cell.element.querySelectorAll('.unit.dead');
            deadElements.forEach(el => el.remove());
        });

        debugConsole.log('Board', `강제 셀 정리: ${cleanedCount}개`);
    }

    /**
     * 전체 보드 정리
     */
    clearAll() {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = this.cells[row][col];
                if (cell.unit) {
                    if (cell.unit.element && cell.unit.element.parentNode === cell.element) {
                        cell.element.removeChild(cell.unit.element);
                    }
                    cell.unit = null;
                    cell.element.classList.remove('occupied');
                }
            }
        }
        this.units.clear();
    }

    /**
     * 빈 플레이어 영역 셀 찾기 (육각형)
     */
    findEmptyPlayerCell() {
        for (const [key, cell] of this.cells) {
            if (!cell.unit && (cell.zone === 'player' || cell.zone === 'neutral')) {
                return { q: cell.q, r: cell.r };
            }
        }
        return null;
    }

    /**
     * 플레이어 영역의 모든 빈 슬롯 반환 (육각형)
     */
    getEmptyPlayerSlots() {
        const slots = [];
        this.cells.forEach(cell => {
            if (!cell.unit && (cell.zone === 'player' || cell.zone === 'neutral')) {
                slots.push({ q: cell.q, r: cell.r });
            }
        });
        return slots;
    }

    /**
     * 특정 위치의 셀 정보 반환 (육각형)
     */
    getCell(q, r) {
        const key = `${q},${r}`;
        return this.cells.get(key) || null;
    }

    /**
     * 합성 가능 유닛 하이라이트
     */
    highlightMergeable(unitCounts) {
        this.units.forEach(unit => {
            const count = unitCounts[unit.unitId] || 0;
            if (count >= 3 && unit.starLevel < 3) {
                unit.element.classList.add('can-merge');
            } else {
                unit.element.classList.remove('can-merge');
            }
        });
    }

    /**
     * 모든 하이라이트 제거
     */
    clearHighlights() {
        this.units.forEach(unit => {
            unit.element.classList.remove('can-merge');
        });
    }
}
