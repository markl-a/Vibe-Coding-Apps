// 遊戲配置
const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 800,
    parent: 'game',
    backgroundColor: '#000814',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// 遊戲變數
let player;
let cursors;
let bullets;
let enemies;
let enemyBullets;
let score = 0;
let lives = 3;
let highScore = 0;
let scoreText;
let livesText;
let highScoreText;
let gameOver = false;
let gameStarted = false;
let level = 1;
let enemySpeed = 100;
let enemyShootTimer = 0;
let waveNumber = 1;
let titleText;
let startText;
let powerUps;
let lastShotTime = 0;
let shootDelay = 300;

// AI 輔助變數
let aiAssistEnabled = false;
let aiAssistText;
let aiDifficultyLevel = 1; // 1: 簡單, 2: 中等, 3: 困難
let aiSuggestions = [];
let aiTargetIndicator;

// 音效系統變數
let soundEnabled = true;
let audioContext;
let sounds = {};

const game = new Phaser.Game(config);

// ============== 音效系統 ==============
// 創建 Web Audio API 音效
function initAudioSystem() {
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        audioContext = new (AudioContext || webkitAudioContext)();
    }
}

// 播放射擊音效
function playShootSound() {
    if (!soundEnabled || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// 播放爆炸音效
function playExplosionSound() {
    if (!soundEnabled || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// 播放道具拾取音效
function playPowerUpSound() {
    if (!soundEnabled || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// 播放受傷音效
function playHitSound() {
    if (!soundEnabled || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

// ============== AI 輔助系統 ==============
// AI 自動瞄準輔助
function aiAimAssist(scene) {
    if (!aiAssistEnabled || !player) return null;

    const activeEnemies = enemies.getChildren().filter(e => e.active);
    if (activeEnemies.length === 0) return null;

    // 找到最近的敵人
    let nearestEnemy = null;
    let minDistance = Infinity;

    activeEnemies.forEach(enemy => {
        const distance = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = enemy;
        }
    });

    return nearestEnemy;
}

// AI 難度動態調整
function aiAdjustDifficulty() {
    // 根據玩家表現調整難度
    if (score > 500 && aiDifficultyLevel < 3) {
        aiDifficultyLevel = 3;
    } else if (score > 200 && aiDifficultyLevel < 2) {
        aiDifficultyLevel = 2;
    }

    // 調整敵人速度和射擊頻率
    enemySpeed = 100 + (aiDifficultyLevel * 20);
}

// AI 生成遊戲建議
function aiGenerateSuggestions(scene) {
    aiSuggestions = [];

    // 檢查危險的敵人子彈
    const dangerousBullets = enemyBullets.getChildren().filter(bullet => {
        return bullet.active &&
               Math.abs(bullet.x - player.x) < 50 &&
               bullet.y > player.y - 100;
    });

    if (dangerousBullets.length > 0) {
        aiSuggestions.push('⚠️ 小心敵人子彈！');
    }

    // 檢查是否有道具
    const nearbyPowerUps = powerUps.getChildren().filter(powerUp => {
        return powerUp.active &&
               Phaser.Math.Distance.Between(player.x, player.y, powerUp.x, powerUp.y) < 100;
    });

    if (nearbyPowerUps.length > 0) {
        aiSuggestions.push('⭐ 附近有道具！');
    }

    // 檢查敵人數量
    const activeEnemies = enemies.countActive();
    if (activeEnemies > 10) {
        aiSuggestions.push('🎯 專注消滅敵人！');
    }
}

// AI 智能關卡生成
function aiGenerateWave(scene) {
    const patterns = [
        'grid',      // 網格陣型
        'vformation', // V字型
        'circle',    // 圓形
        'wave'       // 波浪形
    ];

    const pattern = Phaser.Utils.Array.GetRandom(patterns);
    const enemyCount = 10 + (aiDifficultyLevel * 5);

    switch(pattern) {
        case 'grid':
            createGridWave(scene, enemyCount);
            break;
        case 'vformation':
            createVFormationWave(scene, enemyCount);
            break;
        case 'circle':
            createCircleWave(scene, enemyCount);
            break;
        case 'wave':
            createWavePattern(scene, enemyCount);
            break;
    }
}

function createGridWave(scene, count) {
    const rows = 3;
    const cols = 6;
    const spacing = 60;
    const startX = (config.width - (cols - 1) * spacing) / 2;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = startX + col * spacing;
            const y = 50 + row * 50;
            createEnemy(scene, x, y);
        }
    }
}

function createVFormationWave(scene, count) {
    const centerX = config.width / 2;
    const rows = 5;

    for (let i = 0; i < rows; i++) {
        const spacing = 40 + (i * 20);
        createEnemy(scene, centerX - spacing, 50 + i * 40);
        createEnemy(scene, centerX + spacing, 50 + i * 40);
    }
    createEnemy(scene, centerX, 50);
}

function createCircleWave(scene, count) {
    const centerX = config.width / 2;
    const centerY = 150;
    const radius = 80;

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        createEnemy(scene, x, y);
    }
}

function createWavePattern(scene, count) {
    const cols = Math.min(count, 10);
    const spacing = config.width / (cols + 1);

    for (let i = 0; i < cols; i++) {
        const x = spacing * (i + 1);
        const y = 50 + Math.sin(i * 0.5) * 30;
        createEnemy(scene, x, y);
    }
}

// ============== 遊戲核心函數 ==============
function preload() {
    // 程序化生成所有圖形
}

function create() {
    // 初始化音效系統
    initAudioSystem();

    // 讀取最高分
    highScore = localStorage.getItem('spaceShooterHighScore') || 0;

    // 創建星空背景
    createStarfield(this);

    // 創建玩家飛船
    createPlayer(this);

    // 創建敵人群組
    enemies = this.physics.add.group();

    // 創建子彈群組
    bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 30
    });

    // 創建敵人子彈群組
    enemyBullets = this.physics.add.group({
        defaultKey: 'enemyBullet',
        maxSize: 50
    });

    // 創建道具群組
    powerUps = this.physics.add.group();

    // UI 文字
    scoreText = this.add.text(16, 16, '分數: 0', {
        fontSize: '24px',
        fill: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    });

    livesText = this.add.text(16, 50, `生命: ${lives}`, {
        fontSize: '24px',
        fill: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    });

    highScoreText = this.add.text(config.width - 16, 16, `最高分: ${highScore}`, {
        fontSize: '20px',
        fill: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 3
    }).setOrigin(1, 0);

    const levelText = this.add.text(config.width - 16, 46, `關卡: ${level}`, {
        fontSize: '18px',
        fill: '#00ccff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 3
    }).setOrigin(1, 0);

    // AI 輔助文字
    aiAssistText = this.add.text(config.width / 2, config.height - 30, '', {
        fontSize: '16px',
        fill: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 2
    }).setOrigin(0.5);

    // 標題文字
    titleText = this.add.text(config.width / 2, 250, '太空射擊', {
        fontSize: '64px',
        fill: '#00ffff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
    }).setOrigin(0.5);

    this.tweens.add({
        targets: titleText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 1000,
        yoyo: true,
        repeat: -1
    });

    startText = this.add.text(config.width / 2, 400, '按 ENTER 開始\n按 A 切換 AI 輔助', {
        fontSize: '28px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4,
        align: 'center'
    }).setOrigin(0.5);

    this.tweens.add({
        targets: startText,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
    });

    // 鍵盤輸入
    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-ENTER', () => {
        if (!gameStarted && !gameOver) {
            startGame(this);
        }
    });
    this.input.keyboard.on('keydown-SPACE', () => {
        if (gameStarted && !gameOver) {
            shoot(this);
        }
    });

    // AI 輔助切換
    this.input.keyboard.on('keydown-A', () => {
        aiAssistEnabled = !aiAssistEnabled;
        const message = aiAssistEnabled ? 'AI 輔助已開啟' : 'AI 輔助已關閉';
        aiAssistText.setText(message);
        this.time.delayedCall(2000, () => {
            if (!gameStarted) {
                aiAssistText.setText('');
            }
        });
    });

    // WASD 控制
    this.wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // 碰撞檢測
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);
    this.physics.add.overlap(player, enemyBullets, hitPlayerWithBullet, null, this);
    this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);
}

