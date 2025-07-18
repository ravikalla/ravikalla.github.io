// Math Adventure Game
const game = {
    score: 0,
    level: 1,
    streak: 0,
    currentProblem: null,
    correctAnswer: 0,
    problemsSolved: 0,
    gameRunning: false,
    characters: ['🐻', '🐰', '🦊', '🐯', '🐸', '🐼'],
    visualItems: ['🍎', '🍌', '🍊', '⭐', '🎈', '🌟', '🔴', '🟡', '🟢', '🟣']
};

// Initialize game
function initGame() {
    updateDisplay();
    createFloatingParticles();
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('nextLevelButton').addEventListener('click', nextLevel);
}

// Create floating particles background
function createFloatingParticles() {
    const container = document.getElementById('particlesContainer');
    
    setInterval(() => {
        if (container.children.length < 8) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = game.visualItems[Math.floor(Math.random() * game.visualItems.length)];
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (4 + Math.random() * 3) + 's';
            container.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 7000);
        }
    }, 800);
}

// Start game
function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('problemContainer').style.display = 'block';
    game.gameRunning = true;
    generateProblem();
}

// Generate math problem based on level
function generateProblem() {
    let num1, num2, operator, problem;
    
    if (game.level <= 3) {
        // Addition (1-5)
        num1 = Math.floor(Math.random() * 5) + 1;
        num2 = Math.floor(Math.random() * 5) + 1;
        operator = '+';
        game.correctAnswer = num1 + num2;
        problem = `${num1} + ${num2} = ?`;
    } else if (game.level <= 6) {
        // Addition (1-10)
        num1 = Math.floor(Math.random() * 8) + 1;
        num2 = Math.floor(Math.random() * 8) + 1;
        operator = '+';
        game.correctAnswer = num1 + num2;
        problem = `${num1} + ${num2} = ?`;
    } else if (game.level <= 9) {
        // Subtraction
        num1 = Math.floor(Math.random() * 10) + 5;
        num2 = Math.floor(Math.random() * num1) + 1;
        operator = '-';
        game.correctAnswer = num1 - num2;
        problem = `${num1} - ${num2} = ?`;
    } else {
        // Simple multiplication
        num1 = Math.floor(Math.random() * 5) + 1;
        num2 = Math.floor(Math.random() * 5) + 1;
        operator = '×';
        game.correctAnswer = num1 * num2;
        problem = `${num1} × ${num2} = ?`;
    }
    
    game.currentProblem = { num1, num2, operator };
    document.getElementById('problemText').textContent = problem;
    
    createVisualAid(num1, num2, operator);
    generateAnswerChoices();
}

// Create visual counting aid
function createVisualAid(num1, num2, operator) {
    const visualAid = document.getElementById('visualAid');
    visualAid.innerHTML = '';
    
    if (operator === '+') {
        // Show visual items for addition
        for (let i = 0; i < num1; i++) {
            const item = document.createElement('div');
            item.className = 'visual-item';
            item.style.setProperty('--delay', `${i * 0.1}s`);
            item.textContent = game.visualItems[0];
            visualAid.appendChild(item);
        }
        
        // Add plus sign
        const plus = document.createElement('div');
        plus.className = 'visual-item';
        plus.style.setProperty('--delay', `${num1 * 0.1}s`);
        plus.textContent = '➕';
        plus.style.fontSize = '30px';
        visualAid.appendChild(plus);
        
        for (let i = 0; i < num2; i++) {
            const item = document.createElement('div');
            item.className = 'visual-item';
            item.style.setProperty('--delay', `${(num1 + 1 + i) * 0.1}s`);
            item.textContent = game.visualItems[1];
            visualAid.appendChild(item);
        }
    } else if (operator === '-') {
        // Show items being taken away
        for (let i = 0; i < num1; i++) {
            const item = document.createElement('div');
            item.className = 'visual-item';
            item.style.setProperty('--delay', `${i * 0.1}s`);
            if (i >= game.correctAnswer) {
                item.style.opacity = '0.3';
                item.style.textDecoration = 'line-through';
            }
            item.textContent = game.visualItems[0];
            visualAid.appendChild(item);
        }
    } else if (operator === '×') {
        // Show groups for multiplication
        for (let group = 0; group < num1; group++) {
            for (let i = 0; i < num2; i++) {
                const item = document.createElement('div');
                item.className = 'visual-item';
                item.style.setProperty('--delay', `${(group * num2 + i) * 0.1}s`);
                item.textContent = game.visualItems[group % game.visualItems.length];
                visualAid.appendChild(item);
            }
            
            if (group < num1 - 1) {
                const separator = document.createElement('div');
                separator.style.width = '100%';
                separator.style.height = '10px';
                visualAid.appendChild(separator);
            }
        }
    }
}

