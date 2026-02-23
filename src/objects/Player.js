// ============================================================
// Player.js — The Scribe (Matter.js physics sprite)
// ============================================================
import TrailEmitter from './TrailEmitter.js';
import { GRAVITY_MAGNITUDE, PLAYER_BASE_HP, PLAYER_START_X, PLAYER_START_Y } from '../config.js';

export default class Player {
    constructor(scene, x, y, upgradeState) {
        this.scene = scene;
        this.gravityFlipped = false;
        this.isParrying = false;
        this.isGuarding = false;
        this.upgradeState = upgradeState;

        // HP
        const bonusHP = upgradeState ? (upgradeState.absorbency * 20) : 0;
        this.maxHP = PLAYER_BASE_HP + bonusHP;
        this.hp = this.maxHP;

        // Tether state
        this.tetherActive = false;
        this.tetherAnchor = null;
        this.tetherConstraint = null;

        // Physics body
        this.body = scene.matter.add.image(x, y, 'scribe');
        this.body.setFixedRotation();
        this.body.setFrictionAir(0.02);
        this.body.setDepth(10);
        this.body.setScale(0.7);
        this.body.label = 'player';

        // Trail
        this.trail = new TrailEmitter(scene, 'scribe', 14);

        // Spark indicator (parry window flash)
        this.spark = scene.add.circle(x, y, 36, 0xffffff, 0).setDepth(15);

        this._trailTick = 0;
    }

    get x() { return this.body.x; }
    get y() { return this.body.y; }

    /** Flip gravity — the core mechanic */
    flip(audio) {
        this.gravityFlipped = !this.gravityFlipped;
        const g = this.gravityFlipped ? -GRAVITY_MAGNITUDE : GRAVITY_MAGNITUDE;
        this.scene.matter.world.setGravity(0, g);
        this.body.setScale(this.gravityFlipped ? -0.7 : 0.7, 0.7);
        if (audio) audio.playGravityThrum();

        // Quick visual bounce
        this.scene.tweens.add({
            targets: this.body,
            scaleY: this.gravityFlipped ? -0.85 : 0.85,
            duration: 80,
            yoyo: true,
        });
    }

    /** Flash the parry spark ring */
    showParrySpark(open) {
        if (open) {
            this.scene.tweens.add({
                targets: this.spark,
                fillAlpha: 0.6,
                duration: 60,
                yoyo: true,
                repeat: 2,
                onComplete: () => this.spark.setFillStyle(0xffffff, 0),
            });
        }
    }

    takeDamage(amount) {
        const actual = this.isGuarding ? Math.ceil(amount * 0.5) : amount;
        this.hp = Math.max(0, this.hp - actual);
        this.isGuarding = false;

        // Flash red
        this.scene.tweens.add({
            targets: this.body,
            alpha: 0.2,
            duration: 60,
            yoyo: true,
            repeat: 3,
            onComplete: () => this.body.setAlpha(1),
        });

        return actual;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHP, this.hp + amount);
    }

    get alive() { return this.hp > 0; }

    /** Activate Guard bonus for next hit */
    activateGuard() {
        this.isGuarding = true;
    }

    update(delta) {
        // Keep spark at player pos
        this.spark.setPosition(this.x, this.y);

        // Emit trail every 3 frames
        this._trailTick++;
        if (this._trailTick % 3 === 0) {
            this.trail.emit(this.x, this.y, this.gravityFlipped ? -1 : 1);
        }
        this.trail.update(delta);

        // Clamp to screen bounds
        const hw = 20;
        if (this.body.x < hw) this.body.setX(hw);
        if (this.body.x > this.scene.scale.width - hw) this.body.setX(this.scene.scale.width - hw);
        if (this.body.y < 40) this.body.setY(40);
        if (this.body.y > this.scene.scale.height - 40) this.body.setY(this.scene.scale.height - 40);
    }

    destroy() {
        this.trail.destroy();
        this.spark.destroy();
        this.body.destroy();
    }
}
