--[[
    打磚塊遊戲 (Breakout Game)
    使用 Love2D 開發的經典打磚塊遊戲

    操作說明:
    - 左右方向鍵或 A/D 控制擋板
    - 空白鍵發射球或重新開始
    - ESC 退出遊戲
    - P 暫停遊戲
]]

-- 遊戲狀態
local gameState = "start"  -- start, playing, gameover, win
local paused = false

-- 視窗設置
local windowWidth = 800
local windowHeight = 600

-- 顏色定義
local colors = {
    background = {0.1, 0.1, 0.15},
    paddle = {0.2, 0.6, 1.0},
    ball = {1.0, 0.3, 0.3},
    brick = {
        {0.9, 0.2, 0.2},  -- 紅色 - 3 分
        {0.9, 0.6, 0.2},  -- 橙色 - 2 分
        {0.9, 0.9, 0.2},  -- 黃色 - 1 分
        {0.2, 0.9, 0.2},  -- 綠色 - 1 分
    },
    text = {1.0, 1.0, 1.0},
    textGray = {0.6, 0.6, 0.6}
}

-- 擋板
local paddle = {
    x = 0,
    y = 0,
    width = 100,
    height = 15,
    speed = 500
}

-- 球
local ball = {
    x = 0,
    y = 0,
    radius = 8,
    dx = 0,
    dy = 0,
    speed = 300,
    stuck = true
}

-- 磚塊
local bricks = {}
local brickRows = 5
local brickCols = 10
local brickWidth = 70
local brickHeight = 20
local brickPadding = 5
local brickOffsetTop = 50

-- 遊戲數據
local score = 0
local lives = 3
local level = 1

-- 字體
local fonts = {}

-- Love2D 初始化函數
function love.load()
    -- 設置窗口
    love.window.setMode(windowWidth, windowHeight, {
        resizable = false,
        vsync = true
    })
    love.window.setTitle("打磚塊 - Breakout Game")

    -- 加載字體
    fonts.large = love.graphics.newFont(48)
    fonts.medium = love.graphics.newFont(24)
    fonts.small = love.graphics.newFont(16)

    -- 初始化遊戲
    resetGame()
end

-- 重置遊戲
function resetGame()
    -- 重置擋板位置
    paddle.x = (windowWidth - paddle.width) / 2
    paddle.y = windowHeight - 50

    -- 重置球
    resetBall()

    -- 重置磚塊
    createBricks()

    -- 重置遊戲數據
    score = 0
    lives = 3
    level = 1
    gameState = "start"
end

-- 重置球
function resetBall()
    ball.x = paddle.x + paddle.width / 2
    ball.y = paddle.y - ball.radius
    ball.dx = 0
    ball.dy = 0
    ball.stuck = true
end

