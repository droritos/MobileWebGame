// ============================================================
// BootScene.js — Procedurally generate all textures
// ============================================================
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    create() {
        this._makeParchment();
        this._makeScribe();
        this._makeInkBlot();
        this._makeInkParticle();
        this._makeAnchor();
        this.scene.start('PreloadScene');
    }

    /** Warm off-white paper with subtle noise grain */
    _makeParchment() {
        const W = 450, H = 200;
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Base paper colour
        g.fillStyle(0xf0e8cc, 1);
        g.fillRect(0, 0, W, H);

        // Horizontal ruled lines (very faint)
        g.lineStyle(1, 0xc8b882, 0.3);
        for (let y = 30; y < H; y += 30) {
            g.lineBetween(0, y, W, y);
        }

        // Grain noise dots
        for (let i = 0; i < 600; i++) {
            const nx = Math.random() * W;
            const ny = Math.random() * H;
            const alpha = Math.random() * 0.2;
            g.fillStyle(0x8b6a30, alpha);
            g.fillRect(nx, ny, 1, 1);
        }

        // Edge darkening
        g.fillStyle(0x8b6a30, 0.08);
        g.fillRect(0, 0, 8, H);
        g.fillRect(W - 8, 0, 8, H);

        g.generateTexture('parchment', W, H);
        g.destroy();
    }

    /** Hooded scribe silhouette */
    _makeScribe() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const W = 52, H = 72;

        // Body / robe
        g.fillStyle(0x1a0d00, 1);
        g.fillRoundedRect(12, 22, 28, 44, 6);

        // Hood
        g.fillStyle(0x1a0d00, 1);
        g.fillEllipse(26, 20, 30, 32);

        // Face shadow
        g.fillStyle(0x0d0700, 0.8);
        g.fillEllipse(26, 22, 18, 16);

        // Glowing eye
        g.fillStyle(0xe8c85a, 1);
        g.fillCircle(26, 21, 3);

        // Scarf / brush trail (flowing curves)
        g.lineStyle(4, 0x3a1a00, 0.9);
        g.beginPath();
        g.moveTo(18, 30);
        g.bezierCurveTo(4, 38, 8, 55, 0, 65);
        g.strokePath();
        g.lineStyle(3, 0x5c2e00, 0.7);
        g.beginPath();
        g.moveTo(14, 34);
        g.bezierCurveTo(2, 42, 6, 58, -2, 70);
        g.strokePath();

        // Calligraphy staff / nib
        g.lineStyle(2, 0x8b6a30, 1);
        g.lineBetween(34, 26, 50, 8);
        g.fillStyle(0x8b6a30, 1);
        g.fillTriangle(50, 8, 44, 4, 48, 14);

        g.generateTexture('scribe', W, H);
        g.destroy();
    }

    /** Amorphous ink blob */
    _makeInkBlot() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const W = 100, H = 80;
        const cx = W / 2, cy = H / 2;

        // Main blob (irregular ellipse via bezier)
        g.fillStyle(0x0a0a0a, 1);
        g.beginPath();
        g.moveTo(cx, cy - 34);
        g.bezierCurveTo(cx + 28, cy - 36, cx + 42, cy - 10, cx + 40, cy + 8);
        g.bezierCurveTo(cx + 38, cy + 26, cx + 22, cy + 34, cx, cy + 32);
        g.bezierCurveTo(cx - 22, cy + 34, cx - 40, cy + 22, cx - 38, cy + 4);
        g.bezierCurveTo(cx - 36, cy - 14, cx - 26, cy - 34, cx, cy - 34);
        g.closePath();
        g.fillPath();

        // Spikes (suggest aggression)
        g.fillStyle(0x0a0a0a, 1);
        const spikes = [
            [cx, cy - 36, cx - 6, cy - 48, cx + 6, cy - 48],
            [cx + 40, cy - 2, cx + 50, cy - 12, cx + 52, cy + 4],
            [cx - 38, cy + 2, cx - 52, cy - 8, cx - 50, cy + 8],
        ];
        for (const [x1, y1, x2, y2, x3, y3] of spikes) {
            g.fillTriangle(x1, y1, x2, y2, x3, y3);
        }

        // Highlight gloss
        g.fillStyle(0x2a2a2a, 0.6);
        g.fillEllipse(cx - 8, cy - 12, 22, 14);

        // Red pupil eyes
        g.fillStyle(0xcc1111, 1);
        g.fillCircle(cx - 10, cy - 2, 5);
        g.fillCircle(cx + 10, cy - 2, 5);
        g.fillStyle(0xff4444, 0.7);
        g.fillCircle(cx - 8, cy - 4, 2);
        g.fillCircle(cx + 12, cy - 4, 2);

        g.generateTexture('inkblot', W, H);
        g.destroy();
    }

    /** Small ink droplet for particles */
    _makeInkParticle() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1);
        g.fillCircle(8, 8, 8);
        // Teardrop tail
        g.fillTriangle(8, 0, 4, -8, 12, -8);
        g.generateTexture('inkparticle', 16, 20);
        g.destroy();
    }

    /** Tether anchor pip */
    _makeAnchor() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x5c4a2a, 1);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0x8b6a30, 1);
        g.fillCircle(8, 8, 4);
        g.generateTexture('anchor', 16, 16);
        g.destroy();
    }
}
