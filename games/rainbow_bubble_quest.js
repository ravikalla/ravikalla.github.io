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
    level: 1,
    lives: 3,
    bubbles: [],
    obstacles: [],
    powerups: [],
    particles: [],
    player: {
        x: 0,
        y: 0,
        radius: 25,
        targetX: 0,
        targetY: 0,
        color: '#ff6b9d',
        trail: []
    },
    mouse: { x: 0, y: 0 },
    bubbleColors: ['#ff6b9d', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'],
    combo: 0,
    comboTimer: 0
};

// Initialize player position
game.player.x = canvas.width / 2;
game.player.y = canvas.height / 2;
game.player.targetX = game.player.x;
game.player.targetY = game.player.y;

// Particle class for beautiful effects
class Particle {
    constructor(x, y, vx, vy, color, size, lifetime, type = 'normal') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.type = type;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
        this.rotation += this.rotationSpeed;
        
        if (this.type === 'sparkle') {
            this.vx *= 0.98;
            this.vy *= 0.98;
        }
    }
    
    draw() {
        const alpha = this.lifetime / this.maxLifetime;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.type === 'sparkle') {
            ctx.fillStyle = this.color;
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✨', 0, 0);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// Bubble class
class Bubble {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = 15 + Math.random() * 10;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.collected = false;
        this.scale = 1;
        this.glow = 0;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.bobOffset += 0.05;
        this.glow = Math.sin(this.bobOffset) * 0.3 + 0.7;
        
        // Bounce off edges
        if (this.x < this.radius || this.x > canvas.width - this.radius) {
            this.vx *= -1;
        }
        if (this.y < this.radius || this.y > canvas.height - this.radius) {
            this.vy *= -1;
        }
        
        // Keep in bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Glow effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, this.color + '80');
        gradient.addColorStop(0.7, this.color + '40');
        gradient.addColorStop(1, this.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * this.glow, 0, Math.PI * 2);
        ctx.fill();
        
        // Main bubble
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Obstacle class
class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 1 + Math.random();
        this.angle = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.rotationSpeed = 0.1;
    }
    
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.rotation += this.rotationSpeed;
        
        // Bounce off edges
        if (this.x < this.radius || this.x > canvas.width - this.radius) {
            this.angle = Math.PI - this.angle;
        }
        if (this.y < this.radius || this.y > canvas.height - this.radius) {
            this.angle = -this.angle;
        }
        
        // Keep in bounds
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Spiky obstacle
        ctx.fillStyle = '#ff4757';
        ctx.strokeStyle = '#2f1b14';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = i % 2 === 0 ? this.radius : this.radius * 0.6;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
}

