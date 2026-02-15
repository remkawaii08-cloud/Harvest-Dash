import * as THREE from 'three';

export default class TextureFactory {
    static createTexture(type) {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        switch (type) {
            case 'crate':
                // Base wood
                ctx.fillStyle = '#8B4513'; // SaddleBrown
                ctx.fillRect(0, 0, size, size);
                // Border
                ctx.strokeStyle = '#5D4037';
                ctx.lineWidth = 4;
                ctx.strokeRect(0, 0, size, size);
                // Cross
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(size, size);
                ctx.moveTo(size, 0);
                ctx.lineTo(0, size);
                ctx.stroke();
                // Planks
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, size / 2);
                ctx.lineTo(size, size / 2);
                ctx.stroke();
                break;

            case 'dirt':
                // Base dirt
                ctx.fillStyle = '#5D4037'; // Earth Brown/Dark Brown
                ctx.fillRect(0, 0, size, size);
                // Noise
                for (let i = 0; i < 200; i++) {
                    ctx.fillStyle = Math.random() > 0.5 ? '#3E2723' : '#795548';
                    const x = Math.floor(Math.random() * size);
                    const y = Math.floor(Math.random() * size);
                    ctx.fillRect(x, y, 2, 2);
                }
                break;

            case 'grass':
                // Base grass
                ctx.fillStyle = '#4CAF50'; // Green
                ctx.fillRect(0, 0, size, size);
                // Noise / Blades
                for (let i = 0; i < 300; i++) {
                    ctx.fillStyle = Math.random() > 0.5 ? '#388E3C' : '#81C784';
                    const x = Math.floor(Math.random() * size);
                    const y = Math.floor(Math.random() * size);
                    ctx.fillRect(x, y, 2, 2);
                }
                break;

            case 'face':
                // Base wood
                ctx.fillStyle = '#D2691E'; // Chocolate
                ctx.fillRect(0, 0, size, size);
                // Eyes
                ctx.fillStyle = '#000000';
                ctx.fillRect(15, 20, 10, 10);
                ctx.fillRect(39, 20, 10, 10);
                // Mouth
                ctx.fillRect(20, 45, 24, 6);
                break;
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }
}
