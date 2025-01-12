class Game {
    constructor() {
        console.log('Game initializing...'); // Debug log
        
        // Get DOM elements
        this.player = document.getElementById('player');
        this.gameArea = document.getElementById('gameArea');
        this.scoreElement = document.getElementById('scoreValue');
        this.finalScoreElement = document.getElementById('finalScore');
        this.mainMenu = document.getElementById('mainMenu');
        this.gameOverScreen = document.getElementById('gameOver');
        this.speedValue = document.getElementById('speedValue');
        this.acoinElement = document.getElementById('acoins');
        
        // Verify all elements are found
        if (!this.player || !this.gameArea || !this.scoreElement || 
            !this.finalScoreElement || !this.mainMenu || !this.gameOverScreen) {
            console.error('Required DOM elements not found!');
            return;
        }
        
        // Initialize game state
        this.score = 0;
        this.isJumping = false;
        this.gameSpeed = 5;
        this.obstacles = [];
        this.coins = [];
        this.gameLoop = null;
        this.currentLane = 1;
        this.maxSpeed = 15;
        this.speedMultiplier = 1;
        this.acoins = parseInt(localStorage.getItem('acoins')) || 0;
        this.currentSkin = localStorage.getItem('currentSkin') || 'default';
        
        // Initialize audio with preload
        this.aySound = new Audio('SFX/ay-ay-aben.mp3');
        this.aySound.preload = 'auto';
        
        // Update displays
        this.updateAcoinDisplay();
        this.updateSpeedDisplay();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('Game initialization complete!'); // Debug log
    }

    setupEventListeners() {
        console.log('Setting up event listeners...'); // Debug log
        
        const startButton = document.getElementById('startButton');
        const restartButton = document.getElementById('restartButton');
        
        if (startButton) {
            startButton.addEventListener('click', () => {
                console.log('Start button clicked');
                this.startGame();
            });
        } else {
            console.error('Start button not found!');
        }
        
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                console.log('Restart button clicked');
                this.startGame();
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.jump();
            } else if (e.code === 'ArrowLeft') {
                this.moveLane(-1);
            } else if (e.code === 'ArrowRight') {
                this.moveLane(1);
            }
        });
        
        console.log('Event listeners set up complete!'); // Debug log
    }

    startGame() {
        console.log('Starting game...'); // Debug log
        
        // Reset game state
        this.reset();
        
        // Hide menus
        this.mainMenu.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        
        // Clear any existing intervals
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.obstacleInterval) clearInterval(this.obstacleInterval);
        if (this.coinInterval) clearInterval(this.coinInterval);
        if (this.speedIncreaseInterval) clearInterval(this.speedIncreaseInterval);
        
        // Start game loops
        this.gameLoop = setInterval(() => this.update(), 20);
        this.obstacleInterval = setInterval(() => this.spawnObstacles(), 2000);
        this.coinInterval = setInterval(() => this.spawnCoins(), 1500);
        this.speedIncreaseInterval = setInterval(() => this.increaseSpeed(), 10000);
        
        // Reset speed values
        this.speedMultiplier = 1;
        this.gameSpeed = 5;
        this.updateSpeedDisplay();
        
        console.log('Game started successfully!'); // Debug log
    }

    reset() {
        this.score = 0;
        this.scoreElement.textContent = '0';
        this.gameSpeed = 5;
        this.obstacles.forEach(obstacle => obstacle.remove());
        this.coins.forEach(coin => coin.element.remove());
        this.obstacles = [];
        this.coins = [];
        this.player.style.bottom = '50px';
        this.currentLane = 1;
        this.player.classList.remove('lane-left', 'lane-right');
        this.player.classList.add('lane-center');
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            let jumpHeight = 0;
            const jumpInterval = setInterval(() => {
                if (jumpHeight >= 100) {
                    clearInterval(jumpInterval);
                    this.fall();
                } else {
                    jumpHeight += 5;
                    this.player.style.bottom = (50 + jumpHeight) + 'px';
                }
            }, 20);
        }
    }

    fall() {
        let currentBottom = parseInt(this.player.style.bottom);
        const fallInterval = setInterval(() => {
            if (currentBottom <= 50) {
                clearInterval(fallInterval);
                this.isJumping = false;
                this.player.style.bottom = '50px';
            } else {
                currentBottom -= 5;
                this.player.style.bottom = currentBottom + 'px';
            }
        }, 20);
    }

    spawnObstacles() {
        const obstacle = document.createElement('div');
        obstacle.classList.add('obstacle');
        const lane = Math.floor(Math.random() * 3);
        obstacle.style.left = (lane === 0 ? '33%' : lane === 1 ? '50%' : '67%');
        obstacle.style.bottom = '1000px';
        obstacle.style.transform = `translate(-50%, 0) translateZ(50px)`;
        this.gameArea.appendChild(obstacle);
        this.obstacles.push(obstacle);
    }

    spawnCoins() {
        const isSuperOrb = Math.random() < 0.05; // 5% chance for +10 subscribers
        const orb = document.createElement('div');
        orb.classList.add('subscriber-orb');
        if (isSuperOrb) orb.classList.add('super-orb');
        
        const lane = Math.floor(Math.random() * 3);
        orb.style.left = (lane === 0 ? '33%' : lane === 1 ? '50%' : '67%');
        orb.style.bottom = '1000px';
        orb.style.transform = `translate(-50%, 0) translateZ(50px)`;
        
        this.gameArea.appendChild(orb);
        this.coins.push({
            element: orb,
            isSuperOrb: isSuperOrb
        });
    }

    update() {
        this.moveObjects();
        this.checkCollisions();
        this.removeOffscreenObjects();
        this.updateScore();
    }

    moveObjects() {
        this.obstacles.forEach(obstacle => {
            const currentBottom = parseInt(obstacle.style.bottom || '1000');
            const newBottom = currentBottom - this.gameSpeed;
            obstacle.style.bottom = `${newBottom}px`;
            obstacle.style.transform = `translate(-50%, 0) translateZ(50px)`;
        });

        this.coins.forEach(coin => {
            const currentBottom = parseInt(coin.element.style.bottom || '1000');
            const newBottom = currentBottom - this.gameSpeed;
            coin.element.style.bottom = `${newBottom}px`;
            coin.element.style.transform = `translate(-50%, 0) translateZ(50px)`;
        });
    }

    checkCollisions() {
        const playerRect = this.player.getBoundingClientRect();
        const playerLane = this.currentLane;
        
        // Check obstacle collisions
        this.obstacles.forEach(obstacle => {
            const obstacleLane = obstacle.style.left === '33%' ? 0 :
                               obstacle.style.left === '50%' ? 1 : 2;
            
            if (playerLane === obstacleLane) {
                const obstacleRect = obstacle.getBoundingClientRect();
                
                if (!(playerRect.bottom < obstacleRect.top || 
                      playerRect.top > obstacleRect.bottom || 
                      playerRect.right < obstacleRect.left || 
                      playerRect.left > obstacleRect.right)) {
                    this.gameOver();
                }
            }
        });

        // Check coin collisions
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const coinLane = coin.element.style.left === '33%' ? 0 :
                            coin.element.style.left === '50%' ? 1 : 2;
            
            if (playerLane === coinLane) {
                const coinRect = coin.element.getBoundingClientRect();
                
                if (!(playerRect.bottom < coinRect.top || 
                      playerRect.top > coinRect.bottom || 
                      playerRect.right < coinRect.left || 
                      playerRect.left > coinRect.right)) {
                    this.collectCoin(coin);
                    this.coins.splice(i, 1);
                }
            }
        }
    }

    removeOffscreenObjects() {
        this.obstacles = this.obstacles.filter(obstacle => {
            if (parseInt(obstacle.style.bottom) < -150) {
                obstacle.remove();
                return false;
            }
            return true;
        });

        this.coins = this.coins.filter(coin => {
            if (parseInt(coin.element.style.bottom) < -50) {
                coin.element.remove();
                return false;
            }
            return true;
        });
    }

    updateScore() {
        if (!this.gameLoop) return; // Don't update score if game is over
        this.score += 0.1;
        this.scoreElement.textContent = Math.floor(this.score);
    }

    gameOver() {
        if (!this.gameLoop) return; // Prevent multiple game over calls
        clearInterval(this.gameLoop);
        clearInterval(this.speedIncreaseInterval);
        this.gameLoop = null;
        this.finalScoreElement.textContent = Math.floor(this.score);
        this.gameOverScreen.classList.remove('hidden');
        this.playSound('game-over');
    }

    playSound(type) {
        // Add sound effects here if desired
        console.log(`Playing ${type} sound`);
    }

    moveLane(direction) {
        if (!this.gameLoop) return;
        
        const newLane = this.currentLane + direction;
        if (newLane >= 0 && newLane <= 2) {
            this.currentLane = newLane;
            this.player.classList.remove('lane-left', 'lane-center', 'lane-right');
            this.player.classList.add(
                this.currentLane === 0 ? 'lane-left' :
                this.currentLane === 1 ? 'lane-center' : 'lane-right'
            );
        }
    }

    increaseSpeed() {
        if (this.gameSpeed < this.maxSpeed) {
            this.gameSpeed += 0.5;
            this.speedMultiplier += 0.1;
            this.updateSpeedDisplay();
        }
    }

    updateSpeedDisplay() {
        this.speedValue.textContent = this.speedMultiplier.toFixed(1);
    }

    collectCoin(coin) {
        const amount = coin.isSuperOrb ? 10 : 1;
        this.acoins += amount;
        localStorage.setItem('acoins', this.acoins);
        
        // Create floating text
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-text';
        floatingText.textContent = `+${amount} ACoins`;
        floatingText.style.left = coin.element.style.left;
        floatingText.style.bottom = coin.element.style.bottom;
        this.gameArea.appendChild(floatingText);
        
        setTimeout(() => floatingText.remove(), 1000);
        
        // Play "Ay Ay ABen!" sound with error handling
        if (this.aySound) {
            this.aySound.currentTime = 0;
            this.aySound.play().catch(error => {
                console.error('Error playing sound:', error);
            });
        } else {
            console.error('Sound not initialized');
        }
        
        // Update displays
        this.updateAcoinDisplay();
        coin.element.remove();
    }

    updateAcoinDisplay() {
        this.acoinElement.textContent = this.acoins;
    }

    openShop() {
        const shopMenu = document.getElementById('shopMenu');
        shopMenu.classList.remove('hidden');
        this.updateShopDisplay();
    }

    updateShopDisplay() {
        const shopMenu = document.getElementById('shopMenu');
        const shopItems = document.getElementById('shopItems');
        shopItems.innerHTML = '';
        
        // Add skins
        SKINS.forEach(skin => {
            const item = document.createElement('div');
            item.className = 'shop-item';
            const isOwned = this.ownsSkin(skin.id);
            const isEquipped = this.currentSkin === skin.id;
            
            item.innerHTML = `
                <div class="skin-preview ${skin.id}"></div>
                <h3>${skin.name}</h3>
                <p>${skin.description}</p>
                ${isOwned 
                    ? `<button ${isEquipped ? 'disabled' : ''} onclick="game.equipSkin('${skin.id}')">
                        ${isEquipped ? 'Equipped' : 'Equip'}
                       </button>`
                    : `<button onclick="game.buySkin('${skin.id}')" 
                        ${this.acoins < skin.price ? 'disabled' : ''}>
                        Buy (${skin.price} ACoins)
                       </button>`
                }
            `;
            shopItems.appendChild(item);
        });

        // Add buttons container if it doesn't exist
        let buttonsContainer = shopMenu.querySelector('.shop-buttons');
        if (!buttonsContainer) {
            buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'shop-buttons';
            shopMenu.appendChild(buttonsContainer);
        }

        // Clear existing buttons
        buttonsContainer.innerHTML = '';

        // Add Play Again and Close buttons
        const playAgainButton = document.createElement('button');
        playAgainButton.textContent = 'Play Again';
        playAgainButton.onclick = () => {
            this.startGame();
            shopMenu.classList.add('hidden');
        };

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.onclick = () => shopMenu.classList.add('hidden');

        buttonsContainer.appendChild(playAgainButton);
        buttonsContainer.appendChild(closeButton);
    }

    ownsSkin(skinId) {
        const ownedSkins = JSON.parse(localStorage.getItem('ownedSkins')) || ['default'];
        return ownedSkins.includes(skinId);
    }

    buySkin(skinId) {
        const skin = SKINS.find(s => s.id === skinId);
        if (this.acoins >= skin.price) {
            this.acoins -= skin.price;
            const ownedSkins = JSON.parse(localStorage.getItem('ownedSkins')) || ['default'];
            ownedSkins.push(skinId);
            localStorage.setItem('ownedSkins', JSON.stringify(ownedSkins));
            localStorage.setItem('acoins', this.acoins);
            this.updateAcoinDisplay();
            this.updateShopDisplay();
        }
    }

    equipSkin(skinId) {
        this.currentSkin = skinId;
        localStorage.setItem('currentSkin', skinId);
        this.updatePlayerSkin();
        this.updateShopDisplay();
    }

    updatePlayerSkin() {
        this.player.className = `player ${this.currentSkin}`;
    }
}

const SKINS = [
    {
        id: 'default',
        name: 'Default ABen',
        description: 'The classic ABen look',
        price: 0
    },
    {
        id: 'neon-aben',
        name: 'Neon ABen',
        description: 'A glowing version of ABen',
        price: 10
    },
    {
        id: 'golden-aben',
        name: 'Golden ABen',
        description: 'The legendary golden ABen',
        price: 50
    },
    {
        id: 'rainbow-aben',
        name: 'Rainbow ABen',
        description: 'ABen but make it rainbow',
        price: 100
    }
];

// Initialize the game when the page loads
let game;
window.addEventListener('load', () => {
    console.log('Page loaded, initializing game...'); // Debug log
    game = new Game();
}); 