// Power-up class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'shield', 'magnet', 'points'
        this.radius = 18;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.collected = false;
        this.scale = 1;
    }
    
    update() {
        this.bobOffset += 0.08;
        this.scale = 1 + Math.sin(this.bobOffset) * 0.1;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.bobOffset) * 5);
        ctx.scale(this.scale, this.scale);
        
        // Glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 1.5);
        gradient.addColorStop(0, '#ffd700' + '60');
        gradient.addColorStop(1, '#ffd700' + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Power-up icon
        ctx.font = `${this.radius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        switch (this.type) {
            case 'shield':
                ctx.fillText('🛡️', 0, 0);
                break;
            case 'magnet':
                ctx.fillText('🧲', 0, 0);
                break;
            case 'points':
                ctx.fillText('⭐', 0, 0);
                break;
        }
        
        ctx.restore();
    }
}

// Mouse input
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    game.mouse.x = e.clientX - rect.left;
    game.mouse.y = e.clientY - rect.top;
    game.player.targetX = game.mouse.x;
    game.player.targetY = game.mouse.y;
});

// Touch input for mobile
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    game.mouse.x = touch.clientX - rect.left;
    game.mouse.y = touch.clientY - rect.top;
    game.player.targetX = game.mouse.x;
    game.player.targetY = game.mouse.y;
});

// Game functions
function spawnBubble() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(edge) {
        case 0: x = Math.random() * canvas.width; y = -30; break;
        case 1: x = canvas.width + 30; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + 30; break;
        case 3: x = -30; y = Math.random() * canvas.height; break;
    }
    
    const color = game.bubbleColors[Math.floor(Math.random() * game.bubbleColors.length)];
    game.bubbles.push(new Bubble(x, y, color));
}

function spawnObstacle() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(edge) {
        case 0: x = Math.random() * canvas.width; y = -30; break;
        case 1: x = canvas.width + 30; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + 30; break;
        case 3: x = -30; y = Math.random() * canvas.height; break;
    }
    
    game.obstacles.push(new Obstacle(x, y));
}

function spawnPowerUp() {
    const types = ['shield', 'magnet', 'points'];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = 50 + Math.random() * (canvas.width - 100);
    const y = 50 + Math.random() * (canvas.height - 100);
    game.powerups.push(new PowerUp(x, y, type));
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const speed = 3 + Math.random() * 4;
        game.particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            3 + Math.random() * 4,
            30
        ));
    }
    
    // Add sparkles
    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        game.particles.push(new Particle(
            x + (Math.random() - 0.5) * 20,
            y + (Math.random() - 0.5) * 20,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            '#ffdd59',
            16,
            40,
            'sparkle'
        ));
    }
}

function checkCollisions() {
    // Player-bubble collisions
    game.bubbles.forEach((bubble, index) => {
        const dist = Math.hypot(bubble.x - game.player.x, bubble.y - game.player.y);
        if (dist < bubble.radius + game.player.radius && !bubble.collected) {
            bubble.collected = true;
            game.score += 10;
            game.combo++;
            game.comboTimer = 60;
            
            // Bonus points for combo
            if (game.combo > 1) {
                game.score += game.combo * 5;
            }
            
            createExplosion(bubble.x, bubble.y, bubble.color);
            game.bubbles.splice(index, 1);
            
            // Level up every 100 points
            const newLevel = Math.floor(game.score / 100) + 1;
            if (newLevel > game.level) {
                game.level = newLevel;
                // Add sparkle celebration
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 4;
                    game.particles.push(new Particle(
                        game.player.x,
                        game.player.y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#ffd700',
                        12,
                        60,
                        'sparkle'
                    ));
                }
            }
        }
    });
    
    // Player-obstacle collisions
    game.obstacles.forEach(obstacle => {
        const dist = Math.hypot(obstacle.x - game.player.x, obstacle.y - game.player.y);
        if (dist < obstacle.radius + game.player.radius) {
            game.lives--;
            
            // Create damage effect
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 3;
                game.particles.push(new Particle(
                    game.player.x,
                    game.player.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    '#ff4757',
                    4,
                    30
                ));
            }
            
            // Push obstacle away
            const pushAngle = Math.atan2(obstacle.y - game.player.y, obstacle.x - game.player.x);
            obstacle.x += Math.cos(pushAngle) * 50;
            obstacle.y += Math.sin(pushAngle) * 50;
            
            updateHeartsDisplay();
            
            if (game.lives <= 0) {
                gameOver();
            }
        }
    });
    
    // Player-powerup collisions
    game.powerups.forEach((powerup, index) => {
        const dist = Math.hypot(powerup.x - game.player.x, powerup.y - game.player.y);
        if (dist < powerup.radius + game.player.radius && !powerup.collected) {
            powerup.collected = true;
            
            switch (powerup.type) {
                case 'shield':
                    // Temporary invincibility (visual effect)
                    break;
                case 'magnet':
                    // Attract nearby bubbles
                    game.bubbles.forEach(bubble => {
                        const dx = game.player.x - bubble.x;
                        const dy = game.player.y - bubble.y;
                        bubble.vx += dx * 0.01;
                        bubble.vy += dy * 0.01;
                    });
                    break;
                case 'points':
                    game.score += 50;
                    break;
            }
            
            createExplosion(powerup.x, powerup.y, '#ffd700');
            game.powerups.splice(index, 1);
        }
    });
}

function updateHeartsDisplay() {
    const heartsContainer = document.getElementById('hearts');
    heartsContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const heart = document.createElement('span');
        heart.className = 'heart';
        heart.textContent = i < game.lives ? '❤️' : '🖤';
        heartsContainer.appendChild(heart);
    }
}

function updateGame() {
    // Update player position (smooth following)
    const dx = game.player.targetX - game.player.x;
    const dy = game.player.targetY - game.player.y;
    game.player.x += dx * 0.1;
    game.player.y += dy * 0.1;
    
    // Add trail effect
    game.player.trail.push({ x: game.player.x, y: game.player.y, life: 20 });
    game.player.trail = game.player.trail.filter(point => point.life-- > 0);
    
    // Update combo timer
    if (game.comboTimer > 0) {
        game.comboTimer--;
    } else {
        game.combo = 0;
    }
    
    // Update game objects
    game.bubbles.forEach(bubble => bubble.update());
    game.obstacles.forEach(obstacle => obstacle.update());
    game.powerups.forEach(powerup => powerup.update());
    
    // Update particles
    game.particles = game.particles.filter(particle => {
        particle.update();
        return particle.lifetime > 0;
    });
    
    // Spawn new objects
    if (Math.random() < 0.02 + game.level * 0.005) {
        spawnBubble();
    }
    
    if (Math.random() < 0.005 + game.level * 0.002) {
        spawnObstacle();
    }
    
    if (Math.random() < 0.001 && game.powerups.length < 2) {
        spawnPowerUp();
    }
    
    // Remove off-screen objects
    game.bubbles = game.bubbles.filter(bubble => 
        bubble.x > -50 && bubble.x < canvas.width + 50 && 
        bubble.y > -50 && bubble.y < canvas.height + 50
    );
    
    game.obstacles = game.obstacles.filter(obstacle => 
        obstacle.x > -50 && obstacle.x < canvas.width + 50 && 
        obstacle.y > -50 && obstacle.y < canvas.height + 50
    );
    
    checkCollisions();
    
    // Update UI
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
}

function drawGame() {
    // Clear canvas with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw floating stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 45.7) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw particles
    game.particles.forEach(particle => particle.draw());
    
    // Draw player trail
    game.player.trail.forEach((point, index) => {
        const alpha = point.life / 20;
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = game.player.color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, game.player.radius * alpha, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    
    // Draw game objects
    game.bubbles.forEach(bubble => bubble.draw());
    game.obstacles.forEach(obstacle => obstacle.draw());
    game.powerups.forEach(powerup => powerup.draw());
    
    // Draw player (cute fox)
    ctx.save();
    ctx.translate(game.player.x, game.player.y);
    
    // Player glow
    const playerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, game.player.radius * 1.5);
    playerGradient.addColorStop(0, game.player.color + '40');
    playerGradient.addColorStop(1, game.player.color + '00');
    ctx.fillStyle = playerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, game.player.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Fox emoji
    ctx.font = `${game.player.radius * 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦊', 0, 0);
    
    ctx.restore();
    
    // Draw combo indicator
    if (game.combo > 1) {
        ctx.save();
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        const comboText = `COMBO x${game.combo}!`;
        ctx.strokeText(comboText, canvas.width / 2, 150);
        ctx.fillText(comboText, canvas.width / 2, 150);
        ctx.restore();
    }
}

function gameLoop() {
    updateGame();
    drawGame();
    
    if (gameRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    // Reset game state
    game.score = 0;
    game.level = 1;
    game.lives = 3;
    game.bubbles = [];
    game.obstacles = [];
    game.powerups = [];
    game.particles = [];
    game.combo = 0;
    game.comboTimer = 0;
    game.player.x = canvas.width / 2;
    game.player.y = canvas.height / 2;
    game.player.targetX = game.player.x;
    game.player.targetY = game.player.y;
    game.player.trail = [];
    
    updateHeartsDisplay();
    
    // Hide screens
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    
    // Start game
    gameRunning = true;
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('finalLevel').textContent = game.level;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// Event listeners
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', startGame);

// Add floating sparkles to background
function createFloatingSparkles() {
    const sparklesContainer = document.getElementById('sparklesContainer');
    
    setInterval(() => {
        if (sparklesContainer.children.length < 10) {
            const sparkle = document.createElement('div');
            sparkle.className = 'floating-sparkle';
            sparkle.textContent = ['✨', '⭐', '💫'][Math.floor(Math.random() * 3)];
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.animationDuration = (3 + Math.random() * 2) + 's';
            sparklesContainer.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 5000);
        }
    }, 500);
}

createFloatingSparkles();

// Show start screen
document.getElementById('startScreen').style.display = 'flex';