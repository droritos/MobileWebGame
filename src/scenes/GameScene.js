// ============================================================
// GameScene.js — Core game loop: combat, physics, reactions
// ============================================================
import Player from '../objects/Player.js';
import InkBlot from '../objects/InkBlot.js';
import CombatStateMachine, { STATES } from '../systems/CombatStateMachine.js';
import ParrySystem from '../systems/ParrySystem.js';
import AudioManager from '../systems/AudioManager.js';
import UpgradeManager from '../systems/UpgradeManager.js';
import ParrySplash from '../vfx/ParrySplash.js';
import InkDrip from '../vfx/InkDrip.js';
import DeathDissolve from '../vfx/DeathDissolve.js';
import {
    GAME_WIDTH, ENEMY_ATTACK_DAMAGE, PLAYER_ATTACK_DAMAGE,
    PARRY_REFLECT_MULTIPLIER, PARRY_WINDOW_MS, INKBLOT_INK_DROP,
    SKILLS,
} from '../config.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.upgradeState = UpgradeManager.load();
        this.floor = data?.floor ?? 1;
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // ---- Background ----
        this.bg = this.add.tileSprite(0, 0, W, H, 'parchment')
            .setOrigin(0, 0).setDepth(0);

        // Vignette overlay for mood
        this._makeVignette(W, H);

        // ---- Systems ----
        this.audio = new AudioManager();
        this.fsm = new CombatStateMachine(this);
        this.fsm.floor = this.floor;

        // ---- Player ----
        this.player = new Player(this, W / 2, H * 0.72, this.upgradeState);

        // ---- Enemy ----
        this.enemy = new InkBlot(this, this.floor);

        // ---- Parry system ----
        this.parry = new ParrySystem(this, this.player, this.audio);
        this.parry.setUpgradeState(this.upgradeState);

        // ---- Tether line graphics ----
        this.tetherGfx = this.add.graphics().setDepth(8);

        // ---- Ceiling & Floor boundaries ----
        this.matter.add.rectangle(W / 2, -10, W, 20, { isStatic: true, label: 'ceiling' });
        this.matter.add.rectangle(W / 2, H + 10, W, 20, { isStatic: true, label: 'ground' });
        this.matter.add.rectangle(-10, H / 2, 20, H, { isStatic: true, label: 'wall-left' });
        this.matter.add.rectangle(W + 10, H / 2, 20, H, { isStatic: true, label: 'wall-right' });

        // ---- Event wiring ----
        this._wireEvents();

        // ---- Input ----
        this._setupInput();

        // ---- Start combat ----
        this.time.delayedCall(300, () => this.fsm.startCombat());

        // ---- Hand off to UIScene ----
        this.scene.get('UIScene')?.setGameScene?.(this);

        // Floor label
        this._floorLabel = this.add.text(W / 2, H - 14, `FLOOR ${this.floor}`, {
            fontFamily: 'serif',
            fontSize: '11px',
            color: '#8b6a30',
            alpha: 0.6,
            letterSpacing: 5,
        }).setOrigin(0.5).setDepth(20);
    }

    _makeVignette(W, H) {
        // Simple dark corner vignette using layered semi-transparent rects
        const g = this.add.graphics().setDepth(2).setAlpha(0.5);
        const steps = 8;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const alpha = t * t * 0.35;
            const margin = t * Math.min(W, H) * 0.5;
            g.fillStyle(0x000000, alpha);
            g.fillRect(0, 0, margin, H);
            g.fillRect(W - margin, 0, margin, H);
            g.fillRect(0, 0, W, margin);
            g.fillRect(0, H - margin, W, margin);
        }
    }


    _wireEvents() {
        // FSM state transitions
        this.fsm.on('statechange', ({ from, to }) => {
            const ui = this.scene.get('UIScene');
            if (ui?.onStateChange) ui.onStateChange(from, to, this);

            if (to === STATES.GAME_OVER) this._handleGameOver();
            if (to === STATES.VICTORY) this._handleVictory();
        });

        // Parry events
        this.parry.on('window-open', () => {
            this.player.showParrySpark(true);
            const ui = this.scene.get('UIScene');
            if (ui?.showParryFlash) ui.showParryFlash();
        });

        this.parry.on('parry-success', () => {
            const bulletMs = UpgradeManager.getBulletTime(this.upgradeState);
            ParrySplash.trigger(this, this.player.x, this.player.y, bulletMs);

            // Reflect damage to enemy
            const reflected = Math.ceil(ENEMY_ATTACK_DAMAGE * PARRY_REFLECT_MULTIPLIER
                * UpgradeManager.getDamageMultiplier(this.upgradeState));
            this.enemy.takeDamage(reflected);
            const ui = this.scene.get('UIScene');
            if (ui?.showDamageNumber) ui.showDamageNumber(this.enemy.body.x, this.enemy.body.y - 60, reflected, true);

            this.time.delayedCall(500, () => this._endReactionPhase());
        });

        this.parry.on('window-missed', () => {
            this.audio.playDamage();
            const dmg = this.player.takeDamage(ENEMY_ATTACK_DAMAGE);
            const ui = this.scene.get('UIScene');
            if (ui?.updateHP) ui.updateHP(this.player.hp, this.player.maxHP);
            if (ui?.showDamageNumber) ui.showDamageNumber(this.player.x, this.player.y - 50, dmg, false);
            this.cameras.main.shake(160, 0.018);
            this.time.delayedCall(400, () => this._endReactionPhase());
        });

        // Skill selected
        this.fsm.on('skill-selected', (skillId) => {
            this._executeSkill(skillId);
        });
    }

    _setupInput() {
        this.input.on('pointerdown', (pointer) => {
            this.audio._resume?.();

            if (this.fsm.state === STATES.REACTION) {
                // Attempt parry FIRST
                const parried = this.parry.attemptParry();
                if (!parried) {
                    // Gravity flip anyway (tactical positioning)
                    this.player.flip(this.audio);
                }
            } else if (this.fsm.state === STATES.STRATEGY) {
                // Taps in strategy phase are handled by UI buttons
                this.player.flip(this.audio);
            }
        });

        // Swipe detection for tether
        let swipeStart = null;
        this.input.on('pointerdown', (p) => { swipeStart = { x: p.x, y: p.y, t: Date.now() }; });
        this.input.on('pointerup', (p) => {
            if (!swipeStart) return;
            const dx = p.x - swipeStart.x;
            const dy = p.y - swipeStart.y;
            const dist = Math.hypot(dx, dy);
            const dt = Date.now() - swipeStart.t;
            if (dist > 60 && dt < 400) {
                this._activateTether(p.x, p.y);
            }
            swipeStart = null;
        });
    }

    /** Execute the chosen calligraphic Stroke */
    async _executeSkill(skillId) {
        const skill = SKILLS.find(s => s.id === skillId);
        if (!skill) return;

        this.audio.playNib();

        if (skillId === 'guard') {
            this.player.activateGuard();
            // Show "Guard active" then go to reaction
            this.time.delayedCall(300, () => this._startEnemyAttack(false));
            return;
        }

        // Deal damage to enemy first
        const dmg = Math.ceil(skill.damage * UpgradeManager.getDamageMultiplier(this.upgradeState));
        this.enemy.takeDamage(dmg);
        this.audio.playBlot();

        const ui = this.scene.get('UIScene');
        if (ui?.showDamageNumber) ui.showDamageNumber(this.enemy.body.x, this.enemy.body.y - 60, dmg, true);

        if (!this.enemy.alive) {
            DeathDissolve.play(this, this.enemy.body.x, this.enemy.body.y, 0x0a0a0a);
            this.time.delayedCall(600, () => this.fsm.onReactionPhaseEnded(true, false));
            return;
        }

        // Ink Surge: no parry window
        const hasParry = skillId !== 'surgeInk';
        this.time.delayedCall(400, () => this._startEnemyAttack(hasParry));
    }

    _startEnemyAttack(hasParryWindow) {
        if (this.fsm.state !== STATES.REACTION) this.fsm.transitionTo(STATES.REACTION);

        this.enemy.telegraphAttack(() => {
            this.audio.playBlot();
            if (hasParryWindow) {
                this.parry.openWindow();
            } else {
                // Direct hit (Ink Surge skill — player skipped parry)
                const dmg = this.player.takeDamage(Math.ceil(ENEMY_ATTACK_DAMAGE * 0.6));
                const ui = this.scene.get('UIScene');
                if (ui?.updateHP) ui.updateHP(this.player.hp, this.player.maxHP);
                if (ui?.showDamageNumber) ui.showDamageNumber(this.player.x, this.player.y - 50, dmg, false);
                this.cameras.main.shake(120, 0.012);
                this.time.delayedCall(600, () => this._endReactionPhase());
            }
        });
    }

    _endReactionPhase() {
        this.parry.reset();
        const playerAlive = this.player.alive;
        const enemyAlive = this.enemy.alive;

        if (!playerAlive) {
            DeathDissolve.play(this, this.player.x, this.player.y, 0x8b6a30);
        }

        this.fsm.onReactionPhaseEnded(playerAlive, enemyAlive);
    }

    _activateTether(targetX, targetY) {
        if (this.player.tetherActive) {
            // Release
            if (this.player.tetherConstraint) {
                this.matter.world.removeConstraint(this.player.tetherConstraint);
                this.player.tetherConstraint = null;
            }
            this.player.tetherActive = false;
            return;
        }

        // Fire tether to nearest wall
        const W = this.scale.width;
        const anchorX = targetX < W / 2 ? 0 : W;
        const anchorY = targetY;

        this.player.tetherAnchor = { x: anchorX, y: anchorY };
        this.player.tetherActive = true;

        const length = Math.hypot(this.player.x - anchorX, this.player.y - anchorY);
        const tetherLen = Math.min(length, 220);

        this.player.tetherConstraint = this.matter.add.constraint(
            this.player.body,
            { x: anchorX, y: anchorY },
            tetherLen,
            0.015 * UpgradeManager.getTetherSpeed(this.upgradeState),
        );

        // Auto release after 2.5s
        this.time.delayedCall(2500, () => {
            if (this.player.tetherActive) this._activateTether(0, 0);
        });
    }

    async _handleVictory() {
        const droppedInk = INKBLOT_INK_DROP + (this.floor - 1) * 8;
        this.upgradeState.droppedInk = (this.upgradeState.droppedInk || 0) + droppedInk;
        UpgradeManager.save(this.upgradeState);

        const ui = this.scene.get('UIScene');
        if (ui?.showVictoryBanner) ui.showVictoryBanner(droppedInk);

        await InkDrip.play(this, async () => {
            this.time.delayedCall(300, () => {
                this.scene.stop('UIScene');
                this.scene.start('ShopScene', { floor: this.floor, upgradeState: this.upgradeState });
            });
        });
    }

    _handleGameOver() {
        const ui = this.scene.get('UIScene');
        if (ui?.showGameOver) ui.showGameOver();
    }

    update(time, delta) {
        // Scroll parchment background slowly
        this.bg.tilePositionY -= 0.3;

        // Update player physics & trail
        if (this.player) this.player.update(delta);

        // Draw tether line
        this.tetherGfx.clear();
        if (this.player?.tetherActive && this.player.tetherAnchor) {
            this.tetherGfx.lineStyle(2, 0x8b4513, 0.8);
            this.tetherGfx.lineBetween(
                this.player.x, this.player.y,
                this.player.tetherAnchor.x, this.player.tetherAnchor.y,
            );
            // Anchor pip
            this.tetherGfx.fillStyle(0x8b4513, 0.9);
            this.tetherGfx.fillCircle(this.player.tetherAnchor.x, this.player.tetherAnchor.y, 6);
        }
    }
}