// Generate answer choices
function generateAnswerChoices() {
    const buttons = document.getElementById('answerButtons');
    buttons.innerHTML = '';
    
    const answers = [game.correctAnswer];
    
    // Generate wrong answers
    while (answers.length < 4) {
        let wrongAnswer;
        if (game.correctAnswer <= 10) {
            wrongAnswer = Math.max(0, game.correctAnswer + (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 3) + 1));
        } else {
            wrongAnswer = Math.max(0, game.correctAnswer + (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 5) + 1));
        }
        
        if (!answers.includes(wrongAnswer)) {
            answers.push(wrongAnswer);
        }
    }
    
    // Shuffle answers
    answers.sort(() => Math.random() - 0.5);
    
    // Create buttons
    answers.forEach(answer => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = answer;
        button.addEventListener('click', () => checkAnswer(answer, button));
        buttons.appendChild(button);
    });
}

// Check answer
function checkAnswer(selectedAnswer, button) {
    const allButtons = document.querySelectorAll('.answer-btn');
    allButtons.forEach(btn => btn.disabled = true);
    
    if (selectedAnswer === game.correctAnswer) {
        button.classList.add('correct');
        game.score += (10 + game.streak * 2);
        game.streak++;
        game.problemsSolved++;
        changeCharacter(true);
        
        showPopup('🎉 Correct!', 'Great job! Keep it up!', [], 2000);
        
        setTimeout(() => {
            if (game.problemsSolved >= 5) {
                levelComplete();
            } else {
                generateProblem();
            }
        }, 2000);
    } else {
        button.classList.add('wrong');
        game.streak = 0;
        changeCharacter(false);
        
        // Show correct answer
        allButtons.forEach(btn => {
            if (parseInt(btn.textContent) === game.correctAnswer) {
                btn.classList.add('correct');
            }
        });
        
        showPopup('🤔 Try Again!', `The correct answer was ${game.correctAnswer}. You can do it!`, [], 2000);
        
        setTimeout(() => {
            generateProblem();
        }, 3000);
    }
    
    updateDisplay();
}


// Change character expression
function changeCharacter(isCorrect) {
    const character = document.getElementById('character');
    if (isCorrect) {
        character.textContent = game.characters[Math.floor(Math.random() * game.characters.length)];
        character.style.animation = 'none';
        character.offsetHeight; // Trigger reflow
        character.style.animation = 'characterBounce 0.5s ease 3';
    } else {
        character.style.animation = 'wrongShake 0.6s ease';
        setTimeout(() => {
            character.style.animation = 'characterBounce 3s ease-in-out infinite';
        }, 600);
    }
}

// Level complete
function levelComplete() {
    document.getElementById('levelComplete').style.display = 'flex';
    document.getElementById('problemContainer').style.display = 'none';
    
    // Celebration particles
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createCelebrationParticle();
        }, i * 100);
    }
}

// Create celebration particle
function createCelebrationParticle() {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.fontSize = '30px';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '400';
    particle.textContent = ['🎉', '⭐', '🌟', '✨'][Math.floor(Math.random() * 4)];
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = '-50px';
    
    document.body.appendChild(particle);
    
    const animation = particle.animate([
        { transform: 'translateY(-50px) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight + 50}px) rotate(360deg)`, opacity: 0 }
    ], {
        duration: 3000,
        easing: 'ease-out'
    });
    
    animation.onfinish = () => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    };
}

