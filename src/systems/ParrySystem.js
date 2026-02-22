// ============================================================
// ParrySystem.js — Timing window detection and splash trigger
// ============================================================
import { PARRY_WINDOW_MS } from '../config.js';

export default class ParrySystem extends Phaser.Events.EventEmitter {
    constructor(scene, player, audio) {
        super();
        this.scene = scene;
        this.player = player;
        this.audio = audio;
        this.windowOpen = false;
        this.windowTimer = null;
        this._upgradeState = null;
    }

    setUpgradeState(state) {
        this._upgradeState = state;
    }

    /** Called when an enemy fires an attack */
    openWindow() {
        this.windowOpen = true;
        this.player.isParrying = true;

        // Visual spark on player
        this.emit('window-open');

        // Auto-close after window duration
        const duration = PARRY_WINDOW_MS;
        this.windowTimer = this.scene.time.delayedCall(duration, () => {
            if (this.windowOpen) {
                this.windowOpen = false;
                this.player.isParrying = false;
                this.emit('window-missed');
            }
        });
    }

    /** Called by player tap input during reaction phase */
    attemptParry() {
        if (!this.windowOpen) return false;

        // Success!
        this.windowOpen = false;
        this.player.isParrying = false;
        if (this.windowTimer) this.windowTimer.remove();

        this.audio.playParry();
        this.emit('parry-success');
        return true;
    }

    reset() {
        this.windowOpen = false;
        this.player.isParrying = false;
        if (this.windowTimer) this.windowTimer.remove();
        this.windowTimer = null;
    }
}
