// ============================================================
// DeathDissolve.js — Ink droplet dissolution on entity death
// ============================================================
export default class DeathDissolve {
    /**
     * Plays a death dissolve at (x,y) — entity shatters into ink drops.
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {number} tint — colour of droplets
     */
    static play(scene, x, y, tint = 0x000000) {
        const count = 22;
        const drops = [];

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = Phaser.Math.Between(60, 200);
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;
            const size = Phaser.Math.Between(4, 14);

            const drop = scene.add.circle(x, y, size, tint, 1).setDepth(25);
            drops.push(drop);

            scene.tweens.add({
                targets: drop,
                x: x + dx,
                y: y + dy + 60, // gravity pull
                alpha: 0,
                scaleX: 0.1,
                scaleY: 0.1,
                duration: Phaser.Math.Between(400, 800),
                ease: 'Power2',
                delay: Phaser.Math.Between(0, 100),
                onComplete: () => { if (drop.scene) drop.destroy(); },
            });
        }

        // Screen shake
        scene.cameras.main.shake(200, 0.012);
    }
}
