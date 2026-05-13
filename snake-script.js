class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = this.getHighScore();
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameStartTime = 0;
        this.foodCount = 0;
        this.currentTheme = 'neon';
        this.gameSpeed = 150;
        this.nextDirection = null;
        
        this.initElements();
        this.bindEvents();
        this.updateDisplay();
        this.drawGame();
        this.createParticleSystem();
        this.setTheme(this.currentTheme);
    }

    initElements() {
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.currentScoreEl = document.getElementById('current-score');
        this.highScoreEl = document.getElementById('high-score');
        this.snakeLengthEl = document.getElementById('snake-length');
        this.gameTimeEl = document.getElementById('game-time');
        this.foodCountEl = document.getElementById('food-count');
        this.speedSlider = document.getElementById('speed-slider');
        this.gameOverlay = document.getElementById('game-overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayMessage = document.getElementById('overlay-message');
        this.overlayBtn = document.getElementById('overlay-btn');
        this.overlayIcon = document.querySelector('.overlay-icon i');
        this.foodEffect = document.getElementById('food-effect');
        this.themeButtons = document.querySelectorAll('.theme-btn');
        this.mobileButtons = document.querySelectorAll('.dpad-btn');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.overlayBtn.addEventListener('click', () => this.startGame());
        
        this.speedSlider.addEventListener('input', (e) => {
            const speeds = [300, 225, 150, 100, 60];
            this.gameSpeed = speeds[e.target.value - 1];
        });

        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        this.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setTheme(btn.dataset.theme);
            });
        });

        this.mobileButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeDirection(btn.dataset.direction);
            });
        });

        window.addEventListener('resize', () => this.handleResize());
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.body.setAttribute('data-theme', theme);
        
        this.themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    handleResize() {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            this.canvas.width = 300;
            this.canvas.height = 300;
        } else {
            this.canvas.width = 480;
            this.canvas.height = 480;
        }
        this.tileCount = this.canvas.width / this.gridSize;
        if (!this.gameRunning) {
            this.drawGame();
        }
    }

    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.isSnakePosition(newFood.x, newFood.y));
        return newFood;
    }

    isSnakePosition(x, y) {
        return this.snake.some(segment => segment.x === x && segment.y === y);
    }

    startGame() {
        if (!this.gameRunning && !this.gamePaused) {
            this.gameRunning = true;
            this.gameStartTime = Date.now();
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.hideOverlay();
            this.gameLoop();
        }
    }

    togglePause() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
            this.pauseBtn.innerHTML = this.gamePaused ? 
                '<i class="fas fa-play"></i><span>继续</span>' : 
                '<i class="fas fa-pause"></i><span>暂停</span>';
            
            if (this.gamePaused) {
                this.showOverlay('游戏暂停', '按空格键或点击继续按钮恢复游戏', 'fa-pause-circle');
                this.overlayBtn.innerHTML = '<i class="fas fa-play"></i>继续游戏';
            } else {
                this.hideOverlay();
                this.gameLoop();
            }
        }
    }

    restartGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.snake = [{ x: 10, y: 10 }];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.foodCount = 0;
        this.nextDirection = null;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>暂停</span>';
        
        this.updateDisplay();
        this.drawGame();
        this.showOverlay('准备开始游戏', '按空格键或点击开始按钮开始游戏', 'fa-play-circle');
        this.overlayBtn.innerHTML = '<i class="fas fa-play"></i>开始游戏';
    }

    handleKeyPress(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!this.gameRunning) {
                this.startGame();
            } else {
                this.togglePause();
            }
            return;
        }

        if (!this.gameRunning || this.gamePaused) return;

        const keyDirections = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'KeyW': 'up',
            'KeyS': 'down',
            'KeyA': 'left',
            'KeyD': 'right'
        };

        if (keyDirections[e.code]) {
            e.preventDefault();
            this.changeDirection(keyDirections[e.code]);
        }
    }

    changeDirection(direction) {
        if (!this.gameRunning || this.gamePaused) return;

        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        const currentDir = this.getCurrentDirection();
        if (direction !== opposites[currentDir]) {
            this.nextDirection = direction;
        }
    }

    getCurrentDirection() {
        if (this.dx === 1) return 'right';
        if (this.dx === -1) return 'left';
        if (this.dy === 1) return 'down';
        if (this.dy === -1) return 'up';
        return null;
    }

    applyNextDirection() {
        if (this.nextDirection) {
            const directions = {
                'up': { dx: 0, dy: -1 },
                'down': { dx: 0, dy: 1 },
                'left': { dx: -1, dy: 0 },
                'right': { dx: 1, dy: 0 }
            };
            
            const dir = directions[this.nextDirection];
            this.dx = dir.dx;
            this.dy = dir.dy;
            this.nextDirection = null;
        }
    }

    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        this.applyNextDirection();
        this.moveSnake();
        
        if (this.checkCollision()) {
            this.gameOver();
            return;
        }
        
        if (this.checkFoodCollision()) {
            this.eatFood();
        }
        
        this.drawGame();
        this.updateDisplay();
        
        setTimeout(() => this.gameLoop(), this.gameSpeed);
    }

    moveSnake() {
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        this.snake.unshift(head);
        
        if (!this.checkFoodCollision()) {
            this.snake.pop();
        }
    }

    checkCollision() {
        const head = this.snake[0];
        
        if (head.x < 0 || head.x >= this.tileCount || 
            head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    checkFoodCollision() {
        const head = this.snake[0];
        return head.x === this.food.x && head.y === this.food.y;
    }

    eatFood() {
        this.score += 10;
        this.foodCount++;
        this.food = this.generateFood();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        
        this.showFoodEffect();
        this.createEatParticles();
        this.addScreenShake();
    }

    showFoodEffect() {
        const head = this.snake[0];
        const rect = this.canvas.getBoundingClientRect();
        
        this.foodEffect.style.left = (rect.left + head.x * this.gridSize + this.gridSize / 2) + 'px';
        this.foodEffect.style.top = (rect.top + head.y * this.gridSize) + 'px';
        this.foodEffect.classList.add('show');
        
        setTimeout(() => {
            this.foodEffect.classList.remove('show');
        }, 1000);
    }

    addScreenShake() {
        this.canvas.classList.add('shake');
        setTimeout(() => {
            this.canvas.classList.remove('shake');
        }, 500);
    }

    gameOver() {
        this.gameRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        const isHighScore = this.score === this.highScore && this.score > 0;
        const title = isHighScore ? '新纪录！' : '游戏结束';
        const message = `得分: ${this.score} | 长度: ${this.snake.length} | 食物: ${this.foodCount}`;
        
        this.showOverlay(title, message, isHighScore ? 'fa-crown' : 'fa-skull');
        this.overlayBtn.innerHTML = '<i class="fas fa-redo"></i>重新开始';
        this.overlayBtn.onclick = () => this.restartGame();
    }

    showOverlay(title, message, iconClass = 'fa-play-circle') {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.overlayIcon.className = `fas ${iconClass}`;
        this.gameOverlay.classList.remove('hidden');
    }

    hideOverlay() {
        this.gameOverlay.classList.add('hidden');
    }

    drawGame() {
        this.clearCanvas();
        this.drawGrid();
        this.drawFood();
        this.drawSnake();
    }

    clearCanvas() {
        this.ctx.fillStyle = this.currentTheme === 'neon' ? 
            'rgba(0, 0, 0, 0.3)' : 
            this.currentTheme === 'classic' ? '#f0f0f0' : '#ffecd2';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        const colors = {
            neon: 'rgba(0, 245, 255, 0.1)',
            classic: 'rgba(76, 175, 80, 0.1)',
            minimal: 'rgba(108, 92, 231, 0.1)'
        };
        
        this.ctx.strokeStyle = colors[this.currentTheme];
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }

    drawFood() {
        const colors = {
            neon: ['#ff0080', '#00f5ff'],
            classic: ['#FFC107', '#FF9800'],
            minimal: ['#6c5ce7', '#a29bfe']
        };
        
        const gradient = this.ctx.createRadialGradient(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            0,
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2
        );
        
        gradient.addColorStop(0, colors[this.currentTheme][0]);
        gradient.addColorStop(1, colors[this.currentTheme][1]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            this.food.x * this.gridSize + 2,
            this.food.y * this.gridSize + 2,
            this.gridSize - 4,
            this.gridSize - 4
        );
        
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = colors[this.currentTheme][0];
        this.ctx.fillRect(
            this.food.x * this.gridSize + 2,
            this.food.y * this.gridSize + 2,
            this.gridSize - 4,
            this.gridSize - 4
        );
        this.ctx.shadowBlur = 0;
    }

    drawSnake() {
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            const colors = {
                neon: isHead ? '#00f5ff' : '#00d4aa',
                classic: isHead ? '#4CAF50' : '#81C784',
                minimal: isHead ? '#6c5ce7' : '#a29bfe'
            };
            
            this.ctx.fillStyle = colors[this.currentTheme];
            
            if (isHead) {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = colors[this.currentTheme];
            }
            
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
            
            if (isHead) {
                this.ctx.shadowBlur = 0;
                
                this.ctx.fillStyle = '#ffffff';
                const eyeSize = 3;
                const eyeOffset = 6;
                
                if (this.dx === 1) { 
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset, segment.y * this.gridSize + 5, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + eyeOffset, segment.y * this.gridSize + 12, eyeSize, eyeSize);
                } else if (this.dx === -1) { 
                    this.ctx.fillRect(segment.x * this.gridSize + this.gridSize - eyeOffset - eyeSize, segment.y * this.gridSize + 5, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + this.gridSize - eyeOffset - eyeSize, segment.y * this.gridSize + 12, eyeSize, eyeSize);
                } else if (this.dy === -1) { 
                    this.ctx.fillRect(segment.x * this.gridSize + 5, segment.y * this.gridSize + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + 12, segment.y * this.gridSize + this.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                } else if (this.dy === 1) { 
                    this.ctx.fillRect(segment.x * this.gridSize + 5, segment.y * this.gridSize + eyeOffset, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.gridSize + 12, segment.y * this.gridSize + eyeOffset, eyeSize, eyeSize);
                }
            }
        });
    }

    updateDisplay() {
        this.currentScoreEl.textContent = this.score;
        this.highScoreEl.textContent = this.highScore;
        this.snakeLengthEl.textContent = this.snake.length;
        this.foodCountEl.textContent = this.foodCount;
        
        if (this.gameRunning && !this.gamePaused) {
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.gameTimeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    createParticleSystem() {
        this.particles = [];
    }

    createEatParticles() {
        const head = this.snake[0];
        const rect = this.canvas.getBoundingClientRect();
        const centerX = rect.left + head.x * this.gridSize + this.gridSize / 2;
        const centerY = rect.top + head.y * this.gridSize + this.gridSize / 2;
        
        for (let i = 0; i < 6; i++) {
            this.createParticle(centerX, centerY);
        }
    }

    createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 6px;
            height: 6px;
            background: var(--primary-color);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        document.body.appendChild(particle);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 2 + Math.random() * 3;
        const deltaX = Math.cos(angle) * velocity;
        const deltaY = Math.sin(angle) * velocity;
        
        particle.style.animation = 'particle 0.8s ease-out forwards';
        particle.style.transform = `translate(${deltaX * 20}px, ${deltaY * 20}px)`;
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 800);
    }

    getHighScore() {
        return parseInt(localStorage.getItem('snakeHighScore')) || 0;
    }

    saveHighScore() {
        localStorage.setItem('snakeHighScore', this.highScore.toString());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
});