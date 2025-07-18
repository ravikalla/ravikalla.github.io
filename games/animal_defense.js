// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameRunning = false;
let animationId;

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game state
const game = {
    score: 0,
    wave: 1,
    enemies: [],
    bullets: [],
    items: [],
    particles: [],
    player: {
        x: 0,
        y: 0,
        radius: 20,
        health: 150,
        maxHealth: 150,
        speed: 3.5,
        angle: 0,
        vx: 0,
        vy: 0
    },
    difficulty: {
        enemyHealthMultiplier: 1,
        enemySpeedMultiplier: 1,
        enemyDamageMultiplier: 1,
        spawnRateMultiplier: 1
    },
    weapons: {
        pistol: { damage: 15, fireRate: 250, ammo: Infinity, bulletSpeed: 12, bulletSize: 3, spread: 0 },
        shotgun: { damage: 20, fireRate: 700, ammo: 30, bulletSpeed: 10, bulletSize: 4, spread: 0.25, pellets: 5 },
        rifle: { damage: 35, fireRate: 80, ammo: 80, bulletSpeed: 18, bulletSize: 4, spread: 0.03 },
        rocket: { damage: 150, fireRate: 900, ammo: 10, bulletSpeed: 8, bulletSize: 8, spread: 0, explosive: true }
    },
    currentWeapon: 'pistol',
    lastFireTime: 0,
    joystick: { active: false, dx: 0, dy: 0 },
    keys: { w: false, a: false, s: false, d: false, up: false, left: false, down: false, right: false },
    mouse: { x: 0, y: 0 },
    isDesktop: !('ontouchstart' in window)
};

// Initialize player position
game.player.x = canvas.width / 2;
game.player.y = canvas.height / 2;

// Show/hide controls based on device
if (game.isDesktop) {
    document.getElementById('mobileControls').style.display = 'none';
} else {
    document.getElementById('mobileControls').style.display = 'flex';
}

// Enemy types with base stats (will be scaled by difficulty) - made even weaker
const enemyTypes = {
    wolf: { emoji: '🐺', speed: 1, health: 15, damage: 3, size: 25, score: 10 },
    bear: { emoji: '🐻', speed: 0.6, health: 25, damage: 5, size: 35, score: 20 },
    tiger: { emoji: '🐅', speed: 1.2, health: 18, damage: 4, size: 30, score: 15 },
    boar: { emoji: '🐗', speed: 1, health: 18, damage: 4, size: 28, score: 12 },
    crocodile: { emoji: '🐊', speed: 0.8, health: 30, damage: 6, size: 40, score: 25 }
};

// Item types
const itemTypes = {
    medpack: { emoji: '💊', type: 'health', value: 40, size: 20 },
    ammoBox: { emoji: '📦', type: 'ammo', value: 30, size: 25 }
};

// Particle class
class Particle {
    constructor(x, y, vx, vy, color, size, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    draw() {
        const alpha = this.lifetime / this.maxLifetime;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Enemy class
class Enemy {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        // Apply difficulty scaling
        this.health = Math.floor(enemyTypes[type].health * game.difficulty.enemyHealthMultiplier);
        this.maxHealth = this.health;
        this.emoji = enemyTypes[type].emoji;
        this.speed = enemyTypes[type].speed * game.difficulty.enemySpeedMultiplier;
        this.damage = Math.floor(enemyTypes[type].damage * game.difficulty.enemyDamageMultiplier);
        this.size = enemyTypes[type].size;
        this.score = Math.floor(enemyTypes[type].score * (1 + (game.wave - 1) * 0.1));
        this.angle = 0;
        this.hitFlash = 0;
    }
    
    update() {
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.angle = Math.atan2(dy, dx);
        
        if (distance > 5) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        
        if (this.hitFlash > 0) this.hitFlash--;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        
        if (this.hitFlash > 0) {
            ctx.filter = 'brightness(2)';
        }
        
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        
        ctx.restore();
        
        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = 40;
            const barHeight = 4;
            const barY = this.y - this.size - 10;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x - barWidth/2, barY, (this.health / this.maxHealth) * barWidth, barHeight);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        this.hitFlash = 10;
        
        // Blood particles (reduced for performance)
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            game.particles.push(new Particle(
                this.x, this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff0000',
                Math.random() * 3 + 1,
                20
            ));
        }
    }
}

