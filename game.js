// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

// Game constants
const CELL_SIZE = 28;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
let MOVE_SPEED = 12; // フレーム数：数値が大きいほど遅くなる（12 = 約5回/秒）

// Game state
let score = 0;
let lives = 3;
let gameRunning = false;
let animationId;
let moveCounter = 0; // 移動速度制御用

// Map layout (0 = dot, 1 = wall, 2 = empty, 3 = power pellet)
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1],
    [1,3,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,3,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,2,1,1,2,1,1,0,1,1,1,1,1],
    [1,1,1,1,1,0,1,2,2,2,2,2,2,1,0,1,1,1,1,1],
    [1,1,1,1,1,0,1,2,1,1,1,1,2,1,0,1,1,1,1,1],
    [2,2,2,2,2,0,2,2,1,2,2,1,2,2,0,2,2,2,2,2],
    [1,1,1,1,1,0,1,2,1,1,1,1,2,1,0,1,1,1,1,1],
    [1,1,1,1,1,0,1,2,2,2,2,2,2,1,0,1,1,1,1,1],
    [1,1,1,1,1,0,1,2,1,1,1,1,2,1,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1],
    [1,3,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,3,1],
    [1,1,1,0,1,0,1,0,1,1,1,1,0,1,0,1,0,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Create a copy of the map to track dots
let dotsMap = map.map(row => [...row]);

// Pacman
const pacman = {
    x: 1,
    y: 1,
    dx: 0,
    dy: 0,
    nextDx: 0,
    nextDy: 0,
    mouthOpen: true,
    mouthAngle: 0
};

// Ghosts
const ghosts = [
    { x: 9, y: 9, dx: 1, dy: 0, color: '#ff0000' }, // Red
    { x: 10, y: 9, dx: -1, dy: 0, color: '#ffb8ff' }, // Pink
    { x: 9, y: 10, dx: 0, dy: -1, color: '#00ffff' }, // Cyan
    { x: 10, y: 10, dx: 0, dy: 1, color: '#ffb852' }  // Orange
];

let powerMode = false;
let powerModeTimer = 0;

// Input handling
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    switch(e.key) {
        case 'ArrowUp':
            pacman.nextDx = 0;
            pacman.nextDy = -1;
            e.preventDefault();
            break;
        case 'ArrowDown':
            pacman.nextDx = 0;
            pacman.nextDy = 1;
            e.preventDefault();
            break;
        case 'ArrowLeft':
            pacman.nextDx = -1;
            pacman.nextDy = 0;
            e.preventDefault();
            break;
        case 'ArrowRight':
            pacman.nextDx = 1;
            pacman.nextDy = 0;
            e.preventDefault();
            break;
    }
});

// Start button
startBtn.addEventListener('click', () => {
    if (!gameRunning) {
        startGame();
    }
});

function startGame() {
    gameRunning = true;
    score = 0;
    lives = 3;
    moveCounter = 0;
    dotsMap = map.map(row => [...row]);
    pacman.x = 1;
    pacman.y = 1;
    pacman.dx = 0;
    pacman.dy = 0;
    pacman.nextDx = 0;
    pacman.nextDy = 0;
    powerMode = false;
    powerModeTimer = 0;

    // Reset ghosts
    ghosts[0] = { x: 9, y: 9, dx: 1, dy: 0, color: '#ff0000' };
    ghosts[1] = { x: 10, y: 9, dx: -1, dy: 0, color: '#ffb8ff' };
    ghosts[2] = { x: 9, y: 10, dx: 0, dy: -1, color: '#00ffff' };
    ghosts[3] = { x: 10, y: 10, dx: 0, dy: 1, color: '#ffb852' };

    updateScore();
    updateLives();
    startBtn.textContent = 'ゲーム実行中...';
    startBtn.disabled = true;

    gameLoop();
}

function gameLoop() {
    if (!gameRunning) return;

    update();
    draw();

    animationId = requestAnimationFrame(gameLoop);
}

