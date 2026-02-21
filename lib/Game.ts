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
    runDistance: number = 0;
    totalGold: number = 0;
    totalJades: number = 0;
    totalDistance: number = 0;

    inventory: { magnet: number; potion: number };
    hasMagnet: boolean = false;
    potionActive: boolean = false;
    potionTimer: number = 0;
    hasUnlockedJump: boolean = true;
    hasHorseshoe: boolean = false;

    ownedSkins: string[] = [];
    equippedSkin: string = 'Classic Farmer';

    magnetActive: boolean = false;
    magnetTimer: number = 0;

    highScore: number = 0;

    // Skins Dataa
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
    shakeFrequency: number = 60;
    MAX_SHAKE_INTENSITY: number = 1.0;
    isHitStopping: boolean = false;

    // Lights
    ambientLight!: THREE.AmbientLight;
    dirLight!: THREE.DirectionalLight;
    stars!: THREE.Points;
    sunMesh!: THREE.Mesh;
    moonMesh!: THREE.Mesh;
    sunFlare!: THREE.Mesh;
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

    magnetTimerEl!: HTMLElement;
    magnetTimeLeftEl!: HTMLElement;
    jumpBtnMobile!: HTMLElement | null;
    quickMagnetBtn!: HTMLElement | null;
    quickPotionBtn!: HTMLElement | null;
    distanceHudEl!: HTMLElement;
    distanceOverEl!: HTMLElement;
    startTotalDistEl!: HTMLElement;
    previousScreen: HTMLElement | null = null;
    previousBagScreen: HTMLElement | null = null;
    previousGuideScreen: HTMLElement | null = null;
    wasPlayingBeforeBag: boolean = false;

    // Revive System
    reviveCount: number = 0;
    reviveTimer: number = 0;
    reviveInterval: any = null;
    reviveBtn!: HTMLButtonElement;
    reviveCountdownEl!: HTMLElement;

    // Quest System
    quests: any[] = [];
    questsScreen!: HTMLElement;
    questsListEl!: HTMLElement;
    questProgress: { [key: string]: number } = {};

    // Audio
    bgm!: HTMLAudioElement;
    menuBgm!: HTMLAudioElement;
    currentBgm: HTMLAudioElement | null = null;
    isMuted: boolean = false;
    musicFadeInterval: any = null;

    // SFX
    coinSfx!: HTMLAudioElement;
    jumpSfx!: HTMLAudioElement;
    jadeSfx!: HTMLAudioElement;
    breakSfx!: HTMLAudioElement;

    constructor() {
        console.log('%cTesting Mode Active: Press G for Gold, L for Items/Jump, Reset Button in Shop', 'color: #00ffff; font-weight: bold; font-size: 1.2rem;');

        this.totalGold = parseInt(localStorage.getItem('totalGold') || '0');
        this.totalJades = parseInt(localStorage.getItem('totalJades') || '0');
        this.totalDistance = parseInt(localStorage.getItem('totalDistance') || '0');
        this.highScore = parseInt(localStorage.getItem('highScore') || '0');

        // Items
        this.inventory = JSON.parse(localStorage.getItem('inventory') || '{"magnet": 0, "potion": 0}');
        this.hasUnlockedJump = true; // Always unlocked now
        this.hasHorseshoe = localStorage.getItem('hasHorseshoe') === 'true';
        this.isMuted = localStorage.getItem('isMuted') === 'true';

        // Skins
        const defaultSkins = ['Classic Farmer'];
        this.ownedSkins = JSON.parse(localStorage.getItem('ownedSkins') || JSON.stringify(defaultSkins));
        this.equippedSkin = localStorage.getItem('equippedSkin') || 'Classic Farmer';

        this.initQuests();
    }

    initQuests() {
        const today = new Date().toDateString();
        const savedDay = localStorage.getItem('questDate');

        // Quests Definitions
        this.quests = [
            { id: 'stones', title: 'Break 20 Stones', goal: 20, reward: 50, type: 'stones' },
            { id: 'distance', title: 'Reach 3,000m in one run', goal: 3000, reward: 100, type: 'distance' },
            { id: 'jades', title: 'Collect 5 Jades', goal: 5, reward: 150, type: 'jades' }
        ];

        if (savedDay !== today) {
            this.questProgress = { stones: 0, distance: 0, jades: 0 };
            localStorage.setItem('questDate', today);
            localStorage.setItem('questProgress', JSON.stringify(this.questProgress));
            localStorage.setItem('questsClaimed', JSON.stringify({}));
        } else {
            this.questProgress = JSON.parse(localStorage.getItem('questProgress') || '{"stones": 0, "distance": 0, "jades": 0}');
        }

        this.questsClaimed = JSON.parse(localStorage.getItem('questsClaimed') || '{}');
    }

    questsClaimed: { [key: string]: boolean } = {};

    // Weather System
    weatherType: 'none' | 'storm' | 'sandstorm' | 'bloodmoon' = 'none';
    weatherTimer: number = 0;
    weatherCycleTimer: number = 30;
    thunderSfx!: HTMLAudioElement;
    weatherOverlayEl!: HTMLElement;
    lightningTimer: number = 0;

    init() {
        // Audio Setup
        this.bgm = new Audio('https://freetestdata.com/wp-content/uploads/2021/09/Free_Test_Data_1MB_MP3.mp3');
        this.bgm.loop = true;
        this.bgm.volume = this.isMuted ? 0 : 0.6;
        this.bgm.onerror = () => console.error('Audio Source Missing: BGM');

        this.menuBgm = new Audio('https://www.chosic.com/wp-content/uploads/2021/07/Country-Village.mp3');
        this.menuBgm.loop = true;
        this.menuBgm.volume = this.isMuted ? 0 : 0.6;
        this.menuBgm.onerror = () => console.error('Audio Source Missing: Menu BGM');

        this.thunderSfx = new Audio('https://www.soundjay.com/nature/sounds/thunder-crack-01.mp3');
        this.thunderSfx.volume = 0.8;
        this.thunderSfx.onerror = () => console.error('Audio Source Missing: Thunder SFX');

        this.coinSfx = new Audio('https://www.soundjay.com/buttons/sounds/button-35.mp3');
        this.coinSfx.volume = 1.0;
        this.coinSfx.onerror = () => console.error('Audio Source Missing: Coin SFX');

        this.jumpSfx = new Audio('https://www.soundjay.com/buttons/sounds/button-27.mp3');
        this.jumpSfx.volume = 1.0;
        this.jumpSfx.preload = 'auto';
        this.jumpSfx.onerror = () => { console.error('Audio Source Missing: Jump SFX'); this.playSfx('jump'); };

        this.jadeSfx = new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3');
        this.jadeSfx.volume = 1.0; // Max HTML volume is 1.0
        this.jadeSfx.preload = 'auto';
        this.jadeSfx.onerror = () => { console.error('Audio Source Missing: Jade SFX'); this.playSfx('jade'); };

        this.breakSfx = new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3');
        this.breakSfx.volume = 1.0;
        this.breakSfx.preload = 'auto';
        this.breakSfx.onerror = () => { console.error('Audio Source Missing: Break SFX'); this.playSfx('break'); };

        // Auto-play on first interaction & Resume AudioContext
        const startAudio = () => {
            const context = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (context) {
                const audioCtx = new context();
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
            }

            // Persistence: Start BOTH tracks now, but at zero volume
            this.bgm.volume = 0;
            this.menuBgm.volume = 0;
            this.bgm.play().catch(() => { });
            this.menuBgm.play().catch(() => { });

            if (!this.isPlaying) {
                this.switchMusic('menu');
            } else {
                this.switchMusic('game');
            }
            this.updateMusicButtons();
            window.removeEventListener('mousedown', startAudio);
            window.removeEventListener('keydown', startAudio);
            window.removeEventListener('touchstart', startAudio);
        };
        window.addEventListener('mousedown', startAudio);
        window.addEventListener('keydown', startAudio);
        window.addEventListener('touchstart', startAudio);

        document.getElementById('music-toggle-start')!.addEventListener('click', () => this.toggleMusic());
        document.getElementById('music-toggle-pause')!.addEventListener('click', () => this.toggleMusic());

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

        this.weatherOverlayEl = document.getElementById('weather-overlay')!;

        // Lights: Bright Sun
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Brighter ambient
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5); // Stronger sun
        this.dirLight.position.set(10, 20, 10);
        this.dirLight.castShadow = true;
        this.scene.add(this.dirLight);

        // Sun Mesh
        const sunGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.scene.add(this.sunMesh);

        // Sun Flare (Subtle)
        const flareGeo = new THREE.SphereGeometry(2.5, 32, 32);
        const flareMat = new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true, opacity: 0.2 });
        this.sunFlare = new THREE.Mesh(flareGeo, flareMat);
        this.sunMesh.add(this.sunFlare);

        // Moon Mesh
        const moonGeo = new THREE.SphereGeometry(1.2, 32, 32);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0e0e0 });
        this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
        this.scene.add(this.moonMesh);

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
        this.startTotalDistEl = document.getElementById('start-total-dist')!;
        this.shopGoldEl = document.getElementById('shop-gold')!;
        this.shopJadesEl = document.getElementById('shop-jades')!;
        this.btnBuyMagnet = document.getElementById('buy-magnet') as HTMLButtonElement;
        this.btnBuyPotion = document.getElementById('buy-potion') as HTMLButtonElement;

        this.magnetTimerEl = document.getElementById('magnet-timer')!;
        this.magnetTimeLeftEl = document.getElementById('magnet-time-left')!;

        // Revive UI
        this.reviveBtn = document.getElementById('revive-btn') as HTMLButtonElement;
        this.reviveCountdownEl = document.getElementById('revive-countdown')!;
        this.reviveBtn.addEventListener('click', () => this.revive());

        document.getElementById('start-btn')!.addEventListener('click', () => this.start());
        document.getElementById('restart-btn')!.addEventListener('click', () => this.start());
        document.getElementById('resume-btn')!.addEventListener('click', () => this.togglePause());

        document.getElementById('menu-btn-pause')!.addEventListener('click', () => this.goToMainMenu());
        document.getElementById('menu-btn-over')!.addEventListener('click', () => this.goToMainMenu());

        // Mobile Controls
        this.jumpBtnMobile = document.getElementById('jump-btn-mobile');
        this.quickMagnetBtn = document.getElementById('quick-magnet');
        this.quickPotionBtn = document.getElementById('quick-potion');
        this.distanceHudEl = document.getElementById('distance-hud')!;
        this.distanceOverEl = document.getElementById('run-distance-over')!;

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

        // Quest Listeners
        this.questsScreen = document.getElementById('quests-screen')!;
        this.questsListEl = document.getElementById('quests-list')!;
        document.getElementById('quests-btn-start')!.addEventListener('click', () => this.openQuests());
        document.getElementById('close-quests-btn')!.addEventListener('click', () => this.closeQuests());
        document.getElementById('shop-btn-pause')!.addEventListener('click', () => this.openShop());

        document.getElementById('shop-back')!.addEventListener('click', () => this.closeShop());

        document.getElementById('bag-btn')!.addEventListener('click', () => this.openBag());
        document.getElementById('bag-close')!.addEventListener('click', () => this.closeBag());

        document.getElementById('guide-btn-start')!.addEventListener('click', () => this.openGuide());
        document.getElementById('guide-btn-pause')!.addEventListener('click', () => this.openGuide());
        document.getElementById('guide-close')!.addEventListener('click', () => this.closeGuide());

        this.btnBuyMagnet.addEventListener('click', () => {
            if (this.totalGold >= 30) {
                this.totalGold -= 30;
                this.inventory.magnet = (this.inventory.magnet || 0) + 1;
                this.saveData();
                this.updateShopUI();
            }
        });

        this.btnBuyPotion.addEventListener('click', () => {
            if (this.totalGold >= 100) {
                this.totalGold -= 100;
                this.inventory.potion = (this.inventory.potion || 0) + 1;
                this.saveData();
                this.updateShopUI();
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


        // Keyboard Shortcut for Pause, Items & Cheats
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Digit1') {
                this.useItem('magnet');
            }
            if (e.code === 'Digit2') {
                this.useItem('potion');
            }

            // CHEAT KEYS

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

        // Splash Screen Removal Logic
        const splash = document.getElementById('splash-screen');
        const fill = document.getElementById('loading-bar-fill');
        if (splash && fill) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setTimeout(() => {
                        splash.style.opacity = '0';
                        setTimeout(() => splash.style.display = 'none', 500);
                    }, 500);
                }
                fill.style.width = progress + '%';
            }, 100);
        }
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
        if (this.startTotalDistEl) {
            this.startTotalDistEl.innerText = this.totalDistance.toString();
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

    activatePotion(customDuration?: number) {
        this.potionActive = true;

        let duration = customDuration !== undefined ? customDuration : 20; // Base duration seconds
        if (customDuration === undefined && this.equippedSkin === 'Iron Knight') {
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
        localStorage.setItem('totalDistance', this.totalDistance.toString());
        localStorage.setItem('highScore', this.highScore.toString());
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
        localStorage.setItem('hasHorseshoe', this.hasHorseshoe.toString());
        localStorage.setItem('ownedSkins', JSON.stringify(this.ownedSkins));
        localStorage.setItem('equippedSkin', this.equippedSkin);
    }

    goToMainMenu() {
        this.switchMusic('menu');
        this.isPlaying = false;
        this.gameIsOver = false;

        // Cleanup Active Effects
        this.setWeather('none');
        if (this.player) this.player.mesh.visible = true; // Ensure player is visible if reset during potion blink
        if (this.potionHudEl) this.potionHudEl.style.display = 'none';
        if (this.magnetTimerEl) this.magnetTimerEl.style.display = 'none';

        // Reset Lights to Day Default
        this.dirLight.intensity = 1.5;
        this.dirLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 0.6;
        this.renderer.setClearColor(0x87CEEB);
        this.scene.fog!.color.setHex(0x87CEEB);
        this.dayTime = 0; // Reset Day Cycle
        if (this.stars) (this.stars.material as THREE.PointsMaterial).opacity = 0;
        if (this.sunMesh) this.sunMesh.visible = true;
        if (this.moonMesh) this.moonMesh.visible = false;

        // Visual Cleanup
        if (this.world && this.world.particles) {
            this.world.particles.forEach(p => this.scene.remove(p));
            this.world.particles = [];
        }
        if (this.player) {
            if (this.player.moltenPointLight) this.player.moltenPointLight.intensity = 0;
            if (this.player.moltenHalo) this.player.moltenHalo.visible = false;
        }

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
        this.btnBuyMagnet.innerHTML = "<div>Magnet</div><div style='font-size: 0.8rem; opacity: 0.9;'>Pulls all nearby Gold</div><div class='price'>30 G</div>";
        this.btnBuyMagnet.disabled = this.totalGold < 30;

        // Potion State
        this.btnBuyPotion.classList.remove('owned');
        this.btnBuyPotion.innerHTML = "<div>Iron Potion</div><div style='font-size: 0.8rem; opacity: 0.9;'>Smash through obstacles!</div><div class='price'>100 G</div>";
        this.btnBuyPotion.disabled = this.totalGold < 100;


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
            this.jumpBtnMobile.style.display = this.isPlaying ? 'flex' : 'none';
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

            if (skin.name === 'Golden Dash') {
                preview.style.boxShadow = '0 0 10px #FFD700, inset 0 0 10px #FFFFFF';
                preview.classList.add('golden-glint');
            }

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
        this.switchMusic('game');
        this.isPlaying = true;
        this.gameIsOver = false;
        this.runCoins = 0;
        this.runDistance = 0;
        this.reviveCount = 0;
        if (this.reviveInterval) {
            clearInterval(this.reviveInterval);
            this.reviveInterval = null;
        }
        document.getElementById('revive-container')!.style.display = 'none';

        this.distanceHudEl.innerText = '0000m';
        this.runGoldValEl.innerText = '0';

        this.speed = 10;

        // Neon Runner Ability: +15% Speed
        if (this.equippedSkin === 'Neon Runner') {
            this.speed *= 1.15;
            // this.showNotification('SPEED BOOST ACTIVE!'); // Optional
        }

        this.speedTimer = 0;
        this.clock.start();

        // Reset objects
        this.dayTime = 0; // Ensure day starts at 0
        this.setWeather('none'); // Ensure clean weather state
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
        this.switchMusic('menu');
        this.isPlaying = false;
        this.gameIsOver = true;
        this.clock.stop();

        // Round distance
        const finalDist = Math.floor(this.runDistance);

        if (finalDist > this.highScore) {
            this.highScore = finalDist;
            this.showNotification('NEW PERSONAL BEST!');
        }

        // Add Run Coins to Total
        this.totalGold += this.runCoins;
        this.totalDistance += finalDist;
        this.saveData();
        if (this.totalGoldHudEl) this.totalGoldHudEl.innerText = this.totalGold.toString();

        this.distanceOverEl.innerText = finalDist.toString();
        this.runGoldOverEl.innerText = this.runCoins.toString();
        this.walletOverEl.innerText = this.totalGold.toString();
        this.highScoreOverEl.innerText = this.highScore.toString();

        // Revive Logic
        if (this.reviveCount < 3) {
            document.getElementById('revive-container')!.style.display = 'block';
            this.reviveTimer = 10;
            this.updateReviveUI();

            if (this.reviveInterval) clearInterval(this.reviveInterval);
            this.reviveInterval = setInterval(() => {
                this.reviveTimer--;
                this.updateReviveUI();
                if (this.reviveTimer <= 0) {
                    clearInterval(this.reviveInterval);
                    this.reviveInterval = null;
                    document.getElementById('revive-container')!.style.display = 'none';
                }
            }, 1000);
        } else {
            document.getElementById('revive-container')!.style.display = 'none';
        }

        this.gameOverScreen.style.display = 'block';
        setTimeout(() => this.gameOverScreen.classList.add('active'), 10);
        this.hud.classList.add('hidden');
    }

    getReviveCost() {
        if (this.reviveCount === 0) return 100;
        if (this.reviveCount === 1) return 250;
        return 500;
    }

    updateReviveUI() {
        if (!this.reviveBtn || !this.reviveCountdownEl) return;
        const cost = this.getReviveCost();
        this.reviveCountdownEl.innerText = this.reviveTimer.toString();
        this.reviveBtn.innerHTML = `<div>REVIVE NOW</div><div class='price' style='font-size: 1rem;'>${cost} G</div>`;
        this.reviveBtn.disabled = this.totalGold < cost;

        if (this.totalGold < cost) {
            this.reviveBtn.style.background = '#555';
            this.reviveBtn.style.opacity = '0.5';
            this.reviveBtn.style.cursor = 'not-allowed';
        } else {
            this.reviveBtn.style.background = '#4CAF50';
            this.reviveBtn.style.opacity = '1';
            this.reviveBtn.style.cursor = 'pointer';
        }
    }

    revive() {
        const cost = this.getReviveCost();
        if (this.totalGold >= cost && this.reviveCount < 3) {
            this.totalGold -= cost;
            this.reviveCount++;
            this.saveData();

            if (this.reviveInterval) {
                clearInterval(this.reviveInterval);
                this.reviveInterval = null;
            }

            // Resume Game
            const context = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (context) {
                const audioCtx = new context();
                if (audioCtx.state === 'suspended') audioCtx.resume();
            }
            this.switchMusic('game');

            this.isPlaying = true;
            this.gameIsOver = false;
            this.clock.start();

            // World cleanup: Clear obstacles for safety
            this.world.clearNearbyObstacles(40);

            // Grant 4s Iron Body
            this.activatePotion(4);

            // Hide Game Over
            this.gameOverScreen.classList.remove('active');
            setTimeout(() => {
                this.gameOverScreen.style.display = 'none';
                this.hud.classList.remove('hidden');
            }, 300);

            this.updateStartUI();
            if (this.totalGoldHudEl) this.totalGoldHudEl.innerText = this.totalGold.toString();
            this.showNotification('REVIVED! 4s INVINCIBILITY!');
        }
    }

    update(dt) {
        if (!this.isPlaying) return;

        // Difficulty scaling: Increase speed by 5% every 10 seconds
        this.speedTimer += dt;
        if (this.speedTimer >= 10) {
            this.speed *= 1.05;
            this.speedTimer -= 10;
        }

        // Distance Logic
        const prevDist = Math.floor(this.runDistance);
        this.runDistance += this.speed * dt;
        const currDist = Math.floor(this.runDistance);
        this.distanceHudEl.innerText = currDist.toString().padStart(4, '0') + 'm';

        // Quest Progress: Distance
        if (currDist > this.questProgress.distance) {
            this.updateQuestProgress('distance', currDist, true);
        }

        // Milestone Effect: Every 500m
        if (Math.floor(currDist / 500) > Math.floor(prevDist / 500)) {
            this.showNotification('SPEED UP! ⚡');
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
                this.player.mesh.visible = true; // Ensure visibility
                this.potionHudEl.style.display = 'none';
                this.showNotification('IRON BODY ENDED');
            } else {
                this.potionChargesEl.innerText = Math.ceil(this.potionTimer).toString();
            }
        }

        // Day/Night Cycle (3 Minutes = 180s)
        this.dayTime += dt;
        const cycleLen = 180;
        const t = (this.dayTime % cycleLen) / cycleLen; // 0 to 1

        const colorDay = new THREE.Color(0x87CEEB);
        const colorSunset = new THREE.Color(0xFF8C00);
        const colorNight = new THREE.Color(0x000030); // Deep night blue

        let targetColor;
        let starOpacity = 0;
        let sunIntensity = 1.5;
        let sunColor = new THREE.Color(0xffffff);
        let ambIntensity = 0.6;
        let jadeGlow = 0.8;

        // Celestial Movement: Matches 3 minute cycle
        const angle = t * Math.PI * 2;
        const sunX = Math.cos(angle) * 30;
        const sunY = Math.sin(angle) * 15;
        this.sunMesh.position.set(sunX, sunY, -20);

        const moonAngle = angle + Math.PI;
        this.moonMesh.position.set(Math.cos(moonAngle) * 30, Math.sin(moonAngle) * 15, -20);

        // Phase Timings
        const tDayEnd = 90 / 180;      // 0.5
        const tSunsetEnd = 105 / 180;  // 0.5833
        const tNightStart = 105 / 180;
        const tNightFull = 120 / 180;  // 0.666 (First 15s of night is transition)
        const tNightEnd = 165 / 180;   // 0.9166

        if (t < tDayEnd) { // Day (0 - 90s)
            targetColor = colorDay;
            starOpacity = 0;
            sunIntensity = 1.5;
            ambIntensity = 0.6;
            jadeGlow = 0.8;
            this.sunMesh.visible = true;
            this.moonMesh.visible = false;
            this.sunFlare.visible = true;
            this.sunFlare.scale.setScalar(1.5 + Math.sin(Date.now() * 0.002) * 0.1);
            (this.sunFlare.material as THREE.MeshBasicMaterial).opacity = 0.15;

        } else if (t < tSunsetEnd) { // Sunset (90s - 105s)
            const p = (t - tDayEnd) / (tSunsetEnd - tDayEnd);
            targetColor = colorDay.clone().lerp(colorSunset, p);
            starOpacity = p * 0.3;
            sunIntensity = 1.5 - (p * 0.5);
            ambIntensity = 0.6 - (p * 0.2);
            jadeGlow = 0.8 + (p * 0.7);

            this.sunMesh.visible = true;
            this.moonMesh.visible = true;

            this.sunFlare.visible = true;
            (this.sunFlare.material as THREE.MeshBasicMaterial).opacity = 0.15 * (1 - p);

        } else if (t < tNightEnd) { // Night (105s - 165s)
            // Fade to Night Color over first 15s of Night
            if (t < tNightFull) {
                const p = (t - tNightStart) / (tNightFull - tNightStart);
                targetColor = colorSunset.clone().lerp(colorNight, p);
            } else {
                targetColor = colorNight;
            }

            starOpacity = 1;
            sunIntensity = 0.2;
            ambIntensity = 0.1;
            sunColor = new THREE.Color(0x8888ff);
            jadeGlow = 2.0;

            this.sunMesh.visible = false;
            this.moonMesh.visible = true;
            this.sunFlare.visible = false;

        } else { // Sunrise (165s - 180s)
            const p = (t - tNightEnd) / (1.0 - tNightEnd);
            targetColor = colorNight.clone().lerp(colorDay, p);
            starOpacity = 1 - p;
            sunIntensity = 0.2 + (p * 1.3);
            ambIntensity = 0.1 + (p * 0.5);
            jadeGlow = 2.0 - (p * 1.2);

            this.sunMesh.visible = p > 0.5;
            this.moonMesh.visible = p < 0.5;
            this.sunFlare.visible = false;
        }

        this.scene.fog!.color.copy(targetColor);
        this.renderer.setClearColor(targetColor);
        (this.stars.material as THREE.PointsMaterial).opacity = starOpacity;

        this.dirLight.intensity = sunIntensity;
        this.dirLight.color.copy(sunColor);
        this.dirLight.position.copy(this.sunMesh.position);
        this.ambientLight.intensity = ambIntensity;

        // Interaction: Jades glow stronger at night
        this.world.updateJadeGlow(jadeGlow);

        this.player.update(dt, this.speed);
        this.world.update(dt, this.speed, this.player.mesh, this.magnetActive);

        // Weather System Trigger
        if (this.runDistance > 2000) {
            this.weatherCycleTimer -= dt;
            if (this.weatherCycleTimer <= 0) {
                this.weatherCycleTimer = 30;
                if (this.weatherType === 'none') {
                    const r = Math.random();
                    if (r < 0.33) this.setWeather('storm');
                    else if (r < 0.66) this.setWeather('sandstorm');
                    else this.setWeather('bloodmoon');
                } else {
                    this.setWeather('none');
                }
            }
        }

        if (this.weatherType !== 'none') {
            this.updateWeather(dt);
        }

        // Jade Collection Check
        const jadesCollected = this.world.checkJadeCollision(this.player.mesh);
        if (jadesCollected > 0) {
            for (let i = 0; i < jadesCollected; i++) {
                this.onCollectJade(this.player.mesh.position);
            }
        }

        // Coin Check
        let magnetRadius = this.magnetActive ? 4.0 : 0; // Much larger radius
        if (this.equippedSkin === 'Golden Dash') {
            magnetRadius += 0.5; // Passive buff
        }
        let coinsCollected = this.world.checkCoinCollision(this.player.mesh, magnetRadius);

        // Blood Moon Bonus: 2x Gold
        if (this.weatherType === 'bloodmoon') {
            coinsCollected *= 2;
        }

        // Golden Dash Ability: 5x Gold
        if (this.equippedSkin === 'Golden Dash' && coinsCollected > 0) {
            coinsCollected *= 5;
        }

        // NFT Horse Shoe: +25% Gold
        if (this.hasHorseshoe && coinsCollected > 0) {
            coinsCollected = Math.round(coinsCollected * 1.25);
        }

        if (coinsCollected > 0) {
            this.onCollectGold(coinsCollected);
        }

        // Collision Check
        let collisionRadiusExp = 0;
        if (this.equippedSkin === 'Molten Core' && this.potionActive) {
            collisionRadiusExp = 1.0; // Supernova Dash: Larger destruction radius
        }

        const obs = this.world.checkCollisionDetailed(this.player.mesh, collisionRadiusExp);
        if (obs) {
            if (this.potionActive) { // Potion is active, absorb hit
                // Scaled Shake
                let intensity = 0.1; // Subtle for wooden crates/hay
                if (obs.userData.type === 'rock') intensity = 0.4;
                if (obs.userData.type === 'double_crate') intensity = 0.5;

                this.triggerCameraShake(intensity, 0.15, 60);

                // Play break effect
                this.onBreakObstacle(obs);

                // Quest Progress: Stones
                if (obs.userData.type === 'rock') {
                    this.updateQuestProgress('stones', 1);
                }

                // Jade Drop Logic (All Obstacles)
                this.checkJadeDrop(obs.position);

                // Molten Core Bonus
                if (this.equippedSkin === 'Molten Core') {
                    this.moltenObstacleCount++;
                    if (this.moltenObstacleCount >= 10) {
                        this.totalJades += 5;
                        this.saveData();
                        this.moltenObstacleCount = 0;
                        if (this.totalJadesHudEl) this.totalJadesHudEl.innerText = this.totalJades.toString();
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
            this.world.spawnJade(pos);
        }
    }

    onCollectGold(count: number) {
        this.runCoins += count;
        this.runGoldValEl.innerText = this.runCoins.toString();
        // Multi-channel trigger for each coin
        for (let i = 0; i < count; i++) {
            this.playSfx('coin');
        }

        // Visual Pop
        this.hud.classList.add('pop');
        setTimeout(() => this.hud.classList.remove('pop'), 100);
    }

    onCollectJade(pos: THREE.Vector3) {
        this.totalJades++;
        this.playSfx('jade');
        this.updateQuestProgress('jades', 1);
        this.saveData();
        this.showFloatingText('+1 JADE', pos, '#4CAF50');
        if (this.totalJadesHudEl) this.totalJadesHudEl.innerText = this.totalJades.toString();
    }

    onBreakObstacle(obs: any) {
        this.playSfx('break');
        this.world.breakObstacle(obs);
    }

    setWeather(type: 'none' | 'storm' | 'sandstorm' | 'bloodmoon') {
        this.weatherType = type;
        this.weatherTimer = 30;

        // Reset effects
        if (this.weatherOverlayEl) {
            this.weatherOverlayEl.style.background = 'transparent';
        }

        if (this.currentBgm) this.currentBgm.playbackRate = 1.0;

        // Reset Moon
        (this.moonMesh.material as THREE.MeshBasicMaterial).color.set(0xe0e0e0);
        this.moonMesh.scale.setScalar(1.0);

        switch (type) {
            case 'storm':
                if (this.weatherOverlayEl) this.weatherOverlayEl.style.background = 'rgba(0, 0, 50, 0.4)';
                if (this.currentBgm) this.currentBgm.playbackRate = 0.9;
                break;
            case 'sandstorm':
                if (this.weatherOverlayEl) this.weatherOverlayEl.style.background = 'rgba(139, 69, 19, 0.4)';
                if (this.currentBgm) this.currentBgm.playbackRate = 0.95;
                break;
            case 'bloodmoon':
                if (this.weatherOverlayEl) this.weatherOverlayEl.style.background = 'rgba(139, 0, 0, 0.4)';
                if (this.currentBgm) this.currentBgm.playbackRate = 0.85;
                (this.moonMesh.material as THREE.MeshBasicMaterial).color.set(0xff0000);
                this.moonMesh.scale.setScalar(3.0);
                break;
        }

        this.showNotification(`EXTREME WEATHER: ${type === 'none' ? 'NORMAL' : type.toUpperCase()}`);
    }

    updateWeather(dt: number) {
        this.weatherTimer -= dt;
        if (this.weatherTimer <= 0) {
            // Let cycle timer handle reset
        }

        if (this.weatherType === 'storm') {
            this.lightningTimer -= dt;
            if (this.lightningTimer <= 0) {
                this.lightningTimer = 3 + Math.random() * 5;
                // Flash
                if (this.weatherOverlayEl) this.weatherOverlayEl.style.background = 'rgba(255, 255, 255, 0.8)';

                // Heavy & Slow Shake for Lightning
                this.triggerCameraShake(1.0, 0.5, 10);

                if (this.thunderSfx) this.thunderSfx.play().catch(() => { });
                setTimeout(() => {
                    if (this.weatherType === 'storm' && this.weatherOverlayEl) {
                        this.weatherOverlayEl.style.background = 'rgba(0, 0, 50, 0.4)';
                    }
                }, 100);
            }
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

    triggerCameraShake(intensity: number, duration: number = 0.2, frequency: number = 60) {
        // Smart Cooldown: If already shaking significantly, just extend slightly
        if (this.shakeTime > 0.05) {
            this.shakeTime = Math.min(this.shakeTime + 0.05, 0.3); // Cap extension
            this.shakeIntensity = Math.min(this.MAX_SHAKE_INTENSITY, Math.max(this.shakeIntensity, intensity));
            return;
        }

        this.shakeTime = duration;
        this.shakeIntensity = Math.min(this.MAX_SHAKE_INTENSITY, intensity);
        this.shakeFrequency = frequency;
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

        try {
            if (this.isPlaying && !this.isHitStopping) {
                const dt = this.clock.getDelta();
                this.update(dt);
            } else {
                this.clock.getDelta(); // Keep clock updating
            }

            // Camera Shake Update
            if (this.shakeTime > 0) {
                this.shakeTime -= 0.016;

                // Normalized fade out
                const fade = Math.min(1.0, this.shakeTime / 0.2);
                const currentIntensity = this.shakeIntensity * fade;

                const time = Date.now() * 0.001 * this.shakeFrequency;
                // Use sin/cos for smoother high-quality oscillations
                this.camera.position.x = this.cameraBasePos.x + Math.sin(time) * currentIntensity;
                this.camera.position.y = this.cameraBasePos.y + Math.cos(time * 1.1) * currentIntensity;
            } else {
                this.camera.position.copy(this.cameraBasePos);
            }

            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error("Game Loop Error:", error);
            this.isPlaying = false;
            // Soft Reset
            if (this.animationId) cancelAnimationFrame(this.animationId);
            alert("A critical error occurred. The game has been paused/reset.\nError: " + error);
            this.goToMainMenu();
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Quest System Methods
    updateQuestProgress(type: string, amount: number, isDirect: boolean = false) {
        if (isDirect) {
            if (amount > this.questProgress[type]) {
                this.questProgress[type] = amount;
            }
        } else {
            this.questProgress[type] = (this.questProgress[type] || 0) + amount;
        }

        // Snap to goal
        const quest = this.quests.find(q => q.type === type);
        if (quest && this.questProgress[type] > quest.goal) {
            this.questProgress[type] = quest.goal;
        }

        localStorage.setItem('questProgress', JSON.stringify(this.questProgress));

        // If quests screen is open, re-render
        if (this.questsScreen && this.questsScreen.classList.contains('active')) {
            this.renderQuests();
        }
    }

    openQuests() {
        this.renderQuests();
        this.questsScreen.style.display = 'block';
        setTimeout(() => this.questsScreen.classList.add('active'), 10);
    }

    closeQuests() {
        this.questsScreen.classList.remove('active');
        setTimeout(() => this.questsScreen.style.display = 'none', 300);
    }

    renderQuests() {
        if (!this.questsListEl) return;
        this.questsListEl.innerHTML = '';
        this.quests.forEach(quest => {
            const progress = this.questProgress[quest.type] || 0;
            const isCompleted = progress >= quest.goal;
            const isClaimed = this.questsClaimed[quest.id];

            const questEl = document.createElement('div');
            questEl.className = `quest-item ${isCompleted ? 'completed' : ''}`;

            const percent = Math.min(100, (progress / quest.goal) * 100);

            questEl.innerHTML = `
                <div class="quest-title">${quest.title}</div>
                <div style="font-size: 0.9rem; color: #aaa;">Progress: ${progress} / ${quest.goal}</div>
                <div class="progress-container">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="quest-footer">
                    <div class="reward-info">Reward: <span class="coin-icon"></span>${quest.reward}G</div>
                    <button class="claim-btn" ${(!isCompleted || isClaimed) ? 'disabled' : ''}>
                        ${isClaimed ? 'DONE' : (isCompleted ? 'CLAIM' : 'LOCKED')}
                    </button>
                </div>
            `;

            if (isCompleted && !isClaimed) {
                const claimBtn = questEl.querySelector('.claim-btn') as HTMLButtonElement;
                claimBtn.onclick = () => this.claimQuest(quest.id);
            }

            this.questsListEl.appendChild(questEl);
        });
    }

    claimQuest(id: string) {
        const quest = this.quests.find(q => q.id === id);
        if (quest && !this.questsClaimed[id]) {
            const progress = this.questProgress[quest.type] || 0;
            if (progress >= quest.goal) {
                this.totalGold += quest.reward;
                this.questsClaimed[id] = true;
                localStorage.setItem('questsClaimed', JSON.stringify(this.questsClaimed));
                this.saveData();
                this.updateStartUI();
                if (this.totalGoldHudEl) this.totalGoldHudEl.innerText = this.totalGold.toString();
                this.showNotification(`CLAIMED ${quest.reward} GOLD!`);
                this.renderQuests();
            }
        }
    }

    switchMusic(type: 'menu' | 'game') {
        const nextBgm = type === 'menu' ? this.menuBgm : this.bgm;
        const otherBgm = type === 'menu' ? this.bgm : this.menuBgm;

        if (this.currentBgm === nextBgm) return; // Keep playing, do nothing
        this.currentBgm = nextBgm;

        // Ensure both continue playing (Persistence)
        if (this.bgm && this.menuBgm) {
            this.bgm.play().catch(() => { });
            this.menuBgm.play().catch(() => { });
        }

        const targetVol = this.isMuted ? 0 : 0.6;
        this.fadeCross(nextBgm, otherBgm, targetVol);
        this.updateMusicButtons();
    }

    playSfx(type: 'coin' | 'jump' | 'jade' | 'break') {
        if (this.isMuted) return;

        let sfx: HTMLAudioElement | null = null;
        let fallbackFreq = 440;

        if (type === 'coin') {
            sfx = this.coinSfx;
            fallbackFreq = 880;
        } else if (type === 'jump') {
            sfx = this.jumpSfx;
            fallbackFreq = 660;
        } else if (type === 'jade') {
            sfx = this.jadeSfx;
            fallbackFreq = 1200;
        } else if (type === 'break') {
            sfx = this.breakSfx;
            fallbackFreq = 220;
        }

        const playFallback = () => {
            try {
                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                if (context.state === 'suspended') context.resume();
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(fallbackFreq, context.currentTime);
                gain.gain.setValueAtTime(0.1, context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(context.destination);
                osc.start();
                osc.stop(context.currentTime + 0.1);
            } catch (e) {
                console.warn('Synth Fallback Failed');
            }
        };

        if (sfx && sfx.readyState >= 2) {
            // Overlap Fix: Clone and play
            const clone = sfx.cloneNode() as HTMLAudioElement;
            clone.volume = sfx.volume;
            clone.play().catch(e => {
                console.warn(`${type} File failed, playing synth fallback`);
                playFallback();
            });
        } else {
            playFallback();
        }
    }

    toggleMusic() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('isMuted', this.isMuted.toString());

        const targetVol = this.isMuted ? 0 : 0.6;
        if (this.currentBgm) {
            const otherBgm = this.currentBgm === this.bgm ? this.menuBgm : this.bgm;
            this.fadeCross(this.currentBgm, otherBgm, targetVol);
        }
        this.updateMusicButtons();
    }

    fadeCross(active: HTMLAudioElement, inactive: HTMLAudioElement, targetVolume: number) {
        if (this.musicFadeInterval) clearInterval(this.musicFadeInterval);

        const step = 0.05;
        this.musicFadeInterval = setInterval(() => {
            // Fade in active
            if (active.volume < targetVolume) {
                active.volume = Math.min(active.volume + step, targetVolume);
            } else if (active.volume > targetVolume) {
                active.volume = Math.max(active.volume - step, targetVolume);
            }

            // Fade out inactive
            if (inactive.volume > 0) {
                inactive.volume = Math.max(inactive.volume - step, 0);
            }

            // Check if both reached their targets
            const activeDone = Math.abs(active.volume - targetVolume) < 0.01;
            const inactiveDone = inactive.volume === 0;

            if (activeDone && inactiveDone) {
                active.volume = targetVolume;
                inactive.volume = 0;
                clearInterval(this.musicFadeInterval);
                this.musicFadeInterval = null;
            }
        }, 50);
    }

    updateMusicButtons() {
        const icon = this.isMuted ? '🔇' : '🔊';
        const startBtn = document.getElementById('music-toggle-start');
        const pauseBtn = document.getElementById('music-toggle-pause');
        if (startBtn) startBtn.innerText = icon;
        if (pauseBtn) pauseBtn.innerText = icon;
    }
}