// Bullet class
class Bullet {
    constructor(x, y, angle, weapon) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = game.weapons[weapon].bulletSpeed;
        this.damage = game.weapons[weapon].damage;
        this.size = game.weapons[weapon].bulletSize;
        this.explosive = game.weapons[weapon].explosive || false;
        this.lifetime = 100;
    }
    
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.lifetime--;
    }
    
    draw() {
        ctx.fillStyle = this.explosive ? '#ff6600' : '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail effect
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.x - Math.cos(this.angle) * 10, this.y - Math.sin(this.angle) * 10, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Item class
class Item {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.emoji = itemTypes[type].emoji;
        this.value = itemTypes[type].value;
        this.size = itemTypes[type].size;
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    update() {
        this.bobOffset += 0.05;
    }
    
    draw() {
        const bobY = Math.sin(this.bobOffset) * 5;
        
        ctx.save();
        ctx.translate(this.x, this.y + bobY);
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
        
        // Glow effect
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.type === 'health' ? '#00ff00' : '#0099ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Input handling
let firing = false;

// Keyboard input - now for shooting
window.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case ' ': // Spacebar for shooting
        case 'enter': // Enter as alternative
            firing = true;
            break;
        case '1': switchWeapon('pistol'); break;
        case '2': switchWeapon('shotgun'); break;
        case '3': switchWeapon('rifle'); break;
        case '4': switchWeapon('rocket'); break;
    }
});

window.addEventListener('keyup', (e) => {
    switch(e.key.toLowerCase()) {
        case ' ':
        case 'enter':
            firing = false;
            break;
    }
});

// Mouse input - now for movement
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
});

// Optional: allow clicking to also move towards that position
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
});

// Prevent right-click context menu on canvas
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Mobile controls (if not desktop)
if (!game.isDesktop) {
    const fireButton = document.getElementById('fireButton');
    fireButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        firing = true;
    });
    fireButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        firing = false;
    });
    fireButton.addEventListener('mousedown', () => firing = true);
    fireButton.addEventListener('mouseup', () => firing = false);
}

function switchWeapon(weapon) {
    if (game.weapons[weapon].ammo > 0 || game.weapons[weapon].ammo === Infinity) {
        document.querySelector('.weapon-item.active').classList.remove('active');
        document.querySelector(`[data-weapon="${weapon}"]`).classList.add('active');
        game.currentWeapon = weapon;
    }
}

// Joystick handling (mobile only)
if (!game.isDesktop) {
    const joystickBase = document.getElementById('joystickBase');
    const joystickHandle = document.getElementById('joystickHandle');
    let joystickTouch = null;

    function handleJoystickStart(e) {
        e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        joystickTouch = e.touches ? e.touches[0].identifier : 'mouse';
        game.joystick.active = true;
        updateJoystick(touch);
    }

    function handleJoystickMove(e) {
        e.preventDefault();
        if (!game.joystick.active) return;
        
        const touch = e.touches ? 
            Array.from(e.touches).find(t => t.identifier === joystickTouch) : e;
        if (touch) updateJoystick(touch);
    }

    function handleJoystickEnd(e) {
        e.preventDefault();
        if (e.touches) {
            const stillActive = Array.from(e.touches).find(t => t.identifier === joystickTouch);
            if (stillActive) return;
        }
        
        game.joystick.active = false;
        game.joystick.dx = 0;
        game.joystick.dy = 0;
        joystickHandle.style.transform = 'translate(-50%, -50%)';
    }

    function updateJoystick(touch) {
        const rect = joystickBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = rect.width / 2 - 25;
        
        if (distance > maxDistance) {
            dx = (dx / distance) * maxDistance;
            dy = (dy / distance) * maxDistance;
        }
        
        game.joystick.dx = dx / maxDistance;
        game.joystick.dy = dy / maxDistance;
        
        joystickHandle.style.transform = `translate(${dx - 25}px, ${dy - 25}px)`;
    }

    joystickBase.addEventListener('touchstart', handleJoystickStart);
    joystickBase.addEventListener('touchmove', handleJoystickMove);
    joystickBase.addEventListener('touchend', handleJoystickEnd);
    joystickBase.addEventListener('mousedown', handleJoystickStart);
    window.addEventListener('mousemove', handleJoystickMove);
    window.addEventListener('mouseup', handleJoystickEnd);
}