function update() {
    // 移動速度制御
    moveCounter++;

    // MOVE_SPEEDフレームごとに移動
    if (moveCounter >= MOVE_SPEED) {
        moveCounter = 0;

        // Try to change direction
        const nextX = pacman.x + pacman.nextDx;
        const nextY = pacman.y + pacman.nextDy;

        if (canMove(nextX, nextY)) {
            pacman.dx = pacman.nextDx;
            pacman.dy = pacman.nextDy;
        }

        // Move pacman
        const newX = pacman.x + pacman.dx;
        const newY = pacman.y + pacman.dy;

        if (canMove(newX, newY)) {
            pacman.x = newX;
            pacman.y = newY;

            // Wrap around
            if (pacman.x < 0) pacman.x = GRID_WIDTH - 1;
            if (pacman.x >= GRID_WIDTH) pacman.x = 0;

            // Collect dots
            if (dotsMap[pacman.y] && dotsMap[pacman.y][pacman.x] === 0) {
                dotsMap[pacman.y][pacman.x] = 2;
                score += 10;
                updateScore();
            }

            // Collect power pellets
            if (dotsMap[pacman.y] && dotsMap[pacman.y][pacman.x] === 3) {
                dotsMap[pacman.y][pacman.x] = 2;
                score += 50;
                powerMode = true;
                powerModeTimer = 180; // 3 seconds at 60fps
                updateScore();
            }
        }
    }

    // MOVE_SPEEDフレームごとにゴースト移動と衝突判定
    if (moveCounter === 0) {
        // Move ghosts
        if (Math.random() < 0.1) { // 10% chance to change direction each frame
            ghosts.forEach(ghost => {
                const directions = [
                    { dx: 1, dy: 0 },
                    { dx: -1, dy: 0 },
                    { dx: 0, dy: 1 },
                    { dx: 0, dy: -1 }
                ];

                const validDirections = directions.filter(dir =>
                    canMove(ghost.x + dir.dx, ghost.y + dir.dy)
                );

                if (validDirections.length > 0) {
                    const dir = validDirections[Math.floor(Math.random() * validDirections.length)];
                    ghost.dx = dir.dx;
                    ghost.dy = dir.dy;
                }
            });
        }

        ghosts.forEach(ghost => {
            const newX = ghost.x + ghost.dx;
            const newY = ghost.y + ghost.dy;

            if (canMoveGhost(newX, newY)) {
                ghost.x = newX;
                ghost.y = newY;
            }

            // Check collision with pacman
            if (Math.abs(ghost.x - pacman.x) < 0.5 && Math.abs(ghost.y - pacman.y) < 0.5) {
                if (powerMode) {
                    // Reset ghost position
                    ghost.x = 9;
                    ghost.y = 9;
                    score += 200;
                    updateScore();
                } else {
                    lives--;
                    updateLives();

                    if (lives <= 0) {
                        endGame();
                    } else {
                        // Reset positions
                        pacman.x = 1;
                        pacman.y = 1;
                        pacman.dx = 0;
                        pacman.dy = 0;
                    }
                }
            }
        });

        // Check win condition
        const dotsRemaining = dotsMap.some(row => row.some(cell => cell === 0 || cell === 3));
        if (!dotsRemaining) {
            alert('おめでとうございます！ステージクリア！');
            endGame();
        }
    }

    // Update power mode (毎フレーム更新)
    if (powerMode) {
        powerModeTimer--;
        if (powerModeTimer <= 0) {
            powerMode = false;
        }
    }

    // Animate mouth
    pacman.mouthAngle += 0.1;
}

function canMove(x, y) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
        return x === -1 || x === GRID_WIDTH; // Allow wrap around horizontally
    }
    return map[y][x] !== 1;
}

