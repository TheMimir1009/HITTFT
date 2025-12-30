// 유틸리티 함수들

/**
 * 랜덤 정수 생성 (min 이상 max 이하)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 배열에서 랜덤 요소 선택
 */
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * 배열 셔플 (Fisher-Yates)
 */
function shuffleArray(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * 가중치 기반 랜덤 선택
 */
function weightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }
    return items[items.length - 1];
}

/**
 * UUID 생성 (간단 버전)
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 두 셀 사이의 거리 계산 (육각형 거리)
 * hexUtils.js의 hexDistance 사용
 */
function calculateDistance(pos1, pos2) {
    return hexDistance(pos1, pos2);
}

/**
 * 두 셀 사이의 유클리드 거리 계산 (육각형 좌표)
 */
function calculateEuclideanDistance(pos1, pos2) {
    // 육각형 좌표를 픽셀 좌표로 변환 후 거리 계산
    const dx = (pos1.q - pos2.q) + (pos1.r - pos2.r) * 0.5;
    const dy = (pos1.r - pos2.r) * Math.sqrt(3) / 2;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 딥 클론
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * 숫자 포맷팅 (천 단위 콤마)
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 퍼센트 계산
 */
function percent(value, percentage) {
    return Math.floor(value * (percentage / 100));
}

/**
 * 값을 범위 내로 제한
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * 딜레이 함수 (Promise)
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * DOM 요소 생성 헬퍼
 */
function createElement(tag, className, textContent) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (textContent) {
        element.textContent = textContent;
    }
    return element;
}

/**
 * 요소에 이벤트 리스너 추가 (자동 제거 기능)
 */
function addEventListenerOnce(element, event, handler) {
    const wrapper = (e) => {
        handler(e);
        element.removeEventListener(event, wrapper);
    };
    element.addEventListener(event, wrapper);
}

/**
 * 툴팁 위치 계산
 */
function calculateTooltipPosition(targetRect, tooltipWidth, tooltipHeight) {
    const padding = 10;
    let x = targetRect.right + padding;
    let y = targetRect.top;

    // 화면 오른쪽 경계 체크
    if (x + tooltipWidth > window.innerWidth) {
        x = targetRect.left - tooltipWidth - padding;
    }

    // 화면 아래쪽 경계 체크
    if (y + tooltipHeight > window.innerHeight) {
        y = window.innerHeight - tooltipHeight - padding;
    }

    // 화면 위쪽 경계 체크
    if (y < padding) {
        y = padding;
    }

    return { x, y };
}

/**
 * 등급에 따른 CSS 클래스 반환
 */
function getTierClass(cost) {
    return `tier-${cost}`;
}

/**
 * 별 표시 문자열 생성
 */
function getStarsString(starLevel) {
    return '★'.repeat(starLevel);
}

/**
 * 애니메이션 프레임 기반 타이머
 */
class AnimationTimer {
    constructor(callback, interval) {
        this.callback = callback;
        this.interval = interval;
        this.lastTime = 0;
        this.running = false;
        this.animationId = null;
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.tick();
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    tick() {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime >= this.interval) {
            this.callback(deltaTime);
            this.lastTime = currentTime;
        }

        this.animationId = requestAnimationFrame(() => this.tick());
    }
}

/**
 * 이벤트 이미터 클래스
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener);
    }

    emit(event, ...args) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(...args));
    }

    once(event, listener) {
        const wrapper = (...args) => {
            listener(...args);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
}
