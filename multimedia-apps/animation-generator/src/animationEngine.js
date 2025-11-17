/**
 * Animation Engine - 动画生成引擎
 * 支持多种动画类型和效果
 */

class AnimationEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationType = 'particles';
        this.isPlaying = false;
        this.currentFrame = 0;
        this.totalFrames = 90;
        this.particles = [];
        this.shapes = [];
        this.paths = [];
        this.settings = this.getDefaultSettings();
        this.animationId = null;
        this.startTime = 0;
        this.lastFrameTime = 0;
    }

    getDefaultSettings() {
        return {
            // 通用设置
            fps: 30,
            speed: 1,
            duration: 3,
            canvasWidth: 800,
            canvasHeight: 600,

            // 粒子设置
            particleCount: 100,
            particleSize: 4,
            particleColor: '#00d4ff',
            randomColors: false,

            // 背景设置
            bgType: 'solid',
            bgColor: '#1a1a2e',
            bgGradientStart: '#1a1a2e',
            bgGradientEnd: '#16213e',

            // 形状设置
            shapeType: 'circle',
            shapeSize: 50,

            // 文字设置
            text: 'ANIMATION',
            fontSize: 72,
            fontFamily: 'Arial',

            // 波形设置
            waveAmplitude: 50,
            waveFrequency: 2,

            // 路径设置
            pathType: 'circle'
        };
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.totalFrames = Math.floor(this.settings.fps * this.settings.duration);
        this.canvas.width = this.settings.canvasWidth;
        this.canvas.height = this.settings.canvasHeight;
    }

    setAnimationType(type) {
        this.animationType = type;
        this.reset();
    }

    init() {
        this.reset();
    }

    reset() {
        this.currentFrame = 0;
        this.particles = [];
        this.shapes = [];
        this.paths = [];
        this.startTime = Date.now();
        this.lastFrameTime = 0;

        switch (this.animationType) {
            case 'particles':
                this.initParticles();
                break;
            case 'shapes':
                this.initShapes();
                break;
            case 'path':
                this.initPath();
                break;
            case 'text':
                this.initText();
                break;
            case 'wave':
                this.initWave();
                break;
            case 'particle-text':
                this.initParticleText();
                break;
        }
    }

    // ==================== 粒子系统 ====================

    initParticles() {
        const { particleCount, canvasWidth, canvasHeight, particleSize, particleColor, randomColors } = this.settings;

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: particleSize * (0.5 + Math.random() * 0.5),
                color: randomColors ? this.getRandomColor() : particleColor,
                opacity: 0.5 + Math.random() * 0.5,
                life: 1
            });
        }
    }

    updateParticles() {
        const { canvasWidth, canvasHeight, speed } = this.settings;

        this.particles.forEach(p => {
            p.x += p.vx * speed;
            p.y += p.vy * speed;

            // 边界反弹
            if (p.x < 0 || p.x > canvasWidth) p.vx *= -1;
            if (p.y < 0 || p.y > canvasHeight) p.vy *= -1;

            // 确保粒子在边界内
            p.x = Math.max(0, Math.min(canvasWidth, p.x));
            p.y = Math.max(0, Math.min(canvasHeight, p.y));
        });
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.hexToRgba(p.color, p.opacity);
            this.ctx.fill();

            // 添加发光效果
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        // 绘制连接线
        if (this.particles.length < 200) {
            this.drawParticleConnections();
        }
    }

    drawParticleConnections() {
        const maxDistance = 100;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = this.hexToRgba(this.settings.particleColor, opacity);
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }

    // ==================== 形状动画 ====================

    initShapes() {
        const { canvasWidth, canvasHeight } = this.settings;
        const shapeCount = 8;

        for (let i = 0; i < shapeCount; i++) {
            this.shapes.push({
                x: canvasWidth / 2,
                y: canvasHeight / 2,
                size: 20 + i * 15,
                rotation: (Math.PI * 2 / shapeCount) * i,
                rotationSpeed: 0.02 + i * 0.01,
                color: this.getColorFromHue(i * 45),
                sides: 3 + i % 5
            });
        }
    }

    updateShapes() {
        const { speed } = this.settings;

        this.shapes.forEach(shape => {
            shape.rotation += shape.rotationSpeed * speed;
        });
    }

    drawShapes() {
        const { canvasWidth, canvasHeight } = this.settings;

        this.shapes.forEach(shape => {
            this.ctx.save();
            this.ctx.translate(canvasWidth / 2, canvasHeight / 2);
            this.ctx.rotate(shape.rotation);

            this.drawPolygon(0, 0, shape.size, shape.sides, shape.color);

            this.ctx.restore();
        });
    }

    drawPolygon(x, y, radius, sides, color) {
        this.ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;

            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    // ==================== 路径动画 ====================

    initPath() {
        const { canvasWidth, canvasHeight, pathType } = this.settings;

        this.paths = [];
        const particleCount = 5;

        for (let i = 0; i < particleCount; i++) {
            this.paths.push({
                progress: i / particleCount,
                size: 10 + i * 3,
                color: this.getColorFromHue(i * 72),
                trail: []
            });
        }
    }

    updatePath() {
        const { speed } = this.settings;

        this.paths.forEach(path => {
            path.progress += 0.005 * speed;
            if (path.progress > 1) path.progress = 0;

            const pos = this.getPathPosition(path.progress);
            path.x = pos.x;
            path.y = pos.y;

            // 添加轨迹
            path.trail.push({ x: pos.x, y: pos.y });
            if (path.trail.length > 30) {
                path.trail.shift();
            }
        });
    }

    getPathPosition(progress) {
        const { canvasWidth, canvasHeight, pathType } = this.settings;
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        const radius = Math.min(canvasWidth, canvasHeight) * 0.35;

        switch (pathType) {
            case 'circle':
                const angle = progress * Math.PI * 2;
                return {
                    x: cx + Math.cos(angle) * radius,
                    y: cy + Math.sin(angle) * radius
                };

            case 'infinity':
                const t = progress * Math.PI * 2;
                return {
                    x: cx + Math.sin(t) * radius,
                    y: cy + Math.sin(t) * Math.cos(t) * radius
                };

            case 'spiral':
                const spiralAngle = progress * Math.PI * 6;
                const spiralRadius = progress * radius;
                return {
                    x: cx + Math.cos(spiralAngle) * spiralRadius,
                    y: cy + Math.sin(spiralAngle) * spiralRadius
                };

            default:
                return { x: cx, y: cy };
        }
    }

    drawPath() {
        this.paths.forEach(path => {
            // 绘制轨迹
            if (path.trail.length > 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(path.trail[0].x, path.trail[0].y);

                for (let i = 1; i < path.trail.length; i++) {
                    this.ctx.lineTo(path.trail[i].x, path.trail[i].y);
                }

                this.ctx.strokeStyle = this.hexToRgba(path.color, 0.3);
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            // 绘制粒子
            this.ctx.beginPath();
            this.ctx.arc(path.x, path.y, path.size, 0, Math.PI * 2);
            this.ctx.fillStyle = path.color;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = path.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    // ==================== 文字动画 ====================

    initText() {
        const { text } = this.settings;
        this.textChars = text.split('');
    }

    updateText() {
        // 文字动画主要在绘制时处理
    }

    drawText() {
        const { canvasWidth, canvasHeight, fontSize, fontFamily, text, particleColor } = this.settings;
        const progress = this.currentFrame / this.totalFrames;

        this.ctx.font = `bold ${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 打字机效果
        const visibleChars = Math.floor(this.textChars.length * progress);
        const displayText = this.textChars.slice(0, visibleChars).join('');

        // 绘制文字
        this.ctx.fillStyle = particleColor;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = particleColor;
        this.ctx.fillText(displayText, canvasWidth / 2, canvasHeight / 2);
        this.ctx.shadowBlur = 0;

        // 添加闪烁的光标
        if (visibleChars < this.textChars.length) {
            const textWidth = this.ctx.measureText(displayText).width;
            const cursorX = canvasWidth / 2 + textWidth / 2 + 5;
            const opacity = (Math.sin(this.currentFrame * 0.3) + 1) / 2;

            this.ctx.fillStyle = this.hexToRgba(particleColor, opacity);
            this.ctx.fillRect(cursorX, canvasHeight / 2 - fontSize / 2, 3, fontSize);
        }
    }

    // ==================== 波形动画 ====================

    initWave() {
        this.waveOffset = 0;
    }

    updateWave() {
        const { speed } = this.settings;
        this.waveOffset += 0.05 * speed;
    }

    drawWave() {
        const { canvasWidth, canvasHeight, waveAmplitude, waveFrequency, particleColor } = this.settings;
        const waves = 3;

        for (let w = 0; w < waves; w++) {
            this.ctx.beginPath();

            for (let x = 0; x <= canvasWidth; x += 5) {
                const y = canvasHeight / 2 +
                    Math.sin((x * waveFrequency / 100) + this.waveOffset + w) * waveAmplitude +
                    Math.sin((x * waveFrequency / 50) + this.waveOffset * 1.5 + w) * (waveAmplitude / 2);

                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }

            const hue = (w * 120) % 360;
            this.ctx.strokeStyle = this.hexToRgba(particleColor, 0.6 - w * 0.15);
            this.ctx.lineWidth = 3 - w * 0.5;
            this.ctx.stroke();
        }
    }

    // ==================== 粒子文字 ====================

    initParticleText() {
        const { canvasWidth, canvasHeight, text, fontSize, fontFamily } = this.settings;

        // 创建临时 canvas 来获取文字像素
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.font = `bold ${fontSize}px ${fontFamily}`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillText(text, canvasWidth / 2, canvasHeight / 2);

        // 获取像素数据
        const imageData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
        const pixels = imageData.data;

        this.particles = [];
        const gap = 4; // 采样间隔

        for (let y = 0; y < canvasHeight; y += gap) {
            for (let x = 0; x < canvasWidth; x += gap) {
                const index = (y * canvasWidth + x) * 4;
                const alpha = pixels[index + 3];

                if (alpha > 128) {
                    this.particles.push({
                        targetX: x,
                        targetY: y,
                        x: canvasWidth / 2 + (Math.random() - 0.5) * 100,
                        y: canvasHeight / 2 + (Math.random() - 0.5) * 100,
                        size: 2 + Math.random() * 2,
                        color: this.getRandomColor(),
                        vx: 0,
                        vy: 0
                    });
                }
            }
        }
    }

    updateParticleText() {
        const progress = Math.min(this.currentFrame / (this.totalFrames * 0.7), 1);
        const easing = this.easeOutCubic(progress);

        this.particles.forEach(p => {
            // 向目标位置移动
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;

            p.vx = dx * 0.1;
            p.vy = dy * 0.1;

            p.x += p.vx;
            p.y += p.vy;
        });
    }

    drawParticleText() {
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
        });
    }

    // ==================== 渲染主循环 ====================

    render() {
        // 清空画布
        this.clearCanvas();

        // 绘制背景
        this.drawBackground();

        // 根据动画类型更新和绘制
        switch (this.animationType) {
            case 'particles':
                this.updateParticles();
                this.drawParticles();
                break;
            case 'shapes':
                this.updateShapes();
                this.drawShapes();
                break;
            case 'path':
                this.updatePath();
                this.drawPath();
                break;
            case 'text':
                this.updateText();
                this.drawText();
                break;
            case 'wave':
                this.updateWave();
                this.drawWave();
                break;
            case 'particle-text':
                this.updateParticleText();
                this.drawParticleText();
                break;
        }

        this.currentFrame++;
        if (this.currentFrame >= this.totalFrames) {
            this.currentFrame = 0;
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        const { bgType, bgColor, bgGradientStart, bgGradientEnd, canvasWidth, canvasHeight } = this.settings;

        if (bgType === 'transparent') {
            return;
        }

        if (bgType === 'solid') {
            this.ctx.fillStyle = bgColor;
            this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        } else if (bgType === 'gradient') {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, canvasHeight);
            gradient.addColorStop(0, bgGradientStart);
            gradient.addColorStop(1, bgGradientEnd);
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
    }

    // ==================== 工具函数 ====================

    getRandomColor() {
        const hue = Math.random() * 360;
        return this.getColorFromHue(hue);
    }

    getColorFromHue(hue) {
        return `hsl(${hue}, 70%, 60%)`;
    }

    hexToRgba(hex, alpha = 1) {
        // 如果已经是 hsl 或 rgb 格式，直接返回
        if (hex.startsWith('hsl') || hex.startsWith('rgb')) {
            return hex;
        }

        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // ==================== 播放控制 ====================

    play() {
        this.isPlaying = true;
        this.animate();
    }

    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animate() {
        if (!this.isPlaying) return;

        const now = Date.now();
        const elapsed = now - this.lastFrameTime;
        const frameTime = 1000 / this.settings.fps;

        if (elapsed >= frameTime) {
            this.render();
            this.lastFrameTime = now - (elapsed % frameTime);
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    renderFrame(frameNumber) {
        this.currentFrame = frameNumber;
        this.render();
    }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationEngine;
}
