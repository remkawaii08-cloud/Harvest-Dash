import * as THREE from 'three';
import type Game from './Game';

export default class World {
    game: Game;
    obstacles: THREE.Mesh[];
    coins: THREE.Mesh[];
    floorSegments: THREE.Group[];
    segmentLength: number;
    spawnDistance: number;
    lastSpawnZ: number;

    obstaclePool: Record<string, THREE.Mesh[]>;
    coinPool: THREE.Mesh[];
    floorPool: THREE.Group[]; // Keeping it if you plan to use it, though seemingly unused in snippet
    particles: THREE.Mesh[];

    dirtTexture?: THREE.CanvasTexture;
    grassTexture?: THREE.CanvasTexture;
    crateTexture?: THREE.CanvasTexture;
    hayTexture?: THREE.CanvasTexture;
    rockTexture?: THREE.CanvasTexture;

    constructor(game: Game) {
        this.game = game;
        this.obstacles = [];
        this.coins = [];
        this.floorSegments = [];
        this.segmentLength = 50;
        this.spawnDistance = 100;
        this.lastSpawnZ = 0;

        this.obstaclePool = { crate: [], hay: [], rock: [] };
        this.coinPool = [];
        this.floorPool = [];
        this.particles = [];

        this.init();
    }

    init() {
        // Initial floor
        for (let i = 0; i < 5; i++) {
            this.spawnFloor(-i * this.segmentLength);
        }
    }

    reset() {
        this.obstacles.forEach(obs => {
            obs.visible = false;
            const type = obs.userData.type || 'crate';
            if (!this.obstaclePool[type]) this.obstaclePool[type] = [];
            this.obstaclePool[type].push(obs);
        });
        this.obstacles = [];

        this.coins.forEach(c => {
            c.visible = false;
            this.coinPool.push(c);
        });
        this.coins = [];

        this.particles.forEach(p => this.game.scene.remove(p));
        this.particles = [];

        this.floorSegments.forEach(floor => this.game.scene.remove(floor));
        this.floorSegments = [];
        this.lastSpawnZ = 0;

        for (let i = 0; i < 6; i++) { // Increased to 6 segments for further view distance
            this.spawnFloor(-i * this.segmentLength);
        }

        // Pre-warm: Initial Spawning close to player
        // Start z at -20 (ahead of player) down to -200 (fog)
        for (let z = -20; z > -300; z -= 10) {
            // Dense populating
            const r = Math.random();
            if (r < 0.4) {
                this.spawnObstacle(z);
            } else if (r > 0.6) {
                this.spawnCoin(z);
            }
        }
    }

    spawnFloor(zPos: number) {
        const floorGroup = new THREE.Group();

        // Generate Textures (Ideally cache these in constructor, but for now inline is fine or cached in module scope)
        // Actually, caching in 'this' is better.
        if (!this.dirtTexture) {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#5D4037'; ctx.fillRect(0, 0, 64, 64); // Dirt base
            for (let i = 0; i < 200; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#3E2723' : '#795548';
                ctx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 2, 2);
            }
            this.dirtTexture = new THREE.CanvasTexture(canvas);
            this.dirtTexture.magFilter = THREE.NearestFilter;
            this.dirtTexture.minFilter = THREE.NearestFilter;
            this.dirtTexture.wrapS = THREE.RepeatWrapping;
            this.dirtTexture.wrapT = THREE.RepeatWrapping;
            this.dirtTexture.repeat.set(1, 10); // Repeat along length
        }

