// ============================================================
// InkBlot.js — Standard enemy with timed telegraph attack
// ============================================================
import { ENEMY_BASE_HP, ENEMY_X, ENEMY_Y } from '../config.js';

export default class InkBlot {
    constructor(scene, floor) {
        this.scene = scene;
        this.floor = floor;
        this.maxHP = ENEMY_BASE_HP + (floor - 1) * 20;
        this.hp = this.maxHP;

        // Sprite (static image, animated via tweens)
        this.body = scene.add.image(ENEMY_X, ENEMY_Y, 'inkblot').setDepth(10).setScale(0.8);

        // Idle bob tween
        this._idleTween = scene.tweens.add({
            targets: this.body,
            y: ENEMY_Y + 14,
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Blob pulse scale
        this._pulseTween = scene.tweens.add({
            targets: this.body,
            scaleX: 0.85,
            scaleY: 0.75,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // HP bar
        this._hpBarBg = scene.add.rectangle(ENEMY_X, ENEMY_Y - 70, 100, 10, 0x222222).setDepth(11);
        this._hpBar = scene.add.rectangle(ENEMY_X - 50, ENEMY_Y - 70, 100, 10, 0x111111).setDepth(12).setOrigin(0, 0.5);

        // Intent icon
        this._intentText = scene.add.text(ENEMY_X, ENEMY_Y - 85, '', {
            fontFamily: 'serif',
            fontSize: '12px',
            color: '#8b4513',
            align: 'center',
        }).setOrigin(0.5).setDepth(13);

        this.updateHPBar();
    }

    updateHPBar() {
        const frac = Math.max(0, this.hp / this.maxHP);
        this._hpBar.setScale(frac, 1);
        // Color shifts red→yellow→green
        const r = frac < 0.5 ? 255 : Math.floor((1 - frac) * 512);
        const g = frac > 0.5 ? 200 : Math.floor(frac * 400);
        this._hpBar.setFillStyle(Phaser.Display.Color.GetColor(r, g, 20));
    }

    setIntent(text) {
        this._intentText.setText(text);
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.updateHPBar();

        // Flash white
        this.scene.tweens.add({
            targets: this.body,
            alpha: 0.1,
            duration: 50,
            yoyo: true,
            repeat: 3,
            onComplete: () => this.body.setAlpha(1),
        });

        return amount;
    }

    get alive() { return this.hp > 0; }

    /**
     * Telegraph attack sequence:
     * 1. Wind-up tween (1s) — body glows red, spikes protrude
     * 2. Fire! — body lunges, emits 'attack-fired'
     * Returns a Promise that resolves when the lunge animation is done.
     */
    telegraphAttack(onFire) {
        return new Promise((resolve) => {
            this._idleTween.pause();
            this._pulseTween.pause();
            this.setIntent('⚡ ATTACK!');

            // Wind-up: expand + glow
            this.scene.tweens.add({
                targets: this.body,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 800,
                ease: 'Back.easeIn',
                onComplete: () => {
                    // Flash red warning
                    this.scene.cameras.main.flash(80, 255, 40, 40);

                    // Fire — quick lunge downward
                    const startY = this.body.y;
                    this.scene.tweens.add({
                        targets: this.body,
                        y: startY + 200,
                        duration: 200,
                        ease: 'Cubic.easeIn',
                        onStart: () => { if (onFire) onFire(); },
                        onComplete: () => {
                            // Retract
                            this.scene.tweens.add({
                                targets: this.body,
                                y: startY,
                                scaleX: 0.8,
                                scaleY: 0.8,
                                duration: 350,
                                ease: 'Back.easeOut',
                                onComplete: () => {
                                    this._idleTween.resume();
                                    this._pulseTween.resume();
                                    this.setIntent('');
                                    resolve();
                                },
                            });
                        },
                    });
                },
            });
        });
    }

    destroy() {
        if (this._idleTween) this._idleTween.destroy();
        if (this._pulseTween) this._pulseTween.destroy();
        this.body.destroy();
        this._hpBarBg.destroy();
        this._hpBar.destroy();
        this._intentText.destroy();
    }
}