function canMoveGhost(x, y) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
        return false;
    }
    return map[y][x] !== 1;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze and dots
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const cell = map[y][x];
            const dotCell = dotsMap[y][x];

            if (cell === 1) {
                // Wall
                ctx.fillStyle = '#2121ff';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = '#0000aa';
                ctx.lineWidth = 2;
                ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else if (dotCell === 0) {
                // Dot
                ctx.fillStyle = '#ffb8ff';
                ctx.beginPath();
                ctx.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (dotCell === 3) {
                // Power pellet
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Draw ghosts
    ghosts.forEach(ghost => {
        if (powerMode) {
            ctx.fillStyle = '#0000ff';
        } else {
            ctx.fillStyle = ghost.color;
        }

        const ghostX = ghost.x * CELL_SIZE + CELL_SIZE / 2;
        const ghostY = ghost.y * CELL_SIZE + CELL_SIZE / 2;

        // Ghost body
        ctx.beginPath();
        ctx.arc(ghostX, ghostY, CELL_SIZE / 2 - 2, Math.PI, 0);
        ctx.lineTo(ghostX + CELL_SIZE / 2 - 2, ghostY + CELL_SIZE / 2 - 2);
        ctx.lineTo(ghostX + CELL_SIZE / 3 - 2, ghostY + CELL_SIZE / 4);
        ctx.lineTo(ghostX, ghostY + CELL_SIZE / 2 - 2);
        ctx.lineTo(ghostX - CELL_SIZE / 3 + 2, ghostY + CELL_SIZE / 4);
        ctx.lineTo(ghostX - CELL_SIZE / 2 + 2, ghostY + CELL_SIZE / 2 - 2);
        ctx.closePath();
        ctx.fill();

        // Ghost eyes
        if (!powerMode) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(ghostX - 5, ghostY - 3, 3, 0, Math.PI * 2);
            ctx.arc(ghostX + 5, ghostY - 3, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(ghostX - 4, ghostY - 3, 2, 0, Math.PI * 2);
            ctx.arc(ghostX + 6, ghostY - 3, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw pacman
    ctx.fillStyle = '#ffff00';
    const pacX = pacman.x * CELL_SIZE + CELL_SIZE / 2;
    const pacY = pacman.y * CELL_SIZE + CELL_SIZE / 2;

    // Calculate rotation based on direction
    let rotation = 0;
    if (pacman.dx === 1) rotation = 0;
    else if (pacman.dx === -1) rotation = Math.PI;
    else if (pacman.dy === 1) rotation = Math.PI / 2;
    else if (pacman.dy === -1) rotation = -Math.PI / 2;

    ctx.save();
    ctx.translate(pacX, pacY);
    ctx.rotate(rotation);

    // Mouth animation
    const mouthAngle = Math.abs(Math.sin(pacman.mouthAngle)) * 0.4;

    ctx.beginPath();
    ctx.arc(0, 0, CELL_SIZE / 2 - 2, mouthAngle, Math.PI * 2 - mouthAngle);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function updateScore() {
    scoreElement.textContent = score;
}

function updateLives() {
    livesElement.textContent = lives;
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    startBtn.textContent = 'ゲーム開始';
    startBtn.disabled = false;

    alert(`ゲームオーバー！ 最終スコア: ${score}`);
}

// Mobile controls - Virtual D-Pad
const dpadButtons = document.querySelectorAll('.dpad-btn[data-direction]');
dpadButtons.forEach(button => {
    button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!gameRunning) return;

        const direction = button.getAttribute('data-direction');
        handleDirectionInput(direction);
    });

    // Also support click for testing
    button.addEventListener('click', (e) => {
        e.preventDefault();
        if (!gameRunning) return;

        const direction = button.getAttribute('data-direction');
        handleDirectionInput(direction);
    });
});

function handleDirectionInput(direction) {
    switch(direction) {
        case 'up':
            pacman.nextDx = 0;
            pacman.nextDy = -1;
            break;
        case 'down':
            pacman.nextDx = 0;
            pacman.nextDy = 1;
            break;
        case 'left':
            pacman.nextDx = -1;
            pacman.nextDy = 0;
            break;
        case 'right':
            pacman.nextDx = 1;
            pacman.nextDy = 0;
            break;
    }
}

// Swipe controls for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, false);

canvas.addEventListener('touchend', (e) => {
    if (!gameRunning) return;

    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, false);

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30; // Minimum distance for swipe detection

    // Check if swipe is long enough
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        return;
    }

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
            handleDirectionInput('right');
        } else {
            handleDirectionInput('left');
        }
    } else {
        // Vertical swipe
        if (deltaY > 0) {
            handleDirectionInput('down');
        } else {
            handleDirectionInput('up');
        }
    }
}

// Responsive canvas sizing
function resizeCanvas() {
    const container = document.querySelector('.container');
    const maxWidth = Math.min(560, window.innerWidth - 60);

    if (window.innerWidth <= 768) {
        canvas.style.width = maxWidth + 'px';
        canvas.style.height = maxWidth + 'px';
    } else {
        canvas.style.width = '560px';
        canvas.style.height = '560px';
    }
}

// Call on load and resize
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Speed control
function updateSpeedDisplay(value) {
    const speed = parseInt(value);
    let speedText = '';

    if (speed <= 8) {
        speedText = '超高速';
    } else if (speed <= 10) {
        speedText = '高速';
    } else if (speed <= 12) {
        speedText = '中速';
    } else if (speed <= 16) {
        speedText = '低速';
    } else {
        speedText = '超低速';
    }

    const fps = (60 / speed).toFixed(1);
    speedValue.textContent = `${speedText} (${speed}) - 約${fps}回/秒`;
}

speedSlider.addEventListener('input', (e) => {
    MOVE_SPEED = parseInt(e.target.value);
    updateSpeedDisplay(e.target.value);
});

// Initialize speed display
updateSpeedDisplay(speedSlider.value);

// Initial draw
draw();