// Weapon selection
document.querySelectorAll('.weapon-item').forEach(item => {
    item.addEventListener('click', function() {
        const weapon = this.dataset.weapon;
        if (game.weapons[weapon].ammo > 0 || game.weapons[weapon].ammo === Infinity) {
            document.querySelector('.weapon-item.active').classList.remove('active');
            this.classList.add('active');
            game.currentWeapon = weapon;
        }
    });
});

// Game functions
function spawnEnemy() {
    const types = Object.keys(enemyTypes);
    const type = types[Math.floor(Math.random() * types.length)];
    
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
        case 0: x = Math.random() * canvas.width; y = -50; break;
        case 1: x = canvas.width + 50; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + 50; break;
        case 3: x = -50; y = Math.random() * canvas.height; break;
    }
    
    game.enemies.push(new Enemy(type, x, y));
}

function spawnItem() {
    if (Math.random() < 0.3) { // 30% chance to spawn item
        const types = Object.keys(itemTypes);
        const type = types[Math.floor(Math.random() * types.length)];
        
        const x = Math.random() * (canvas.width - 100) + 50;
        const y = Math.random() * (canvas.height - 100) + 50;
        
        game.items.push(new Item(type, x, y));
    }
}

function fireBullet() {
    const now = Date.now();
    const weapon = game.weapons[game.currentWeapon];
    
    if (now - game.lastFireTime < weapon.fireRate) return;
    if (weapon.ammo <= 0 && weapon.ammo !== Infinity) return;
    
    game.lastFireTime = now;
    
    // Always use player angle (which now faces nearest enemy)
    let targetAngle = game.player.angle;
    
    if (game.currentWeapon === 'shotgun') {
        // Fire multiple pellets
        for (let i = 0; i < weapon.pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread;
            game.bullets.push(new Bullet(game.player.x, game.player.y, targetAngle + spread, game.currentWeapon));
        }
    } else {
        const spread = (Math.random() - 0.5) * weapon.spread;
        game.bullets.push(new Bullet(game.player.x, game.player.y, targetAngle + spread, game.currentWeapon));
    }
    
    if (weapon.ammo !== Infinity) {
        weapon.ammo--;
        updateAmmoDisplay();
    }
    
    // Muzzle flash
    for (let i = 0; i < 3; i++) {
        const angle = targetAngle + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 2 + 1;
        game.particles.push(new Particle(
            game.player.x + Math.cos(targetAngle) * 20,
            game.player.y + Math.sin(targetAngle) * 20,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            '#ffff00',
            Math.random() * 2 + 1,
            10
        ));
    }
}

function updateAmmoDisplay() {
    document.getElementById('pistolAmmo').textContent = '∞';
    document.getElementById('shotgunAmmo').textContent = game.weapons.shotgun.ammo;
    document.getElementById('rifleAmmo').textContent = game.weapons.rifle.ammo;
    document.getElementById('rocketAmmo').textContent = game.weapons.rocket.ammo;
}

