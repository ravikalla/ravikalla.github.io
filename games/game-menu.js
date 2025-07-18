// Universal Game Menu Bar Component
// To be included in all games for consistent navigation

function createGameMenuBar() {
    const menuBar = document.createElement('div');
    menuBar.className = 'game-menu-bar';
    menuBar.innerHTML = `
        <div class="menu-bar-content">
            <button class="menu-icon" onclick="showGameMenu()" aria-label="Game Menu" tabindex="0">
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            </button>
            
            <div class="menu-title">
                <span class="game-title-text" id="currentGameTitle">Game</span>
            </div>
            
            <div class="menu-actions">
                <button class="menu-btn" onclick="restartGame()" title="Restart Game" tabindex="0">
                    🔄
                </button>
                <button class="menu-btn" onclick="showHelp()" title="Help" tabindex="0">
                    ❓
                </button>
                <button class="menu-btn" onclick="goToGamesMenu()" title="All Games" tabindex="0">
                    🏠
                </button>
            </div>
        </div>
        
        <!-- Dropdown Menu -->
        <div class="dropdown-menu" id="gameDropdownMenu">
            <div class="dropdown-content">
                <a href="../games.html" class="dropdown-item">
                    <span class="dropdown-icon">🏠</span>
                    <span>All Games</span>
                </a>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" onclick="restartGame()">
                    <span class="dropdown-icon">🔄</span>
                    <span>Restart Game</span>
                </button>
                <button class="dropdown-item" onclick="showHelp()">
                    <span class="dropdown-icon">❓</span>
                    <span>Help</span>
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" onclick="pauseGame()">
                    <span class="dropdown-icon">⏸️</span>
                    <span>Pause</span>
                </button>
                <button class="dropdown-item" onclick="toggleSound()">
                    <span class="dropdown-icon" id="soundIcon">🔊</span>
                    <span>Sound</span>
                </button>
            </div>
        </div>
    `;
    
    // Insert at the beginning of body
    document.body.insertBefore(menuBar, document.body.firstChild);
    
    // Add event listeners
    setupMenuEventListeners();
}

function setupMenuEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('gameDropdownMenu');
        const menuIcon = document.querySelector('.menu-icon');
        
        if (!dropdown.contains(e.target) && !menuIcon.contains(e.target)) {
            hideGameMenu();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideGameMenu();
        }
    });
}

function showGameMenu() {
    const dropdown = document.getElementById('gameDropdownMenu');
    dropdown.classList.add('show');
    
    // Focus first menu item
    setTimeout(() => {
        const firstItem = dropdown.querySelector('.dropdown-item');
        if (firstItem) firstItem.focus();
    }, 100);
}

function hideGameMenu() {
    const dropdown = document.getElementById('gameDropdownMenu');
    dropdown.classList.remove('show');
}

function goToGamesMenu() {
    window.location.href = '../games.html';
}

function restartGame() {
    // This function should be overridden by each game
    if (typeof window.gameRestart === 'function') {
        window.gameRestart();
    } else {
        location.reload();
    }
    hideGameMenu();
}

function pauseGame() {
    // This function should be overridden by each game
    if (typeof window.gamePause === 'function') {
        window.gamePause();
    }
    hideGameMenu();
}

function toggleSound() {
    // This function should be overridden by each game
    if (typeof window.gameToggleSound === 'function') {
        window.gameToggleSound();
    }
    
    // Update icon
    const soundIcon = document.getElementById('soundIcon');
    const isMuted = localStorage.getItem('gameSoundMuted') === 'true';
    
    if (isMuted) {
        localStorage.setItem('gameSoundMuted', 'false');
        soundIcon.textContent = '🔊';
    } else {
        localStorage.setItem('gameSoundMuted', 'true');
        soundIcon.textContent = '🔇';
    }
    
    hideGameMenu();
}

// Initialize menu bar when page loads
document.addEventListener('DOMContentLoaded', () => {
    createGameMenuBar();
    
    // Set game title from page title
    const gameTitle = document.querySelector('#currentGameTitle');
    if (gameTitle) {
        gameTitle.textContent = document.title.split(' - ')[0] || 'Game';
    }
    
    // Initialize sound state
    const soundIcon = document.getElementById('soundIcon');
    const isMuted = localStorage.getItem('gameSoundMuted') === 'true';
    if (isMuted && soundIcon) {
        soundIcon.textContent = '🔇';
    }
});