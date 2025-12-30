// 대기석 (벤치) 관리 클래스

class Bench {
    constructor() {
        this.slots = 8;
        this.units = []; // 인덱스별 유닛 저장 (null 가능)
        this.element = null;

        this.init();
    }

    /**
     * 벤치 초기화
     */
    init() {
        this.element = document.getElementById('bench');
        this.createSlots();
    }

    /**
     * 슬롯 생성
     */
    createSlots() {
        this.element.innerHTML = '';
        this.units = new Array(this.slots).fill(null);

        for (let i = 0; i < this.slots; i++) {
            const slot = createElement('div', 'bench-slot');
            slot.setAttribute('data-slot', i);

            // 드롭 이벤트
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('drag-over');
            });

            slot.addEventListener('dragleave', () => {
                slot.classList.remove('drag-over');
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');

                const unitId = e.dataTransfer.getData('text/plain');
                const sourceType = e.dataTransfer.getData('source-type');

                if (unitId) {
                    game.handleBenchDrop(unitId, sourceType, i);
                }
            });

            this.element.appendChild(slot);
        }
    }

    /**
     * 유닛을 벤치에 추가
     */
    addUnit(unit, slotIndex = -1) {
        // 특정 슬롯이 지정된 경우
        if (slotIndex >= 0 && slotIndex < this.slots) {
            if (this.units[slotIndex] === null) {
                this.units[slotIndex] = unit;
                this.renderUnit(unit, slotIndex);
                return true;
            }
        }

        // 빈 슬롯 찾기
        const emptySlot = this.findEmptySlot();
        if (emptySlot !== -1) {
            this.units[emptySlot] = unit;
            this.renderUnit(unit, emptySlot);
            return true;
        }

        return false; // 벤치가 가득 참
    }

    /**
     * 유닛 렌더링
     */
    renderUnit(unit, slotIndex) {
        const slot = this.element.children[slotIndex];

        if (!unit.element) {
            unit.createElement();
        }

        // 기존 리스너 제거 (중복 방지)
        unit.removeAllEventListeners();

        // 드래그 이벤트 설정 (참조 저장)
        unit.eventListeners.dragstart = (e) => {
            e.dataTransfer.setData('text/plain', unit.id);
            e.dataTransfer.setData('source-type', 'bench');
            e.dataTransfer.setData('bench-slot', slotIndex.toString());
            unit.element.classList.add('dragging');
        };

        unit.eventListeners.dragend = () => {
            unit.element.classList.remove('dragging');
        };

        // 툴팁 이벤트 (참조 저장)
        unit.eventListeners.mouseenter = (e) => {
            game.showUnitTooltip(unit, e);
        };

        unit.eventListeners.mouseleave = () => {
            game.hideUnitTooltip();
        };

        // 판매를 위한 더블 클릭 (참조 저장)
        unit.eventListeners.dblclick = () => {
            game.sellUnit(unit, 'bench', slotIndex);
        };

        // 이벤트 리스너 등록
        unit.element.addEventListener('dragstart', unit.eventListeners.dragstart);
        unit.element.addEventListener('dragend', unit.eventListeners.dragend);
        unit.element.addEventListener('mouseenter', unit.eventListeners.mouseenter);
        unit.element.addEventListener('mouseleave', unit.eventListeners.mouseleave);
        unit.element.addEventListener('dblclick', unit.eventListeners.dblclick);

        slot.appendChild(unit.element);
    }

    /**
     * 유닛 제거
     */
    removeUnit(unit) {
        const index = this.units.findIndex(u => u && u.id === unit.id);
        if (index !== -1) {
            this.removeUnitByIndex(index);
            return true;
        }
        return false;
    }

    /**
     * 인덱스로 유닛 제거
     */
    removeUnitByIndex(slotIndex) {
        if (slotIndex >= 0 && slotIndex < this.slots && this.units[slotIndex]) {
            const unit = this.units[slotIndex];
            const slot = this.element.children[slotIndex];

            // 이벤트 리스너 제거 (메모리 누수 방지)
            unit.removeAllEventListeners();

            if (unit.element && unit.element.parentNode === slot) {
                slot.removeChild(unit.element);
            }

            this.units[slotIndex] = null;
            return unit;
        }
        return null;
    }

    /**
     * ID로 유닛 찾기
     */
    getUnitById(unitId) {
        return this.units.find(u => u && u.id === unitId);
    }

    /**
     * 인덱스로 유닛 찾기
     */
    getUnitByIndex(slotIndex) {
        return this.units[slotIndex];
    }

    /**
     * 유닛의 슬롯 인덱스 찾기
     */
    getUnitSlot(unit) {
        return this.units.findIndex(u => u && u.id === unit.id);
    }

    /**
     * 빈 슬롯 찾기
     */
    findEmptySlot() {
        return this.units.findIndex(u => u === null);
    }

    /**
     * 빈 슬롯 수
     */
    getEmptySlotCount() {
        return this.units.filter(u => u === null).length;
    }

    /**
     * 벤치에 있는 모든 유닛
     */
    getAllUnits() {
        return this.units.filter(u => u !== null);
    }

    /**
     * 벤치가 가득 찼는지
     */
    isFull() {
        return this.findEmptySlot() === -1;
    }

    /**
     * 벤치 비우기
     */
    clear() {
        for (let i = 0; i < this.slots; i++) {
            if (this.units[i]) {
                this.removeUnitByIndex(i);
            }
        }
    }

    /**
     * 합성 가능 유닛 하이라이트
     */
    highlightMergeable(unitCounts) {
        this.units.forEach(unit => {
            if (unit) {
                const count = unitCounts[unit.unitId] || 0;
                if (count >= 3 && unit.starLevel < 3) {
                    unit.element.classList.add('can-merge');
                } else {
                    unit.element.classList.remove('can-merge');
                }
            }
        });
    }

    /**
     * 모든 하이라이트 제거
     */
    clearHighlights() {
        this.units.forEach(unit => {
            if (unit && unit.element) {
                unit.element.classList.remove('can-merge');
            }
        });
    }

    /**
     * 유닛 위치 교환
     */
    swapUnits(index1, index2) {
        const unit1 = this.units[index1];
        const unit2 = this.units[index2];

        // DOM 업데이트
        const slot1 = this.element.children[index1];
        const slot2 = this.element.children[index2];

        if (unit1 && unit1.element) {
            slot1.removeChild(unit1.element);
        }
        if (unit2 && unit2.element) {
            slot2.removeChild(unit2.element);
        }

        // 스왑
        this.units[index1] = unit2;
        this.units[index2] = unit1;

        // 다시 렌더링
        if (unit1) {
            slot2.appendChild(unit1.element);
        }
        if (unit2) {
            slot1.appendChild(unit2.element);
        }
    }
}
