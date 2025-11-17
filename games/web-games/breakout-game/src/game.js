// 遊戲配置
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 遊戲常量
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 25;
const BRICK_PADDING = 5;
const BRICK_OFFSET_TOP = 50;
const BRICK_OFFSET_LEFT = 35;

// 遊戲狀態
let gameState = {
    paddle: {
        x: canvas.width / 2 - PADDLE_WIDTH / 2,
        y: canvas.height - 40,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: 0,
        maxSpeed: 8
    },
    ball: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: BALL_RADIUS,
        dx: 4,
        dy: -4,
        speed: 4
    },
    bricks: [],
    score: 0,
    lives: 3,
    level: 1,
    highScore: localStorage.getItem('breakoutHighScore') || 0,
    gameLoop: null,
    isPaused: false,
    isGameOver: false,
    isGameStarted: false
};

// DOM 元素
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const highScoreElement = document.getElementById('highScore');

// 滑鼠控制
let mouseX = 0;
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
});

// 觸控支援
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mouseX = touch.clientX - rect.left;
}, { passive: false });

// 初始化磚塊
function createBricks() {
    gameState.bricks = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            const x = col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
            const y = row * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;

            // 根據行數設置不同的顏色和耐久度
            let color, hits;
            if (row < 2) {
                color = '#ef4444'; // 紅色 - 1次
                hits = 1;
            } else if (row < 4) {
                color = '#f97316'; // 橙色 - 2次
                hits = 2;
            } else {
                color = '#eab308'; // 黃色 - 3次
                hits = 3;
            }

            gameState.bricks.push({
                x, y,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                color,
                hits,
                maxHits: hits,
                visible: true
            });
        }
    }
}

// 初始化
function init() {
    createBricks();
    updateUI();
    drawGame();

    // 事件監聽器
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', resetGame);
}

// 開始遊戲
function startGame() {
    if (gameState.gameLoop) return;

    gameState.isGameStarted = true;
    gameState.isGameOver = false;
    gameState.isPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    // 重置球的位置和速度
    gameState.ball.x = canvas.width / 2;
    gameState.ball.y = canvas.height - 100;
    gameState.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    gameState.ball.dy = -4;

    gameState.gameLoop = requestAnimationFrame(gameLoop);
}

// 遊戲循環
function gameLoop() {
    if (gameState.isPaused || gameState.isGameOver) {
        gameState.gameLoop = requestAnimationFrame(gameLoop);
        return;
    }

    update();
    drawGame();
    updateUI();

    gameState.gameLoop = requestAnimationFrame(gameLoop);
}

// 更新遊戲狀態
function update() {
    // 更新擋板位置（跟隨滑鼠）
    if (mouseX > 0) {
        gameState.paddle.x = mouseX - gameState.paddle.width / 2;
        gameState.paddle.x = Math.max(0, Math.min(canvas.width - gameState.paddle.width, gameState.paddle.x));
    }

    // 更新球的位置
    gameState.ball.x += gameState.ball.dx;
    gameState.ball.y += gameState.ball.dy;

    // 球與牆壁碰撞
    if (gameState.ball.x + gameState.ball.radius > canvas.width ||
        gameState.ball.x - gameState.ball.radius < 0) {
        gameState.ball.dx = -gameState.ball.dx;
    }

    if (gameState.ball.y - gameState.ball.radius < 0) {
        gameState.ball.dy = -gameState.ball.dy;
    }

    // 球與擋板碰撞
    if (gameState.ball.y + gameState.ball.radius > gameState.paddle.y &&
        gameState.ball.x > gameState.paddle.x &&
        gameState.ball.x < gameState.paddle.x + gameState.paddle.width) {

        // 根據擊中擋板的位置改變球的角度
        const hitPos = (gameState.ball.x - gameState.paddle.x) / gameState.paddle.width;
        const angle = (hitPos - 0.5) * Math.PI / 3; // -60° to 60°
        const speed = Math.sqrt(gameState.ball.dx ** 2 + gameState.ball.dy ** 2);

        gameState.ball.dx = speed * Math.sin(angle);
        gameState.ball.dy = -speed * Math.cos(angle);
    }

    // 球掉落
    if (gameState.ball.y - gameState.ball.radius > canvas.height) {
        loseLife();
        return;
    }

    // 球與磚塊碰撞
    gameState.bricks.forEach(brick => {
        if (!brick.visible) return;

        if (gameState.ball.x + gameState.ball.radius > brick.x &&
            gameState.ball.x - gameState.ball.radius < brick.x + brick.width &&
            gameState.ball.y + gameState.ball.radius > brick.y &&
            gameState.ball.y - gameState.ball.radius < brick.y + brick.height) {

            // 反彈
            gameState.ball.dy = -gameState.ball.dy;

            // 減少磚塊耐久度
            brick.hits--;
            if (brick.hits <= 0) {
                brick.visible = false;
                gameState.score += 10;

                // 更新最高分
                if (gameState.score > gameState.highScore) {
                    gameState.highScore = gameState.score;
                    localStorage.setItem('breakoutHighScore', gameState.highScore);
                }
            }

            // 更新磚塊顏色
            updateBrickColor(brick);
        }
    });

    // 檢查是否清空所有磚塊
    if (gameState.bricks.every(brick => !brick.visible)) {
        nextLevel();
    }
}