function checkCollisions() {
    // Bullet-enemy collisions
    game.bullets.forEach((bullet, bulletIndex) => {
        game.enemies.forEach((enemy, enemyIndex) => {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < bullet.size + enemy.size) {
                enemy.takeDamage(bullet.damage);
                
                if (bullet.explosive) {
                    // Explosion damage to nearby enemies
                    game.enemies.forEach(otherEnemy => {
                        const explodeDist = Math.hypot(bullet.x - otherEnemy.x, bullet.y - otherEnemy.y);
                        if (explodeDist < 100 && otherEnemy !== enemy) {
                            otherEnemy.takeDamage(bullet.damage * 0.5);
                        }
                    });
                    
                    // Explosion particles (reduced for performance)
                    for (let i = 0; i < 10; i++) {
                        const angle = (Math.PI * 2 / 10) * i;
                        const speed = Math.random() * 5 + 2;
                        game.particles.push(new Particle(
                            bullet.x, bullet.y,
                            Math.cos(angle) * speed,
                            Math.sin(angle) * speed,
                            '#ff6600',
                            Math.random() * 4 + 2,
                            30
                        ));
                    }
                }
                
                if (enemy.health <= 0) {
                    game.score += enemy.score;
                    game.enemies.splice(enemyIndex, 1);
                    
                    // Higher chance to drop items in early waves
                    const dropChance = Math.max(0.15, 0.35 - (game.wave * 0.02));
                    if (Math.random() < dropChance) {
                        const itemType = Math.random() < 0.6 ? 'medpack' : 'ammoBox';
                        game.items.push(new Item(itemType, enemy.x, enemy.y));
                    }
                }
                
                game.bullets.splice(bulletIndex, 1);
                return;
            }
        });
    });
    
    // Player-enemy collisions
    game.enemies.forEach(enemy => {
        const dist = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
        if (dist < enemy.size + game.player.radius) {
            game.player.health -= enemy.damage;
            enemy.x += (enemy.x - game.player.x) * 20 / dist;
            enemy.y += (enemy.y - game.player.y) * 20 / dist;
            
            // Damage particles (reduced for performance)
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3 + 1;
                game.particles.push(new Particle(
                    game.player.x, game.player.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    '#ff0000',
                    Math.random() * 3 + 1,
                    15
                ));
            }
        }
    });
    
    // Player-item collisions
    game.items.forEach((item, index) => {
        const dist = Math.hypot(item.x - game.player.x, item.y - game.player.y);
        if (dist < item.size + game.player.radius) {
            if (item.type === 'health') {
                game.player.health = Math.min(game.player.health + item.value, game.player.maxHealth);
            } else if (item.type === 'ammo') {
                Object.keys(game.weapons).forEach(weapon => {
                    if (game.weapons[weapon].ammo !== Infinity) {
                        game.weapons[weapon].ammo += Math.floor(item.value / 2);
                    }
                });
                updateAmmoDisplay();
            }
            
            game.items.splice(index, 1);
            
            // Pickup particles (reduced for performance)
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 + 1;
                game.particles.push(new Particle(
                    item.x, item.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    item.type === 'health' ? '#00ff00' : '#0099ff',
                    Math.random() * 2 + 1,
                    15
                ));
            }
        }
    });
}

function updateGame() {
    // Update player position
    if (game.isDesktop) {
        // Mouse-based movement
        const dx = game.mouse.x - game.player.x;
        const dy = game.mouse.y - game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Move towards mouse if not too close
        if (distance > 5) {
            const moveSpeed = Math.min(distance * 0.1, game.player.speed);
            game.player.vx = (dx / distance) * moveSpeed;
            game.player.vy = (dy / distance) * moveSpeed;
        } else {
            game.player.vx = 0;
            game.player.vy = 0;
        }
        
        // Update player angle to face nearest enemy
        if (game.enemies.length > 0) {
            const nearest = game.enemies.reduce((closest, enemy) => {
                const dist = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
                const closestDist = Math.hypot(closest.x - game.player.x, closest.y - game.player.y);
                return dist < closestDist ? enemy : closest;
            });
            game.player.angle = Math.atan2(nearest.y - game.player.y, nearest.x - game.player.x);
        }
    } else {
        // Joystick movement for mobile
        game.player.vx = game.joystick.dx * game.player.speed;
        game.player.vy = game.joystick.dy * game.player.speed;
        
        // Update player angle (joystick on mobile)
        if (game.joystick.dx !== 0 || game.joystick.dy !== 0) {
            game.player.angle = Math.atan2(game.joystick.dy, game.joystick.dx);
        }
    }
    
    game.player.x += game.player.vx;
    game.player.y += game.player.vy;
    
    // Keep player in bounds
    game.player.x = Math.max(game.player.radius, Math.min(canvas.width - game.player.radius, game.player.x));
    game.player.y = Math.max(game.player.radius, Math.min(canvas.height - game.player.radius, game.player.y));
    
    // Update enemies
    game.enemies.forEach(enemy => enemy.update());
    
    // Update bullets
    game.bullets = game.bullets.filter(bullet => {
        bullet.update();
        return bullet.lifetime > 0 && 
               bullet.x > -50 && bullet.x < canvas.width + 50 &&
               bullet.y > -50 && bullet.y < canvas.height + 50;
    });
    
    // Update items
    game.items.forEach(item => item.update());
    
    // Update particles (with limit for performance)
    if (game.particles.length > 100) {
        game.particles = game.particles.slice(-100); // Keep only last 100 particles
    }
    game.particles = game.particles.filter(particle => {
        particle.update();
        return particle.lifetime > 0;
    });
    
    // Fire bullets
    if (firing) fireBullet();
    
    // Check collisions
    checkCollisions();
    
    // Update UI
    document.getElementById('score').textContent = game.score;
    document.getElementById('wave').textContent = game.wave;
    document.getElementById('healthBar').style.width = `${(game.player.health / game.player.maxHealth) * 100}%`;
    document.getElementById('healthText').textContent = `${Math.max(0, Math.floor(game.player.health))}/${game.player.maxHealth}`;
    
    // Check game over
    if (game.player.health <= 0) {
        gameOver();
    }
    
    // Check wave completion
    if (game.enemies.length === 0 && gameRunning) {
        game.wave++;
        updateDifficulty();
        
        // Very simple enemy spawning - much fewer enemies
        const totalEnemies = Math.min(3, 1 + Math.floor(game.wave / 3)); // 1-3 enemies max, very slow increase
        
        setTimeout(() => {
            for (let i = 0; i < totalEnemies; i++) {
                setTimeout(() => {
                    // Only spawn if under max enemy limit
                    if (game.enemies.length < 2) { // Max 2 enemies on screen at once
                        spawnEnemy();
                    }
                }, i * 3000); // Much slower spawn rate (3 seconds between each)
            }
        }, 5000); // Longer break between waves
    }
}

