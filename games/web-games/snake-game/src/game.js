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

// AI 系統
let aiMode = false;
let aiEnabled = false;
let aiPath = [];
let aiHintEnabled = false;
let audioContext;

// DOM 元素
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const lengthElement = document.getElementById('length');
const speedElement = document.getElementById('speed');
const difficultyElement = document.getElementById('difficulty');

// ============== 音效系統 ==============
function initAudioSystem() {
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        audioContext = new (AudioContext || webkitAudioContext)();
    }
}

function playEatSound() {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playGameOverSound() {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

function playMoveSound() {
    if (!audioContext || !aiHintEnabled) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.05);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
}

// ============== AI 系統 ==============
// A* 尋路算法
function findPathAStar(start, goal) {
    const gridSize = CANVAS_SIZE / GRID_SIZE;

    // 檢查位置是否有效
    function isValid(pos) {
        if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) {
            return false;
        }

        // 檢查是否撞到蛇身（排除尾部，因為會移動）
        for (let i = 0; i < gameState.snake.length - 1; i++) {
            if (gameState.snake[i].x === pos.x && gameState.snake[i].y === pos.y) {
                return false;
            }
        }
        return true;
    }

    // 曼哈頓距離
    function heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    const openSet = [{ ...start, g: 0, h: heuristic(start, goal), f: heuristic(start, goal), parent: null }];
    const closedSet = new Set();

    while (openSet.length > 0) {
        // 找到 f 值最小的節點
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        // 到達目標
        if (current.x === goal.x && current.y === goal.y) {
            const path = [];
            let node = current;
            while (node.parent) {
                path.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }
            return path;
        }

        closedSet.add(`${current.x},${current.y}`);

        // 檢查四個方向
        const neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 }
        ];

        for (const neighbor of neighbors) {
            if (!isValid(neighbor) || closedSet.has(`${neighbor.x},${neighbor.y}`)) {
                continue;
            }

            const g = current.g + 1;
            const h = heuristic(neighbor, goal);
            const f = g + h;

            const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

            if (!existingNode) {
                openSet.push({ ...neighbor, g, h, f, parent: current });
            } else if (g < existingNode.g) {
                existingNode.g = g;
                existingNode.f = f;
                existingNode.parent = current;
            }
        }
    }

    return []; // 沒有找到路徑
}

// AI 計算下一步方向
function getAIDirection() {
    const head = gameState.snake[0];
    const food = gameState.food;

    // 使用 A* 找路徑
    const path = findPathAStar(head, food);

    if (path.length > 0) {
        const nextStep = path[0];
        const dx = nextStep.x - head.x;
        const dy = nextStep.y - head.y;
        return { x: dx, y: dy };
    }

    // 如果找不到路徑，嘗試找安全的方向
    const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    for (const dir of directions) {
        const newHead = {
            x: head.x + dir.x,
            y: head.y + dir.y
        };

        if (!checkCollision(newHead) &&
            !(dir.x === -gameState.direction.x && dir.y === -gameState.direction.y)) {
            return dir;
        }
    }

    return gameState.direction; // 沒有安全方向，保持當前方向
}

// AI 提示系統
function getAIHint() {
    const head = gameState.snake[0];
    const food = gameState.food;

    // 使用 A* 找路徑
    aiPath = findPathAStar(head, food);

    if (aiPath.length > 0) {
        return aiPath[0];
    }
    return null;
}

// 初始化
function init() {
    initAudioSystem();
    updateUI();
    drawGame();

    // 添加 AI 控制按鈕
    createAIControls();

    // 事件監聽器
    document.addEventListener('keydown', handleKeyPress);
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resetBtn.addEventListener('click', resetGame);
}

function createAIControls() {
    const controlsDiv = document.querySelector('.controls');

    // AI 自動玩家按鈕
    const aiBtn = document.createElement('button');
    aiBtn.id = 'aiBtn';
    aiBtn.className = 'btn btn-primary';
    aiBtn.textContent = 'AI 自動玩家';
    aiBtn.addEventListener('click', toggleAI);
    controlsDiv.appendChild(aiBtn);

    // AI 提示按鈕
    const hintBtn = document.createElement('button');
    hintBtn.id = 'hintBtn';
    hintBtn.className = 'btn btn-secondary';
    hintBtn.textContent = 'AI 提示';
    hintBtn.addEventListener('click', toggleHint);
    controlsDiv.appendChild(hintBtn);
}

function toggleAI() {
    aiEnabled = !aiEnabled;
    const aiBtn = document.getElementById('aiBtn');
    aiBtn.textContent = aiEnabled ? 'AI 已開啟' : 'AI 自動玩家';
    aiBtn.className = aiEnabled ? 'btn btn-danger' : 'btn btn-primary';

    if (aiEnabled && !gameState.gameLoop) {
        startGame();
    }
}

function toggleHint() {
    aiHintEnabled = !aiHintEnabled;
    const hintBtn = document.getElementById('hintBtn');
    hintBtn.textContent = aiHintEnabled ? 'AI 提示已開啟' : 'AI 提示';
    hintBtn.className = aiHintEnabled ? 'btn btn-danger' : 'btn btn-secondary';
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

    // AI 自動控制
    if (aiEnabled) {
        const aiDirection = getAIDirection();
        if (aiDirection.x !== -gameState.direction.x ||
            aiDirection.y !== -gameState.direction.y) {
            gameState.nextDirection = aiDirection;
        }
    }

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

    playMoveSound();
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

    // 繪製 AI 路徑提示
    if (aiHintEnabled && !gameState.isGameOver) {
        const hint = getAIHint();
        if (hint) {
            aiPath.forEach((step, index) => {
                const x = step.x * GRID_SIZE;
                const y = step.y * GRID_SIZE;
                const alpha = 1 - (index / aiPath.length) * 0.7;

                ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.3})`;
                ctx.fillRect(x + 4, y + 4, GRID_SIZE - 8, GRID_SIZE - 8);

                // 繪製箭頭
                if (index === 0) {
                    ctx.fillStyle = `rgba(255, 150, 0, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(x + GRID_SIZE / 2, y + GRID_SIZE / 2, 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }
    }

    // 繪製蛇
    gameState.snake.forEach((segment, index) => {
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;

        // 蛇頭使用漸層
        if (index === 0) {
            const gradient = ctx.createLinearGradient(x, y, x + GRID_SIZE, y + GRID_SIZE);
            gradient.addColorStop(0, aiEnabled ? '#ff4de8' : '#4ade80');
            gradient.addColorStop(1, aiEnabled ? '#bf1ca3' : '#22c55e');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = aiEnabled ? '#fca5f1' : '#86efac';
        }

        ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        ctx.strokeStyle = aiEnabled ? '#bf1ca3' : '#22c55e';
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

    // 方向控制（僅在非 AI 模式下）
    if (!aiEnabled) {
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

    playEatSound();
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

    playGameOverSound();

    // 顯示遊戲結束訊息
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('遊戲結束!', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20);

    ctx.font = '20px Arial';
    ctx.fillText(`最終分數: ${gameState.score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);

    if (aiEnabled) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#ff4de8';
        ctx.fillText('(AI 模式)', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 50);
    }

    startBtn.disabled = false;
    pauseBtn.disabled = true;

    // AI 模式自動重新開始
    if (aiEnabled) {
        setTimeout(() => {
            resetGame();
            startGame();
        }, 2000);
    }
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

    aiPath = [];

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