-- 創建磚塊
function createBricks()
    bricks = {}

    local totalBrickWidth = brickCols * (brickWidth + brickPadding) - brickPadding
    local offsetLeft = (windowWidth - totalBrickWidth) / 2

    for row = 1, brickRows do
        for col = 1, brickCols do
            local brick = {
                x = offsetLeft + (col - 1) * (brickWidth + brickPadding),
                y = brickOffsetTop + (row - 1) * (brickHeight + brickPadding),
                width = brickWidth,
                height = brickHeight,
                alive = true,
                points = brickRows - row + 1,  -- 上面的磚塊分數更高
                colorIndex = math.min(row, #colors.brick)
            }
            table.insert(bricks, brick)
        end
    end
end

-- 發射球
function launchBall()
    if ball.stuck then
        local angle = math.random(-45, 45)
        angle = math.rad(angle)
        ball.dx = ball.speed * math.sin(angle)
        ball.dy = -ball.speed * math.cos(angle)
        ball.stuck = false
    end
end

-- 更新函數
function love.update(dt)
    if gameState ~= "playing" or paused then
        return
    end

    -- 更新擋板位置
    if love.keyboard.isDown("left") or love.keyboard.isDown("a") then
        paddle.x = math.max(0, paddle.x - paddle.speed * dt)
    end
    if love.keyboard.isDown("right") or love.keyboard.isDown("d") then
        paddle.x = math.min(windowWidth - paddle.width, paddle.x + paddle.speed * dt)
    end

    -- 如果球黏在擋板上,球跟著擋板移動
    if ball.stuck then
        ball.x = paddle.x + paddle.width / 2
        ball.y = paddle.y - ball.radius
        return
    end

    -- 更新球的位置
    ball.x = ball.x + ball.dx * dt
    ball.y = ball.y + ball.dy * dt

    -- 球與左右牆壁碰撞
    if ball.x - ball.radius <= 0 then
        ball.x = ball.radius
        ball.dx = -ball.dx
    elseif ball.x + ball.radius >= windowWidth then
        ball.x = windowWidth - ball.radius
        ball.dx = -ball.dx
    end

    -- 球與頂部牆壁碰撞
    if ball.y - ball.radius <= 0 then
        ball.y = ball.radius
        ball.dy = -ball.dy
    end

    -- 球與擋板碰撞
    if checkPaddleCollision() then
        ball.y = paddle.y - ball.radius
        ball.dy = -math.abs(ball.dy)

        -- 根據擊中位置調整反彈角度
        local hitPos = (ball.x - paddle.x) / paddle.width
        local angle = (hitPos - 0.5) * 90  -- -45 到 45 度
        angle = math.rad(angle)

        local speed = math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)
        ball.dx = speed * math.sin(angle)
        ball.dy = -speed * math.cos(angle)
    end

    -- 球與磚塊碰撞
    checkBrickCollision()

    -- 球掉出底部
    if ball.y - ball.radius > windowHeight then
        lives = lives - 1
        if lives <= 0 then
            gameState = "gameover"
        else
            resetBall()
        end
    end

    -- 檢查是否清除所有磚塊
    if checkAllBricksGone() then
        level = level + 1
        ball.speed = ball.speed + 50  -- 增加難度
        resetBall()
        createBricks()
    end
end

-- 檢查擋板碰撞
function checkPaddleCollision()
    return ball.x > paddle.x and
           ball.x < paddle.x + paddle.width and
           ball.y + ball.radius > paddle.y and
           ball.y < paddle.y + paddle.height and
           ball.dy > 0
end

-- 檢查磚塊碰撞
function checkBrickCollision()
    for _, brick in ipairs(bricks) do
        if brick.alive then
            -- AABB 碰撞檢測
            if ball.x + ball.radius > brick.x and
               ball.x - ball.radius < brick.x + brick.width and
               ball.y + ball.radius > brick.y and
               ball.y - ball.radius < brick.y + brick.height then

                -- 磚塊被擊中
                brick.alive = false
                score = score + brick.points * 10

                -- 計算碰撞方向
                local overlapLeft = ball.x + ball.radius - brick.x
                local overlapRight = brick.x + brick.width - (ball.x - ball.radius)
                local overlapTop = ball.y + ball.radius - brick.y
                local overlapBottom = brick.y + brick.height - (ball.y - ball.radius)

                local minOverlap = math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

                -- 根據最小重疊調整球的方向
                if minOverlap == overlapLeft or minOverlap == overlapRight then
                    ball.dx = -ball.dx
                else
                    ball.dy = -ball.dy
                end

                return
            end
        end
    end
end

-- 檢查是否所有磚塊都被清除
function checkAllBricksGone()
    for _, brick in ipairs(bricks) do
        if brick.alive then
            return false
        end
    end
    return true
end

-- 繪製函數
function love.draw()
    -- 背景
    love.graphics.setColor(colors.background)
    love.graphics.rectangle("fill", 0, 0, windowWidth, windowHeight)

    -- 繪製磚塊
    for _, brick in ipairs(bricks) do
        if brick.alive then
            love.graphics.setColor(colors.brick[brick.colorIndex])
            love.graphics.rectangle("fill", brick.x, brick.y, brick.width, brick.height, 3)
        end
    end

    -- 繪製擋板
    love.graphics.setColor(colors.paddle)
    love.graphics.rectangle("fill", paddle.x, paddle.y, paddle.width, paddle.height, 5)

    -- 繪製球
    love.graphics.setColor(colors.ball)
    love.graphics.circle("fill", ball.x, ball.y, ball.radius)

    -- 繪製UI
    drawUI()

    -- 繪製遊戲狀態
    if gameState == "start" then
        drawStartScreen()
    elseif gameState == "gameover" then
        drawGameOverScreen()
    elseif paused then
        drawPausedScreen()
    end
