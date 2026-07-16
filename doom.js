(() => {
  const MAP = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
    [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  const ENEMY_SPAWNS = [
    { x: 10.5, y: 2.5 },
    { x: 12.5, y: 4.5 },
    { x: 8.5, y: 7.5 },
    { x: 3.5, y: 9.5 },
    { x: 11.5, y: 11.5 },
  ];

  const TILE_COLORS = {
    1: ['#264235', '#183025'],
    2: ['#c5ff8f', '#77e34d'],
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const length2 = (x, y) => Math.hypot(x, y);
  const wrapAngle = (value) => {
    let angle = value;
    while (angle <= -Math.PI) angle += Math.PI * 2;
    while (angle > Math.PI) angle -= Math.PI * 2;
    return angle;
  };

  class DoomGame {
    constructor(root) {
      this.root = root;
      this.canvas = root.querySelector('#doom-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.statusEl = root.querySelector('#doom-status');
      this.hpEl = root.querySelector('#doom-hp');
      this.ammoEl = root.querySelector('#doom-ammo');
      this.killsEl = root.querySelector('#doom-kills');
      this.stateEl = root.querySelector('#doom-state');
      this.overlay = root.querySelector('#doom-overlay');
      this.overlayTitle = root.querySelector('#doom-overlay-title');
      this.overlayText = root.querySelector('#doom-overlay-text');
      this.controlButtons = root.querySelectorAll('[data-doom-action]');
      this.holdButtons = root.querySelectorAll('[data-doom-hold]');
      this.hold = new Set();
      this.running = false;
      this.paused = false;
      this.over = false;
      this.won = false;
      this.health = 100;
      this.ammo = 24;
      this.kills = 0;
      this.score = 0;
      this.player = { x: 2.5, y: 2.5, angle: 0.18 };
      this.enemies = this.createEnemies();
      this.zBuffer = [];
      this.viewWidth = 640;
      this.viewHeight = 360;
      this.lastFrame = 0;
      this.moveSpeed = 2.6;
      this.strafeSpeed = 2.1;
      this.turnSpeed = 1.85;
      this.fireCooldown = 0;
      this.damageCooldown = 0;
      this.animationFrame = null;
      this.fov = Math.PI / 3.3;

      window.activeGame = window.activeGame || this;

      this.reset(true);
      this.bindEvents();
      this.resize();
      this.loop = this.loop.bind(this);
      this.animationFrame = requestAnimationFrame(this.loop);
    }

    createEnemies() {
      return ENEMY_SPAWNS.map((spawn, index) => ({
        x: spawn.x,
        y: spawn.y,
        alive: true,
        bob: index * 0.7,
        cooldown: 0,
        wander: index * 1.31,
      }));
    }

    bindEvents() {
      this.root.addEventListener('pointerdown', () => {
        window.activeGame = this;
      });

      document.addEventListener('keydown', (event) => {
        if (window.activeGame && window.activeGame !== this) return;
        const key = event.key.toLowerCase();

        if (key === 'w' || key === 'arrowup') this.hold.add('forward');
        if (key === 's' || key === 'arrowdown') this.hold.add('back');
        if (key === 'a') this.hold.add('strafeLeft');
        if (key === 'd') this.hold.add('strafeRight');
        if (key === 'arrowleft') this.hold.add('turnLeft');
        if (key === 'arrowright') this.hold.add('turnRight');
        if (key === 'shift') this.hold.add('sprint');

        if (key === ' ') {
          event.preventDefault();
          if (!event.repeat) this.shoot();
        }

        if (key === 'p') this.togglePause();
        if (key === 'enter') this.restart();
        if (key === 'r') this.restart();
      });

      document.addEventListener('keyup', (event) => {
        if (window.activeGame && window.activeGame !== this) return;
        const key = event.key.toLowerCase();
        if (key === 'w' || key === 'arrowup') this.hold.delete('forward');
        if (key === 's' || key === 'arrowdown') this.hold.delete('back');
        if (key === 'a') this.hold.delete('strafeLeft');
        if (key === 'd') this.hold.delete('strafeRight');
        if (key === 'arrowleft') this.hold.delete('turnLeft');
        if (key === 'arrowright') this.hold.delete('turnRight');
        if (key === 'shift') this.hold.delete('sprint');
      });

      this.canvas.addEventListener('pointerdown', () => {
        window.activeGame = this;
        if (this.running && !this.paused && !this.over && !this.won) {
          this.shoot();
        }
      });

      this.controlButtons.forEach((button) => {
        button.addEventListener('click', () => {
          window.activeGame = this;
          const action = button.dataset.doomAction;
          if (action === 'start') this.start();
          if (action === 'pause') this.togglePause();
          if (action === 'restart') this.restart();
          if (action === 'shoot') this.shoot();
        });
      });

      const addHold = (action, down) => {
        if (down) this.hold.add(action);
        else this.hold.delete(action);
      };

      this.holdButtons.forEach((button) => {
        const action = button.dataset.doomHold;
        if (!action) return;
        button.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          window.activeGame = this;
          if (action === 'shoot') {
            this.shoot();
            return;
          }
          addHold(action, true);
        });
        button.addEventListener('pointerup', () => addHold(action, false));
        button.addEventListener('pointerleave', () => addHold(action, false));
        button.addEventListener('pointercancel', () => addHold(action, false));
      });

      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const width = Math.max(320, Math.floor(Math.min(rect.width - 16, 760)));
      const height = Math.max(180, Math.floor(width * 9 / 16));
      this.viewWidth = width;
      this.viewHeight = height;
      this.canvas.width = width;
      this.canvas.height = height;
      this.draw();
    }

    reset(boot = false) {
      this.player = { x: 1.5, y: 1.5, angle: 0.18 };
      this.enemies = this.createEnemies();
      this.health = 100;
      this.ammo = 24;
      this.kills = 0;
      this.score = 0;
      this.running = false;
      this.paused = false;
      this.over = false;
      this.won = false;
      this.fireCooldown = 0;
      this.damageCooldown = 0;
      this.hold.clear();
      this.hideOverlay();
      this.setStatus(boot ? 'Ready' : 'Reset');
      this.updateHud();
      this.draw();
    }

    start() {
      window.activeGame = this;
      if (this.over || this.won) {
        this.reset();
      }
      this.running = true;
      this.paused = false;
      this.hideOverlay();
      this.setStatus('Running');
      this.updateHud();
    }

    restart() {
      window.activeGame = this;
      this.reset();
      this.start();
      this.setStatus('Restarted');
    }

    togglePause() {
      if (this.over || this.won) {
        this.restart();
        return;
      }
      if (!this.running) {
        this.start();
        return;
      }
      this.paused = !this.paused;
      this.setStatus(this.paused ? 'Paused' : 'Running');
      this.updateHud();
    }

    loop(timestamp) {
      if (!this.lastFrame) this.lastFrame = timestamp;
      const dt = clamp((timestamp - this.lastFrame) / 1000, 0, 0.05);
      this.lastFrame = timestamp;

      if (this.running && !this.paused && !this.over && !this.won) {
        this.update(dt);
      }

      this.draw();
      this.animationFrame = requestAnimationFrame(this.loop);
    }

    update(dt) {
      this.fireCooldown = Math.max(0, this.fireCooldown - dt);
      this.damageCooldown = Math.max(0, this.damageCooldown - dt);

      const turn = (this.hold.has('turnLeft') ? -1 : 0) + (this.hold.has('turnRight') ? 1 : 0);
      const speed = this.moveSpeed * (this.hold.has('sprint') ? 1.45 : 1);
      this.player.angle = wrapAngle(this.player.angle + turn * this.turnSpeed * dt);

      let moveX = 0;
      let moveY = 0;

      if (this.hold.has('forward')) {
        moveX += Math.cos(this.player.angle);
        moveY += Math.sin(this.player.angle);
      }
      if (this.hold.has('back')) {
        moveX -= Math.cos(this.player.angle);
        moveY -= Math.sin(this.player.angle);
      }
      if (this.hold.has('strafeLeft')) {
        moveX += Math.cos(this.player.angle - Math.PI / 2);
        moveY += Math.sin(this.player.angle - Math.PI / 2);
      }
      if (this.hold.has('strafeRight')) {
        moveX += Math.cos(this.player.angle + Math.PI / 2);
        moveY += Math.sin(this.player.angle + Math.PI / 2);
      }

      if (moveX || moveY) {
        const scale = speed * dt / Math.max(1, length2(moveX, moveY));
        this.tryMove(this.player.x + moveX * scale, this.player.y + moveY * scale);
      }

      this.updateEnemies(dt);
      this.checkExitCondition();
      this.updateHud();
    }

    updateEnemies(dt) {
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const dist = length2(dx, dy);

        enemy.wander += dt;
        if (dist < 0.72) {
          enemy.cooldown = Math.max(0, enemy.cooldown - dt);
          if (enemy.cooldown <= 0) {
            this.health = Math.max(0, this.health - 12);
            enemy.cooldown = 0.9;
            if (this.health <= 0) {
              this.endGame('Game Over', 'Doom marine was overwhelmed. Restart to try again.');
              return;
            }
          }
          continue;
        }

        const direction = Math.atan2(dy, dx);
        const wander = Math.sin(enemy.wander + enemy.x + enemy.y) * 0.25;
        const visible = this.hasLineOfSight(enemy.x, enemy.y, dist);
        const speed = (visible ? 0.65 : 0.42) + (this.kills * 0.01);
        const step = speed * dt;
        const nx = enemy.x + Math.cos(direction + wander) * step;
        const ny = enemy.y + Math.sin(direction + wander) * step;
        if (this.canOccupy(nx, enemy.y)) enemy.x = nx;
        if (this.canOccupy(enemy.x, ny)) enemy.y = ny;
      }
    }

    shoot() {
      window.activeGame = this;
      if (!this.running) {
        this.start();
        return;
      }
      if (this.paused || this.over || this.won) return;
      if (this.fireCooldown > 0) return;
      if (this.ammo <= 0) {
        this.setStatus('No Ammo');
        return;
      }

      this.fireCooldown = 0.18;
      this.ammo = Math.max(0, this.ammo - 1);

      let target = null;
      let bestDistance = Infinity;

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const dist = length2(dx, dy);
        const diff = Math.abs(wrapAngle(Math.atan2(dy, dx) - this.player.angle));
        if (diff > 0.07 || dist >= bestDistance) continue;
        if (!this.hasLineOfSight(enemy.x, enemy.y, dist)) continue;
        target = enemy;
        bestDistance = dist;
      }

      if (target) {
        target.alive = false;
        this.kills += 1;
        this.score += 100;
      } else {
        this.score += 5;
      }

      this.updateHud();
      if (this.enemies.every((enemy) => !enemy.alive) && this.isAtExit()) {
        this.win();
      }
    }

    checkExitCondition() {
      if (this.enemies.some((enemy) => enemy.alive)) return;
      if (this.isAtExit()) {
        this.win();
      }
    }

    isAtExit() {
      return length2(this.player.x - 12.5, this.player.y - 11.5) < 0.8;
    }

    win() {
      this.won = true;
      this.running = false;
      this.paused = false;
      this.setStatus('Cleared');
      this.showOverlay('Cleared', 'All enemies are down. Press Restart or Enter to play again.');
    }

    endGame(title, text) {
      this.over = true;
      this.running = false;
      this.paused = false;
      this.setStatus('Game Over');
      this.showOverlay(title, text);
    }

    setStatus(text) {
      if (this.statusEl) this.statusEl.textContent = text;
    }

    updateHud() {
      if (this.hpEl) this.hpEl.textContent = String(this.health);
      if (this.ammoEl) this.ammoEl.textContent = String(this.ammo);
      if (this.killsEl) this.killsEl.textContent = String(this.kills);
      if (this.stateEl) {
        this.stateEl.textContent = this.over ? 'Game Over' : this.won ? 'Cleared' : this.paused ? 'Paused' : this.running ? 'Running' : 'Idle';
      }
    }

    showOverlay(title, text) {
      if (!this.overlay) return;
      this.overlay.hidden = false;
      this.overlay.style.display = 'grid';
      if (this.overlayTitle) this.overlayTitle.textContent = title;
      if (this.overlayText) this.overlayText.textContent = text;
    }

    hideOverlay() {
      if (!this.overlay) return;
      this.overlay.hidden = true;
      this.overlay.style.display = 'none';
    }

    canOccupy(x, y) {
      const radius = 0.18;
      return !this.isWall(x - radius, y - radius)
        && !this.isWall(x + radius, y - radius)
        && !this.isWall(x - radius, y + radius)
        && !this.isWall(x + radius, y + radius);
    }

    tryMove(x, y) {
      if (this.canOccupy(x, this.player.y)) this.player.x = x;
      if (this.canOccupy(this.player.x, y)) this.player.y = y;
    }

    isWall(x, y) {
      const mx = Math.floor(x);
      const my = Math.floor(y);
      if (my < 0 || my >= MAP.length || mx < 0 || mx >= MAP[0].length) return true;
      return MAP[my][mx] === 1;
    }

    tileAt(x, y) {
      const mx = Math.floor(x);
      const my = Math.floor(y);
      if (my < 0 || my >= MAP.length || mx < 0 || mx >= MAP[0].length) return 1;
      return MAP[my][mx];
    }

    hasLineOfSight(x, y, maxDistance = Infinity) {
      const dx = x - this.player.x;
      const dy = y - this.player.y;
      const dist = length2(dx, dy);
      const steps = Math.max(4, Math.ceil(dist / 0.08));
      for (let i = 1; i < steps; i += 1) {
        const t = i / steps;
        const px = this.player.x + dx * t;
        const py = this.player.y + dy * t;
        if (this.isWall(px, py)) return false;
      }
      return dist <= maxDistance + 0.2;
    }

    castRay(angle) {
      const rayDirX = Math.cos(angle);
      const rayDirY = Math.sin(angle);
      let mapX = Math.floor(this.player.x);
      let mapY = Math.floor(this.player.y);

      const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
      const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);

      let stepX;
      let stepY;
      let sideDistX;
      let sideDistY;

      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (this.player.x - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - this.player.x) * deltaDistX;
      }

      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (this.player.y - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - this.player.y) * deltaDistY;
      }

      let side = 0;
      let hitTile = 1;
      let safety = 0;

      while (safety < 128) {
        safety += 1;
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }

        if (mapY < 0 || mapY >= MAP.length || mapX < 0 || mapX >= MAP[0].length) {
          break;
        }

        if (MAP[mapY][mapX] > 0) {
          hitTile = MAP[mapY][mapX];
          break;
        }
      }

      let distance;
      if (side === 0) {
        distance = (mapX - this.player.x + (1 - stepX) / 2) / (rayDirX || 1e-6);
      } else {
        distance = (mapY - this.player.y + (1 - stepY) / 2) / (rayDirY || 1e-6);
      }

      return {
        distance: Math.max(0.02, Math.abs(distance)),
        tile: hitTile,
        side,
        wallX: side === 0 ? this.player.y + distance * rayDirY : this.player.x + distance * rayDirX,
      };
    }

    draw() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const width = this.viewWidth;
      const height = this.viewHeight;

      ctx.clearRect(0, 0, width, height);

      const sky = ctx.createLinearGradient(0, 0, 0, height * 0.5);
      sky.addColorStop(0, '#b9efff');
      sky.addColorStop(1, '#4978aa');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height * 0.5);

      const floor = ctx.createLinearGradient(0, height * 0.5, 0, height);
      floor.addColorStop(0, '#20331f');
      floor.addColorStop(1, '#09120e');
      ctx.fillStyle = floor;
      ctx.fillRect(0, height * 0.5, width, height * 0.5);

      const columns = Math.max(200, Math.floor(width / 2));
      const step = width / columns;
      this.zBuffer = new Array(columns);

      for (let column = 0; column < columns; column += 1) {
        const cameraX = (column / columns) * 2 - 1;
        const rayAngle = this.player.angle + cameraX * this.fov * 0.5;
        const hit = this.castRay(rayAngle);
        const corrected = Math.max(0.02, hit.distance * Math.cos(rayAngle - this.player.angle));
        const wallHeight = Math.min(height * 1.6, height / corrected);
        const top = Math.round((height - wallHeight) / 2);
        const [base, edge] = TILE_COLORS[hit.tile] || ['#7ad36a', '#2d6d2a'];
        const shade = clamp(1 - corrected / 14, 0.22, 1);
        const color = hit.side === 1 ? this.mixColor(base, '#000000', 0.18) : base;
        ctx.fillStyle = this.fadeColor(color, shade);
        ctx.fillRect(column * step, top, step + 1, wallHeight);
        ctx.fillStyle = this.fadeColor(edge, shade * 0.75);
        ctx.fillRect(column * step, top, Math.max(1, step * 0.16), wallHeight);
        this.zBuffer[column] = corrected;
      }

      this.drawExit();
      this.drawEnemies();
      this.drawWeapon();
      this.drawMinimap();
      this.drawCrosshair();
      this.drawStatusBar();
    }

    drawExit() {
      const exit = { x: 13.5, y: 11.5 };
      const dx = exit.x - this.player.x;
      const dy = exit.y - this.player.y;
      const dist = length2(dx, dy);
      const angle = wrapAngle(Math.atan2(dy, dx) - this.player.angle);
      if (Math.abs(angle) > this.fov * 0.6) return;

      const column = Math.floor(((angle / (this.fov * 0.5)) + 1) * 0.5 * this.zBuffer.length);
      if (column < 0 || column >= this.zBuffer.length) return;
      if (dist > this.zBuffer[column] + 0.2) return;

      const height = this.viewHeight / Math.max(0.5, dist);
      const top = (this.viewHeight - height) / 2;
      const x = (column / this.zBuffer.length) * this.viewWidth;
      const width = Math.max(3, this.viewWidth / this.zBuffer.length);
      this.ctx.fillStyle = 'rgba(183, 255, 126, 0.28)';
      this.ctx.fillRect(x, top, width, height);
    }

    drawEnemies() {
      const ctx = this.ctx;
      const width = this.viewWidth;
      const height = this.viewHeight;
      const list = this.enemies
        .filter((enemy) => enemy.alive)
        .map((enemy) => {
          const dx = enemy.x - this.player.x;
          const dy = enemy.y - this.player.y;
          const dist = length2(dx, dy);
          const angle = wrapAngle(Math.atan2(dy, dx) - this.player.angle);
          return { enemy, dist, angle };
        })
        .sort((a, b) => b.dist - a.dist);

      for (const item of list) {
        if (Math.abs(item.angle) > this.fov * 0.55) continue;
        const screenX = ((item.angle / (this.fov * 0.5)) + 1) * 0.5 * width;
        const size = clamp(height / Math.max(0.3, item.dist) * 0.58, 10, height * 0.85);
        const top = height * 0.5 - size * 0.52;
        const left = screenX - size * 0.5;
        const bufferIndex = clamp(Math.floor((screenX / width) * this.zBuffer.length), 0, this.zBuffer.length - 1);
        if (item.dist > this.zBuffer[bufferIndex] + 0.2) continue;

        const intensity = clamp(1 - item.dist / 12, 0.2, 1);
        const body = ctx.createLinearGradient(left, top, left + size, top + size);
        body.addColorStop(0, `rgba(255, 78, 78, ${0.18 + intensity * 0.35})`);
        body.addColorStop(0.5, `rgba(255, 177, 86, ${0.4 + intensity * 0.4})`);
        body.addColorStop(1, `rgba(84, 15, 15, ${0.35 + intensity * 0.4})`);
        ctx.fillStyle = body;
        ctx.fillRect(left, top, size, size);
        ctx.fillStyle = `rgba(255, 232, 167, ${0.15 + intensity * 0.35})`;
        ctx.fillRect(left + size * 0.2, top + size * 0.12, size * 0.6, size * 0.18);
        ctx.strokeStyle = `rgba(255, 248, 220, ${0.25 + intensity * 0.4})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(left, top, size, size);
      }
    }

    drawWeapon() {
      const ctx = this.ctx;
      const w = this.viewWidth;
      const h = this.viewHeight;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(w * 0.42, h * 0.72, w * 0.16, h * 0.18);
      ctx.fillStyle = 'rgba(82, 36, 24, 0.85)';
      ctx.fillRect(w * 0.435, h * 0.74, w * 0.13, h * 0.14);
      ctx.fillStyle = 'rgba(223, 159, 95, 0.8)';
      ctx.fillRect(w * 0.49, h * 0.77, w * 0.02, h * 0.11);
    }

    drawCrosshair() {
      const ctx = this.ctx;
      const x = this.viewWidth / 2;
      const y = this.viewHeight / 2;
      ctx.strokeStyle = 'rgba(240, 255, 230, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x - 3, y);
      ctx.moveTo(x + 3, y);
      ctx.lineTo(x + 10, y);
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x, y - 3);
      ctx.moveTo(x, y + 3);
      ctx.lineTo(x, y + 10);
      ctx.stroke();
    }

    drawStatusBar() {
      const ctx = this.ctx;
      const w = this.viewWidth;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, w, 26);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.font = '12px monospace';
      ctx.fillText(`HP ${this.health}  Ammo ${this.ammo}  Kills ${this.kills}`, 10, 17);
    }

    drawMinimap() {
      const ctx = this.ctx;
      const scale = 7;
      const pad = 10;
      const mapWidth = MAP[0].length * scale;
      const mapHeight = MAP.length * scale;
      const originX = this.viewWidth - mapWidth - pad;
      const originY = pad;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
      ctx.fillRect(originX - 4, originY - 4, mapWidth + 8, mapHeight + 8);

      for (let y = 0; y < MAP.length; y += 1) {
        for (let x = 0; x < MAP[0].length; x += 1) {
          const tile = MAP[y][x];
          if (tile === 0) continue;
          ctx.fillStyle = tile === 2 ? 'rgba(183, 255, 126, 0.95)' : 'rgba(77, 137, 89, 0.85)';
          ctx.fillRect(originX + x * scale, originY + y * scale, scale - 1, scale - 1);
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(originX + this.player.x * scale, originY + this.player.y * scale, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(originX + this.player.x * scale, originY + this.player.y * scale);
      ctx.lineTo(
        originX + (this.player.x + Math.cos(this.player.angle) * 1.4) * scale,
        originY + (this.player.y + Math.sin(this.player.angle) * 1.4) * scale
      );
      ctx.stroke();

      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        ctx.fillStyle = 'rgba(255, 90, 90, 0.92)';
        ctx.fillRect(originX + enemy.x * scale - 1.5, originY + enemy.y * scale - 1.5, 3, 3);
      }
    }

    fadeColor(color, amount) {
      if (!color.startsWith('#')) return color;
      const hex = color.slice(1);
      const value = hex.length === 3
        ? hex.split('').map((char) => parseInt(char + char, 16))
        : [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
      const faded = value.map((channel) => Math.round(channel * amount));
      return `rgb(${faded[0]}, ${faded[1]}, ${faded[2]})`;
    }

    mixColor(from, to, weight) {
      if (!from.startsWith('#') || !to.startsWith('#')) return from;
      const a = from.slice(1);
      const b = to.slice(1);
      const parse = (hex) => (hex.length === 3
        ? hex.split('').map((char) => parseInt(char + char, 16))
        : [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)));
      const c1 = parse(a);
      const c2 = parse(b);
      const mixed = c1.map((channel, index) => Math.round(channel * (1 - weight) + c2[index] * weight));
      return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
    }
  }

  window.DoomGame = DoomGame;
})();
