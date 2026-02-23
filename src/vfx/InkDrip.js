// ============================================================
// InkDrip.js — Floor-transition wipe animation
// ============================================================
export default class InkDrip {
    /**
     * Plays an ink-drip wipe from the bottom of the screen.
     * Returns a promise that resolves when the cover is full,
     * then calls midCallback, then resolves again after reveal.
     */
    static async play(scene, midCallback) {
        const W = scene.scale.width;
        const H = scene.scale.height;

        // Ink wave overlay
        const overlay = scene.add.rectangle(0, H, W, H, 0x0d0a05, 1)
            .setOrigin(0, 0).setDepth(100);

        // Slide up to cover screen
        await new Promise(r => scene.tweens.add({
            targets: overlay,
            y: 0,
            duration: 600,
            ease: 'Power3.easeIn',
            onComplete: r,
        }));

        // Drip droplets falling from top edge
        const drops = [];
        for (let i = 0; i < 8; i++) {
            const drop = scene.add.ellipse(
                Phaser.Math.Between(30, W - 30), 0,
                Phaser.Math.Between(8, 18),
                Phaser.Math.Between(20, 40),
                0x0d0a05,
            ).setDepth(101);
            drops.push(drop);
            scene.tweens.add({
                targets: drop,
                y: Phaser.Math.Between(40, 120),
                duration: Phaser.Math.Between(300, 700),
                ease: 'Bounce.easeOut',
                delay: i * 60,
            });
        }

        if (midCallback) await midCallback();

        await new Promise(r => scene.time.delayedCall(200, r));

        // Reveal — slide up off-screen
        await new Promise(r => scene.tweens.add({
            targets: overlay,
            y: -H,
            duration: 500,
            ease: 'Power2.easeOut',
            onComplete: r,
        }));

        overlay.destroy();
        drops.forEach(d => d.destroy());
    }
}