        if (!this.grassTexture) {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#4CAF50'; ctx.fillRect(0, 0, 64, 64); // Grass base
            for (let i = 0; i < 300; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#388E3C' : '#81C784';
                ctx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 2, 2);
            }
            this.grassTexture = new THREE.CanvasTexture(canvas);
            this.grassTexture.magFilter = THREE.NearestFilter;
            this.grassTexture.minFilter = THREE.NearestFilter;
            this.grassTexture.wrapS = THREE.RepeatWrapping;
            this.grassTexture.wrapT = THREE.RepeatWrapping;
            this.grassTexture.repeat.set(4, 10);
        }

        // Road Mesh (Dirt Path)
        const roadGeo = new THREE.PlaneGeometry(8, this.segmentLength);
        const roadMat = new THREE.MeshStandardMaterial({
            map: this.dirtTexture,
            roughness: 1.0,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, 0.01, 0);

        floorGroup.add(road);

        // Grass Sides
        const grassGeo = new THREE.PlaneGeometry(20, this.segmentLength);
        const grassMat = new THREE.MeshStandardMaterial({
            map: this.grassTexture,
            roughness: 1.0,
            metalness: 0.0,
            side: THREE.DoubleSide
        });

        // Left Grass
        const leftGrass = new THREE.Mesh(grassGeo, grassMat);
        leftGrass.rotation.x = -Math.PI / 2;
        leftGrass.position.set(-14, 0, 0); // Road is 8 wide (-4 to 4). Grass starts at -4. 
        // 20 wide centered at -14 means -24 to -4. Perfect.
        floorGroup.add(leftGrass);

        // Right Grass
        const rightGrass = new THREE.Mesh(grassGeo, grassMat);
        rightGrass.rotation.x = -Math.PI / 2;
        rightGrass.position.set(14, 0, 0); // 4 to 24.
        floorGroup.add(rightGrass);

        // Grass Patches as Lane Dividers
        const patchGeo = new THREE.PlaneGeometry(0.4, 0.4);
        const patchMat = new THREE.MeshStandardMaterial({
            map: this.grassTexture,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });

        const patchCount = Math.floor(this.segmentLength / 2); // More dense
        for (let i = 0; i < patchCount; i++) {
            const z = (i * 2) - this.segmentLength / 2 + (Math.random() * 1); // Randomize z slightly

            // Left Line (approx x = -1)
            const p1 = new THREE.Mesh(patchGeo, patchMat);
            p1.rotation.x = -Math.PI / 2;
            p1.rotation.z = Math.random() * Math.PI; // Random rotation
            p1.position.set(-1 + (Math.random() * 0.2 - 0.1), 0.02, z);
            floorGroup.add(p1);

            // Right Line (approx x = 1)
            const p2 = new THREE.Mesh(patchGeo, patchMat);
            p2.rotation.x = -Math.PI / 2;
            p2.rotation.z = Math.random() * Math.PI;
            p2.position.set(1 + (Math.random() * 0.2 - 0.1), 0.02, z);
            floorGroup.add(p2);
        }

        // Correct divider positions based on previous logic (-1 and 1 were correct for lanes at -2, 0, 2)
        // Wait, why did I change them to -1.5? Let's check.
        // Lane centers: -2, 0, 2.
        // Boundary between -2 and 0 is -1.
        // Boundary between 0 and 2 is 1.
        // So I should keep -1 and 1.




        // Fences
        const fencePostGeo = new THREE.BoxGeometry(0.2, 1.2, 0.2); // Slightly taller
        const fenceRailGeo = new THREE.BoxGeometry(0.1, 0.1, 5); // Long along Z axis
        const fenceMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9 }); // Dark Brown

        for (let i = 0; i < 10; i++) { // 10 fences per 50 unit segment (every 5 units)
            const z = (i * 5) - this.segmentLength / 2;

            // Left Fence
            const postL = new THREE.Mesh(fencePostGeo, fenceMat);
            postL.position.set(-3.5, 0.5, z);
            floorGroup.add(postL);

            const railL1 = new THREE.Mesh(fenceRailGeo, fenceMat);
            railL1.position.set(-3.5, 0.8, z + 2.5); // Upper rail
            floorGroup.add(railL1);

            const railL2 = new THREE.Mesh(fenceRailGeo, fenceMat);
            railL2.position.set(-3.5, 0.4, z + 2.5); // Lower rail
            floorGroup.add(railL2);

            // Right Fence
            const postR = new THREE.Mesh(fencePostGeo, fenceMat);
            postR.position.set(3.5, 0.5, z);
            floorGroup.add(postR);

            const railR1 = new THREE.Mesh(fenceRailGeo, fenceMat);
            railR1.position.set(3.5, 0.8, z + 2.5);
            floorGroup.add(railR1);

            const railR2 = new THREE.Mesh(fenceRailGeo, fenceMat);
            railR2.position.set(3.5, 0.4, z + 2.5);
            floorGroup.add(railR2);
        }

        // Decor: Trees, Rocks, Flowers
        // Simple Geometries
        const treeTrunkGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
        const treeLeavesGeo = new THREE.ConeGeometry(1, 2, 8);
        const treeMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const leavesMat = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // ForestGreen

        const rockGeo = new THREE.DodecahedronGeometry(0.4);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x808080 });

        const flowerGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const flowerMatY = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
        const flowerMatR = new THREE.MeshStandardMaterial({ color: 0xFF0000 });

        // Randomly place decor on grass
        for (let i = 0; i < 20; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const xOffset = (Math.random() * 10 + 6) * side; // 6 to 16 units out
            const zOffset = (Math.random() * this.segmentLength) - this.segmentLength / 2;

            const rand = Math.random();
            if (rand < 0.2) { // Tree
                const trunk = new THREE.Mesh(treeTrunkGeo, treeMat);
                trunk.position.set(xOffset, 0.5, zOffset);
                floorGroup.add(trunk);
                const leaves = new THREE.Mesh(treeLeavesGeo, leavesMat);
                leaves.position.set(xOffset, 1.5, zOffset);
                floorGroup.add(leaves);
            } else if (rand < 0.4) { // Rock
                const rock = new THREE.Mesh(rockGeo, rockMat);
                rock.position.set(xOffset, 0.2, zOffset);
                rock.rotation.set(Math.random(), Math.random(), Math.random());
                floorGroup.add(rock);
            } else { // Flower
                const flower = new THREE.Mesh(flowerGeo, Math.random() > 0.5 ? flowerMatY : flowerMatR);
                flower.position.set(xOffset, 0.1, zOffset);
                floorGroup.add(flower);
            }
        }

        floorGroup.position.z = zPos - this.segmentLength / 2;
        floorGroup.position.y = 0;

        this.game.scene.add(floorGroup);
        this.floorSegments.push(floorGroup);
    }

    spawnObstacle(zPos: number) {
        const types = ['crate', 'hay', 'rock'];
        const type = types[Math.floor(Math.random() * types.length)];

        let obstacle;

        // Initialize pool structure if not exists (handling migration from array to object if user didn't refresh)
        if (Array.isArray(this.obstaclePool)) {
            this.obstaclePool = { crate: [], hay: [], rock: [] };
        }

        if (this.obstaclePool[type] && this.obstaclePool[type].length > 0) {
            obstacle = this.obstaclePool[type].pop();
            obstacle.visible = true;
        } else {
            obstacle = this.createObstacleMesh(type);
        }

        // Random Lane (-1, 0, 1) -> x = -2, 0, 2
        const lane = Math.floor(Math.random() * 3) - 1;
        // Adjust height based on type (Rock might be lower)
        const yPos = type === 'rock' ? 0.4 : 0.5;
        obstacle.position.set(lane * 2.0, yPos, zPos);
        obstacle.rotation.set(0, 0, 0); // Reset rotation

        // Random rotation for rock for variety
        if (type === 'rock') {
            obstacle.rotation.y = Math.random() * Math.PI;
            obstacle.rotation.x = Math.random() * Math.PI;
        }

        this.obstacles.push(obstacle);
    }

    createObstacleMesh(type: string) {
        let geometry, material;

        if (type === 'crate') {
            if (!this.crateTexture) {
                const canvas = document.createElement('canvas');
                canvas.width = 64; canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#8B4513'; ctx.fillRect(0, 0, 64, 64); // Brown
                ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, 64, 64); // Border
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(64, 64); ctx.moveTo(64, 0); ctx.lineTo(0, 64); ctx.stroke(); // X
                this.crateTexture = new THREE.CanvasTexture(canvas);
                this.crateTexture.magFilter = THREE.NearestFilter;
            }
            geometry = new THREE.BoxGeometry(1, 1, 1);
            material = new THREE.MeshStandardMaterial({ map: this.crateTexture, roughness: 0.8 });
        } else if (type === 'hay') {
            if (!this.hayTexture) {
                const canvas = document.createElement('canvas');
                canvas.width = 64; canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFD700'; ctx.fillRect(0, 0, 64, 64); // Golden
                ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 2;
                // Draw straw lines
                for (let i = 0; i < 10; i++) {
                    const y = Math.random() * 64;
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(64, y + (Math.random() * 10 - 5)); ctx.stroke();
                }
                this.hayTexture = new THREE.CanvasTexture(canvas);
                this.hayTexture.magFilter = THREE.NearestFilter;
            }
            geometry = new THREE.BoxGeometry(1, 1, 1);
            material = new THREE.MeshStandardMaterial({ map: this.hayTexture, roughness: 1.0 });
        } else if (type === 'rock') {
            if (!this.rockTexture) {
                const canvas = document.createElement('canvas');
                canvas.width = 64; canvas.height = 64;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 64, 64); // Grey
                // Noise
                for (let i = 0; i < 100; i++) {
                    ctx.fillStyle = Math.random() > 0.5 ? '#696969' : '#A9A9A9';
                    ctx.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 4, 4);
                }
                this.rockTexture = new THREE.CanvasTexture(canvas);
                this.rockTexture.magFilter = THREE.NearestFilter;
            }
            geometry = new THREE.DodecahedronGeometry(0.5); // Rock shape
            material = new THREE.MeshStandardMaterial({ map: this.rockTexture, roughness: 0.9 });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.type = type;
        this.game.scene.add(mesh);
        return mesh;
    }

    spawnCoin(zPos: number) {
        let coin;
        if (this.coinPool.length > 0) {
            coin = this.coinPool.pop();
            coin.visible = true;
            // Reset state
            coin.userData.isPopping = false;
            coin.scale.setScalar(1);
            // We might have cloned the material, so if we did, we should probably reset it or dispose old one?
            // Simple way: just reset properties. 
            // Better: Share one base material for all normal coins.
            // If pooling, we can just assign the base material back.
            // But we don't have reference to base material here easily without storing it.
            // Let's just fix the properties.
            (coin.material as THREE.MeshStandardMaterial).opacity = 1;
            (coin.material as THREE.MeshStandardMaterial).transparent = false;
        } else {
            // Coin Shape: Cylinder (Disc)
            const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                emissive: 0xffaa00,
                emissiveIntensity: 0.5,
                metalness: 0.8,
                roughness: 0.2
            });
            coin = new THREE.Mesh(geometry, material);
            // Default rotation for cylinder is upright (like a can). 
            // We want it like a wheel, so rotate X.
            coin.rotation.x = Math.PI / 2;
            // Save initial rotation offset so we can spin it properly
            coin.userData.initialRotX = Math.PI / 2;

            this.game.scene.add(coin);
        }

        const lane = Math.floor(Math.random() * 3) - 1;
        coin.position.set(lane * 2.0, 0.5, zPos);

        // Reset rotation each spawn if reused
        coin.rotation.set(Math.PI / 2, 0, 0); // Reset to upright disc
        coin.userData.bobOffset = Math.random() * Math.PI * 2; // Random bob phase
        coin.userData.imgScale = 1;

        this.coins.push(coin);
    }

    update(dt: number, speed: number, playerMesh: THREE.Mesh, magnetActive: boolean) {
        const moveDistance = speed * dt;

        // Move Floors
        // ... (existing floor logic)
        for (let i = this.floorSegments.length - 1; i >= 0; i--) {
            const floor = this.floorSegments[i];
            floor.position.z += moveDistance;

            if (floor.position.z > 50) {
                let minZ = 0;
                this.floorSegments.forEach(f => minZ = Math.min(minZ, f.position.z));
                floor.position.z = minZ - this.segmentLength;

                const spawnCount = 8;
                const step = this.segmentLength / spawnCount;

                for (let j = 0; j < spawnCount; j++) {
                    const z = floor.position.z + (j * step) - (this.segmentLength / 2);
                    const r = Math.random();
                    if (r < 0.45) {
                        this.spawnObstacle(z);
                    } else if (r > 0.55) {
                        this.spawnCoin(z);
                    }
                }
            }
        }

        // Move Obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.position.z += moveDistance;

            if (obs.position.z > 10) {
                obs.visible = false;
                const type = obs.userData.type || 'crate';
                if (!this.obstaclePool[type]) this.obstaclePool[type] = [];
                this.obstaclePool[type].push(obs);
                this.obstacles.splice(i, 1);
            }
        }

        // Move Coins & Animate
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];

            if (coin.userData.isPopping) {
                coin.userData.imgScale += dt * 5;
                coin.scale.setScalar(coin.userData.imgScale);
                (coin.material as THREE.MeshStandardMaterial).opacity -= dt * 3;
                coin.position.z += moveDistance;

                if ((coin.material as THREE.MeshStandardMaterial).opacity <= 0) {
                    coin.visible = false;
                    coin.userData.isPopping = false;
                    this.coinPool.push(coin);
                    this.coins.splice(i, 1);
                }
                continue;
            }

            // Magnet Attraction Logic
            if (magnetActive && playerMesh) {
                const dist = coin.position.distanceTo(playerMesh.position);
                if (dist < 8.0) { // Attraction range
                    const attractionSpeed = 15;
                    // Move towards player
                    const dir = playerMesh.position.clone().sub(coin.position).normalize();
                    coin.position.add(dir.multiplyScalar(attractionSpeed * dt));
                }
            }

            // Normal behavior
            coin.position.z += moveDistance;
            coin.rotation.z += 2 * dt;
            coin.position.y = 0.5 + Math.sin(Date.now() * 0.005 + coin.userData.bobOffset) * 0.1;

            if (coin.position.z > 10) {
                coin.visible = false;
                this.coinPool.push(coin);
                this.coins.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.position.add(p.userData.velocity.clone().multiplyScalar(dt));
            p.userData.velocity.y += this.game.player.gravity * 0.5 * dt; // Gravity
            p.userData.life -= dt;
            (p.material as THREE.Material).opacity = p.userData.life;

            if (p.userData.life <= 0) {
                this.game.scene.remove(p);
                this.particles.splice(i, 1);
            }
        }
    }

    checkCollision(playerMesh: THREE.Mesh) {
        const playerBox = new THREE.Box3().setFromObject(playerMesh);
        playerBox.expandByScalar(-0.2);

        for (const obs of this.obstacles) {
            const obsBox = new THREE.Box3().setFromObject(obs);
            obsBox.expandByScalar(-0.1);
            if (playerBox.intersectsBox(obsBox)) {
                return true;
            }
        }
        return false;
    }

    checkCollisionDetailed(playerMesh: THREE.Mesh, expansion: number = 0) {
        const playerBox = new THREE.Box3().setFromObject(playerMesh);
        playerBox.expandByScalar(-0.2 + expansion); // Subtract base contraction and add expansion

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            const obsBox = new THREE.Box3().setFromObject(obs);
            obsBox.expandByScalar(-0.1);
            if (playerBox.intersectsBox(obsBox)) {
                return obs; // Return the obstacle that was hit
            }
        }
        return null;
    }

    breakObstacle(obs: THREE.Mesh) {
        this.spawnShatterParticles(obs.position, obs.userData.type);
        obs.visible = false;
        // Move to pool logic
        const type = obs.userData.type || 'crate';
        if (this.obstaclePool[type]) {
            this.obstaclePool[type].push(obs);
        }
        // Remove from active obstacles array
        const index = this.obstacles.indexOf(obs);
        if (index > -1) {
            this.obstacles.splice(index, 1);
        }
    }

    spawnShatterParticles(pos: THREE.Vector3, type: string) {
        const isBig = this.game.potionActive;
        const count = isBig ? 20 : 10;
        const size = isBig ? 0.4 : 0.2;
        const speed = isBig ? 12 : 8;

        let color = 0x8B4513;
        if (type === 'rock' || type === 'stone') color = 0x808080;
        else if (type === 'hay') color = 0xFFD700;

        this.spawnGenericParticles(pos, count, color, size, speed, 1.2, false);
    }

    spawnGenericParticles(pos: THREE.Vector3, count: number, color: number | string, size: number = 0.2, speed: number = 5, life: number = 1.0, isGlow: boolean = false) {
        const particleGeo = new THREE.BoxGeometry(size, size, size);
        for (let i = 0; i < count; i++) {
            const mat = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                emissive: isGlow ? color : 0x000000,
                emissiveIntensity: isGlow ? 1.0 : 0
            });
            const p = new THREE.Mesh(particleGeo, mat);
            p.position.copy(pos);
            p.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * speed,
                (Math.random() * speed * 0.5) + (speed * 0.2),
                (Math.random() - 0.5) * speed
            );
            p.userData.life = life;
            p.userData.maxLife = life;
            this.game.scene.add(p);
            this.particles.push(p);
        }
    }

    checkCoinCollision(playerMesh: THREE.Mesh, magnetRadius: number = 0) {
        const playerBox = new THREE.Box3().setFromObject(playerMesh);
        if (magnetRadius > 0) {
            playerBox.expandByScalar(magnetRadius);
        }
        let gathered = 0;

        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (coin.userData.isPopping) continue; // Ignore already collected

            const coinBox = new THREE.Box3().setFromObject(coin);

            if (playerBox.intersectsBox(coinBox)) {
                gathered++;
                // Trigger Pop Animation
                coin.userData.isPopping = true;
                coin.userData.imgScale = 1;
                // Make sure we clone material so we don't fade ALL coins
                // But efficient way: cache materials? For now, clone on pop if needed or use unique material?
                // Actually, modifying opacity on shared material will fade ALL coins.
                // We need to clone material for the popping coin.
                coin.material = (coin.material as THREE.Material).clone();
                (coin.material as THREE.MeshStandardMaterial).transparent = true;
                (coin.material as THREE.MeshStandardMaterial).opacity = 1;
            }
        }
        return gathered;
    }
}
