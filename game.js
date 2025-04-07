// 获取画布和上下文
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const scoreDisplay = document.getElementById('score');
const easyBtn = document.getElementById('easy-btn');
const mediumBtn = document.getElementById('medium-btn');
const hardBtn = document.getElementById('hard-btn');

// 游戏状态
let gameStarted = false;
let gameOver = false;
let score = 0;
let frames = 0;
let isPaused = false;  // 添加暂停状态
let difficulty = 'medium'; // 默认难度

// 难度预设
const difficultySettings = {
    easy: {
        gravity: 0.12,
        jump: 3.2,
        pipeSpeed: 1.0,
        pipeGap: 170,
        pipeFrequency: 180
    },
    medium: {
        gravity: 0.15,
        jump: 3.5,
        pipeSpeed: 1.2,
        pipeGap: 150,
        pipeFrequency: 150
    },
    hard: {
        gravity: 0.18,
        jump: 4.0,
        pipeSpeed: 1.5,
        pipeGap: 130,
        pipeFrequency: 120
    }
};

// 应用难度设置
function applyDifficulty() {
    const settings = difficultySettings[difficulty];
    bird.gravity = settings.gravity;
    bird.jump = settings.jump;
    pipes.dx = settings.pipeSpeed;
    pipes.gap = settings.pipeGap;
    pipes.frequency = settings.pipeFrequency;
}

// 游戏背景
const background = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    color: '#70c5ce',
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
};

// 地面
const ground = {
    x: 0,
    y: canvas.height - 80,
    width: canvas.width,
    height: 80,
    color: '#ded895',
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 地面上的草
        ctx.fillStyle = '#33a61e';
        ctx.fillRect(this.x, this.y, this.width, 15);
    }
};

// 小鸟
const bird = {
    x: 50,
    y: 150,
    width: 34,
    height: 24,
    gravity: 0.15,
    velocity: 0,
    jump: 3.5,
    color: '#ffdb15', // 黄色主体
    eyeColor: '#ffffff', // 白色眼睛
    pupilColor: '#000000', // 黑色瞳孔
    beakColor: '#ff7b00', // 橙色喙
    wingColor: '#ff9900', // 橙色翅膀
    rotation: 0,
    maxVelocity: 5, // 限制最大下落速度，使游戏手感更好

    update() {
        // 如果游戏已开始，应用重力
        if (gameStarted) {
            this.velocity += this.gravity;

            // 限制最大下落速度
            if (this.velocity > this.maxVelocity) {
                this.velocity = this.maxVelocity;
            }

            this.y += this.velocity;

            // 计算旋转角度（下落时头朝下）
            if (this.velocity >= this.jump / 2) {
                this.rotation = Math.min(Math.PI / 4, this.rotation + 0.08);
            } else {
                this.rotation = Math.max(-Math.PI / 4, this.rotation - 0.1);
            }
        }

        // 碰到地面
        if (this.y + this.height >= ground.y) {
            this.y = ground.y - this.height;
            if (gameStarted) {
                gameOver = true;
            }
        }

        // 碰到天花板
        if (this.y <= 0) {
            this.y = 0;
            this.velocity = 0.5;
        }
    },

    flap() {
        this.velocity = -this.jump;
        this.rotation = -Math.PI / 4;
    },

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // 绘制小鸟身体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制翅膀（随时间煽动）
        ctx.fillStyle = this.wingColor;
        ctx.beginPath();
        const wingOffset = Math.sin(frames * 0.3) * 5;
        ctx.ellipse(-5, wingOffset, this.width / 4, this.height / 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // 绘制眼睛
        ctx.fillStyle = this.eyeColor;
        ctx.beginPath();
        ctx.arc(this.width / 4, -this.height / 6, this.width / 10, 0, Math.PI * 2);
        ctx.fill();

        // 绘制瞳孔
        ctx.fillStyle = this.pupilColor;
        ctx.beginPath();
        ctx.arc(this.width / 4 + 1, -this.height / 6, this.width / 20, 0, Math.PI * 2);
        ctx.fill();

        // 绘制喙
        ctx.fillStyle = this.beakColor;
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width / 2 + this.width / 4, -this.height / 8);
        ctx.lineTo(this.width / 2 + this.width / 4, this.height / 8);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
};

