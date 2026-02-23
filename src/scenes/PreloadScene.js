// ============================================================
// PreloadScene.js — Asset loading / splash screen
// ============================================================
export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Title
        this.add.text(W / 2, H * 0.4, 'PROJECT', {
            fontFamily: '"Palatino Linotype", Palatino, serif',
            fontSize: '28px',
            color: '#8b6a30',
            letterSpacing: 12,
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.48, 'INK-FLIP', {
            fontFamily: '"Palatino Linotype", Palatino, serif',
            fontSize: '52px',
            fontStyle: 'bold',
            color: '#1a0d00',
            letterSpacing: 4,
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(W / 2, H * 0.57, '— A CALLIGRAPHY ODYSSEY —', {
            fontFamily: 'serif',
            fontSize: '12px',
            color: '#8b6a30',
            letterSpacing: 6,
        }).setOrigin(0.5);

        // Animated nib icon
        const nib = this.add.triangle(W / 2, H * 0.68, 0, 10, -6, -4, 6, -4, 0x1a0d00)
            .setScale(2);
        this.tweens.add({
            targets: nib,
            y: H * 0.68 + 8,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Tap to begin
        const tapText = this.add.text(W / 2, H * 0.78, 'TAP TO BEGIN', {
            fontFamily: 'serif',
            fontSize: '16px',
            color: '#5c3a10',
            letterSpacing: 6,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: tapText,
            alpha: 0,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Paper background
        this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'parchment')
            .setOrigin(0, 0).setDepth(-1);

        this.input.once('pointerdown', () => {
            this.cameras.main.fade(400, 26, 13, 0);
            this.time.delayedCall(400, () => {
                this.scene.start('GameScene');
                this.scene.launch('UIScene');
            });
        });
    }
}