// 更新磚塊顏色（根據剩餘耐久度）
function updateBrickColor(brick) {
    if (brick.hits === 2) {
        brick.color = '#f97316'; // 橙色
    } else if (brick.hits === 1) {
        brick.color = '#eab308'; // 黃色
    }
}

// 繪製遊戲
function drawGame() {
    // 清空畫布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 繪製磚塊
    gameState.bricks.forEach(brick => {
        if (!brick.visible) return;

        // 磚塊主體
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // 磚塊邊框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // 磚塊高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height / 3);

        // 顯示耐久度
        if (brick.hits > 1) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(brick.hits, brick.x + brick.width / 2, brick.y + brick.height / 2);
        }
    });

    // 繪製擋板
    const gradient = ctx.createLinearGradient(
        gameState.paddle.x,
        gameState.paddle.y,
        gameState.paddle.x,
        gameState.paddle.y + gameState.paddle.height
    );
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');

    ctx.fillStyle = gradient;
    ctx.fillRect(
        gameState.paddle.x,
        gameState.paddle.y,
        gameState.paddle.width,
        gameState.paddle.height
    );

    // 擋板邊框
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        gameState.paddle.x,
        gameState.paddle.y,
        gameState.paddle.width,
        gameState.paddle.height
    );

    // 繪製球
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    const ballGradient = ctx.createRadialGradient(
        gameState.ball.x - 3,
        gameState.ball.y - 3,
        0,
        gameState.ball.x,
        gameState.ball.y,
        gameState.ball.radius
    );
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(1, '#00ffff');
    ctx.fillStyle = ballGradient;
    ctx.fill();
    ctx.closePath();

    // 球的外圈
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // 繪製遊戲提示
    if (!gameState.isGameStarted) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('點擊開始遊戲', canvas.width / 2, canvas.height / 2);
    }

    if (gameState.isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('暫停', canvas.width / 2, canvas.height / 2);
    }
}

// 失去生命
function loseLife() {
    gameState.lives--;

    if (gameState.lives <= 0) {
        gameOver();
    } else {
        // 重置球的位置
        gameState.ball.x = canvas.width / 2;
        gameState.ball.y = canvas.height - 100;
        gameState.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
        gameState.ball.dy = -4;
    }
}

// 下一關
function nextLevel() {
    gameState.level++;

    // 增加球速
    const speedMultiplier = 1.1;
    gameState.ball.dx *= speedMultiplier;
    gameState.ball.dy *= speedMultiplier;

    // 重新創建磚塊
    createBricks();

    // 重置球的位置
    gameState.ball.x = canvas.width / 2;
    gameState.ball.y = canvas.height - 100;

    // 顯示關卡提示
    gameState.isPaused = true;
    setTimeout(() => {
        gameState.isPaused = false;
    }, 2000);

    drawLevelTransition();
}

// 繪製關卡過渡
function drawLevelTransition() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`關卡 ${gameState.level}`, canvas.width / 2, canvas.height / 2);
}

// 遊戲結束
function gameOver() {
    gameState.isGameOver = true;
    cancelAnimationFrame(gameState.gameLoop);
    gameState.gameLoop = null;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('遊戲結束!', canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(`最終分數: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 20);

    if (gameState.score === gameState.highScore && gameState.score > 0) {
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 25px Arial';
        ctx.fillText('🎉 新紀錄！', canvas.width / 2, canvas.height / 2 + 60);
    }

    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// 切換暫停
function togglePause() {
    if (!gameState.isGameStarted || gameState.isGameOver) return;

    gameState.isPaused = !gameState.isPaused;
    pauseBtn.textContent = gameState.isPaused ? '繼續' : '暫停';
}

// 重置遊戲
function resetGame() {
    if (gameState.gameLoop) {
        cancelAnimationFrame(gameState.gameLoop);
        gameState.gameLoop = null;
    }

    gameState = {
        paddle: {
            x: canvas.width / 2 - PADDLE_WIDTH / 2,
            y: canvas.height - 40,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            speed: 0,
            maxSpeed: 8
        },
        ball: {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: BALL_RADIUS,
            dx: 4,
            dy: -4,
            speed: 4
        },
        bricks: [],
        score: 0,
        lives: 3,
        level: 1,
        highScore: localStorage.getItem('breakoutHighScore') || 0,
        gameLoop: null,
        isPaused: false,
        isGameOver: false,
        isGameStarted: false
    };

    createBricks();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暫停';
    updateUI();
    drawGame();
}

// 更新 UI
function updateUI() {
    scoreElement.textContent = gameState.score;
    livesElement.textContent = gameState.lives;
    levelElement.textContent = gameState.level;
    highScoreElement.textContent = gameState.highScore;
}

// 啟動遊戲
init();