function createStarfield(scene) {
    for (let i = 0; i < 100; i++) {
        const x = Phaser.Math.Between(0, config.width);
        const y = Phaser.Math.Between(0, config.height);
        const size = Phaser.Math.Between(1, 3);
        const alpha = Phaser.Math.FloatBetween(0.3, 1);

        const star = scene.add.circle(x, y, size, 0xffffff, alpha);

        // 閃爍效果
        scene.tweens.add({
            targets: star,
            alpha: alpha * 0.3,
            duration: Phaser.Math.Between(1000, 3000),
            yoyo: true,
            repeat: -1
        });
    }
}

function createPlayer(scene) {
    // 創建玩家飛船圖形
    const graphics = scene.add.graphics();

    // 飛船主體
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillTriangle(20, 0, 0, 40, 40, 40);

    // 駕駛艙
    graphics.fillStyle(0x00ccff, 1);
    graphics.fillCircle(20, 25, 8);

    // 引擎
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(8, 40, 8, 5);
    graphics.fillRect(24, 40, 8, 5);

    graphics.generateTexture('player', 40, 45);
    graphics.destroy();

    player = scene.physics.add.sprite(config.width / 2, config.height - 100, 'player');
    player.setCollideWorldBounds(true);
}

function createBullet(scene) {
    if (!scene.textures.exists('bullet')) {
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillRect(0, 0, 4, 12);
        graphics.fillStyle(0x00ffff, 1);
        graphics.fillRect(0, 0, 4, 4);
        graphics.generateTexture('bullet', 4, 12);
        graphics.destroy();
    }
}

