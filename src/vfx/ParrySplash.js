// ============================================================
// ParrySplash.js — White ink explosion VFX on successful parry
// ============================================================
export default class ParrySplash {
    /**
     * Trigger the parry splash at position (x, y).
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {number} bulletTimeDuration — ms to slow time
     */
    static trigger(scene, x, y, bulletTimeDuration = 300) {
        // ---- Ink particle burst ----
        const particles = scene.add.particles(x, y, 'inkparticle', {
            speed: { min: 120, max: 380 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.9, end: 0.0 },
            alpha: { start: 1, end: 0 },
            lifespan: 420,
            quantity: 28,
            tint: [0xffffff, 0xe8e0c8, 0x000000],
            gravityY: 60,
            emitting: false,
        });
        particles.setDepth(30);
        particles.explode(28, x, y);

        // ---- Screen flash ----
        const flash = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0xffffff, 1)
            .setOrigin(0, 0).setDepth(50);
        scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 180,
            ease: 'Power2',
            onComplete: () => flash.destroy(),
        });

        // ---- Shockwave ring ----
        const ring = scene.add.circle(x, y, 10, 0xffffff, 0)
            .setStrokeStyle(4, 0xffffff, 1).setDepth(31);
        scene.tweens.add({
            targets: ring,
            radius: 90,
            alpha: 0,
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy(),
        });

        // ---- Bullet time ----
        scene.time.timeScale = 0.25;
        scene.physics?.world && (scene.physics.world.timeScale = 1 / 0.25);
        scene.time.delayedCall(bulletTimeDuration * 0.25, () => {
            scene.tweens.add({
                targets: null,
                duration: 150,
                onUpdate: (_, __, ___, current) => {
                    scene.time.timeScale = 0.25 + (1 - 0.25) * current;
                },
                onComplete: () => { scene.time.timeScale = 1; },
            });
        });

        // Cleanup particles
        scene.time.delayedCall(600, () => {
            if (particles && particles.scene) particles.destroy();
        });
    }
}
