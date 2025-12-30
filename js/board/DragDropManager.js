// 드래그 앤 드롭 관리 클래스

class DragDropManager {
    constructor() {
        this.board = null;
        this.onUnitDrop = null;
    }

    /**
     * 초기화
     */
    init(board, onUnitDrop) {
        this.board = board;
        this.onUnitDrop = onUnitDrop || (() => {});
    }

    /**
     * 보드 셀에 드래그 앤 드롭 설정
     */
    setupBoardDragDrop() {
        this.board.cells.forEach(cell => {
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
                        this.onUnitDrop(unitId, sourceType, cell.q, cell.r);
                    }
                });
            }
        });
    }

    /**
     * 유닛 드래그 이벤트 설정
     */
    setupUnitDrag(unit, callbacks = {}) {
        // 기존 리스너 제거 (중복 방지)
        unit.removeAllEventListeners();

        const onSell = callbacks.onSell || (() => {});
        const onShowTooltip = callbacks.onShowTooltip || (() => {});
        const onHideTooltip = callbacks.onHideTooltip || (() => {});
        const getPhase = callbacks.getPhase || (() => 'preparation');

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
            if (getPhase() === 'preparation') {
                onSell(unit, 'board');
            }
        };

        // 툴팁 이벤트 (참조 저장)
        unit.eventListeners.mouseenter = (e) => {
            onShowTooltip(unit, e);
        };

        unit.eventListeners.mouseleave = () => {
            onHideTooltip();
        };

        // 이벤트 리스너 등록
        unit.element.addEventListener('dragstart', unit.eventListeners.dragstart);
        unit.element.addEventListener('dragend', unit.eventListeners.dragend);
        unit.element.addEventListener('dblclick', unit.eventListeners.dblclick);
        unit.element.addEventListener('mouseenter', unit.eventListeners.mouseenter);
        unit.element.addEventListener('mouseleave', unit.eventListeners.mouseleave);
    }

    /**
     * 적 유닛에 툴팁 이벤트 설정
     */
    setupEnemyTooltip(enemy, callbacks = {}) {
        const onShowTooltip = callbacks.onShowTooltip || (() => {});
        const onHideTooltip = callbacks.onHideTooltip || (() => {});

        enemy.element.addEventListener('mouseenter', (e) => {
            onShowTooltip(enemy, e);
        });

        enemy.element.addEventListener('mouseleave', () => {
            onHideTooltip();
        });
    }
}
