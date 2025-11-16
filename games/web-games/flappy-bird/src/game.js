// 遊戲配置
const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 600,
    parent: 'game',
    backgroundColor: '#4ec0ca',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
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
let bird;
let pipes;
let score = 0;
let scoreText;
let highScore = 0;
let highScoreText;
let gameOver = false;
let ground;
let pipeTimer;
let gameStarted = false;
let titleText;
let instructionText;

const game = new Phaser.Game(config);

function preload() {
    // 由於沒有圖片資源,我們將使用圖形繪製
    // 這樣遊戲可以直接運行而不需要外部資源
}

function create() {
    // 讀取最高分
    highScore = localStorage.getItem('flappyBirdHighScore') || 0;

    // 創建地面
    createGround(this);

    // 創建小鳥
    createBird(this);

    // 創建管道群組
    pipes = this.physics.add.group();

    // 分數文字
    scoreText = this.add.text(16, 16, '分數: 0', {
        fontSize: '32px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    });

    // 最高分文字
    highScoreText = this.add.text(16, 56, `最高分: ${highScore}`, {
        fontSize: '24px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 3
    });

    // 標題文字
    titleText = this.add.text(200, 200, 'Flappy Bird', {
        fontSize: '48px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
    }).setOrigin(0.5);

    // 指示文字
    instructionText = this.add.text(200, 280, '點擊開始', {
        fontSize: '32px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    }).setOrigin(0.5);

    // 讓指示文字閃爍
    this.tweens.add({
        targets: instructionText,
        alpha: 0.3,
        duration: 800,
        ease: 'Linear',
        yoyo: true,
        repeat: -1
    });

    // 碰撞檢測
    this.physics.add.collider(bird, pipes, hitPipe, null, this);
    this.physics.add.collider(bird, ground, hitGround, null, this);

    // 輸入事件
    this.input.on('pointerdown', flap, this);
    this.input.keyboard.on('keydown-SPACE', flap, this);
}

function createBird(scene) {
    // 創建小鳥 (使用圖形)
    const graphics = scene.add.graphics();
    graphics.fillStyle(0xFFFF00, 1);
    graphics.fillCircle(20, 20, 20);
    graphics.fillStyle(0xFFFFFF, 1);
    graphics.fillCircle(28, 15, 6);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(30, 15, 3);
    graphics.fillStyle(0xFF6600, 1);
    graphics.fillTriangle(35, 20, 45, 18, 45, 22);

    graphics.generateTexture('bird', 50, 40);
    graphics.destroy();

    bird = scene.physics.add.sprite(100, 300, 'bird');
    bird.setCollideWorldBounds(false);
    bird.body.gravity.y = 0; // 開始時沒有重力
}

function createGround(scene) {
    // 創建地面圖形
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x8B4513, 1);
    graphics.fillRect(0, 0, 400, 80);
    graphics.fillStyle(0x90EE90, 1);
    graphics.fillRect(0, 0, 400, 20);
    for (let i = 0; i < 10; i++) {
        graphics.fillStyle(0x228B22, 1);
        graphics.fillRect(i * 50, 5, 30, 10);
    }

    graphics.generateTexture('ground', 400, 80);
    graphics.destroy();

    ground = scene.physics.add.staticSprite(200, 580, 'ground');
    ground.setScale(1);
    ground.refreshBody();
}

function createPipe(scene) {
    if (gameOver || !gameStarted) return;

    const gap = 150;
    const minHeight = 100;
    const maxHeight = 350;
    const pipeHeight = Phaser.Math.Between(minHeight, maxHeight);

    // 創建上管道
    const topPipe = createPipeGraphic(scene, 400, pipeHeight, true);
    pipes.add(topPipe);

    // 創建下管道
    const bottomPipe = createPipeGraphic(scene, 400, pipeHeight + gap, false);
    pipes.add(bottomPipe);

    // 設置速度
    topPipe.setVelocityX(-200);
    bottomPipe.setVelocityX(-200);

    // 標記用於計分
    topPipe.scored = false;
    bottomPipe.scored = false;
}

function createPipeGraphic(scene, x, y, isTop) {
    // 創建管道圖形
    if (!scene.textures.exists('pipe')) {
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x00FF00, 1);
        graphics.fillRect(0, 0, 60, 400);
        graphics.fillStyle(0x00CC00, 1);
        graphics.fillRect(5, 0, 50, 400);
        graphics.fillStyle(0x00AA00, 1);
        graphics.fillRect(0, 0, 10, 400);

        graphics.generateTexture('pipe', 60, 400);
        graphics.destroy();
    }

    const pipe = scene.physics.add.sprite(x, 0, 'pipe');

    if (isTop) {
        pipe.setOrigin(0.5, 1);
        pipe.y = y;
    } else {
        pipe.setOrigin(0.5, 0);
        pipe.y = y;
    }

    pipe.body.allowGravity = false;
    pipe.setImmovable(true);

    return pipe;
}

function flap() {
    if (!gameStarted) {
        startGame(this);
        return;
    }

    if (gameOver) {
        restartGame(this);
        return;
    }

    // 讓小鳥飛起來
    bird.setVelocityY(-350);

    // 旋轉動畫
    this.tweens.add({
        targets: bird,
        angle: -20,
        duration: 100
    });
}

function startGame(scene) {
    gameStarted = true;
    titleText.setVisible(false);
    instructionText.setVisible(false);

    // 啟動重力
    bird.body.gravity.y = 1000;

    // 開始生成管道
    pipeTimer = scene.time.addEvent({
        delay: 2000,
        callback: () => createPipe(scene),
        callbackScope: scene,
        loop: true
    });

    // 立即生成第一個管道
    createPipe(scene);
}

function hitPipe() {
    if (!gameOver) {
        gameOver = true;
        bird.setTint(0xff0000);
        endGame(this);
    }
}

function hitGround() {
    if (!gameOver) {
        gameOver = true;
        bird.setTint(0xff0000);
        endGame(this);
    }
}

function endGame(scene) {
    // 停止管道生成
    if (pipeTimer) {
        pipeTimer.remove();
    }

    // 停止所有物理
    scene.physics.pause();

    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyBirdHighScore', highScore);
        highScoreText.setText(`最高分: ${highScore}`);
    }

    // 顯示遊戲結束文字
    const gameOverText = scene.add.text(200, 250, '遊戲結束!', {
        fontSize: '48px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
    }).setOrigin(0.5);

    const finalScoreText = scene.add.text(200, 320, `最終分數: ${score}`, {
        fontSize: '32px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 4
    }).setOrigin(0.5);

    const restartText = scene.add.text(200, 380, '點擊重新開始', {
        fontSize: '24px',
        fill: '#fff',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 3
    }).setOrigin(0.5);

    // 閃爍效果
    scene.tweens.add({
        targets: restartText,
        alpha: 0.3,
        duration: 600,
        ease: 'Linear',
        yoyo: true,
        repeat: -1
    });
}

function restartGame(scene) {
    // 清除所有管道
    pipes.clear(true, true);

    // 重置變數
    score = 0;
    gameOver = false;
    gameStarted = false;

    // 清除場景並重新開始
    scene.scene.restart();
}

function update() {
    if (gameOver || !gameStarted) return;

    // 根據速度旋轉小鳥
    if (bird.body.velocity.y > 0) {
        bird.angle = Math.min(bird.angle + 2, 90);
    }

    // 檢查小鳥是否飛出上方
    if (bird.y < 0) {
        hitPipe.call(this);
    }

    // 檢查計分
    pipes.children.entries.forEach(pipe => {
        if (!pipe.scored && pipe.x + pipe.width < bird.x) {
            pipe.scored = true;
            score += 0.5; // 每組管道2分,每個0.5
            scoreText.setText(`分數: ${Math.floor(score)}`);
        }

        // 刪除離開螢幕的管道
        if (pipe.x < -100) {
            pipe.destroy();
        }
    });
}
