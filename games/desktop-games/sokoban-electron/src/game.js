// 遊戲配置
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#34495e',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// 遊戲常量
const TILE_SIZE = 50;
const PLAYER = 1;
const BOX = 2;
const WALL = 3;
const TARGET = 4;

// 關卡數據
const levels = [
    {
        name: "第一關 - 入門",
        width: 8,
        height: 8,
        map: [
            [3, 3, 3, 3, 3, 3, 3, 3],
            [3, 0, 0, 0, 0, 0, 0, 3],
            [3, 0, 0, 2, 0, 0, 0, 3],
            [3, 0, 0, 0, 0, 4, 0, 3],
            [3, 0, 1, 0, 0, 0, 0, 3],
            [3, 0, 0, 0, 0, 0, 0, 3],
            [3, 0, 0, 0, 0, 0, 0, 3],
            [3, 3, 3, 3, 3, 3, 3, 3]
        ]
    },
    {
        name: "第二關 - 進階",
        width: 10,
        height: 8,
        map: [
            [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
            [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
            [3, 0, 2, 0, 0, 2, 0, 0, 0, 3],
            [3, 0, 0, 0, 3, 0, 0, 0, 0, 3],
            [3, 0, 0, 0, 0, 0, 4, 0, 4, 3],
            [3, 0, 1, 0, 0, 0, 0, 0, 0, 3],
            [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
            [3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
        ]
    },
    {
        name: "第三關 - 挑戰",
        width: 12,
        height: 9,
        map: [
            [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
            [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
            [3, 0, 2, 0, 0, 3, 3, 0, 0, 2, 0, 3],
            [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
            [3, 0, 0, 3, 0, 2, 0, 3, 0, 0, 0, 3],
            [3, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 3],
            [3, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 3],
            [3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 3],
            [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
        ]
    }
];

let currentLevel = 0;
let playerX, playerY;
let boxes = [];
let targets = [];
let walls = [];
let moveCount = 0;
let graphics;
let levelText;
let moveText;
let instructionText;

function preload() {
    // 不需要預加載,使用圖形繪製
}

function create() {
    graphics = this.add.graphics();

    // 顯示關卡信息
    levelText = this.add.text(16, 16, '', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Arial'
    });

    moveText = this.add.text(16, 50, '', {
        fontSize: '20px',
        fill: '#fff',
        fontFamily: 'Arial'
    });

    instructionText = this.add.text(16, config.height - 100,
        '操作說明:\n方向鍵移動\nR - 重置關卡\nN - 下一關\nP - 上一關', {
        fontSize: '16px',
        fill: '#ecf0f1',
        fontFamily: 'Arial'
    });

    // 鍵盤輸入
    this.input.keyboard.on('keydown-UP', () => movePlayer(0, -1));
    this.input.keyboard.on('keydown-DOWN', () => movePlayer(0, 1));
    this.input.keyboard.on('keydown-LEFT', () => movePlayer(-1, 0));
    this.input.keyboard.on('keydown-RIGHT', () => movePlayer(1, 0));
    this.input.keyboard.on('keydown-R', resetLevel);
    this.input.keyboard.on('keydown-N', nextLevel);
    this.input.keyboard.on('keydown-P', previousLevel);

    loadLevel(currentLevel);
}

function update() {
    drawGame();
}

function loadLevel(levelIndex) {
    if (levelIndex < 0 || levelIndex >= levels.length) return;

    currentLevel = levelIndex;
    const level = levels[currentLevel];

    boxes = [];
    targets = [];
    walls = [];
    moveCount = 0;

    // 解析關卡
    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
            const tile = level.map[y][x];

            switch(tile) {
                case PLAYER:
                    playerX = x;
                    playerY = y;
                    break;
                case BOX:
                    boxes.push({ x, y });
                    break;
                case WALL:
                    walls.push({ x, y });
                    break;
                case TARGET:
                    targets.push({ x, y });
                    break;
            }
        }
    }

    updateUI();
}

function drawGame() {
    graphics.clear();

    const level = levels[currentLevel];
    const offsetX = (config.width - level.width * TILE_SIZE) / 2;
    const offsetY = 120;

    // 繪製地板
    for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
            graphics.fillStyle(0x95a5a6, 1);
            graphics.fillRect(
                offsetX + x * TILE_SIZE,
                offsetY + y * TILE_SIZE,
                TILE_SIZE - 2,
                TILE_SIZE - 2
            );
        }
    }

    // 繪製目標點
    targets.forEach(target => {
        graphics.fillStyle(0x3498db, 0.5);
        graphics.fillCircle(
            offsetX + target.x * TILE_SIZE + TILE_SIZE / 2,
            offsetY + target.y * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE / 3
        );
    });

    // 繪製牆壁
    walls.forEach(wall => {
        graphics.fillStyle(0x2c3e50, 1);
        graphics.fillRect(
            offsetX + wall.x * TILE_SIZE,
            offsetY + wall.y * TILE_SIZE,
            TILE_SIZE - 2,
            TILE_SIZE - 2
        );
    });

    // 繪製箱子
    boxes.forEach(box => {
        const isOnTarget = targets.some(t => t.x === box.x && t.y === box.y);
        graphics.fillStyle(isOnTarget ? 0x27ae60 : 0xe67e22, 1);
        graphics.fillRect(
            offsetX + box.x * TILE_SIZE + 5,
            offsetY + box.y * TILE_SIZE + 5,
            TILE_SIZE - 12,
            TILE_SIZE - 12
        );
    });

    // 繪製玩家
    graphics.fillStyle(0xe74c3c, 1);
    graphics.fillCircle(
        offsetX + playerX * TILE_SIZE + TILE_SIZE / 2,
        offsetY + playerY * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE / 2.5
    );
}

function movePlayer(dx, dy) {
    const newX = playerX + dx;
    const newY = playerY + dy;

    // 檢查牆壁
    if (walls.some(w => w.x === newX && w.y === newY)) return;

    // 檢查箱子
    const boxIndex = boxes.findIndex(b => b.x === newX && b.y === newY);

    if (boxIndex !== -1) {
        const boxNewX = newX + dx;
        const boxNewY = newY + dy;

        // 檢查箱子新位置是否有效
        if (walls.some(w => w.x === boxNewX && w.y === boxNewY)) return;
        if (boxes.some(b => b.x === boxNewX && b.y === boxNewY)) return;

        // 移動箱子
        boxes[boxIndex].x = boxNewX;
        boxes[boxIndex].y = boxNewY;
    }

    // 移動玩家
    playerX = newX;
    playerY = newY;
    moveCount++;

    updateUI();
    checkWin();
}

function checkWin() {
    const allBoxesOnTargets = boxes.every(box =>
        targets.some(target => target.x === box.x && target.y === box.y)
    );

    if (allBoxesOnTargets && boxes.length > 0) {
        setTimeout(() => {
            alert(`恭喜過關!\n步數: ${moveCount}\n\n按確定進入下一關`);
            nextLevel();
        }, 300);
    }
}

function resetLevel() {
    loadLevel(currentLevel);
}

function nextLevel() {
    if (currentLevel < levels.length - 1) {
        loadLevel(currentLevel + 1);
    } else {
        alert('恭喜完成所有關卡!');
        loadLevel(0);
    }
}

function previousLevel() {
    if (currentLevel > 0) {
        loadLevel(currentLevel - 1);
    }
}

function updateUI() {
    levelText.setText(`${levels[currentLevel].name} (${currentLevel + 1}/${levels.length})`);
    moveText.setText(`步數: ${moveCount}`);
}