function drawGame() {
    // Clear canvas (solid color for better performance)
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw particles
    game.particles.forEach(particle => particle.draw());
    
    // Draw items
    game.items.forEach(item => item.draw());
    
    // Draw bullets
    game.bullets.forEach(bullet => bullet.draw());
    
    // Draw enemies
    game.enemies.forEach(enemy => enemy.draw());
    
    // Draw player
    ctx.save();
    ctx.translate(game.player.x, game.player.y);
    ctx.rotate(game.player.angle + Math.PI / 2);
    
    // Player body
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(0, 0, game.player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Player direction indicator
    ctx.fillStyle = '#fff';
    ctx.fillRect(-3, -game.player.radius - 10, 6, 10);
    
    ctx.restore();
    
    // Draw player health outline if damaged
    if (game.player.health < game.player.maxHealth) {
        ctx.strokeStyle = `rgba(255, 0, 0, ${1 - game.player.health / game.player.maxHealth})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(game.player.x, game.player.y, game.player.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function gameLoop() {
    updateGame();
    drawGame();
    
    if (gameRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function updateDifficulty() {
    // Very gentle difficulty scaling
    const waveProgress = game.wave - 1;
    
    // Very minimal increases
    game.difficulty.enemyHealthMultiplier = 1 + (waveProgress * 0.05);
    game.difficulty.enemySpeedMultiplier = Math.min(1.3, 1 + (waveProgress * 0.02));
    game.difficulty.enemyDamageMultiplier = 1 + (waveProgress * 0.04);
    game.difficulty.spawnRateMultiplier = 1; // No spawn rate increase
}

function startGame() {
    // Reset game state
    game.score = 0;
    game.wave = 1;
    game.enemies = [];
    game.bullets = [];
    game.items = [];
    game.particles = [];
    game.player.health = game.player.maxHealth;
    game.player.x = canvas.width / 2;
    game.player.y = canvas.height / 2;
    
    // Reset difficulty
    game.difficulty = {
        enemyHealthMultiplier: 1,
        enemySpeedMultiplier: 1,
        enemyDamageMultiplier: 1,
        spawnRateMultiplier: 1
    };
    
    // Reset weapon ammo with more generous amounts
    game.weapons.shotgun.ammo = 30;
    game.weapons.rifle.ammo = 80;
    game.weapons.rocket.ammo = 10;
    updateAmmoDisplay();
    
    // Hide screens
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    
    // Start game
    gameRunning = true;
    
    // Spawn initial enemy (just 1 for wave 1)
    setTimeout(() => spawnEnemy(), 2000); // Single enemy after 2 seconds
    
    // Start spawning items more frequently
    setInterval(() => {
        if (gameRunning && game.items.length < 3) { // More items available
            spawnItem();
        }
    }, 6000); // More frequent item spawns
    
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('wavesSurvived').textContent = game.wave - 1;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// Event listeners
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', startGame);

// Show start screen
document.getElementById('startScreen').style.display = 'flex';