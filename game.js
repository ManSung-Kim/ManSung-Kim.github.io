(() => {
  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const OPPOSITES = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  };

  class SnakeGame {
    constructor(root) {
      this.root = root;
      this.canvas = root.querySelector('#snake-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.statusEl = root.querySelector('#game-status');
      this.scoreEl = root.querySelector('#score-value');
      this.bestEl = root.querySelector('#best-value');
      this.speedEl = root.querySelector('#speed-value');
      this.stateEl = root.querySelector('#state-value');
      this.overlay = root.querySelector('#game-overlay');
      this.overlayTitle = root.querySelector('#overlay-title');
      this.overlayText = root.querySelector('#overlay-text');
      this.controlButtons = root.querySelectorAll('[data-action]');
      this.padButtons = root.querySelectorAll('[data-dir]');
      this.timer = null;
      this.running = false;
      this.paused = false;
      this.gameOver = false;
      this.pendingDirection = 'right';
      this.direction = 'right';
      this.score = 0;
      this.bestScore = this.loadBestScore();
      this.baseTick = 160;
      this.tick = this.baseTick;
      this.cols = 20;
      this.rows = 20;
      this.cell = 24;
      this.deviceRatio = Math.max(1, window.devicePixelRatio || 1);
      this.resizeObserver = null;

      this.reset(true);
      this.bindEvents();
      this.attachResizeObserver();
      this.draw();
    }

    loadBestScore() {
      const raw = localStorage.getItem('snake-best-score');
      const parsed = Number(raw || 0);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    saveBestScore() {
      try {
        localStorage.setItem('snake-best-score', String(this.bestScore));
      } catch (error) {
        void error;
      }
    }

    bindEvents() {
      document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (key === 'arrowup' || key === 'w') return this.setDirection('up', true);
        if (key === 'arrowdown' || key === 's') return this.setDirection('down', true);
        if (key === 'arrowleft' || key === 'a') return this.setDirection('left', true);
        if (key === 'arrowright' || key === 'd') return this.setDirection('right', true);
        if (key === ' ' || key === 'p') return this.togglePause();
        if (key === 'enter' || key === 'r') return this.restart();
      });

      this.controlButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const action = button.dataset.action;
          if (action === 'start') this.start();
          if (action === 'pause') this.togglePause();
          if (action === 'restart') this.restart();
        });
      });

      this.padButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const dir = button.dataset.dir;
          this.setDirection(dir, true);
        });
      });

      this.canvas.addEventListener('touchstart', (event) => {
        if (event.touches.length > 1) return;
        const touch = event.touches[0];
        this.touchStart = { x: touch.clientX, y: touch.clientY };
      }, { passive: true });

      this.canvas.addEventListener('touchend', (event) => {
        if (!this.touchStart || !event.changedTouches.length) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - this.touchStart.x;
        const dy = touch.clientY - this.touchStart.y;
        if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          this.setDirection(dx > 0 ? 'right' : 'left', true);
        } else {
          this.setDirection(dy > 0 ? 'down' : 'up', true);
        }
      }, { passive: true });
    }

    attachResizeObserver() {
      const resize = () => this.resize();
      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(resize);
        this.resizeObserver.observe(this.canvas.parentElement);
      }
      window.addEventListener('resize', resize);
      resize();
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const size = Math.floor(Math.min(rect.width - 16, 560));
      const bounded = Math.max(280, size || 280);
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      this.canvas.width = bounded * ratio;
      this.canvas.height = bounded * ratio;
      this.deviceRatio = ratio;
      this.cell = bounded / this.cols;
      this.draw();
    }

    reset(boot = false) {
      this.snake = [
        { x: 8, y: 10 },
        { x: 7, y: 10 },
        { x: 6, y: 10 },
      ];
      this.direction = 'right';
      this.pendingDirection = 'right';
      this.score = 0;
      this.tick = this.baseTick;
      this.running = false;
      this.paused = false;
      this.gameOver = false;
      this.food = this.spawnFood();
      this.updateHud();
      this.setStatus(boot ? 'Ready' : 'Reset');
      this.hideOverlay();
      this.clearTimer();
    }

    restart() {
      this.reset();
      this.start();
      this.setStatus('Restarted');
    }

    start() {
      if (this.gameOver) {
        this.reset();
      }
      this.running = true;
      this.paused = false;
      this.hideOverlay();
      this.setStatus('Running');
      this.scheduleTick();
    }

    togglePause() {
      if (this.gameOver) {
        this.restart();
        return;
      }
      if (!this.running) {
        this.start();
        return;
      }
      this.paused = !this.paused;
      this.setStatus(this.paused ? 'Paused' : 'Running');
      if (this.paused) {
        this.clearTimer();
      } else {
        this.scheduleTick();
      }
    }

    scheduleTick() {
      this.clearTimer();
      if (!this.running || this.paused) return;
      this.timer = setInterval(() => this.step(), this.tick);
    }

    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    setDirection(direction, fromInput = false) {
      if (!DIRECTIONS[direction]) return;
      const active = this.pendingDirection || this.direction;
      if (OPPOSITES[direction] === active) return;
      this.pendingDirection = direction;
      if (!this.running && fromInput) {
        this.start();
      }
    }

    spawnFood() {
      let x = 0;
      let y = 0;
      let guard = 0;
      do {
        x = Math.floor(Math.random() * this.cols);
        y = Math.floor(Math.random() * this.rows);
        guard += 1;
      } while (this.snake?.some((part) => part.x === x && part.y === y) && guard < 200);
      return { x, y };
    }

    step() {
      if (!this.running || this.paused || this.gameOver) return;

      this.direction = this.pendingDirection;
      const vector = DIRECTIONS[this.direction];
      const head = this.snake[0];
      const next = { x: head.x + vector.x, y: head.y + vector.y };

      const hitWall = next.x < 0 || next.y < 0 || next.x >= this.cols || next.y >= this.rows;
      const hitSelf = this.snake.some((part) => part.x === next.x && part.y === next.y);

      if (hitWall || hitSelf) {
        this.endGame();
        return;
      }

      this.snake.unshift(next);

      if (next.x === this.food.x && next.y === this.food.y) {
        this.score += 10;
        this.bestScore = Math.max(this.bestScore, this.score);
        this.food = this.spawnFood();
        this.tick = Math.max(70, this.baseTick - Math.floor(this.score / 20) * 8);
        this.clearTimer();
        this.scheduleTick();
      } else {
        this.snake.pop();
      }

      this.updateHud();
      this.draw();
    }

    endGame() {
      this.gameOver = true;
      this.running = false;
      this.paused = false;
      this.clearTimer();
      this.bestScore = Math.max(this.bestScore, this.score);
      this.saveBestScore();
      this.updateHud();
      this.setStatus('Game Over');
      this.showOverlay('Game Over', 'Restart를 누르거나 Enter 키로 다시 시작하세요.');
    }

    setStatus(text) {
      if (this.statusEl) this.statusEl.textContent = text;
      if (this.stateEl) this.stateEl.textContent = text;
    }

    updateHud() {
      if (this.scoreEl) this.scoreEl.textContent = String(this.score);
      if (this.bestEl) this.bestEl.textContent = String(this.bestScore);
      if (this.speedEl) this.speedEl.textContent = `${(this.baseTick / this.tick).toFixed(2)}x`;
      if (this.stateEl) this.stateEl.textContent = this.gameOver ? 'Game Over' : this.paused ? 'Paused' : this.running ? 'Running' : 'Idle';
    }

    showOverlay(title, text) {
      if (!this.overlay) return;
      this.overlay.hidden = false;
      this.overlay.style.display = 'grid';
      if (this.overlayTitle) this.overlayTitle.textContent = title;
      if (this.overlayText) this.overlayText.textContent = text;
    }

    hideOverlay() {
      if (this.overlay) {
        this.overlay.hidden = true;
        this.overlay.style.display = 'none';
      }
    }

    draw() {
      if (!this.ctx || !this.canvas) return;
      const size = this.canvas.width;
      const scale = this.deviceRatio;
      const cell = size / (this.cols * scale);
      const px = cell * scale;

      this.ctx.save();
      this.ctx.scale(scale, scale);
      this.ctx.clearRect(0, 0, size / scale, size / scale);
      this.ctx.fillStyle = '#020704';
      this.ctx.fillRect(0, 0, size / scale, size / scale);

      this.ctx.strokeStyle = 'rgba(103, 255, 146, 0.05)';
      this.ctx.lineWidth = 1;
      for (let i = 0; i <= this.cols; i += 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(i * px, 0);
        this.ctx.lineTo(i * px, this.rows * px);
        this.ctx.stroke();
      }
      for (let i = 0; i <= this.rows; i += 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, i * px);
        this.ctx.lineTo(this.cols * px, i * px);
        this.ctx.stroke();
      }

      this.ctx.fillStyle = '#ff5a5a';
      this.drawCell(this.food.x, this.food.y, px, 0.18);

      this.snake.forEach((part, index) => {
        const alpha = index === 0 ? 1 : Math.max(0.45, 1 - index * 0.08);
        this.ctx.fillStyle = index === 0 ? '#b8ffcf' : `rgba(103, 255, 146, ${alpha})`;
        this.drawCell(part.x, part.y, px, 0.16);
      });

      this.ctx.restore();
    }

    drawCell(x, y, px, insetRatio) {
      const inset = Math.max(1, px * insetRatio);
      const size = px - inset * 2;
      this.ctx.fillRect(x * px + inset, y * px + inset, size, size);
    }
  }

  window.SnakeGame = SnakeGame;
})();
