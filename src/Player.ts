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
            if (this.game.hasUnlockedJump) {
                this.velocity = 10;
                this.isJumping = true;
            } else {
                this.game.showNotification('JUMP LOCKED');
            }
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

            if (this.mesh.position.y <= 0.5) {
                this.mesh.position.y = 0.5;
                this.isJumping = false;
                this.velocity = 0;
            }
        }

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
}
