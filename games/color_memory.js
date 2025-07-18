// Color Memory Game
const game = {
    score: 0,
    level: 1,
    streak: 0,
    currentSequence: [],
    userSequence: [],
    colors: [
        { name: 'red', color: '#ff6b6b', sound: 'C' },
        { name: 'blue', color: '#4ecdc4', sound: 'D' },
        { name: 'yellow', color: '#ffd93d', sound: 'E' },
        { name: 'green', color: '#6bcf7f', sound: 'F' },
        { name: 'purple', color: '#a55eea', sound: 'G' },
        { name: 'orange', color: '#ff9f43', sound: 'A' },
        { name: 'pink', color: '#ff6b9d', sound: 'B' },
        { name: 'cyan', color: '#26d0ce', sound: 'C2' }
    ],
    gameState: 'menu', // menu, showing, input, gameover
    showIndex: 0,
    gameRunning: false
};

// Audio context for sound effects
let audioContext;
let oscillator;

// Initialize game
function initGame() {
    updateDisplay();
    createSparkles();
    setupEventListeners();
    initAudio();
}

// Initialize audio
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

// Play sound for color
function playColorSound(color) {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    const notes = { C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.00, A: 440.00, B: 493.88, C2: 523.25 };
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(notes[color.sound], audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Create floating sparkles
function createSparkles() {
    const container = document.getElementById('sparklesContainer');
    
    setInterval(() => {
        if (container.children.length < 12) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.textContent = ['✨', '⭐', '🌟', '💫', '🔮'][Math.floor(Math.random() * 5)];
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.animationDuration = (3 + Math.random() * 2) + 's';
            sparkle.style.color = game.colors[Math.floor(Math.random() * game.colors.length)].color;
            container.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 5000);
        }
    }, 600);
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('playAgainButton').addEventListener('click', startGame);
    document.getElementById('resetButton').addEventListener('click', resetCurrentLevel);
}

// Start game
function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
    
    game.score = 0;
    game.level = 1;
    game.streak = 0;
    game.gameRunning = true;
    
    updateDisplay();
    startLevel();
}

// Start new level
function startLevel() {
    game.currentSequence = [];
    game.userSequence = [];
    game.showIndex = 0;
    
    // Generate sequence based on level
    const sequenceLength = Math.min(2 + game.level, 8);
    const availableColors = game.colors.slice(0, Math.min(4 + Math.floor(game.level / 2), 8));
    
    for (let i = 0; i < sequenceLength; i++) {
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        game.currentSequence.push(randomColor);
    }
    
    showSequence();
}

// Show sequence to player
function showSequence() {
    game.gameState = 'showing';
    document.getElementById('patternDisplay').style.display = 'block';
    document.getElementById('inputDisplay').style.display = 'none';
    document.getElementById('phaseIndicator').textContent = 'Watch carefully...';
    
    const sequenceContainer = document.getElementById('patternSequence');
    sequenceContainer.innerHTML = '';
    
    // Create circles for sequence
    game.currentSequence.forEach((color, index) => {
        const circle = document.createElement('div');
        circle.className = 'color-circle';
        circle.style.backgroundColor = color.color;
        circle.style.opacity = '0.3';
        sequenceContainer.appendChild(circle);
    });
    
    // Show sequence with timing
    setTimeout(() => {
        showNextColor();
    }, 1000);
}

// Show next color in sequence
function showNextColor() {
    if (game.showIndex >= game.currentSequence.length) {
        setTimeout(() => {
            showInputPhase();
        }, 1000);
        return;
    }
    
    const circles = document.querySelectorAll('#patternSequence .color-circle');
    const currentCircle = circles[game.showIndex];
    
    // Light up current color
    currentCircle.style.opacity = '1';
    currentCircle.classList.add('active');
    playColorSound(game.currentSequence[game.showIndex]);
    
    setTimeout(() => {
        currentCircle.style.opacity = '0.3';
        currentCircle.classList.remove('active');
        game.showIndex++;
        
        setTimeout(() => {
            showNextColor();
        }, 300);
    }, 800);
}

