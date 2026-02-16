import * as THREE from 'three';
import Player from './Player';
import World from './World';

export default class Game {
    scene!: THREE.Scene;
    camera!: THREE.PerspectiveCamera;
    renderer!: THREE.WebGLRenderer;
    player!: Player;
    world!: World;
    animationId: number | null = null;
    clock: THREE.Clock = new THREE.Clock();
    isPlaying: boolean = false;
    runCoins: number = 0;
    totalGold: number = 0;
    totalJades: number = 0;

    inventory: { magnet: number; potion: number };
    hasMagnet: boolean = false;
    potionActive: boolean = false;
    potionTimer: number = 0;
    hasUnlockedJump: boolean = false;
    hasHorseshoe: boolean = false;

    ownedSkins: string[] = [];
    equippedSkin: string = 'Classic Farmer';

    magnetActive: boolean = false;
    magnetTimer: number = 0;

    highScore: number = 0;

    // Skins Data
    skinsData = [
        { name: 'Classic Farmer', price: 0, currency: 'gold', color: '#D2691E', desc: 'A humble start.' },
        { name: 'Iron Knight', price: 150, currency: 'gold', color: '#708090', desc: 'Iron Body Potion lasts 3s longer.' },
        { name: 'Neon Runner', price: 10, currency: 'jades', color: '#00FF00', desc: '+15% Base Speed.' }, // Neon Green
        { name: 'Golden Dash', price: 500, currency: 'gold', color: '#FFD700', desc: '5x Gold Collection!' },
        { name: 'Molten Core', price: 50, currency: 'jades', color: '#FF4500', desc: 'Supernova Dash & Bonus Jades!' }
    ];

    moltenObstacleCount: number = 0;

    speed: number = 10;
    speedTimer: number = 0;

    gameIsOver: boolean = false;

    cameraBasePos: THREE.Vector3 = new THREE.Vector3(0, 3, 5);
    shakeTime: number = 0;
    shakeIntensity: number = 0;
    isHitStopping: boolean = false;

    // Lights
    ambientLight!: THREE.AmbientLight;
    dirLight!: THREE.DirectionalLight;
    stars!: THREE.Points;
    dayTime: number = 0;

    // UI Elements
    startScreen!: HTMLElement;
    gameOverScreen!: HTMLElement;
    shopScreen!: HTMLElement;
    pausedScreen!: HTMLElement;
    bagScreen!: HTMLElement;
    bagItemsList!: HTMLElement;
    guideScreen!: HTMLElement;
    notificationEl!: HTMLElement | null;
    potionHudEl!: HTMLElement;
    potionChargesEl!: HTMLElement;
    hud!: HTMLElement;
    runGoldValEl!: HTMLElement;
    runGoldOverEl!: HTMLElement;
    walletOverEl!: HTMLElement;
    highScoreOverEl!: HTMLElement;
    totalGoldHudEl!: HTMLElement | null;
    totalJadesHudEl!: HTMLElement | null;
    startGoldEl!: HTMLElement | null;
    startJadesEl!: HTMLElement | null;
    startHighScoreEl!: HTMLElement | null;
    shopGoldEl!: HTMLElement;
    shopJadesEl!: HTMLElement;
    btnBuyMagnet!: HTMLButtonElement;
    btnBuyPotion!: HTMLButtonElement;
    btnBuyJump!: HTMLButtonElement;
    magnetTimerEl!: HTMLElement;
    magnetTimeLeftEl!: HTMLElement;
    jumpBtnMobile!: HTMLElement | null;
    quickMagnetBtn!: HTMLElement | null;
    quickPotionBtn!: HTMLElement | null;
    previousScreen: HTMLElement | null = null;
    previousBagScreen: HTMLElement | null = null;
    previousGuideScreen: HTMLElement | null = null;
    wasPlayingBeforeBag: boolean = false;

