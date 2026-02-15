import * as THREE from 'three';
import Player from './Player.js';
import World from './World.js';

export default class Game {
    constructor() {
        console.log('%cTesting Mode Active: Press G for Gold, L for Items/Jump, Reset Button in Shop', 'color: #00ffff; font-weight: bold; font-size: 1.2rem;');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.world = null;
        this.animationId = null;
        this.clock = new THREE.Clock();
        this.isPlaying = false;
        this.runCoins = 0; // Coins collected in current run
        this.totalGold = parseInt(localStorage.getItem('totalGold')) || 0;
        this.totalJades = parseInt(localStorage.getItem('totalJades')) || 0;

        // Items
        this.inventory = JSON.parse(localStorage.getItem('inventory')) || { magnet: 0, potion: 0 };
        this.hasMagnet = false;
        this.potionActive = false;
        this.potionCharges = 0;
        this.hasUnlockedJump = localStorage.getItem('hasUnlockedJump') === 'true';
        this.hasHorseshoe = localStorage.getItem('hasHorseshoe') === 'true';

        this.magnetActive = false;
        this.magnetTimer = 0;

        this.speed = 10;
        this.speedTimer = 0;

        this.gameIsOver = false;

        // Shake & HitStop
        this.cameraBasePos = new THREE.Vector3(0, 3, 5);
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.isHitStopping = false;
    }