function createEnemyBullet(scene) {
    if (!scene.textures.exists('enemyBullet')) {
        const graphics = scene.add.graphics();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(0, 0, 4, 12);
        graphics.generateTexture('enemyBullet', 4, 12);
        graphics.destroy();
    }
}

function createEnemy(scene, x, y) {
    if (!scene.textures.exists('enemy')) {
        const graphics = scene.add.graphics();

        // 敵人飛船
        graphics.fillStyle(0xff0000, 1);
        graphics.fillTriangle(15, 30, 0, 0, 30, 0);

        // 武器
        graphics.fillStyle(0xff6600, 1);
        graphics.fillRect(5, 0, 5, 8);
        graphics.fillRect(20, 0, 5, 8);

        graphics.generateTexture('enemy', 30, 30);
        graphics.destroy();
    }

    const enemy = enemies.create(x, y, 'enemy');
    enemy.setVelocityY(enemySpeed);
    return enemy;
}

function createPowerUp(scene, x, y) {
    if (!scene.textures.exists('powerUp')) {
        const graphics = scene.add.graphics();
        graphics.fillStyle(0xffff00, 1);
        graphics.fillStar(15, 15, 5, 15, 7, 0);
        graphics.generateTexture('powerUp', 30, 30);
        graphics.destroy();
    }

    const powerUp = powerUps.create(x, y, 'powerUp');
    powerUp.setVelocityY(100);

    scene.tweens.add({
        targets: powerUp,
        angle: 360,
        duration: 2000,
        repeat: -1
    });

    return powerUp;
}

function startGame(scene) {
    gameStarted = true;
    titleText.setVisible(false);
    startText.setVisible(false);

    // 使用 AI 生成第一波敵人
    aiGenerateWave(scene);

    // 定時生成敵人
    scene.time.addEvent({
        delay: 4000,
        callback: () => {
            if (!gameOver && gameStarted) {
                aiGenerateWave(scene);
                waveNumber++;
            }
        },
        callbackScope: scene,
        loop: true
    });
}

function shoot(scene) {
    const currentTime = scene.time.now;

    if (currentTime - lastShotTime < shootDelay) {
        return;
    }

    lastShotTime = currentTime;

    createBullet(scene);

    const bullet = bullets.get(player.x, player.y - 20, 'bullet');

    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setVelocityY(-400);
        bullet.body.enable = true;

        // 播放射擊音效
        playShootSound();
    }
}

function enemyShoot(scene, enemy) {
    createEnemyBullet(scene);

    const bullet = enemyBullets.get(enemy.x, enemy.y + 20, 'enemyBullet');

    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setVelocityY(300);
        bullet.body.enable = true;
    }
}

function hitEnemy(bullet, enemy) {
    // 創建爆炸效果
    createExplosion(this, enemy.x, enemy.y);

    bullet.destroy();
    enemy.destroy();

    score += 10;
    scoreText.setText(`分數: ${score}`);

    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceShooterHighScore', highScore);
        highScoreText.setText(`最高分: ${highScore}`);
    }

    // 播放爆炸音效
    playExplosionSound();

    // 隨機掉落道具
    if (Math.random() < 0.15) {
        createPowerUp(this, enemy.x, enemy.y);
    }

    // AI 動態難度調整
    aiAdjustDifficulty();
}

function hitPlayer(player, enemy) {
    createExplosion(this, player.x, player.y);
    enemy.destroy();
    playHitSound();
    loseLife(this);
}

function hitPlayerWithBullet(player, bullet) {
    bullet.destroy();
    createExplosion(this, player.x, player.y);
    playHitSound();
    loseLife(this);
}

function loseLife(scene) {
    lives--;
    livesText.setText(`生命: ${lives}`);

    if (lives <= 0) {
        endGame(scene);
    } else {
        // 無敵時間
        player.setAlpha(0.5);
        scene.time.delayedCall(2000, () => {
            player.setAlpha(1);
        });
    }
}

function collectPowerUp(player, powerUp) {
    powerUp.destroy();

    // 恢復生命
    lives = Math.min(lives + 1, 5);
    livesText.setText(`生命: ${lives}`);

    // 增加分數
    score += 50;
    scoreText.setText(`分數: ${score}`);

    // 播放道具音效
    playPowerUpSound();
}