    constructor() {
        console.log('%cTesting Mode Active: Press G for Gold, L for Items/Jump, Reset Button in Shop', 'color: #00ffff; font-weight: bold; font-size: 1.2rem;');

        this.totalGold = parseInt(localStorage.getItem('totalGold') || '0');
        this.totalJades = parseInt(localStorage.getItem('totalJades') || '0');
        this.highScore = parseInt(localStorage.getItem('highScore') || '0');

        // Items
        this.inventory = JSON.parse(localStorage.getItem('inventory') || '{"magnet": 0, "potion": 0}');
        this.hasUnlockedJump = localStorage.getItem('hasUnlockedJump') === 'true';
        this.hasHorseshoe = localStorage.getItem('hasHorseshoe') === 'true';

        // Skins
        const defaultSkins = ['Classic Farmer'];
        this.ownedSkins = JSON.parse(localStorage.getItem('ownedSkins') || JSON.stringify(defaultSkins));
        this.equippedSkin = localStorage.getItem('equippedSkin') || 'Classic Farmer';
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
        this.startScreen = document.getElementById('start-screen')!;
        this.gameOverScreen = document.getElementById('game-over-screen')!;
        this.shopScreen = document.getElementById('shop-screen')!;
        this.pausedScreen = document.getElementById('paused-screen')!;
        this.bagScreen = document.getElementById('bag-screen')!;
        this.bagItemsList = document.getElementById('bag-items-list')!;
        this.guideScreen = document.getElementById('guide-screen')!;
        this.notificationEl = document.getElementById('notification');
        this.potionHudEl = document.getElementById('potion-hud')!;
        this.potionChargesEl = document.getElementById('potion-charges')!;

        this.hud = document.getElementById('hud')!;
        this.runGoldValEl = document.getElementById('run-gold-val')!; // Numeric span

        this.runGoldOverEl = document.getElementById('run-gold-over')!; // Game Over Run Gold
        this.walletOverEl = document.getElementById('wallet-over')!; // Game Over Wallet
        this.highScoreOverEl = document.getElementById('high-score-over')!; // Game Over High Score
        this.totalGoldHudEl = document.getElementById('total-gold-hud'); // HUD Wallet
        this.totalJadesHudEl = document.getElementById('total-jades-hud'); // HUD Jades
        this.startGoldEl = document.getElementById('start-total-gold'); // Start Screen Wallet
        this.startJadesEl = document.getElementById('start-total-jades'); // Start Screen Jades
        this.startHighScoreEl = document.getElementById('start-high-score'); // High Score
        this.shopGoldEl = document.getElementById('shop-gold')!;
        this.shopJadesEl = document.getElementById('shop-jades')!;
        this.btnBuyMagnet = document.getElementById('buy-magnet') as HTMLButtonElement;
        this.btnBuyPotion = document.getElementById('buy-potion') as HTMLButtonElement;
        this.btnBuyJump = document.getElementById('buy-jump') as HTMLButtonElement;

        this.magnetTimerEl = document.getElementById('magnet-timer')!;
        this.magnetTimeLeftEl = document.getElementById('magnet-time-left')!;

        document.getElementById('start-btn')!.addEventListener('click', () => this.start());
        document.getElementById('restart-btn')!.addEventListener('click', () => this.start());
        document.getElementById('resume-btn')!.addEventListener('click', () => this.togglePause());

        document.getElementById('menu-btn-pause')!.addEventListener('click', () => this.goToMainMenu());
        document.getElementById('menu-btn-over')!.addEventListener('click', () => this.goToMainMenu());

        // Mobile Controls
        this.jumpBtnMobile = document.getElementById('jump-btn-mobile');
        this.quickMagnetBtn = document.getElementById('quick-magnet');
        this.quickPotionBtn = document.getElementById('quick-potion');

        document.getElementById('touch-move-left')!.addEventListener('pointerdown', (e) => {
            this.player.moveLeft();
        });
        document.getElementById('touch-move-right')!.addEventListener('pointerdown', (e) => {
            this.player.moveRight();
        });

        this.jumpBtnMobile?.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.player.jump();
        });

        this.quickMagnetBtn?.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.useItem('magnet');
        });
        this.quickPotionBtn?.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.useItem('potion');
        });

        // Shop Listeners
        document.getElementById('shop-btn-start')!.addEventListener('click', () => this.openShop());
        document.getElementById('shop-btn-over')!.addEventListener('click', () => this.openShop());
        document.getElementById('shop-btn-pause')!.addEventListener('click', () => this.openShop());
        document.getElementById('skills-btn-start')!.addEventListener('click', () => this.openShop()); // Redirect to shop
        document.getElementById('shop-back')!.addEventListener('click', () => this.closeShop());

        document.getElementById('bag-btn')!.addEventListener('click', () => this.openBag());
        document.getElementById('bag-close')!.addEventListener('click', () => this.closeBag());

        document.getElementById('guide-btn-start')!.addEventListener('click', () => this.openGuide());
        document.getElementById('guide-btn-pause')!.addEventListener('click', () => this.openGuide());
        document.getElementById('guide-close')!.addEventListener('click', () => this.closeGuide());

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
        document.getElementById('mint-horseshoe')!.addEventListener('click', () => this.mintHorseshoe());

        // Shop Tab Switching
        const tabStore = document.getElementById('tab-store')!;
        const tabSkins = document.getElementById('tab-skins')!;
        const tabMint = document.getElementById('tab-mint')!;
        const contentStore = document.getElementById('store-content')!;
        const contentSkins = document.getElementById('skins-content')!;
        const contentMint = document.getElementById('mint-content')!;

        const switchTab = (tab: HTMLElement, content: HTMLElement) => {
            [tabStore, tabSkins, tabMint].forEach(t => t.classList.remove('active'));
            [contentStore, contentSkins, contentMint].forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            content.classList.add('active');
            if (tab === tabSkins) this.renderSkinsShop();
        };

        tabStore.addEventListener('click', () => switchTab(tabStore, contentStore));
        tabSkins.addEventListener('click', () => switchTab(tabSkins, contentSkins));
        tabMint.addEventListener('click', () => switchTab(tabMint, contentMint));

        // Developer Tools: Reset All
        document.getElementById('reset-all-btn')!.addEventListener('click', () => {
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
                if (this.totalGoldHudEl) this.totalGoldHudEl.innerText = this.totalGold.toString();
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
            this.startGoldEl.innerText = this.totalGold.toString();
        }
        if (this.startJadesEl) {
            this.startJadesEl.innerText = this.totalJades.toString();
        }
        if (this.startHighScoreEl) {
            this.startHighScoreEl.innerText = this.highScore.toString();
        }
    }

    isUIOpen() {
        return this.shopScreen.classList.contains('active') ||
            this.bagScreen.classList.contains('active') ||
            this.guideScreen.classList.contains('active') ||
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

        let duration = 10; // Base duration seconds
        if (this.equippedSkin === 'Iron Knight') {
            duration += 3; // Exactly +3s
            this.showNotification('IRON KNIGHT BONUS: +3s Potion!');
        }

        this.potionTimer = duration;
        this.player.setMetallicSkin(true);
        this.potionHudEl.style.display = 'block';
        this.potionChargesEl.innerText = Math.ceil(this.potionTimer).toString();
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
        localStorage.setItem('totalGold', this.totalGold.toString());
        localStorage.setItem('totalJades', this.totalJades.toString());
        localStorage.setItem('highScore', this.highScore.toString());
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
        localStorage.setItem('hasUnlockedJump', this.hasUnlockedJump.toString());
        localStorage.setItem('hasHorseshoe', this.hasHorseshoe.toString());
        localStorage.setItem('ownedSkins', JSON.stringify(this.ownedSkins));
        localStorage.setItem('equippedSkin', this.equippedSkin);
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
                this.walletOverEl.innerText = this.totalGold.toString(); // Update display!
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
        this.shopGoldEl.innerText = this.totalGold.toString();
        this.shopJadesEl.innerText = this.totalJades.toString();
        if (this.totalGoldHudEl) this.totalGoldHudEl.innerText = this.totalGold.toString();
        if (this.totalJadesHudEl) this.totalJadesHudEl.innerText = this.totalJades.toString();

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
        const mintBtn = document.getElementById('mint-horseshoe') as HTMLButtonElement;
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
                this.quickMagnetBtn!.style.display = 'flex';
                (this.quickMagnetBtn!.querySelector('.count') as HTMLElement).innerText = `x${this.inventory.magnet}`;
            } else {
                this.quickMagnetBtn!.style.display = 'none';
            }

            if (this.inventory.potion > 0) {
                this.quickPotionBtn!.style.display = 'flex';
                (this.quickPotionBtn!.querySelector('.count') as HTMLElement).innerText = `x${this.inventory.potion}`;
            } else {
                this.quickPotionBtn!.style.display = 'none';
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

    renderSkinsShop() {
        const list = document.getElementById('skins-list')!;
        list.innerHTML = '';

        this.skinsData.forEach(skin => {
            const btn = document.createElement('button');
            btn.className = 'item-btn';
            if (skin.name === 'Molten Core') btn.classList.add('molten-border');

            // Preview Circle
            const preview = document.createElement('div');
            preview.style.width = '40px';
            preview.style.height = '40px';
            preview.style.borderRadius = '50%';
            preview.style.backgroundColor = skin.color;
            preview.style.marginBottom = '5px';
            preview.style.border = '2px solid #fff';

            const nameDiv = document.createElement('div');
            nameDiv.innerText = skin.name;

            const priceDiv = document.createElement('div');
            priceDiv.className = 'price';

            // Status Logic
            const isOwned = this.ownedSkins.includes(skin.name);
            const isEquipped = this.equippedSkin === skin.name;

            if (isEquipped) {
                btn.classList.add('owned');
                priceDiv.innerText = 'EQUIPPED';
                btn.disabled = true;
            } else if (isOwned) {
                priceDiv.innerText = 'OWNED';
                btn.onclick = () => this.equipSkin(skin.name);
            } else {
                if (skin.currency === 'gold') {
                    priceDiv.innerHTML = `${skin.price} G`;
                    if (this.totalGold < skin.price) btn.disabled = true;
                } else {
                    priceDiv.innerHTML = `<span style="color:#4CAF50">${skin.price} J</span>`;
                    if (this.totalJades < skin.price) btn.disabled = true;
                }

                btn.onclick = () => this.buySkin(skin);
            }

            const descDiv = document.createElement('div');
            descDiv.style.fontSize = '0.7rem';
            descDiv.style.opacity = '0.7';
            descDiv.innerText = skin.desc || '';

            btn.appendChild(preview);
            btn.appendChild(nameDiv);
            btn.appendChild(descDiv);
            btn.appendChild(priceDiv);
            list.appendChild(btn);
        });
    }

    buySkin(skin: any) {
        if (skin.currency === 'gold') {
            if (this.totalGold >= skin.price) {
                this.totalGold -= skin.price;
                this.completeSkinPurchase(skin.name);
            }
        } else {
            if (this.totalJades >= skin.price) {
                this.totalJades -= skin.price;
                this.completeSkinPurchase(skin.name);
            }
        }
    }

    completeSkinPurchase(skinName: string) {
        this.ownedSkins.push(skinName);
        this.showNotification('SKIN UNLOCKED!');
        this.saveData();
        this.updateShopUI(); // Updates top bar
        this.renderSkinsShop(); // Re-renders buttons
    }

    equipSkin(skinName: string) {
        this.equippedSkin = skinName;
        this.saveData();
        this.player.setSkin(skinName);
        this.renderSkinsShop();
        this.showNotification('EQUIPPED!');
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

        // Neon Runner Ability: +15% Speed
        if (this.equippedSkin === 'Neon Runner') {
            this.speed *= 1.15;
            // this.showNotification('SPEED BOOST ACTIVE!'); // Optional
        }

        this.speedTimer = 0;
        this.clock.start();

        // Reset objects
        this.player.reset();

        // Magnet logic moved to useItem, but ensure it's off at start if not active
        this.magnetActive = false;
        this.player.setMagnetEffect(false);
        this.magnetTimerEl.style.display = 'none';

        this.potionActive = false;
        this.potionTimer = 0;
        this.player.setMetallicSkin(false);
        this.potionHudEl.style.display = 'none';

        this.world.reset();
        if (this.totalGoldHudEl) this.totalGoldHudEl.innerText = this.totalGold.toString();
        if (this.totalJadesHudEl) this.totalJadesHudEl.innerText = this.totalJades.toString();

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

    openGuide() {
        this.isPlaying = false;

        // Determine which screen we are coming from
        if (this.pausedScreen.style.display !== 'none' && this.pausedScreen.classList.contains('active')) {
            this.previousGuideScreen = this.pausedScreen;
        } else if (this.startScreen.style.display !== 'none' && this.startScreen.classList.contains('active')) {
            this.previousGuideScreen = this.startScreen;
        } else {
            this.previousGuideScreen = null;
        }

        if (this.previousGuideScreen) {
            this.previousGuideScreen.classList.remove('active');
            setTimeout(() => this.previousGuideScreen!.style.display = 'none', 300);
        }

        this.guideScreen.style.display = 'block';
        setTimeout(() => this.guideScreen.classList.add('active'), 10);
    }

    closeGuide() {
        this.guideScreen.classList.remove('active');
        setTimeout(() => {
            this.guideScreen.style.display = 'none';

            if (this.previousGuideScreen) {
                this.previousGuideScreen.style.display = 'block';
                setTimeout(() => this.previousGuideScreen!.classList.add('active'), 10);
                this.isPlaying = false;
            } else {
                // Return to HUD / Resume state if for some reason we came from nowhere
                this.isPlaying = true;
            }
        }, 300);
    }

    gameOver() {
        this.isPlaying = false;
        this.gameIsOver = true;
        this.clock.stop();

        if (this.runCoins > this.highScore) {
            this.highScore = this.runCoins;
            this.showNotification('NEW HIGH SCORE!');
        }

        // Add Run Coins to Total
        this.totalGold += this.runCoins;
        this.saveData();
        if (this.totalGoldHudEl) this.totalGoldHudEl.innerText = this.totalGold.toString();

        this.runGoldOverEl.innerText = this.runCoins.toString();
        this.walletOverEl.innerText = this.totalGold.toString();
        this.highScoreOverEl.innerText = this.highScore.toString();

        this.gameOverScreen.style.display = 'block';
        setTimeout(() => this.gameOverScreen.classList.add('active'), 10);
        this.hud.classList.add('hidden');
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
                this.magnetTimeLeftEl.innerText = Math.ceil(this.magnetTimer).toString();
            }
        }

        // Potion Timer Logic
        if (this.potionActive) {
            this.potionTimer -= dt;
            if (this.potionTimer <= 0) {
                this.potionActive = false;
                this.potionTimer = 0;
                this.player.setMetallicSkin(false);
                this.potionHudEl.style.display = 'none';
                this.showNotification('IRON BODY ENDED');
            } else {
                this.potionChargesEl.innerText = Math.ceil(this.potionTimer).toString();
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

        this.scene.fog!.color.copy(targetColor);
        this.renderer.setClearColor(targetColor);
        (this.stars.material as THREE.Material).opacity = starOpacity;

        this.dirLight.intensity = sunIntensity;
        this.dirLight.color.copy(sunColor);
        this.ambientLight.intensity = ambIntensity;

        this.player.update(dt, this.speed);
        this.world.update(dt, this.speed, this.player.mesh, this.magnetActive);

        // Coin Check
        const magnetRadius = this.magnetActive ? 4.0 : 0; // Much larger radius
        let coinsCollected = this.world.checkCoinCollision(this.player.mesh, magnetRadius);

        // Golden Dash Ability: 5x Gold
        if (this.equippedSkin === 'Golden Dash' && coinsCollected > 0) {
            coinsCollected *= 5;
        }

        // NFT Horse Shoe: +25% Gold
        if (this.hasHorseshoe && coinsCollected > 0) {
            coinsCollected = Math.round(coinsCollected * 1.25);
        }

        if (coinsCollected > 0) {
            this.runCoins += coinsCollected;
            this.runGoldValEl.innerText = this.runCoins.toString();

            // Pop Logic
            this.hud.classList.add('pop');
            setTimeout(() => {
                this.hud.classList.remove('pop');
            }, 100);
        }

        // Collision Check
        let collisionRadiusExp = 0;
        if (this.equippedSkin === 'Molten Core' && this.potionActive) {
            collisionRadiusExp = 1.0; // Supernova Dash: Larger destruction radius
        }

        const obs = this.world.checkCollisionDetailed(this.player.mesh, collisionRadiusExp);
        if (obs) {
            if (this.potionActive) { // Potion is active, absorb hit
                this.showNotification('SUPERNOVA!');

                // Shake Camera
                this.shakeIntensity = 0.5;
                this.shakeTime = 0.5;

                // Play break effect
                this.world.breakObstacle(obs);

                // Jade Drop Logic (All Obstacles)
                this.checkJadeDrop(obs.position);

                // Molten Core Bonus
                if (this.equippedSkin === 'Molten Core') {
                    this.moltenObstacleCount++;
                    if (this.moltenObstacleCount >= 10) {
                        this.totalJades += 5;
                        this.saveData();
                        this.showNotification('+5 JADE BONUS (MOLTEN)');
                        this.moltenObstacleCount = 0;
                        if (this.totalJadesHudEl) this.totalJadesHudEl.innerText = this.totalJades.toString();
                        this.showFloatingText('BONUS JADES!', this.player.mesh.position, '#FFD700');
                    }
                }
            } else {
                // Game Over
                this.gameOver();
            }
        }
    }

    checkJadeDrop(pos: THREE.Vector3) {
        if (Math.random() < 0.65) { // 65% Jade Drop Chance
            this.totalJades++;
            this.saveData();
            this.showFloatingText('+1 JADE', pos, '#4CAF50');
            if (this.totalJadesHudEl) this.totalJadesHudEl.innerText = this.totalJades.toString();
        }
    }

    showFloatingText(text: string, pos: THREE.Vector3, color: string) {
        const div = document.createElement('div');
        div.innerText = text;
        div.style.position = 'absolute';
        div.style.color = color;
        div.style.fontWeight = 'bold';
        div.style.fontSize = '24px';
        div.style.pointerEvents = 'none';
        div.style.textShadow = '0 0 10px ' + color;
        div.style.transition = 'all 1s ease-out';
        div.style.zIndex = '1000';
        div.style.fontFamily = 'Arial, sans-serif';

        // Project position to screen
        const vector = pos.clone();
        vector.project(this.camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

        div.style.left = `${x}px`;
        div.style.top = `${y}px`;

        document.body.appendChild(div);

        // Animate
        requestAnimationFrame(() => {
            div.style.transform = 'translateY(-100px)';
            div.style.opacity = '0';
        });

        setTimeout(() => {
            div.remove();
        }, 1000);
    }

    triggerCameraShake(intensity: number) {
        this.shakeTime = 0.2;
        this.shakeIntensity = intensity;
    }

    hitStop(duration: number) {
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
