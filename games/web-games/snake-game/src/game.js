// 遊戲配置
const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;

// Canvas 設定
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 遊戲狀態
let gameState = {
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 15, y: 15 },
    score: 0,
    highScore: localStorage.getItem('snakeHighScore') || 0,
    gameLoop: null,
    isPaused: false,
    isGameOver: false,
    speed: INITIAL_SPEED
};

// DOM 元素
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const lengthElement = document.getElementById('length');
const speedElement = document.getElementById('speed');
const difficultyElement = document.getElementById('difficulty');

// 初始化
function init() {
    updateUI();
    drawGame();

    // 事件監聽器
    document.addEventListener('keydown', handleKeyPress);
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', resetGame);
}

// 開始遊戲
function startGame() {
    if (gameState.gameLoop) return;

    gameState.isGameOver = false;
    gameState.isPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    gameState.gameLoop = setInterval(update, gameState.speed);
}

// 更新遊戲狀態
function update() {
    if (gameState.isPaused || gameState.isGameOver) return;

    // 更新方向
    gameState.direction = { ...gameState.nextDirection };

    // 計算新的頭部位置
    const head = {
        x: gameState.snake[0].x + gameState.direction.x,
        y: gameState.snake[0].y + gameState.direction.y
    };

    // 檢查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }

    // 添加新頭部
    gameState.snake.unshift(head);

    // 檢查是否吃到食物
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        eatFood();
    } else {
        // 移除尾部
        gameState.snake.pop();
    }

    drawGame();
    updateUI();
}

// 繪製遊戲
function drawGame() {
    // 清空畫布
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 繪製網格
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
    }

    // 繪製蛇
    gameState.snake.forEach((segment, index) => {
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;

        // 蛇頭使用漸層
        if (index === 0) {
            const gradient = ctx.createLinearGradient(x, y, x + GRID_SIZE, y + GRID_SIZE);
            gradient.addColorStop(0, '#4ade80');
            gradient.addColorStop(1, '#22c55e');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = '#86efac';
        }

        ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);

        // 蛇頭眼睛
        if (index === 0) {
            ctx.fillStyle = 'white';
            const eyeSize = 3;
            const eyeOffset = 5;

            if (gameState.direction.x === 1) { // 向右
                ctx.fillRect(x + GRID_SIZE - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + GRID_SIZE - eyeOffset - eyeSize, y + GRID_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            } else if (gameState.direction.x === -1) { // 向左
                ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + eyeOffset, y + GRID_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            } else if (gameState.direction.y === 1) { // 向下
                ctx.fillRect(x + eyeOffset, y + GRID_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(x + GRID_SIZE - eyeOffset - eyeSize, y + GRID_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            } else { // 向上
                ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + GRID_SIZE - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
            }
        }
    });

    // 繪製食物
    const foodX = gameState.food.x * GRID_SIZE;
    const foodY = gameState.food.y * GRID_SIZE;

    // 食物外圈
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(foodX + GRID_SIZE / 2, foodY + GRID_SIZE / 2, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // 食物高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(foodX + GRID_SIZE / 2 - 2, foodY + GRID_SIZE / 2 - 2, GRID_SIZE / 4, 0, Math.PI * 2);
    ctx.fill();
}

// 處理鍵盤輸入
function handleKeyPress(e) {
    if (gameState.isGameOver) return;

    const key = e.key;

    // 暫停/繼續
    if (key === ' ') {
        e.preventDefault();
        if (gameState.gameLoop) {
            togglePause();
        }
        return;
    }

    // 方向控制
    const directionMap = {
        'ArrowUp': { x: 0, y: -1 },
        'ArrowDown': { x: 0, y: 1 },
        'ArrowLeft': { x: -1, y: 0 },
        'ArrowRight': { x: 1, y: 0 }
    };

    const newDirection = directionMap[key];

    if (newDirection) {
        e.preventDefault();

        // 防止反向移動
        if (newDirection.x !== -gameState.direction.x &&
            newDirection.y !== -gameState.direction.y) {
            gameState.nextDirection = newDirection;
        }
    }
}

// 檢查碰撞
function checkCollision(head) {
    // 撞牆
    if (head.x < 0 || head.x >= CANVAS_SIZE / GRID_SIZE ||
        head.y < 0 || head.y >= CANVAS_SIZE / GRID_SIZE) {
        return true;
    }

    // 撞到自己
    return gameState.snake.some(segment =>
        segment.x === head.x && segment.y === head.y
    );
}

// 吃到食物
function eatFood() {
    gameState.score += 10;

    // 更新最高分
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('snakeHighScore', gameState.highScore);
    }

    // 生成新食物
    generateFood();

    // 增加速度
    if (gameState.snake.length % 5 === 0) {
        gameState.speed = Math.max(50, gameState.speed - SPEED_INCREMENT);
        clearInterval(gameState.gameLoop);
        gameState.gameLoop = setInterval(update, gameState.speed);
    }
}

// 生成食物
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
            y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE))
        };
    } while (gameState.snake.some(segment =>
        segment.x === newFood.x && segment.y === newFood.y
    ));

    gameState.food = newFood;
}

// 切換暫停
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    pauseBtn.textContent = gameState.isPaused ? '繼續' : '暫停';
}

// 遊戲結束
function gameOver() {
    gameState.isGameOver = true;
    clearInterval(gameState.gameLoop);
    gameState.gameLoop = null;

    // 顯示遊戲結束訊息
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('遊戲結束!', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20);

    ctx.font = '20px Arial';
    ctx.fillText(`最終分數: ${gameState.score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);

    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// 重置遊戲
function resetGame() {
    clearInterval(gameState.gameLoop);

    gameState = {
        snake: [{ x: 10, y: 10 }],
        direction: { x: 1, y: 0 },
        nextDirection: { x: 1, y: 0 },
        food: { x: 15, y: 15 },
        score: 0,
        highScore: localStorage.getItem('snakeHighScore') || 0,
        gameLoop: null,
        isPaused: false,
        isGameOver: false,
        speed: INITIAL_SPEED
    };

    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暫停';

    updateUI();
    drawGame();
}

// 更新 UI
function updateUI() {
    scoreElement.textContent = gameState.score;
    highScoreElement.textContent = gameState.highScore;
    lengthElement.textContent = gameState.snake.length;

    const speedLevel = Math.floor((INITIAL_SPEED - gameState.speed) / SPEED_INCREMENT) + 1;
    speedElement.textContent = speedLevel;

    if (gameState.snake.length < 10) {
        difficultyElement.textContent = '簡單';
    } else if (gameState.snake.length < 20) {
        difficultyElement.textContent = '中等';
    } else {
        difficultyElement.textContent = '困難';
    }
}

// 啟動遊戲
init();