function createExplosion(scene, x, y) {
    // 粒子爆炸效果
    for (let i = 0; i < 8; i++) {
        const particle = scene.add.circle(x, y, 3, 0xff6600);
        const angle = (i / 8) * Math.PI * 2;
        const speed = 100;

        scene.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * 30,
            y: y + Math.sin(angle) * 30,
            alpha: 0,
            duration: 500,
            onComplete: () => particle.destroy()
        });
    }

    // 中心爆炸
    const explosion = scene.add.circle(x, y, 5, 0xff6600);
    scene.tweens.add({
        targets: explosion,
        radius: 30,
        alpha: 0,
        duration: 300,
        onComplete: () => explosion.destroy()
    });
}

function endGame(scene) {
    gameOver = true;

    // 停止所有敵人
    enemies.children.entries.forEach(enemy => {
        enemy.setVelocity(0, 0);
    });

    player.setTint(0xff0000);

    const gameOverText = scene.add.text(config.width / 2, 300, '遊戲結束!', {
        fontSize: '64px',
        fill: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 8
    }).setOrigin(0.5);

    const finalScoreText = scene.add.text(config.width / 2, 400, `最終分數: ${score}`, {
        fontSize: '36px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
    }).setOrigin(0.5);

    const restartText = scene.add.text(config.width / 2, 480, '按 ENTER 重新開始', {
        fontSize: '24px',
        fill: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    }).setOrigin(0.5);

    scene.tweens.add({
        targets: restartText,
        alpha: 0.3,
        duration: 600,
        yoyo: true,
        repeat: -1
    });

    scene.input.keyboard.once('keydown-ENTER', () => {
        scene.scene.restart();
        resetGame();
    });
}

function resetGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    gameStarted = false;
    level = 1;
    waveNumber = 1;
    aiDifficultyLevel = 1;
    enemySpeed = 100;
}

function update(time, delta) {
    if (!gameStarted || gameOver) return;

    // 玩家移動
    if (cursors.left.isDown || this.wasd.left.isDown) {
        player.setVelocityX(-300);
    } else if (cursors.right.isDown || this.wasd.right.isDown) {
        player.setVelocityX(300);
    } else {
        player.setVelocityX(0);
    }

    // AI 輔助：顯示最近的敵人
    if (aiAssistEnabled) {
        const target = aiAimAssist(this);
        if (target) {
            // 繪製目標指示器
            if (!aiTargetIndicator) {
                aiTargetIndicator = this.add.circle(0, 0, 20, 0xff0000, 0);
                aiTargetIndicator.setStrokeStyle(2, 0xff0000);
            }
            aiTargetIndicator.setPosition(target.x, target.y);
            aiTargetIndicator.setAlpha(Math.sin(time * 0.005) * 0.5 + 0.5);
        }

        // 生成 AI 建議
        aiGenerateSuggestions(this);
        if (aiSuggestions.length > 0) {
            aiAssistText.setText(aiSuggestions[0]);
        } else {
            aiAssistText.setText('');
        }
    } else if (aiTargetIndicator) {
        aiTargetIndicator.setAlpha(0);
        aiAssistText.setText('');
    }

    // 清理離開螢幕的子彈
    bullets.children.entries.forEach(bullet => {
        if (bullet.y < 0) {
            bullet.destroy();
        }
    });

    enemyBullets.children.entries.forEach(bullet => {
        if (bullet.y > config.height) {
            bullet.destroy();
        }
    });

    // 清理離開螢幕的道具
    powerUps.children.entries.forEach(powerUp => {
        if (powerUp.y > config.height) {
            powerUp.destroy();
        }
    });

    // 敵人射擊（根據難度調整頻率）
    enemyShootTimer += delta;
    const shootInterval = 2000 - (aiDifficultyLevel * 300);
    if (enemyShootTimer > shootInterval) {
        enemyShootTimer = 0;
        const activeEnemies = enemies.getChildren().filter(e => e.active);
        if (activeEnemies.length > 0) {
            const randomEnemy = Phaser.Utils.Array.GetRandom(activeEnemies);
            if (randomEnemy) {
                enemyShoot(this, randomEnemy);
            }
        }
    }

    // 移除離開螢幕的敵人
    enemies.children.entries.forEach(enemy => {
        if (enemy.y > config.height) {
            enemy.destroy();
        }
    });

    // 檢查是否所有敵人都被消滅
    if (gameStarted && enemies.countActive() === 0 && enemyBullets.countActive() === 0) {
        // 增加關卡難度
        level++;
    }
}