// Show input phase
function showInputPhase() {
    game.gameState = 'input';
    document.getElementById('patternDisplay').style.display = 'none';
    document.getElementById('inputDisplay').style.display = 'block';
    document.getElementById('phaseIndicator').textContent = 'Your turn! Click the colors in order.';
    
    createInputButtons();
}

// Create input buttons
function createInputButtons() {
    const inputContainer = document.getElementById('userInput');
    inputContainer.innerHTML = '';
    
    const availableColors = game.colors.slice(0, Math.min(4 + Math.floor(game.level / 2), 8));
    
    availableColors.forEach(color => {
        const button = document.createElement('div');
        button.className = 'input-circle';
        button.style.backgroundColor = color.color;
        button.addEventListener('click', () => handleColorClick(color));
        inputContainer.appendChild(button);
    });
}

// Handle color click
function handleColorClick(clickedColor) {
    if (game.gameState !== 'input') return;
    
    game.userSequence.push(clickedColor);
    playColorSound(clickedColor);
    
    const expectedColor = game.currentSequence[game.userSequence.length - 1];
    
    if (clickedColor.name === expectedColor.name) {
        // Correct color
        const clickedButton = event.target;
        clickedButton.classList.add('correct');
        
        setTimeout(() => {
            clickedButton.classList.remove('correct');
        }, 500);
        
        // Check if sequence is complete
        if (game.userSequence.length === game.currentSequence.length) {
            // Level complete!
            game.score += (100 + game.level * 50 + game.streak * 10);
            game.streak++;
            game.level++;
            
            document.getElementById('phaseIndicator').textContent = '🎉 Perfect! Get ready for the next level...';
            
            setTimeout(() => {
                if (game.level <= 10) {
                    startLevel();
                } else {
                    gameComplete();
                }
            }, 2000);
        }
    } else {
        // Wrong color
        const clickedButton = event.target;
        clickedButton.classList.add('wrong');
        
        game.streak = 0;
        document.getElementById('phaseIndicator').textContent = '❌ Oops! Try again...';
        
        setTimeout(() => {
            clickedButton.classList.remove('wrong');
            resetCurrentLevel();
        }, 1500);
    }
    
    updateDisplay();
}

// Reset current level
function resetCurrentLevel() {
    game.userSequence = [];
    setTimeout(() => {
        showSequence();
    }, 500);
}

// Game complete
function gameComplete() {
    game.gameState = 'gameover';
    document.getElementById('inputDisplay').style.display = 'none';
    document.getElementById('finalScore').textContent = game.score;
    document.getElementById('finalLevel').textContent = game.level - 1;
    document.getElementById('gameOverScreen').style.display = 'flex';
    
    // Victory celebration
    createCelebration();
}

// Create celebration effects
function createCelebration() {
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const celebration = document.createElement('div');
            celebration.style.position = 'absolute';
            celebration.style.fontSize = '40px';
            celebration.style.pointerEvents = 'none';
            celebration.style.zIndex = '300';
            celebration.textContent = ['🎉', '🌟', '✨', '🎊', '🏆'][Math.floor(Math.random() * 5)];
            celebration.style.left = Math.random() * window.innerWidth + 'px';
            celebration.style.top = '-50px';
            
            document.body.appendChild(celebration);
            
            const animation = celebration.animate([
                { transform: 'translateY(-50px) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight + 50}px) rotate(720deg)`, opacity: 0 }
            ], {
                duration: 4000,
                easing: 'ease-out'
            });
            
            animation.onfinish = () => {
                if (celebration.parentNode) {
                    celebration.parentNode.removeChild(celebration);
                }
            };
        }, i * 100);
    }
}

// Update display
function updateDisplay() {
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('streak').textContent = game.streak;
}

// Initialize when page loads
window.addEventListener('load', initGame);

// Handle user interaction for audio context
document.addEventListener('click', () => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}, { once: true });