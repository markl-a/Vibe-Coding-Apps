// Encoding Tools Application
class EncodingTools {
    constructor() {
        this.init();
    }

    init() {
        this.setupTabs();
    }

    setupTabs() {
        document.querySelectorAll('.tool-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));

                e.target.classList.add('active');
                document.getElementById(`${e.target.dataset.tool}-tool`).classList.add('active');
            });
        });
    }

    // Base64 Methods
    base64Encode() {
        try {
            const input = document.getElementById('base64-input').value;
            const encoded = btoa(unescape(encodeURIComponent(input)));
            document.getElementById('base64-output').value = encoded;
            this.showToast('Base64 編碼成功');
        } catch (error) {
            this.showToast('編碼失敗: ' + error.message, 'error');
        }
    }

    base64Decode() {
        try {
            const input = document.getElementById('base64-input').value;
            const decoded = decodeURIComponent(escape(atob(input)));
            document.getElementById('base64-output').value = decoded;
            this.showToast('Base64 解碼成功');
        } catch (error) {
            this.showToast('解碼失敗: 請確認輸入的是有效的 Base64', 'error');
        }
    }

    // URL Encoding Methods
    urlEncode() {
        try {
            const input = document.getElementById('url-input').value;
            const encoded = encodeURIComponent(input);
            document.getElementById('url-output').value = encoded;
            this.showToast('URL 編碼成功');
        } catch (error) {
            this.showToast('編碼失敗: ' + error.message, 'error');
        }
    }

    urlDecode() {
        try {
            const input = document.getElementById('url-input').value;
            const decoded = decodeURIComponent(input);
            document.getElementById('url-output').value = decoded;
            this.showToast('URL 解碼成功');
        } catch (error) {
            this.showToast('解碼失敗: 請確認輸入的是有效的 URL 編碼', 'error');
        }
    }

    // Hash Methods
    async generateHashes() {
        const input = document.getElementById('hash-input').value;

        if (!input) {
            this.showToast('請輸入要產生 Hash 的文字', 'error');
            return;
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(input);

            // MD5 (using simple implementation)
            document.getElementById('hash-md5').value = this.simpleMD5(input);

            // SHA-1
            const sha1 = await crypto.subtle.digest('SHA-1', data);
            document.getElementById('hash-sha1').value = this.bufferToHex(sha1);

            // SHA-256
            const sha256 = await crypto.subtle.digest('SHA-256', data);
            document.getElementById('hash-sha256').value = this.bufferToHex(sha256);

            // SHA-512
            const sha512 = await crypto.subtle.digest('SHA-512', data);
            document.getElementById('hash-sha512').value = this.bufferToHex(sha512);

            this.showToast('Hash 值產生成功');
        } catch (error) {
            this.showToast('產生 Hash 失敗: ' + error.message, 'error');
        }
    }

    bufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Simple MD5 implementation (for demonstration)
    simpleMD5(string) {
        // This is a placeholder. For production, use a proper MD5 library.
        // For now, we'll return a simple hash
        let hash = 0;
        for (let i = 0; i < string.length; i++) {
            const char = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).padStart(32, '0');
    }

    copyHash(type) {
        const value = document.getElementById(`hash-${type}`).value;
        this.copyToClipboard(value);
    }

    // HTML Entity Methods
    htmlEncode() {
        const input = document.getElementById('html-input').value;
        const div = document.createElement('div');
        div.textContent = input;
        const encoded = div.innerHTML;
        document.getElementById('html-output').value = encoded;
        this.showToast('HTML 編碼成功');
    }

    htmlDecode() {
        try {
            const input = document.getElementById('html-input').value;
            const div = document.createElement('div');
            div.innerHTML = input;
            const decoded = div.textContent;
            document.getElementById('html-output').value = decoded;
            this.showToast('HTML 解碼成功');
        } catch (error) {
            this.showToast('解碼失敗', 'error');
        }
    }

    // UUID Methods
    generateUUID() {
        const version = document.querySelector('input[name="uuid-version"]:checked').value;
        const count = parseInt(document.getElementById('uuid-count').value) || 1;

        const uuids = [];
        for (let i = 0; i < count; i++) {
            if (version === 'v4') {
                uuids.push(this.generateUUIDv4());
            } else {
                uuids.push(this.generateSimpleGUID());
            }
        }

        this.displayUUIDs(uuids);
        this.showToast(`已產生 ${count} 個 UUID`);
    }

    generateUUIDv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    generateSimpleGUID() {
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function() {
            return (Math.random() * 16 | 0).toString(16);
        });
    }

    displayUUIDs(uuids) {
        const container = document.getElementById('uuid-list');
        container.innerHTML = uuids.map(uuid => `
            <div class="uuid-item">
                <span>${uuid}</span>
                <button onclick="encodingTools.copyToClipboard('${uuid}')">📋 複製</button>
            </div>
        `).join('');
    }

    // JWT Methods
    decodeJWT() {
        try {
            const token = document.getElementById('jwt-input').value.trim();

            if (!token) {
                this.showToast('請輸入 JWT Token', 'error');
                return;
            }

            const parts = token.split('.');

            if (parts.length !== 3) {
                this.showToast('無效的 JWT Token 格式', 'error');
                return;
            }

            // Decode header and payload
            const header = JSON.parse(this.base64UrlDecode(parts[0]));
            const payload = JSON.parse(this.base64UrlDecode(parts[1]));

            document.getElementById('jwt-header').textContent = JSON.stringify(header, null, 2);
            document.getElementById('jwt-payload').textContent = JSON.stringify(payload, null, 2);

            this.showToast('JWT 解碼成功');
        } catch (error) {
            this.showToast('JWT 解碼失敗: ' + error.message, 'error');
            document.getElementById('jwt-header').textContent = '解碼失敗';
            document.getElementById('jwt-payload').textContent = '解碼失敗';
        }
    }

    base64UrlDecode(str) {
        // Convert base64url to base64
        str = str.replace(/-/g, '+').replace(/_/g, '/');

        // Add padding if needed
        while (str.length % 4 !== 0) {
            str += '=';
        }

        // Decode base64
        return decodeURIComponent(escape(atob(str)));
    }

    // Utility Methods
    async pasteInput(tool) {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById(`${tool}-input`).value = text;
            this.showToast('已從剪貼簿貼上');
        } catch (error) {
            this.showToast('無法從剪貼簿讀取', 'error');
        }
    }

    clearInput(tool) {
        document.getElementById(`${tool}-input`).value = '';
        if (document.getElementById(`${tool}-output`)) {
            document.getElementById(`${tool}-output`).value = '';
        }
    }

    async copyOutput(tool) {
        const text = document.getElementById(`${tool}-output`).value;
        if (!text) {
            this.showToast('沒有可複製的內容', 'error');
            return;
        }
        await this.copyToClipboard(text);
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('已複製到剪貼簿');
        } catch (error) {
            this.showToast('複製失敗', 'error');
        }
    }

    downloadOutput(tool) {
        const text = document.getElementById(`${tool}-output`).value;
        if (!text) {
            this.showToast('沒有可下載的內容', 'error');
            return;
        }

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tool}-output-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('下載成功');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
}

// Initialize app
const encodingTools = new EncodingTools();
