// ============================================================
// TrailEmitter.js — Motion smear ink trail for The Scribe
// ============================================================
export default class TrailEmitter {
    constructor(scene, texture, maxTrails = 12) {
        this.scene = scene;
        this.texture = texture;
        this.maxTrails = maxTrails;
        this.pool = [];

        for (let i = 0; i < maxTrails; i++) {
            const sprite = scene.add.image(0, 0, texture)
                .setAlpha(0)
                .setDepth(3)
                .setScale(0.55);
            this.pool.push({ sprite, life: 0 });
        }
        this._cursor = 0;
    }

    /** Call each frame with the current entity position and flip state */
    emit(x, y, scaleX = 1) {
        const slot = this.pool[this._cursor];
        slot.sprite.setPosition(x, y);
        slot.sprite.setAlpha(0.45);
        slot.sprite.setScale(0.55 * scaleX, 0.55);
        slot.sprite.setTint(0x2a1a02);
        slot.life = 1.0;
        this._cursor = (this._cursor + 1) % this.maxTrails;
    }

    /** Call each frame in update() */
    update(delta) {
        const decay = delta * 0.004;
        for (const slot of this.pool) {
            if (slot.life > 0) {
                slot.life -= decay;
                slot.sprite.setAlpha(Math.max(0, slot.life * 0.45));
                // Slight taper — scale down as it fades
                const s = 0.3 + slot.life * 0.25;
                slot.sprite.setScale(s, s);
                if (slot.life <= 0) {
                    slot.sprite.setAlpha(0);
                }
            }
        }
    }

    destroy() {
        for (const slot of this.pool) {
            slot.sprite.destroy();
        }
        this.pool = [];
    }
}