// 游戏特效
const effects = {
    scoreFlashes: [],

    // 添加一个得分闪光效果
    addScoreFlash(x, y) {
        this.scoreFlashes.push({
            x: x,
            y: y,
            opacity: 1.0,
            radius: 20,
            color: '#ffffff'
        });
    },

    // 更新和绘制所有特效
    update() {
        // 更新得分闪光效果
        for (let i = this.scoreFlashes.length - 1; i >= 0; i--) {
            let flash = this.scoreFlashes[i];
            flash.opacity -= 0.05;
            flash.radius += 1;

            if (flash.opacity <= 0) {
                this.scoreFlashes.splice(i, 1);
            }
        }
    },

    draw() {
        // 绘制得分闪光效果
        for (let i = 0; i < this.scoreFlashes.length; i++) {
            let flash = this.scoreFlashes[i];

            ctx.beginPath();
            ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${flash.opacity})`;
            ctx.fill();

            ctx.font = '20px Arial';
            ctx.fillStyle = `rgba(255, 215, 0, ${flash.opacity})`;
            ctx.textAlign = 'center';
            ctx.fillText('+1', flash.x, flash.y);
        }
    }
};

// 管道
const pipes = {
    position: [],
    top: {
        color: '#73bf2e'
    },
    bottom: {
        color: '#73bf2e'
    },
    width: 52,
    height: 400,
    gap: 150,
    maxYPosition: -150,
    dx: 1.2,
    frequency: 150, // 新增参数用于控制管道生成频率
    showHitboxes: false, // 是否显示碰撞盒（调试用）

    update() {
        if (gameStarted && !gameOver) {
            if (frames % this.frequency === 0) {
                this.position.push({
                    x: canvas.width,
                    y: this.maxYPosition * (Math.random() + 1),
                    passed: false // 添加标记，表示小鸟是否已通过此管道
                });
            }

            for (let i = 0; i < this.position.length; i++) {
                let p = this.position[i];
                p.x -= this.dx;

                // 标记小鸟已通过此管道的中心点
                if (!p.passed && p.x + this.width / 2 < bird.x) {
                    p.passed = true;
                    score++;
                    scoreDisplay.textContent = score;

                    // 添加过管得分特效
                    effects.addScoreFlash(bird.x + bird.width, bird.y);
                }

                // 仅对未完全通过的管道进行碰撞检测
                if (!p.passed || p.x + this.width > bird.x - bird.width / 2) {
                    // 定义小鸟的碰撞盒（稍微缩小一些，更符合视觉效果）
                    const birdHitbox = {
                        x: bird.x + bird.width * 0.25,
                        y: bird.y + bird.height * 0.25,
                        width: bird.width * 0.5,
                        height: bird.height * 0.5
                    };

                    // 定义上管道的碰撞盒
                    const topPipeHitbox = {
                        x: p.x,
                        y: p.y,
                        width: this.width,
                        height: this.height
                    };

                    // 定义下管道的碰撞盒
                    const bottomPipeHitbox = {
                        x: p.x,
                        y: p.y + this.height + this.gap,
                        width: this.width,
                        height: this.height
                    };

                    // 碰撞检测函数：检查两个矩形是否相交
                    function checkCollision(rect1, rect2) {
                        return rect1.x < rect2.x + rect2.width &&
                            rect1.x + rect1.width > rect2.x &&
                            rect1.y < rect2.y + rect2.height &&
                            rect1.y + rect1.height > rect2.y;
                    }

                    // 检查小鸟是否与上管道或下管道相撞
                    if (checkCollision(birdHitbox, topPipeHitbox) ||
                        checkCollision(birdHitbox, bottomPipeHitbox)) {
                        gameOver = true;
                    }
                }

                // 移除屏幕外的管道
                if (p.x + this.width <= 0) {
                    this.position.shift();
                }
            }
        }
    },

    draw() {
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            // 上管道
            ctx.fillStyle = this.top.color;
            ctx.fillRect(p.x, p.y, this.width, this.height);

            // 管道顶部
            ctx.fillStyle = '#42692b';
            ctx.fillRect(p.x - 2, p.y + this.height - 20, this.width + 4, 20);

            // 下管道
            ctx.fillStyle = this.bottom.color;
            ctx.fillRect(p.x, p.y + this.height + this.gap, this.width, this.height);

            // 管道顶部
            ctx.fillStyle = '#42692b';
            ctx.fillRect(p.x - 2, p.y + this.height + this.gap, this.width + 4, 20);
        }
    },

    // 显示碰撞盒的方法（调试用）
    drawHitboxes() {
        if (!gameStarted || gameOver) return;

        // 小鸟的碰撞盒
        const birdHitbox = {
            x: bird.x + bird.width * 0.25,
            y: bird.y + bird.height * 0.25,
            width: bird.width * 0.5,
            height: bird.height * 0.5
        };

        ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(birdHitbox.x, birdHitbox.y, birdHitbox.width, birdHitbox.height);

        // 管道的碰撞盒
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];

            // 设置颜色：已通过的管道用绿色，未通过的用红色
            ctx.strokeStyle = p.passed ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';

            // 上管道
            ctx.strokeRect(p.x, p.y, this.width, this.height);

            // 下管道
            ctx.strokeRect(p.x, p.y + this.height + this.gap, this.width, this.height);
        }
    }
};

// 云朵
const clouds = {
    position: [
        { x: canvas.width * 0.1, y: canvas.height * 0.2, size: 30 },
        { x: canvas.width * 0.4, y: canvas.height * 0.1, size: 40 },
        { x: canvas.width * 0.7, y: canvas.height * 0.25, size: 35 },
    ],
    dx: 0.3,
    color: '#ffffff',

    update() {
        if (gameStarted) {
            this.position.forEach(cloud => {
                cloud.x -= this.dx;
                if (cloud.x + cloud.size * 2 < 0) {
                    cloud.x = canvas.width + cloud.size;
                    cloud.y = Math.random() * canvas.height * 0.4;
                }
            });
        }
    },

    draw() {
        ctx.fillStyle = this.color;
        this.position.forEach(cloud => {
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.7, cloud.y - cloud.size * 0.2, cloud.size * 0.8, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 1.3, cloud.y, cloud.size * 0.9, 0, Math.PI * 2);
            ctx.fill();
        });
    }
};

// 绘制游戏结束画面
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 50);

    ctx.font = '20px Arial';
    ctx.fillText(`得分: ${score}`, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 30, 120, 40);

    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.fillText('重新开始', canvas.width / 2, canvas.height / 2 + 55);
}

// 监听点击和按键事件
canvas.addEventListener('click', function (e) {
    if (!gameStarted) {
        startGame();
    } else if (!gameOver) {
        bird.flap();
    } else {
        // 检查点击重新开始按钮
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        if (
            clickX > canvas.width / 2 - 60 &&
            clickX < canvas.width / 2 + 60 &&
            clickY > canvas.height / 2 + 30 &&
            clickY < canvas.height / 2 + 70
        ) {
            resetGame();
        }
    }
});

window.addEventListener('keydown', function (e) {
    if (e.code === 'Space') {
        if (!gameStarted) {
            startGame();
        } else if (!gameOver) {
            bird.flap();
        }
    } else if (e.code === 'Escape' || e.code === 'KeyP') {
        // 按ESC或P键暂停/继续游戏
        if (gameStarted && !gameOver) {
            togglePause();
        }
    } else if (e.code === 'KeyD') {
        // 按D键切换显示碰撞盒
        pipes.showHitboxes = !pipes.showHitboxes;
    }
});

// 添加难度选择事件监听
easyBtn.addEventListener('click', () => {
    difficulty = 'easy';
    highlightDifficultyButton();
});

mediumBtn.addEventListener('click', () => {
    difficulty = 'medium';
    highlightDifficultyButton();
});

hardBtn.addEventListener('click', () => {
    difficulty = 'hard';
    highlightDifficultyButton();
});

// 高亮显示选中的难度按钮
function highlightDifficultyButton() {
    easyBtn.style.border = difficulty === 'easy' ? '2px solid white' : 'none';
    mediumBtn.style.border = difficulty === 'medium' ? '2px solid white' : 'none';
    hardBtn.style.border = difficulty === 'hard' ? '2px solid white' : 'none';
}

// 初始化高亮显示
highlightDifficultyButton();

startButton.addEventListener('click', startGame);

// 开始游戏
function startGame() {
    gameStarted = true;
    startScreen.style.display = 'none';
    applyDifficulty(); // 应用选择的难度设置
}

// 重置游戏
function resetGame() {
    gameOver = false;
    score = 0;
    frames = 0;
    bird.y = 150;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes.position = [];
    scoreDisplay.textContent = score;
    isPaused = false;
}

// 暂停/继续游戏
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        drawPauseScreen();
    }
}

// 绘制暂停画面
function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '20px Arial';
    ctx.fillText('按ESC或P键继续', canvas.width / 2, canvas.height / 2 + 20);
}

// 游戏循环
function update() {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    background.draw();

    // 绘制云朵
    if (!isPaused) {
        clouds.update();
    }
    clouds.draw();

    // 绘制管道
    if (!isPaused) {
        pipes.update();
    }
    pipes.draw();

    // 绘制地面
    ground.draw();

    // 更新和绘制小鸟
    if (!isPaused) {
        bird.update();
    }
    bird.draw();

    // 更新和绘制特效
    if (!isPaused) {
        effects.update();
    }
    effects.draw();

    // 显示碰撞盒（如果开启了调试）
    if (pipes.showHitboxes) {
        pipes.drawHitboxes();
    }

    // 游戏结束
    if (gameOver) {
        drawGameOver();
    }

    // 绘制暂停画面
    if (isPaused) {
        drawPauseScreen();
    }

    if (!isPaused) {
        frames++;
    }
    requestAnimationFrame(update);
}

// 启动游戏
update(); 