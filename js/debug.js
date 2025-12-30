// 디버그 콘솔 클래스

class DebugConsole {
    constructor() {
        this.enabled = false;
        this.logs = [];
        this.maxLogs = 100;
        this.element = null;
    }

    init() {
        this.createUI();
        this.bindKeys();
    }

    createUI() {
        // 디버그 패널 생성
        const panel = document.createElement('div');
        panel.id = 'debug-console';
        panel.innerHTML = `
            <div class="debug-header">
                <span>Debug Console (F9)</span>
                <button id="debug-clear">Clear</button>
                <button id="debug-close">X</button>
            </div>
            <div class="debug-content"></div>
        `;
        document.body.appendChild(panel);
        this.element = panel;
        this.hide();

        // 버튼 이벤트
        document.getElementById('debug-clear').onclick = () => this.clear();
        document.getElementById('debug-close').onclick = () => this.hide();
    }

    bindKeys() {
        // F9 또는 ` 키로 토글
        document.addEventListener('keydown', (e) => {
            if (e.key === '`' || e.key === 'F9') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    log(category, message, data = null) {
        const entry = {
            time: new Date().toLocaleTimeString(),
            category,
            message,
            data
        };

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // 콘솔에도 출력
        if (data) {
            console.log(`[${category}]`, message, data);
        } else {
            console.log(`[${category}]`, message);
        }

        // UI가 보이는 경우에만 렌더링
        if (this.enabled) {
            this.render();
        }
    }

    render() {
        if (!this.element) return;

        const content = this.element.querySelector('.debug-content');
        content.innerHTML = this.logs.map(log =>
            `<div class="debug-log ${log.category.toLowerCase()}">
                <span class="time">${log.time}</span>
                <span class="cat">[${log.category}]</span>
                <span class="msg">${log.message}</span>
                ${log.data ? `<pre>${JSON.stringify(log.data, null, 2)}</pre>` : ''}
            </div>`
        ).join('');
        content.scrollTop = content.scrollHeight;
    }

    toggle() {
        if (this.enabled) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        this.enabled = true;
        this.element.classList.remove('hidden');
        this.render();
    }

    hide() {
        this.enabled = false;
        this.element.classList.add('hidden');
    }

    clear() {
        this.logs = [];
        this.render();
    }
}

// 전역 인스턴스
const debugConsole = new DebugConsole();
