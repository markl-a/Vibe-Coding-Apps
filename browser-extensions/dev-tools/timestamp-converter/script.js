// Timestamp Converter Application
class TimestampConverter {
    constructor() {
        this.currentTimeInterval = null;
        this.init();
    }

    init() {
        this.startCurrentTimeUpdate();
        this.setupEventListeners();
        this.updateCurrentTime();
    }

    setupEventListeners() {
        // Timestamp input - auto convert on input
        document.getElementById('timestamp-input').addEventListener('input', () => {
            if (document.getElementById('timestamp-input').value) {
                this.convertTimestamp();
            }
        });

        // Radio buttons for timestamp unit
        document.querySelectorAll('input[name="timestamp-unit"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (document.getElementById('timestamp-input').value) {
                    this.convertTimestamp();
                }
            });
        });

        // Date input - auto convert on change
        document.getElementById('date-input').addEventListener('change', () => {
            this.convertDate();
        });

        // Enter key support
        document.getElementById('timestamp-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.convertTimestamp();
        });

        document.getElementById('calc-timestamp').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.calculateTime(true);
        });
    }

    startCurrentTimeUpdate() {
        this.currentTimeInterval = setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    }

    updateCurrentTime() {
        const now = new Date();
        const timestampSec = Math.floor(now.getTime() / 1000);
        const timestampMs = now.getTime();

        document.getElementById('current-timestamp-sec').textContent = timestampSec;
        document.getElementById('current-timestamp-ms').textContent = timestampMs;
        document.getElementById('current-local-time').textContent = this.formatDateTime(now);
        document.getElementById('current-utc-time').textContent = this.formatDateTime(now, true);
    }

    convertTimestamp() {
        const input = document.getElementById('timestamp-input').value.trim();

        if (!input) {
            this.showToast('請輸入時間戳', 'error');
            return;
        }

        try {
            let timestamp = parseInt(input);
            const unit = document.querySelector('input[name="timestamp-unit"]:checked').value;

            // Convert to milliseconds if needed
            if (unit === 'seconds') {
                timestamp = timestamp * 1000;
            }

            // Validate timestamp
            if (isNaN(timestamp) || timestamp < 0) {
                throw new Error('無效的時間戳');
            }

            // Check if timestamp is reasonable (between 1970 and 2100)
            if (timestamp < 0 || timestamp > 4102444800000) {
                throw new Error('時間戳超出合理範圍');
            }

            const date = new Date(timestamp);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                throw new Error('無法轉換為有效日期');
            }

            // Display results
            document.getElementById('timestamp-to-local').textContent = this.formatDateTime(date);
            document.getElementById('timestamp-to-utc').textContent = this.formatDateTime(date, true);
            document.getElementById('timestamp-to-iso').textContent = date.toISOString();
            document.getElementById('timestamp-to-relative').textContent = this.getRelativeTime(date);

        } catch (error) {
            this.showToast(`轉換失敗: ${error.message}`, 'error');
            this.clearTimestampResults();
        }
    }

    convertDate() {
        const input = document.getElementById('date-input').value;

        if (!input) {
            this.showToast('請選擇日期時間', 'error');
            return;
        }

        try {
            const date = new Date(input);

            if (isNaN(date.getTime())) {
                throw new Error('無效的日期');
            }

            const timestampMs = date.getTime();
            const timestampSec = Math.floor(timestampMs / 1000);

            document.getElementById('date-to-timestamp-sec').textContent = timestampSec;
            document.getElementById('date-to-timestamp-ms').textContent = timestampMs;
            document.getElementById('date-to-iso').textContent = date.toISOString();

        } catch (error) {
            this.showToast(`轉換失敗: ${error.message}`, 'error');
            this.clearDateResults();
        }
    }

    calculateTime(add = true) {
        const timestampInput = document.getElementById('calc-timestamp').value.trim();

        if (!timestampInput) {
            this.showToast('請輸入基準時間戳', 'error');
            return;
        }

        try {
            const baseTimestamp = parseInt(timestampInput);
            const value = parseInt(document.getElementById('calc-value').value) || 0;
            const unit = document.getElementById('calc-unit').value;

            if (isNaN(baseTimestamp)) {
                throw new Error('無效的時間戳');
            }

            const baseDate = new Date(baseTimestamp * 1000);
            let resultDate = new Date(baseDate);

            const multiplier = add ? 1 : -1;
            const adjustedValue = value * multiplier;

            switch (unit) {
                case 'seconds':
                    resultDate.setSeconds(resultDate.getSeconds() + adjustedValue);
                    break;
                case 'minutes':
                    resultDate.setMinutes(resultDate.getMinutes() + adjustedValue);
                    break;
                case 'hours':
                    resultDate.setHours(resultDate.getHours() + adjustedValue);
                    break;
                case 'days':
                    resultDate.setDate(resultDate.getDate() + adjustedValue);
                    break;
                case 'weeks':
                    resultDate.setDate(resultDate.getDate() + (adjustedValue * 7));
                    break;
                case 'months':
                    resultDate.setMonth(resultDate.getMonth() + adjustedValue);
                    break;
                case 'years':
                    resultDate.setFullYear(resultDate.getFullYear() + adjustedValue);
                    break;
            }

            const resultTimestamp = Math.floor(resultDate.getTime() / 1000);

            document.getElementById('calc-result').textContent = this.formatDateTime(resultDate);
            document.getElementById('calc-timestamp-result').textContent = resultTimestamp;

            this.showToast('計算完成');

        } catch (error) {
            this.showToast(`計算失敗: ${error.message}`, 'error');
        }
    }

    usePreset(preset) {
        const now = new Date();
        let targetDate;

        switch (preset) {
            case 'now':
                targetDate = now;
                break;
            case 'today-start':
                targetDate = new Date(now);
                targetDate.setHours(0, 0, 0, 0);
                break;
            case 'today-end':
                targetDate = new Date(now);
                targetDate.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                targetDate = new Date(now);
                targetDate.setDate(targetDate.getDate() - 1);
                break;
            case 'tomorrow':
                targetDate = new Date(now);
                targetDate.setDate(targetDate.getDate() + 1);
                break;
            case 'week-ago':
                targetDate = new Date(now);
                targetDate.setDate(targetDate.getDate() - 7);
                break;
            case 'month-ago':
                targetDate = new Date(now);
                targetDate.setMonth(targetDate.getMonth() - 1);
                break;
            case 'year-ago':
                targetDate = new Date(now);
                targetDate.setFullYear(targetDate.getFullYear() - 1);
                break;
            default:
                targetDate = now;
        }

        const timestamp = Math.floor(targetDate.getTime() / 1000);
        document.getElementById('timestamp-input').value = timestamp;
        this.convertTimestamp();
        this.showToast(`已設定為: ${this.getPresetLabel(preset)}`);
    }

    getPresetLabel(preset) {
        const labels = {
            'now': '現在',
            'today-start': '今天開始',
            'today-end': '今天結束',
            'yesterday': '昨天',
            'tomorrow': '明天',
            'week-ago': '一週前',
            'month-ago': '一個月前',
            'year-ago': '一年前'
        };
        return labels[preset] || preset;
    }

    useCurrentTimestamp() {
        const timestamp = Math.floor(Date.now() / 1000);
        document.getElementById('timestamp-input').value = timestamp;
        this.convertTimestamp();
    }

    useCurrentDate() {
        const now = new Date();
        const localDateTime = this.formatDateTimeForInput(now);
        document.getElementById('date-input').value = localDateTime;
        this.convertDate();
    }

    useCurrentForCalc() {
        const timestamp = Math.floor(Date.now() / 1000);
        document.getElementById('calc-timestamp').value = timestamp;
    }

    async pasteInput(type) {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById(`${type}-input`).value = text.trim();

            if (type === 'timestamp') {
                this.convertTimestamp();
            }

            this.showToast('已從剪貼簿貼上');
        } catch (error) {
            this.showToast('無法從剪貼簿讀取', 'error');
        }
    }

    clearTimestamp() {
        document.getElementById('timestamp-input').value = '';
        this.clearTimestampResults();
    }

    clearDate() {
        document.getElementById('date-input').value = '';
        this.clearDateResults();
    }

    clearTimestampResults() {
        document.getElementById('timestamp-to-local').textContent = '-';
        document.getElementById('timestamp-to-utc').textContent = '-';
        document.getElementById('timestamp-to-iso').textContent = '-';
        document.getElementById('timestamp-to-relative').textContent = '-';
    }

    clearDateResults() {
        document.getElementById('date-to-timestamp-sec').textContent = '-';
        document.getElementById('date-to-timestamp-ms').textContent = '-';
        document.getElementById('date-to-iso').textContent = '-';
    }

    formatDateTime(date, utc = false) {
        if (utc) {
            return date.toUTCString();
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    formatDateTimeForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    getRelativeTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        if (diffSec < 60) {
            return `${diffSec} 秒前`;
        } else if (diffMin < 60) {
            return `${diffMin} 分鐘前`;
        } else if (diffHour < 24) {
            return `${diffHour} 小時前`;
        } else if (diffDay < 30) {
            return `${diffDay} 天前`;
        } else if (diffMonth < 12) {
            return `${diffMonth} 個月前`;
        } else {
            return `${diffYear} 年前`;
        }
    }

    async copyResult(elementId) {
        const text = document.getElementById(elementId).textContent;

        if (text === '-') {
            this.showToast('沒有可複製的內容', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showToast(`已複製: ${text}`);
        } catch (error) {
            this.showToast('複製失敗', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
}

// Initialize app
const timestampConverter = new TimestampConverter();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (timestampConverter.currentTimeInterval) {
        clearInterval(timestampConverter.currentTimeInterval);
    }
});
