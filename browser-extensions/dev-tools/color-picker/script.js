// Color Picker Application
class ColorPicker {
    constructor() {
        this.currentColor = { r: 59, g: 130, b: 246 };
        this.alpha = 1.0;
        this.history = this.loadHistory();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAllFormats();
        this.loadPresets('material');
        this.renderHistory();
        this.updateHarmony('complementary');
        this.updateContrast();
    }

    setupEventListeners() {
        // Color input
        document.getElementById('color-input').addEventListener('input', (e) => {
            this.setColorFromHex(e.target.value);
        });

        // RGB sliders
        ['r', 'g', 'b'].forEach(channel => {
            const slider = document.getElementById(`${channel}-slider`);
            slider.addEventListener('input', (e) => {
                this.currentColor[channel] = parseInt(e.target.value);
                this.updateAllFormats();
            });
        });

        // HSL sliders
        document.getElementById('h-slider').addEventListener('input', () => this.updateFromHSL());
        document.getElementById('s-slider').addEventListener('input', () => this.updateFromHSL());
        document.getElementById('l-slider').addEventListener('input', () => this.updateFromHSL());

        // Alpha slider
        document.getElementById('alpha-slider').addEventListener('input', (e) => {
            this.alpha = parseInt(e.target.value) / 100;
            this.updateAlpha();
        });

        // Copy buttons
        document.getElementById('copy-color-btn').addEventListener('click', () => {
            this.copyToClipboard(this.rgbToHex(this.currentColor));
        });

        document.querySelectorAll('.btn-copy-format').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.target.dataset.format;
                const value = document.getElementById(`${format}-input`).value;
                this.copyToClipboard(value);
            });
        });

        // Harmony tabs
        document.querySelectorAll('.harmony-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.harmony-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.updateHarmony(e.target.dataset.harmony);
            });
        });

        // Preset tabs
        document.querySelectorAll('.preset-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.preset-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.loadPresets(e.target.dataset.category);
            });
        });

        // Contrast checker
        document.getElementById('fg-color').addEventListener('input', () => this.updateContrast());
        document.getElementById('bg-color').addEventListener('input', () => this.updateContrast());
        document.getElementById('fg-hex').addEventListener('input', (e) => {
            document.getElementById('fg-color').value = e.target.value;
            this.updateContrast();
        });
        document.getElementById('bg-hex').addEventListener('input', (e) => {
            document.getElementById('bg-color').value = e.target.value;
            this.updateContrast();
        });

        // History
        document.getElementById('clear-history-btn').addEventListener('click', () => this.clearHistory());
    }

    setColorFromHex(hex) {
        const rgb = this.hexToRgb(hex);
        this.currentColor = rgb;
        this.updateAllFormats();
        this.addToHistory(hex);
    }

    updateAllFormats() {
        const { r, g, b } = this.currentColor;
        const hex = this.rgbToHex({ r, g, b });
        const hsl = this.rgbToHsl(r, g, b);

        // Update preview
        const preview = document.getElementById('color-preview');
        preview.style.background = hex;
        document.getElementById('color-name').textContent = hex;

        // Update sliders
        document.getElementById('r-slider').value = r;
        document.getElementById('g-slider').value = g;
        document.getElementById('b-slider').value = b;
        document.getElementById('r-value').textContent = r;
        document.getElementById('g-value').textContent = g;
        document.getElementById('b-value').textContent = b;

        document.getElementById('h-slider').value = hsl.h;
        document.getElementById('s-slider').value = hsl.s;
        document.getElementById('l-slider').value = hsl.l;
        document.getElementById('h-value').textContent = hsl.h + '°';
        document.getElementById('s-value').textContent = hsl.s + '%';
        document.getElementById('l-value').textContent = hsl.l + '%';

        document.getElementById('color-input').value = hex;

        // Update format inputs
        document.getElementById('hex-input').value = hex;
        document.getElementById('rgb-input').value = `rgb(${r}, ${g}, ${b})`;
        document.getElementById('rgba-input').value = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
        document.getElementById('hsl-input').value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        document.getElementById('hsla-input').value = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${this.alpha})`;
        document.getElementById('filter-input').value = this.generateCSSFilter();

        // Update harmonies
        const activeHarmony = document.querySelector('.harmony-tab.active');
        if (activeHarmony) {
            this.updateHarmony(activeHarmony.dataset.harmony);
        }
    }

    updateFromHSL() {
        const h = parseInt(document.getElementById('h-slider').value);
        const s = parseInt(document.getElementById('s-slider').value);
        const l = parseInt(document.getElementById('l-slider').value);

        const rgb = this.hslToRgb(h, s, l);
        this.currentColor = rgb;
        this.updateAllFormats();
    }

    updateAlpha() {
        document.getElementById('alpha-value').textContent = this.alpha.toFixed(2);
        const { r, g, b } = this.currentColor;
        document.getElementById('rgba-input').value = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;

        const hsl = this.rgbToHsl(r, g, b);
        document.getElementById('hsla-input').value = `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${this.alpha})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    rgbToHex({ r, g, b }) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    generateCSSFilter() {
        // Simplified CSS filter generation
        const { r, g, b } = this.currentColor;
        const brightness = Math.round((r + g + b) / 3 / 255 * 100);
        return `brightness(${brightness}%) contrast(100%)`;
    }

    updateHarmony(type) {
        const hsl = this.rgbToHsl(this.currentColor.r, this.currentColor.g, this.currentColor.b);
        let colors = [];

        switch (type) {
            case 'complementary':
                colors = [(hsl.h + 180) % 360];
                break;
            case 'analogous':
                colors = [(hsl.h + 30) % 360, (hsl.h - 30 + 360) % 360];
                break;
            case 'triadic':
                colors = [(hsl.h + 120) % 360, (hsl.h + 240) % 360];
                break;
            case 'tetradic':
                colors = [(hsl.h + 90) % 360, (hsl.h + 180) % 360, (hsl.h + 270) % 360];
                break;
            case 'shades':
                colors = [
                    { ...hsl, l: Math.max(0, hsl.l - 30) },
                    { ...hsl, l: Math.max(0, hsl.l - 15) },
                    { ...hsl, l: Math.min(100, hsl.l + 15) },
                    { ...hsl, l: Math.min(100, hsl.l + 30) }
                ];
                this.renderHarmonyColors(colors, true);
                return;
        }

        const harmonyColors = colors.map(h => ({ h, s: hsl.s, l: hsl.l }));
        this.renderHarmonyColors(harmonyColors);
    }

    renderHarmonyColors(colors, isShades = false) {
        const container = document.getElementById('harmony-colors');
        container.innerHTML = colors.map(color => {
            const rgb = isShades ? this.hslToRgb(color.h, color.s, color.l) : this.hslToRgb(color.h, color.s, color.l);
            const hex = this.rgbToHex(rgb);
            return `<div class="harmony-color" style="background: ${hex}" data-color="${hex}" onclick="colorPicker.setColorFromHex('${hex}')"></div>`;
        }).join('');
    }

    updateContrast() {
        const fgHex = document.getElementById('fg-color').value;
        const bgHex = document.getElementById('bg-color').value;

        document.getElementById('fg-hex').value = fgHex;
        document.getElementById('bg-hex').value = bgHex;

        const preview = document.getElementById('contrast-preview');
        preview.style.color = fgHex;
        preview.style.background = bgHex;

        const ratio = this.calculateContrastRatio(fgHex, bgHex);
        document.getElementById('ratio-value').textContent = ratio.toFixed(2) + ':1';

        // WCAG standards
        const aaLarge = ratio >= 3;
        const aaNormal = ratio >= 4.5;
        const aaaLarge = ratio >= 4.5;
        const aaaNormal = ratio >= 7;

        this.updateWCAGBadge('aa-large', aaLarge);
        this.updateWCAGBadge('aa-normal', aaNormal);
        this.updateWCAGBadge('aaa-large', aaaLarge);
        this.updateWCAGBadge('aaa-normal', aaaNormal);
    }

    updateWCAGBadge(id, pass) {
        const badge = document.getElementById(id);
        badge.textContent = pass ? '✓' : '✗';
        badge.className = `wcag-badge ${pass ? 'pass' : 'fail'}`;
    }

    calculateContrastRatio(color1, color2) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        const l1 = this.relativeLuminance(rgb1);
        const l2 = this.relativeLuminance(rgb2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    relativeLuminance({ r, g, b }) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    loadPresets(category) {
        const presets = {
            material: {
                'Red': '#f44336', 'Pink': '#e91e63', 'Purple': '#9c27b0',
                'Deep Purple': '#673ab7', 'Indigo': '#3f51b5', 'Blue': '#2196f3',
                'Light Blue': '#03a9f4', 'Cyan': '#00bcd4', 'Teal': '#009688',
                'Green': '#4caf50', 'Light Green': '#8bc34a', 'Lime': '#cddc39',
                'Yellow': '#ffeb3b', 'Amber': '#ffc107', 'Orange': '#ff9800',
                'Deep Orange': '#ff5722'
            },
            tailwind: {
                'Slate': '#64748b', 'Gray': '#6b7280', 'Zinc': '#71717a',
                'Neutral': '#737373', 'Stone': '#78716c', 'Red': '#ef4444',
                'Orange': '#f97316', 'Amber': '#f59e0b', 'Yellow': '#eab308',
                'Lime': '#84cc16', 'Green': '#22c55e', 'Emerald': '#10b981',
                'Teal': '#14b8a6', 'Cyan': '#06b6d4', 'Sky': '#0ea5e9',
                'Blue': '#3b82f6', 'Indigo': '#6366f1', 'Violet': '#8b5cf6',
                'Purple': '#a855f7', 'Fuchsia': '#d946ef', 'Pink': '#ec4899',
                'Rose': '#f43f5e'
            },
            web: {
                'Black': '#000000', 'Silver': '#c0c0c0', 'Gray': '#808080',
                'White': '#ffffff', 'Maroon': '#800000', 'Red': '#ff0000',
                'Purple': '#800080', 'Fuchsia': '#ff00ff', 'Green': '#008000',
                'Lime': '#00ff00', 'Olive': '#808000', 'Yellow': '#ffff00',
                'Navy': '#000080', 'Blue': '#0000ff', 'Teal': '#008080',
                'Aqua': '#00ffff'
            }
        };

        const container = document.getElementById('preset-colors');
        const colors = presets[category];

        container.innerHTML = Object.entries(colors).map(([name, hex]) => {
            return `<div class="preset-color" style="background: ${hex}" data-color="${hex}" title="${name}" onclick="colorPicker.setColorFromHex('${hex}')"></div>`;
        }).join('');
    }

    addToHistory(hex) {
        if (!this.history.includes(hex)) {
            this.history.unshift(hex);
            if (this.history.length > 20) {
                this.history = this.history.slice(0, 20);
            }
            this.saveHistory();
            this.renderHistory();
        }
    }

    renderHistory() {
        const container = document.getElementById('color-history');
        if (this.history.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">尚無歷史記錄</p>';
            return;
        }

        container.innerHTML = this.history.map(hex => {
            return `<div class="history-color" style="background: ${hex}" data-color="${hex}" onclick="colorPicker.setColorFromHex('${hex}')"></div>`;
        }).join('');
    }

    saveHistory() {
        localStorage.setItem('color-picker-history', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('color-picker-history');
        return saved ? JSON.parse(saved) : [];
    }

    clearHistory() {
        if (confirm('確定要清除所有歷史記錄嗎？')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(`已複製: ${text}`);
        } catch (err) {
            this.showToast('複製失敗', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
}

// Initialize app
const colorPicker = new ColorPicker();