end

-- 繪製UI
function drawUI()
    love.graphics.setColor(colors.text)
    love.graphics.setFont(fonts.small)

    -- 分數
    love.graphics.print("分數: " .. score, 10, 10)

    -- 生命值
    love.graphics.print("生命: " .. lives, 10, 30)

    -- 關卡
    love.graphics.print("關卡: " .. level, windowWidth - 80, 10)

    -- 操作提示
    love.graphics.setColor(colors.textGray)
    love.graphics.setFont(fonts.small)
    love.graphics.print("P-暫停 ESC-退出", windowWidth - 150, windowHeight - 25)
end

-- 繪製開始畫面
function drawStartScreen()
    -- 半透明背景
    love.graphics.setColor(0, 0, 0, 0.7)
    love.graphics.rectangle("fill", 0, 0, windowWidth, windowHeight)

    -- 標題
    love.graphics.setColor(colors.text)
    love.graphics.setFont(fonts.large)
    local title = "打磚塊"
    local titleWidth = fonts.large:getWidth(title)
    love.graphics.print(title, (windowWidth - titleWidth) / 2, windowHeight / 2 - 100)

    -- 說明
    love.graphics.setFont(fonts.medium)
    local instructions = {
        "操作說明:",
        "左右方向鍵或 A/D - 移動擋板",
        "空白鍵 - 發射球",
        "",
        "按空白鍵開始遊戲"
    }

    for i, text in ipairs(instructions) do
        local textWidth = fonts.medium:getWidth(text)
        love.graphics.print(text, (windowWidth - textWidth) / 2, windowHeight / 2 + i * 30)
    end
end

-- 繪製遊戲結束畫面
function drawGameOverScreen()
    -- 半透明背景
    love.graphics.setColor(0, 0, 0, 0.8)
    love.graphics.rectangle("fill", 0, 0, windowWidth, windowHeight)

    -- Game Over
    love.graphics.setColor(colors.ball)
    love.graphics.setFont(fonts.large)
    local gameOver = "遊戲結束"
    local gameOverWidth = fonts.large:getWidth(gameOver)
    love.graphics.print(gameOver, (windowWidth - gameOverWidth) / 2, windowHeight / 2 - 80)

    -- 最終分數
    love.graphics.setColor(colors.text)
    love.graphics.setFont(fonts.medium)
    local finalScore = "最終分數: " .. score
    local scoreWidth = fonts.medium:getWidth(finalScore)
    love.graphics.print(finalScore, (windowWidth - scoreWidth) / 2, windowHeight / 2)

    local reachedLevel = "到達關卡: " .. level
    local levelWidth = fonts.medium:getWidth(reachedLevel)
    love.graphics.print(reachedLevel, (windowWidth - levelWidth) / 2, windowHeight / 2 + 40)

    -- 重新開始提示
    local restart = "按空白鍵重新開始"
    local restartWidth = fonts.medium:getWidth(restart)
    love.graphics.print(restart, (windowWidth - restartWidth) / 2, windowHeight / 2 + 100)
end

-- 繪製暫停畫面
function drawPausedScreen()
    -- 半透明背景
    love.graphics.setColor(0, 0, 0, 0.5)
    love.graphics.rectangle("fill", 0, 0, windowWidth, windowHeight)

    -- 暫停文字
    love.graphics.setColor(colors.text)
    love.graphics.setFont(fonts.large)
    local pausedText = "暫停"
    local pausedWidth = fonts.large:getWidth(pausedText)
    love.graphics.print(pausedText, (windowWidth - pausedWidth) / 2, windowHeight / 2)
end

-- 鍵盤按下事件
function love.keypressed(key)
    if key == "escape" then
        love.event.quit()
    end

    if key == "p" and gameState == "playing" then
        paused = not paused
    end

    if key == "space" then
        if gameState == "start" then
            gameState = "playing"
            launchBall()
        elseif gameState == "playing" and ball.stuck then
            launchBall()
        elseif gameState == "gameover" then
            resetGame()
        end
    end
end