    init() {
        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.02); // Sky Blue Fog

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 3, 5);
        this.camera.lookAt(0, 1, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky Blue Background
        document.body.appendChild(this.renderer.domElement);

        // Lights: Bright Sun
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Brighter ambient
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5); // Stronger sun
        this.dirLight.position.set(10, 20, 10);
        this.dirLight.castShadow = true;
        this.scene.add(this.dirLight);

        // Stars
        this.createStars();
        this.dayTime = 0;

        // Objects
        this.player = new Player(this);
        this.world = new World(this);

        // Event Listeners
        window.addEventListener('resize', () => this.onWindowResize());

        // UI
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.shopScreen = document.getElementById('shop-screen');
        this.pausedScreen = document.getElementById('paused-screen');
        this.bagScreen = document.getElementById('bag-screen');
        this.bagItemsList = document.getElementById('bag-items-list');
        this.notificationEl = document.getElementById('notification');
        this.potionHudEl = document.getElementById('potion-hud');
        this.potionChargesEl = document.getElementById('potion-charges');

        this.hud = document.getElementById('hud');
        this.runGoldValEl = document.getElementById('run-gold-val'); // Numeric span

        this.runGoldOverEl = document.getElementById('run-gold-over'); // Game Over Run Gold
        this.walletOverEl = document.getElementById('wallet-over'); // Game Over Wallet
        this.totalGoldHudEl = document.getElementById('total-gold-hud'); // HUD Wallet
        this.totalJadesHudEl = document.getElementById('total-jades-hud'); // HUD Jades
        this.startGoldEl = document.getElementById('start-total-gold'); // Start Screen Wallet
        this.startJadesEl = document.getElementById('start-total-jades'); // Start Screen Jades

        this.shopGoldEl = document.getElementById('shop-gold');
        this.shopJadesEl = document.getElementById('shop-jades');
        this.btnBuyMagnet = document.getElementById('buy-magnet');
        this.btnBuyPotion = document.getElementById('buy-potion');
        this.btnBuyJump = document.getElementById('buy-jump');

        this.magnetTimerEl = document.getElementById('magnet-timer');
        this.magnetTimeLeftEl = document.getElementById('magnet-time-left');

        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => this.start());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());

        document.getElementById('menu-btn-pause').addEventListener('click', () => this.goToMainMenu());
        document.getElementById('menu-btn-over').addEventListener('click', () => this.goToMainMenu());

        // Mobile Controls
        this.jumpBtnMobile = document.getElementById('jump-btn-mobile');
        this.quickMagnetBtn = document.getElementById('quick-magnet');
        this.quickPotionBtn = document.getElementById('quick-potion');

        document.getElementById('touch-move-left').addEventListener('pointerdown', (e) => {
            this.player.moveLeft();
        });
        document.getElementById('touch-move-right').addEventListener('pointerdown', (e) => {
            this.player.moveRight();
        });

        this.jumpBtnMobile.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.player.jump();
        });

        this.quickMagnetBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.useItem('magnet');
        });
        this.quickPotionBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.useItem('potion');
        });

        // Shop Listeners
        document.getElementById('shop-btn-start').addEventListener('click', () => this.openShop());
        document.getElementById('shop-btn-over').addEventListener('click', () => this.openShop());
        document.getElementById('shop-btn-pause').addEventListener('click', () => this.openShop());
        document.getElementById('skills-btn-start').addEventListener('click', () => this.openShop()); // Redirect to shop
        document.getElementById('shop-back').addEventListener('click', () => this.closeShop());

        document.getElementById('bag-btn').addEventListener('click', () => this.openBag());
        document.getElementById('bag-close').addEventListener('click', () => this.closeBag());

        this.btnBuyMagnet.addEventListener('click', () => {
            if (this.totalGold >= 1) {
                this.totalGold -= 1;
                this.inventory.magnet = (this.inventory.magnet || 0) + 1;
                this.saveData();
                this.updateShopUI();
            }
        });

        this.btnBuyPotion.addEventListener('click', () => {
            if (this.totalGold >= 1) {
                this.totalGold -= 1;
                this.inventory.potion = (this.inventory.potion || 0) + 1;
                this.saveData();
                this.updateShopUI();
            }
        });

        this.btnBuyJump.addEventListener('click', () => {
            if (this.totalGold >= 10 && !this.hasUnlockedJump) {
                this.totalGold -= 10;
                this.hasUnlockedJump = true;
                this.saveData();
                this.updateShopUI();
                this.showNotification('SKILL UNLOCKED: You can now Jump using Spacebar!');
            }
        });

        // NFT Minting
        document.getElementById('mint-horseshoe').addEventListener('click', () => this.mintHorseshoe());

        // Shop Tab Switching
        const tabStore = document.getElementById('tab-store');
        const tabMint = document.getElementById('tab-mint');
        const contentStore = document.getElementById('store-content');
        const contentMint = document.getElementById('mint-content');

        tabStore.addEventListener('click', () => {
            tabStore.classList.add('active');
            tabMint.classList.remove('active');
            contentStore.classList.add('active');
            contentMint.classList.remove('active');
        });

        tabMint.addEventListener('click', () => {
            tabMint.classList.add('active');
            tabStore.classList.remove('active');
            contentMint.classList.add('active');
            contentStore.classList.remove('active');
        });

        // Developer Tools: Reset All
        document.getElementById('reset-all-btn').addEventListener('click', () => {
            if (confirm('Clear all data and start from scratch? This will reload the page.')) {
                localStorage.clear();
                window.location.reload();
            }
        });

        // Keyboard Shortcut for Pause, Items & Cheats
        window.addEventListener('keydown', (e) => {

            if (e.code === 'Digit1') {
                this.useItem('magnet');
            }
            if (e.code === 'Digit2') {
                this.useItem('potion');
            }

            // CHEAT KEYS
            if (e.code === 'KeyG') {
                this.totalGold += 500;
                this.saveData();
                this.updateShopUI();
                if (this.totalGoldHudEl) this.totalGoldHudEl.innerText = this.totalGold;
                this.updateStartUI();
                this.showNotification('+500 GOLD (CHEAT)');
            }
            if (e.code === 'KeyL') {
                this.hasUnlockedJump = true;
                this.totalJades += 200;
                this.inventory.potion = (this.inventory.potion || 0) + 5;
                this.inventory.magnet = (this.inventory.magnet || 0) + 5;
                this.saveData();
                this.updateShopUI();
                this.updateBagUI();
                this.showNotification('ITEMS, JUMP & JADES (CHEAT)');
            }

            if (e.code === 'KeyB' || e.code === 'Escape') {
                if (this.bagScreen.classList.contains('active')) {
                    this.closeBag();
                } else if (this.shopScreen.classList.contains('active')) {
                    this.closeShop();
                } else if (this.pausedScreen.classList.contains('active')) {
                    this.togglePause();
                } else {
                    this.openBag();
                }
            }
        });

        this.updateStartUI();
    }

    updateStartUI() {
        if (this.startGoldEl) {
            this.startGoldEl.innerText = this.totalGold;
        }
        if (this.startJadesEl) {
            this.startJadesEl.innerText = this.totalJades;
        }
    }

    isUIOpen() {
        return this.shopScreen.classList.contains('active') ||
            this.bagScreen.classList.contains('active') ||
            this.pausedScreen.classList.contains('active') ||
            this.startScreen.classList.contains('active') ||
            this.gameOverScreen.classList.contains('active');
    }

    useItem(itemName) {
        if (!this.isPlaying && !this.bagScreen.classList.contains('active')) return;

        if (itemName === 'magnet') {
            if (this.magnetActive) {
                this.showNotification('Item already active!');
                return;
            }
            if (this.inventory.magnet > 0) {
                this.inventory.magnet--;
                this.activateMagnet();
                this.saveData();
                this.updateBagUI();
                if (this.bagScreen.classList.contains('active')) {
                    this.closeBag();
                }
            }
        } else if (itemName === 'potion') {
            if (this.potionActive) {
                this.showNotification('Item already active!');
                return;
            }
            if (this.inventory.potion > 0) {
                this.inventory.potion--;
                this.activatePotion();
                this.saveData();
                this.updateBagUI();
                if (this.bagScreen.classList.contains('active')) {
                    this.closeBag();
                }
            }
        }
        this.updateMobileControlsVisibility();
    }

    activatePotion() {
        this.potionActive = true;
        this.potionCharges = 10;
        this.player.setMetallicSkin(true);
        this.potionHudEl.style.display = 'block';
        this.potionChargesEl.innerText = this.potionCharges;
        this.showNotification('IRON BODY ACTIVATED!');
    }

    activateMagnet() {
        this.magnetActive = true;
        this.magnetTimer = 30;
        this.player.setMagnetEffect(true);
        this.magnetTimerEl.style.display = 'block';
        this.showNotification('MAGNET ACTIVATED!');
    }

    showNotification(text) {
        if (!this.notificationEl) return;
        this.notificationEl.innerText = text;
        this.notificationEl.style.opacity = '1';
        this.notificationEl.style.transform = 'translate(-50%, -200%)';

        setTimeout(() => {
            this.notificationEl.style.opacity = '0';
            this.notificationEl.style.transform = 'translate(-50%, -150%)';
        }, 2000);
    }

    togglePause() {
        if (!this.isPlaying && !this.pausedScreen.classList.contains('active')) return;

        if (this.isPlaying) {
            this.isPlaying = false;
            this.pausedScreen.style.display = 'block';
            setTimeout(() => this.pausedScreen.classList.add('active'), 10);
        } else {
            this.isPlaying = true;
            this.pausedScreen.classList.remove('active');
            setTimeout(() => this.pausedScreen.style.display = 'none', 300);
        }
        this.updateMobileControlsVisibility();
    }

    saveData() {
        localStorage.setItem('totalGold', this.totalGold);
        localStorage.setItem('totalJades', this.totalJades);
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
        localStorage.setItem('hasUnlockedJump', this.hasUnlockedJump);
        localStorage.setItem('hasHorseshoe', this.hasHorseshoe);
    }

    goToMainMenu() {
        this.isPlaying = false;
        this.gameIsOver = false;

        // Hide all game-run screens
        this.pausedScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
        this.bagScreen.classList.remove('active');
        this.hud.classList.add('hidden');

        setTimeout(() => {
            this.pausedScreen.style.display = 'none';
            this.gameOverScreen.style.display = 'none';
            this.bagScreen.style.display = 'none';

            // Show start screen
            this.startScreen.style.display = 'block';
            setTimeout(() => this.startScreen.classList.add('active'), 10);
            this.updateStartUI(); // Update savings view
        }, 300);
    }

    openShop() {
        this.isPlaying = false; // Pause the game in the background

        // Determine which screen we came from
        if (this.gameOverScreen.style.display !== 'none' && this.gameOverScreen.classList.contains('active')) {
            this.previousScreen = this.gameOverScreen;
        } else if (this.pausedScreen.style.display !== 'none' && this.pausedScreen.classList.contains('active')) {
            this.previousScreen = this.pausedScreen;
        } else {
            this.previousScreen = this.startScreen;
        }

        this.previousScreen.classList.remove('active');
        this.previousScreen.style.display = 'none';

        this.shopScreen.style.display = 'block';
        setTimeout(() => this.shopScreen.classList.add('active'), 10);

        this.updateShopUI();
    }

    closeShop() {
        this.shopScreen.classList.remove('active');
        setTimeout(() => {
            this.shopScreen.style.display = 'none';

            if (this.gameIsOver && this.previousScreen === this.gameOverScreen) {
                // Return to game over screen with updated wallet
                this.gameOverScreen.style.display = 'block';
                this.walletOverEl.innerText = this.totalGold; // Update display!
                setTimeout(() => this.gameOverScreen.classList.add('active'), 10);
                this.isPlaying = false;
            } else if (this.previousScreen) {
                this.previousScreen.style.display = 'block';
                setTimeout(() => this.previousScreen.classList.add('active'), 10);
                // If the previous screen was start/paused/gameover, we stay paused
                this.isPlaying = (
                    this.previousScreen !== this.startScreen &&
                    this.previousScreen !== this.pausedScreen &&
                    this.previousScreen !== this.gameOverScreen
                );
            } else {
                // Fallback
                this.startScreen.style.display = 'block';
                setTimeout(() => this.startScreen.classList.add('active'), 10);
                this.isPlaying = false;
            }
            this.updateStartUI();
            this.updateMobileControlsVisibility();
        }, 300);
    }

    updateShopUI() {
        this.shopGoldEl.innerText = this.totalGold;
        this.shopJadesEl.innerText = this.totalJades;
        if (this.totalGoldHudEl) this.totalGoldHudEl.innerText = this.totalGold;
        if (this.totalJadesHudEl) this.totalJadesHudEl.innerText = this.totalJades;

        // Magnet State
        this.btnBuyMagnet.classList.remove('owned');
        this.btnBuyMagnet.innerHTML = "<div>Magnet (30s)</div><div class='price'>1 G</div>";
        this.btnBuyMagnet.disabled = this.totalGold < 1;

        // Potion State
        this.btnBuyPotion.classList.remove('owned');
        this.btnBuyPotion.innerHTML = "<div>Iron Potion</div><div class='price'>1 G</div>";
        this.btnBuyPotion.disabled = this.totalGold < 1;

        // Jump State
        if (this.hasUnlockedJump) {
            this.btnBuyJump.classList.add('owned');
            this.btnBuyJump.innerHTML = "<div>Jump Skill</div><div class='price'>OWNED</div>";
            this.btnBuyJump.disabled = true;
        } else {
            this.btnBuyJump.classList.remove('owned');
            this.btnBuyJump.innerHTML = "<div>Jump Skill</div><div class='price'>10 G</div>";
            this.btnBuyJump.disabled = this.totalGold < 10;
        }

        // NFT Section
        const mintBtn = document.getElementById('mint-horseshoe');
        if (this.hasHorseshoe) {
            mintBtn.classList.add('owned');
            mintBtn.innerHTML = "<div style='font-size: 2.5rem;'>👟</div><div>Horse Shoe</div><div class='price'>NFT VERIFIED</div>";
            mintBtn.disabled = true;
        } else {
            mintBtn.innerHTML = "<div style='font-size: 2.5rem;'>👟</div><div>Horse Shoe</div><div class='price'>MINT (1000G + 100J)</div>";
            mintBtn.disabled = (this.totalGold < 1000 || this.totalJades < 100);
        }

        this.updateMobileControlsVisibility();
    }

    updateMobileControlsVisibility() {
        if (this.jumpBtnMobile) {
            this.jumpBtnMobile.style.display = (this.hasUnlockedJump && this.isPlaying) ? 'flex' : 'none';
        }

        // Update Quick Use Buttons
        if (this.isPlaying) {
            if (this.inventory.magnet > 0) {
                this.quickMagnetBtn.style.display = 'flex';
                this.quickMagnetBtn.querySelector('.count').innerText = `x${this.inventory.magnet}`;
            } else {
                this.quickMagnetBtn.style.display = 'none';
            }

            if (this.inventory.potion > 0) {
                this.quickPotionBtn.style.display = 'flex';
                this.quickPotionBtn.querySelector('.count').innerText = `x${this.inventory.potion}`;
            } else {
                this.quickPotionBtn.style.display = 'none';
            }
        } else {
            this.quickMagnetBtn.style.display = 'none';
            this.quickPotionBtn.style.display = 'none';
        }
    }

    mintHorseshoe() {
        if (this.totalGold >= 1000 && this.totalJades >= 100 && !this.hasHorseshoe) {
            this.totalGold -= 1000;
            this.totalJades -= 100;
            this.hasHorseshoe = true;
            this.saveData();

            // Visual Effect
            const btn = document.getElementById('mint-horseshoe');
            btn.classList.add('mint-glow');
            setTimeout(() => btn.classList.remove('mint-glow'), 1000);

            this.updateShopUI();
            this.showNotification('NFT MINTED: Horse Shoe Collected!');

            // Add charm to player if owned
            if (this.player) this.player.updateCosmetic();
        }
    }

    openBag() {
        if (this.bagScreen.classList.contains('active')) return;

        this.wasPlayingBeforeBag = this.isPlaying;
        this.isPlaying = false;

        // Determine which screen we are coming from
        if (this.gameOverScreen.style.display !== 'none' && this.gameOverScreen.classList.contains('active')) {
            this.previousBagScreen = this.gameOverScreen;
        } else if (this.startScreen.style.display !== 'none' && this.startScreen.classList.contains('active')) {
            this.previousBagScreen = this.startScreen;
        } else if (this.pausedScreen.style.display !== 'none' && this.pausedScreen.classList.contains('active')) {
            this.previousBagScreen = this.pausedScreen;
        } else {
            this.previousBagScreen = null; // From HUD
        }

        if (this.previousBagScreen) {
            this.previousBagScreen.classList.remove('active');
            setTimeout(() => this.previousBagScreen.style.display = 'none', 300);
        }

        this.bagScreen.style.display = 'block';
        setTimeout(() => this.bagScreen.classList.add('active'), 10);
        this.updateBagUI();
    }

    closeBag() {
        this.bagScreen.classList.remove('active');
        setTimeout(() => {
            this.bagScreen.style.display = 'none';

            if (this.previousBagScreen) {
                this.previousBagScreen.style.display = 'block';
                setTimeout(() => this.previousBagScreen.classList.add('active'), 10);
                this.isPlaying = false;
            } else {
                // Return to HUD / Resume state
                this.isPlaying = this.wasPlayingBeforeBag;
            }
            this.updateMobileControlsVisibility();
        }, 300);
    }

    updateBagUI() {
        this.bagItemsList.innerHTML = '';

        // Magnet Item
        if (this.inventory.magnet > 0) {
            const btn = document.createElement('button');
            btn.className = 'item-btn';
            btn.innerHTML = `
                <div style="font-size: 2rem;">🧲</div>
                <div>Magnet (30s)</div>
                <div class="item-count">x${this.inventory.magnet}</div>
                <div class="price">USE</div>
            `;
            btn.onclick = () => {
                this.useItem('magnet');
            };
            this.bagItemsList.appendChild(btn);
        }

        // Potion Item
        if (this.inventory.potion > 0) {
            const btn = document.createElement('button');
            btn.className = 'item-btn';
            btn.innerHTML = `
                <div style="font-size: 2rem;">🧪</div>
                <div>Iron Potion</div>
                <div class="item-count">x${this.inventory.potion}</div>
                <div class="price">USE</div>
            `;
            btn.onclick = () => {
                this.useItem('potion');
            };
            this.bagItemsList.appendChild(btn);
        }

        // NFT Item: Horse Shoe
        if (this.hasHorseshoe) {
            const btn = document.createElement('div');
            btn.className = 'item-btn owned';
            btn.style.borderColor = '#FFD700';
            btn.innerHTML = `
                <div style="font-size: 2rem;">👟</div>
                <div>Horse Shoe</div>
                <div style="font-size: 0.8rem; color: #FFD700; margin-top: 5px; font-weight: bold;">NFT VERIFIED</div>
                <div class="price" style="color: #fff;">EQUIPPED</div>
            `;
            this.bagItemsList.appendChild(btn);
        }

        if (this.bagItemsList.innerHTML === '') {
            this.bagItemsList.innerHTML = '<p>Your bag is empty!</p>';
        }

        // Add a "Main Menu" button ONLY if mid-run to allow quitting
        const footer = document.createElement('div');
        footer.style.marginTop = '20px';

        if (!this.previousBagScreen && !this.gameIsOver) {
            const quitBtn = document.createElement('button');
            quitBtn.innerText = 'Quit to Menu';
            quitBtn.style.fontSize = '1.5rem';
            quitBtn.style.marginRight = '10px';
            quitBtn.onclick = () => {
                this.bagScreen.classList.remove('active');
                setTimeout(() => {
                    this.bagScreen.style.display = 'none';
                    this.isPlaying = false;
                    this.hud.classList.add('hidden');
                    this.startScreen.style.display = 'block';
                    setTimeout(() => this.startScreen.classList.add('active'), 10);
                }, 300);
            };
            this.bagItemsList.appendChild(quitBtn);
        }
    }

    start() {
        this.isPlaying = true;
        this.gameIsOver = false;
        this.runCoins = 0;

        this.speed = 10;
        this.speedTimer = 0;
        this.clock.start();

        // Reset objects
        this.player.reset();

        // Magnet logic moved to useItem, but ensure it's off at start if not active
        this.magnetActive = false;
        this.player.setMagnetEffect(false);
        this.magnetTimerEl.style.display = 'none';

        this.potionActive = false;
        this.potionCharges = 0;
        this.player.setMetallicSkin(false);
        this.potionHudEl.style.display = 'none';

        this.world.reset();
        if (this.totalGoldHudEl) this.totalGoldHudEl.innerText = this.totalGold;
        if (this.totalJadesHudEl) this.totalJadesHudEl.innerText = this.totalJades;

        if (this.player) this.player.updateCosmetic();

        this.updateMobileControlsVisibility();

        // UI
        this.startScreen.style.display = 'none';

        // Ensure Shop is closed/hidden properly
        this.shopScreen.classList.remove('active');
        this.shopScreen.style.display = 'none';

        // Using opacity/display properly with class toggle
        this.startScreen.classList.remove('active');
        this.gameOverScreen.classList.remove('active');
        setTimeout(() => {
            this.startScreen.style.display = 'none';
            this.gameOverScreen.style.display = 'none';
        }, 300);

        this.hud.classList.remove('hidden');

        if (!this.animationId) {
            this.animate();
        }
    }

    gameOver() {
        this.isPlaying = false;
        this.gameIsOver = true;
        this.isHitStopping = false; // Reset hitstop

        // Add Run Coins to Total
        this.totalGold += this.runCoins;
        this.saveData();
        if (this.totalGoldHudEl) this.totalGoldHudEl.innerText = this.totalGold;

        this.runGoldOverEl.innerText = this.runCoins;
        this.walletOverEl.innerText = this.totalGold;

        this.hud.classList.add('hidden');

        this.gameOverScreen.style.display = 'block';
        setTimeout(() => this.gameOverScreen.classList.add('active'), 10);
    }

    update(dt) {
        if (!this.isPlaying) return;

        // Difficulty scaling: Increase speed by 5% every 10 seconds
        this.speedTimer += dt;
        if (this.speedTimer >= 10) {
            this.speed *= 1.05;
            this.speedTimer -= 10;
        }

        // Magnet Timer Logic
        if (this.magnetActive) {
            this.magnetTimer -= dt;
            if (this.magnetTimer <= 0) {
                this.magnetActive = false;
                this.magnetTimer = 0;
                this.player.setMagnetEffect(false);
                this.magnetTimerEl.style.display = 'none';
            } else {
                this.magnetTimeLeftEl.innerText = Math.ceil(this.magnetTimer);
            }
        }

        // Day/Night Cycle
        this.dayTime += dt;
        const cycleLen = 120;
        const t = (this.dayTime % cycleLen) / cycleLen; // 0 to 1

        const colorDay = new THREE.Color(0x87CEEB);
        const colorSunset = new THREE.Color(0xFF8C00);
        const colorNight = new THREE.Color(0x000080);

        let targetColor;
        let starOpacity = 0;
        let sunIntensity = 1.5;
        let sunColor = new THREE.Color(0xffffff);
        let ambIntensity = 0.6;

        // Phase Logic
        if (t < 0.4) { // Day (0 - 40%)
            targetColor = colorDay;
            starOpacity = 0;
            sunIntensity = 1.5;
            ambIntensity = 0.6;
        } else if (t < 0.5) { // Sunset (40% - 50%)
            const p = (t - 0.4) / 0.1; // 0 to 1
            targetColor = colorDay.clone().lerp(colorSunset, p);
            starOpacity = p * 0.3;
            sunIntensity = 1.5 - (p * 0.5);
            ambIntensity = 0.6 - (p * 0.2);
            sunColor.lerp(new THREE.Color(0xffaa00), p);
        } else if (t < 0.9) { // Night (50% - 90%)
            if (t < 0.6) { // Sunset to Night Transition
                const p = (t - 0.5) / 0.1;
                targetColor = colorSunset.clone().lerp(colorNight, p);
                starOpacity = 0.3 + (p * 0.7);
                sunIntensity = 1.0 - (p * 0.7); // Down to 0.3
                ambIntensity = 0.4 - (p * 0.2); // Down to 0.2
                sunColor = new THREE.Color(0xffaa00).lerp(new THREE.Color(0x8888ff), p);
            } else { // Full Night
                targetColor = colorNight;
                starOpacity = 1;
                sunIntensity = 0.3;
                ambIntensity = 0.2;
                sunColor = new THREE.Color(0x8888ff);
            }
        } else { // Sunrise (90% - 100%)
            const p = (t - 0.9) / 0.1;
            targetColor = colorNight.clone().lerp(colorDay, p);
            starOpacity = 1 - p;
            sunIntensity = 0.3 + (p * 1.2);
            ambIntensity = 0.2 + (p * 0.4);
            sunColor = new THREE.Color(0x8888ff).lerp(new THREE.Color(0xffffff), p);
        }

        this.scene.fog.color.copy(targetColor);
        this.renderer.setClearColor(targetColor);
        this.stars.material.opacity = starOpacity;

        this.dirLight.intensity = sunIntensity;
        this.dirLight.color.copy(sunColor);
        this.ambientLight.intensity = ambIntensity;

        this.player.update(dt, this.speed);
        this.world.update(dt, this.speed, this.player.mesh, this.magnetActive);

        // Coin Check
        const magnetRadius = this.magnetActive ? 4.0 : 0; // Much larger radius
        const coinsCollected = this.world.checkCoinCollision(this.player.mesh, magnetRadius);
        if (coinsCollected > 0) {
            this.runCoins += coinsCollected;

            // Pop Logic
            this.hud.classList.add('pop');
            setTimeout(() => {
                this.hud.classList.remove('pop');
            }, 100);
        }

        this.runGoldValEl.innerText = this.runCoins;

        // Collision Check
        const collidedObs = this.world.checkCollisionDetailed(this.player.mesh);
        if (collidedObs) {
            const obsType = collidedObs.userData.type; // 'rock', 'crate', 'hay'

            if (this.potionActive && this.potionCharges > 0 && obsType === 'rock') {
                // Impact Effects
                this.hitStop(0.05);
                this.triggerCameraShake(0.3);

                // Break obstacle
                this.world.breakObstacle(collidedObs);
                this.potionCharges--;
                this.potionChargesEl.innerText = this.potionCharges;

                // Jade Logic: 40% chance
                if (Math.random() < 0.4) {
                    this.totalJades++;
                    this.saveData();
                    if (this.totalJadesHudEl) this.totalJadesHudEl.innerText = this.totalJades;
                    this.showNotification('JADE FRAGMENT FOUND! (+1 JADE)');
                } else {
                    this.showNotification(`STONE SHATTERED! (${this.potionCharges} LEFT)`);
                }

                if (this.potionCharges <= 0) {
                    this.potionActive = false;
                    this.player.setMetallicSkin(false);
                    this.potionHudEl.style.display = 'none';
                    this.showNotification('POTION EXPIRED!');
                }
            } else {
                // Not a rock or no charges: Game Over
                this.gameOver();
            }
        }
    }

    triggerCameraShake(intensity) {
        this.shakeTime = 0.2;
        this.shakeIntensity = intensity;
    }

    hitStop(duration) {
        this.isHitStopping = true;
        setTimeout(() => {
            this.isHitStopping = false;
        }, duration * 1000);
    }

    createStars() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 500;
        const posArray = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 100; // Spread 100 units
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const starMat = new THREE.PointsMaterial({
            size: 0.3,
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            sizeAttenuation: true
        });

        this.stars = new THREE.Points(starGeo, starMat);
        this.stars.position.y = 20; // Lift stars up a bit
        this.scene.add(this.stars);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.isPlaying && !this.isHitStopping) {
            const dt = this.clock.getDelta();
            this.update(dt);
        } else {
            this.clock.getDelta(); // Keep clock updating
        }

        // Camera Shake Update (runs even during hitstop for effect)
        if (this.shakeTime > 0) {
            this.shakeTime -= 0.016; // Approx 60fps
            const currentIntensity = this.shakeIntensity * (this.shakeTime / 0.2);
            this.camera.position.x = this.cameraBasePos.x + (Math.random() - 0.5) * currentIntensity;
            this.camera.position.y = this.cameraBasePos.y + (Math.random() - 0.5) * currentIntensity;
        } else {
            this.camera.position.copy(this.cameraBasePos);
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