// Next level
function nextLevel() {
    game.level++;
    game.problemsSolved = 0;
    document.getElementById('levelComplete').style.display = 'none';
    document.getElementById('problemContainer').style.display = 'block';
    generateProblem();
}

// Update display
function updateDisplay() {
    document.getElementById('score').textContent = game.score;
    document.getElementById('level').textContent = game.level;
    document.getElementById('streak').textContent = game.streak;
}

// Custom Popup System
let popupTimeout = null;

function showPopup(title, message, buttons = [], autoClose = 2000) {
    const popup = document.getElementById('gamePopup');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    const popupButtons = document.getElementById('popupButtons');
    
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    popupButtons.innerHTML = '';
    
    // Add buttons if provided
    buttons.forEach((button, index) => {
        const btn = document.createElement('button');
        btn.className = `popup-button ${button.type || ''}`;
        btn.textContent = button.text;
        btn.onclick = button.action;
        btn.tabIndex = 0;
        
        // Add keyboard support
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.action();
            }
        });
        
        popupButtons.appendChild(btn);
        
        // Focus first button
        if (index === 0) {
            setTimeout(() => btn.focus(), 100);
        }
    });
    
    // Show popup
    popup.classList.add('show');
    
    // Handle clicks outside popup to close (if no buttons)
    if (buttons.length === 0) {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                hidePopup();
            }
        });
    }
    
    // Auto close if specified
    if (autoClose && buttons.length === 0) {
        popupTimeout = setTimeout(() => {
            hidePopup();
        }, autoClose);
    }
    
    // Add keyboard support for popup
    document.addEventListener('keydown', handlePopupKeyboard);
}

function hidePopup() {
    const popup = document.getElementById('gamePopup');
    popup.classList.remove('show');
    
    if (popupTimeout) {
        clearTimeout(popupTimeout);
        popupTimeout = null;
    }
    
    document.removeEventListener('keydown', handlePopupKeyboard);
}

function handlePopupKeyboard(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        hidePopup();
    } else if (e.key === 'Enter' || e.key === ' ') {
        const popup = document.getElementById('gamePopup');
        if (popup.classList.contains('show')) {
            const buttons = popup.querySelectorAll('.popup-button');
            if (buttons.length === 0) {
                e.preventDefault();
                hidePopup();
            }
        }
    }
}

// Help System
function showHelp() {
    const helpModal = document.getElementById('helpModal');
    helpModal.classList.add('show');
    
    // Add keyboard support
    document.addEventListener('keydown', handleHelpKeyboard);
    
    // Focus close button
    setTimeout(() => {
        const closeBtn = helpModal.querySelector('.help-close');
        closeBtn.focus();
    }, 100);
}

function hideHelp() {
    const helpModal = document.getElementById('helpModal');
    helpModal.classList.remove('show');
    document.removeEventListener('keydown', handleHelpKeyboard);
}

function handleHelpKeyboard(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        hideHelp();
    }
}

// Enhanced level complete with better navigation
function levelComplete() {
    document.getElementById('levelComplete').style.display = 'none';
    document.getElementById('problemContainer').style.display = 'none';
    
    // Show celebration popup with navigation options
    showPopup(
        '🎉 Level Complete! 🎉',
        `Awesome job! You completed level ${game.level}! Ready for the next challenge?`,
        [
            {
                text: '➡️ Next Level',
                action: () => {
                    hidePopup();
                    nextLevel();
                }
            },
            {
                text: '🏠 Back to Menu',
                type: 'secondary',
                action: () => {
                    hidePopup();
                    window.location.href = '../games.html';
                }
            }
        ]
    );
    
    // Celebration particles
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createCelebrationParticle();
        }, i * 100);
    }
}

// Initialize when page loads
window.addEventListener('load', initGame);