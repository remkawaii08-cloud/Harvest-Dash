import * as THREE from 'three';
import type Game from './Game';

export default class Player {
    game: Game;
    mesh!: THREE.Mesh;
    lane: number;
    laneWidth: number;

    // Jumping physics
    velocity: number;
    gravity: number;
    isJumping: boolean;
    yPos: number;

    magnetRingMat!: THREE.MeshBasicMaterial;
    magnetRing!: THREE.Mesh;
    horseShoe!: THREE.Mesh;

    // Effect Timers
    effectTimer: number = 0;
    trailTimer: number = 0;
    burnTimer: number = 0;
    wasInAir: boolean = false;
    shimmerTimer: number = 0;
    coinTrailTimer: number = 0;

    constructor(game: Game) {
        this.game = game;
        this.lane = 0; // -1, 0, 1
        this.laneWidth = 2.0;

        // Jumping physics
        this.velocity = 0;
        this.gravity = -30;
        this.isJumping = false;
        this.yPos = 0.5; // Half of player height

        this.init();
    }

    init() {
        // Player Mesh (Balloon)
        const geometry = new THREE.BoxGeometry(1, 1, 1);

        // Generate Texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        // Face Texture
        ctx.fillStyle = '#D2691E'; // Wood base
        ctx.fillRect(0, 0, 64, 64);
        // Eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(15, 20, 10, 10);
        ctx.fillRect(39, 20, 10, 10);
        // Mouth
        ctx.fillRect(20, 45, 24, 6);

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.0
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = this.yPos;
        this.game.scene.add(this.mesh);

        // Load Saved Skin
        this.setSkin(this.game.equippedSkin);



        // Magnet Ring (Visual Only)
        const ringGeo = new THREE.TorusGeometry(1.2, 0.05, 16, 32);
        this.magnetRingMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });
        this.magnetRing = new THREE.Mesh(ringGeo, this.magnetRingMat);
        this.magnetRing.rotation.x = Math.PI / 2;
        this.magnetRing.visible = false;
        this.game.scene.add(this.magnetRing);

        // Controls
        window.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Cosmetic: Horse Shoe NFT
        const shoeGeo = new THREE.TorusGeometry(0.2, 0.05, 8, 16, Math.PI);
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 1.0, roughness: 0.2 });
        this.horseShoe = new THREE.Mesh(shoeGeo, shoeMat);
        this.horseShoe.position.set(0, 0.3, 0.6); // Behind player
        this.horseShoe.rotation.z = Math.PI;
        this.horseShoe.visible = false;
        this.mesh.add(this.horseShoe); // Attach to player mesh

        this.updateCosmetic();
    }

    reset() {
        this.lane = 0;
        this.mesh.position.x = 0;
        this.mesh.position.y = 0.5;
        this.velocity = 0;
        this.isJumping = false;
        this.setMagnetEffect(false);
    }

    onKeyDown(e: KeyboardEvent) {
        if (!this.game.isPlaying) return;

        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight();
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'Space':
                this.jump();
                break;
        }
    }

    moveLeft() {
        if (!this.game.isPlaying) return;
        if (this.lane > -1) this.lane--;
    }

    moveRight() {
        if (!this.game.isPlaying) return;
        if (this.lane < 1) this.lane++;
    }

    jump() {
        if (!this.game.isPlaying) return;
        if (!this.isJumping) {
            this.velocity = 12.0;
            this.isJumping = true;
        }
    }

    update(dt: number, speed: number) {
        // Horizontal Movement (Smooth Lerp)
        const targetX = this.lane * this.laneWidth;
        this.mesh.position.x += (targetX - this.mesh.position.x) * 10 * dt;

        // Jumping Logic
        if (this.isJumping) {
            this.mesh.position.y += this.velocity * dt;
            this.velocity += this.gravity * dt;
            this.wasInAir = true;

            if (this.mesh.position.y <= 0.5) {
                this.mesh.position.y = 0.5;
                this.isJumping = false;
                this.velocity = 0;
                this.handleLanding();
            }
        } else {
            this.wasInAir = false;
        }

        // Spawn Continuous Effects
        this.spawnContinuousEffects(dt);

        // Magnet Ring Position & Blinking
        if (this.magnetRing.visible) {
            this.magnetRing.position.x = this.mesh.position.x;
            this.magnetRing.position.z = this.mesh.position.z;
            this.magnetRing.position.y = 0.1;
            this.magnetRing.rotation.z += dt * 3;

            // Blinking logic when time is low
            if (this.game.magnetActive && this.game.magnetTimer <= 5) {
                const timeRemaining = this.game.magnetTimer;
                // Faster blink as it approaches 0
                const frequency = timeRemaining <= 2 ? 20 : 10;
                this.magnetRingMat.opacity = (Math.sin(Date.now() * 0.001 * frequency) * 0.5) + 0.5;
            } else {
                this.magnetRingMat.opacity = 0.5;
            }
        }

        // Rolling Animation (rotate around X axis)
        if (!this.isJumping) {
            this.mesh.rotation.x -= speed * dt;
        } else {
            this.mesh.rotation.x -= speed * dt * 0.5; // Slower rotation in air
        }

        // Cosmetic Animation
        if (this.horseShoe.visible) {
            this.horseShoe.rotation.y += dt * 5;
        }

        // Iron Potion Blinking Warning
        if (this.game.potionActive && this.game.potionTimer <= 3) {
            // Blink every 100ms
            this.mesh.visible = Math.floor(Date.now() / 100) % 2 === 0;
        } else if (this.game.isPlaying) {
            this.mesh.visible = true;
        }
    }

    setMagnetEffect(enabled: boolean) {
        if (this.magnetRing) {
            this.magnetRing.visible = enabled;
        }
    }

    setMetallicSkin(enabled: boolean) {
        if (!this.mesh) return;
        const mat = this.mesh.material as THREE.MeshStandardMaterial; // Cast as we know it's Standard
        if (enabled) {
            mat.color.set(0xaaaaaa); // Metallic Grey
            mat.metalness = 1.0;
            mat.roughness = 0.2;
        } else {
            mat.color.set(0xffffff); // Default
            mat.metalness = 0.0;
            mat.roughness = 0.8;
        }
    }

    updateCosmetic() {
        if (this.horseShoe) {
            this.horseShoe.visible = this.game.hasHorseshoe;
        }
    }

    setSkin(skinName: string) {
        if (!this.mesh) return;

        const mat = this.mesh.material as THREE.MeshStandardMaterial;

        // Reset behaviors
        mat.emissiveIntensity = 0;
        mat.emissive.setHex(0x000000);

        switch (skinName) {
            case 'Classic Farmer':
                mat.color.set('#D2691E');
                mat.metalness = 0.0;
                mat.roughness = 0.8;
                break;
            case 'Iron Knight':
                mat.color.set('#C0C0C0'); // Metallic Silver/Gray
                mat.metalness = 1.0;
                mat.roughness = 0.2;
                break;
            case 'Neon Runner':
                mat.color.set('#00FFFF'); // Cyan Base
                mat.emissive.set('#00FFFF'); // Glow
                mat.emissiveIntensity = 0.5;
                mat.metalness = 0.5;
                mat.roughness = 0.5;
                break;
            case 'Golden Dash':
                mat.color.set('#FFD700'); // Gold Bar
                mat.metalness = 1.0;
                mat.roughness = 0.2;
                mat.emissive.set('#997700'); // Edges glow
                mat.emissiveIntensity = 0.5;
                mat.map = null; // Force-remove Classic Farmer texture
                break;
            case 'Molten Core':
                // Procedural Molten Texture
                const canvas = document.createElement('canvas');
                canvas.width = 128; canvas.height = 128;
                const ctx = canvas.getContext('2d')!;

                // Base: Deep Volcanic Red
                ctx.fillStyle = '#4B0000';
                ctx.fillRect(0, 0, 128, 128);

                // Molten Cracks
                for (let i = 0; i < 40; i++) {
                    ctx.strokeStyle = Math.random() > 0.5 ? '#FF4500' : '#FF8C00';
                    ctx.lineWidth = Math.random() * 5 + 2;
                    ctx.beginPath();
                    ctx.moveTo(Math.random() * 128, Math.random() * 128);
                    ctx.lineTo(Math.random() * 128, Math.random() * 128);
                    ctx.stroke();
                }

                // Core: Bright Center
                const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 50);
                grad.addColorStop(0, '#FFFFFF'); // White core
                grad.addColorStop(0.2, '#FFFF00'); // Yellow
                grad.addColorStop(1, 'rgba(255, 69, 0, 0)'); // Fading Red
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 128, 128);

                const tex = new THREE.CanvasTexture(canvas);
                mat.map = tex;
                mat.color.set('#FFFFFF'); // Use texture colors
                mat.emissive.set('#FF4500');
                mat.emissiveIntensity = 1.0;
                mat.metalness = 0.5;
                mat.roughness = 0.4;
                break;
            default:
                mat.color.set('#D2691E');
        }
    }

    handleLanding() {
        if (this.game.equippedSkin === 'Iron Knight') {
            // Metal sparks on land
            const landPos = this.mesh.position.clone();
            landPos.y = 0.1;
            this.game.world.spawnGenericParticles(landPos, 8, 0xFFFF00, 0.1, 4, 0.5, true);
            // Simulate 'Clink' visually since we have no audio
        }
    }

    spawnContinuousEffects(dt: number) {
        this.effectTimer += dt;
        this.trailTimer += dt;

        const skin = this.game.equippedSkin;
        const pos = this.mesh.position.clone();

        // Foot position (for dust/sparks)
        const footPos = pos.clone();
        footPos.y = 0.1;
        footPos.z += 0.5;

        if (skin === 'Classic Farmer') {
            if (this.trailTimer > 0.1 && !this.isJumping) {
                this.game.world.spawnGenericParticles(footPos, 1, 0xd2b48c, 0.1, 1, 0.5, false); // Dust puff
                this.trailTimer = 0;
            }
        } else if (skin === 'Neon Runner') {
            // Pulse/Flicker
            const mat = this.mesh.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;

            // Electric Sparks
            if (this.effectTimer > 0.05) {
                const sparkPos = pos.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * 1.2,
                    (Math.random() - 0.5) * 1.2,
                    (Math.random() - 0.5) * 1.2
                ));
                this.game.world.spawnGenericParticles(sparkPos, 1, 0x00FFFF, 0.05, 0.5, 0.3, true);
                this.effectTimer = 0;
            }

            // Motion Trail Particles
            if (this.trailTimer > 0.02) {
                this.game.world.spawnGenericParticles(pos, 2, 0x00FFFF, 0.15, 0.1, 0.4, true);
                this.trailTimer = 0;
            }
        } else if (skin === 'Golden Dash') {
            // High-Gloss Shine Animation (Shimmer)
            this.shimmerTimer += dt;
            const mat = this.mesh.material as THREE.MeshStandardMaterial;
            if (this.shimmerTimer > 2.0) { // Every 2 seconds
                const shine = (Math.sin(Date.now() * 0.01) * 0.5) + 0.5;
                mat.emissiveIntensity = 1.5 * shine;
                if (this.shimmerTimer > 2.5) {
                    this.shimmerTimer = 0;
                }
            } else {
                mat.emissiveIntensity = 0.5;
            }

            // Forced Yellow Sparkle Particle Trail
            // Emit 5 particles every 0.1s
            if (this.trailTimer > 0.1) {
                const trailPos = pos.clone().add(new THREE.Vector3(0, 0, 0.5)); // Emit behind player
                // Spawn 5 star-like particles
                this.game.world.spawnGenericParticles(trailPos, 5, 0xFFFF00, 0.2, 2, 0.8, true);
                this.trailTimer = 0;
            }

            // Tiny Sparkling Diamonds (Faster, smaller)
            this.coinTrailTimer += dt;
            if (this.coinTrailTimer > 0.15) {
                const diaPos = pos.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * 1.5,
                    (Math.random() - 0.5) * 1.5,
                    0.8
                ));
                this.game.world.spawnGenericParticles(diaPos, 1, 0xFFFFFF, 0.1, 3, 0.5, true);
                this.coinTrailTimer = 0;
            }
        } else if (skin === 'Molten Core') {
            // Core Pulsing
            const mat = this.mesh.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 1.5 + Math.sin(Date.now() * 0.005) * 0.5;

            // Heat Waves (Distorted air effect using thin, fast-dying particles)
            if (this.trailTimer > 0.05) {
                const heatPos = pos.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 2
                ));
                // Transparent, fast-rising orange particles
                this.game.world.spawnGenericParticles(heatPos, 1, 0xFF8C00, 0.3, 2, 0.4, true);
                this.trailTimer = 0;
            }

            // Ground Melting (Small embers)
            if (this.effectTimer > 0.1) {
                this.game.world.spawnGenericParticles(footPos, 2, 0xFF4500, 0.1, 0.5, 0.6, true);
                this.effectTimer = 0;
            }

            // Scorched Earth Decals
            this.burnTimer += dt;
            if (this.burnTimer >= 0.1 && !this.isJumping) {
                this.game.world.spawnBurnMark(this.mesh.position);
                this.burnTimer = 0;
            }
        }
    }
}
