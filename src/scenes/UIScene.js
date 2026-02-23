// ============================================================
// UIScene.js — HUD overlay: HP bar, skills, damage numbers, banners
// ============================================================
import { SKILLS } from '../config.js';
import { STATES } from '../systems/CombatStateMachine.js';

const SKILL_COLORS = {
    slash: { bg: 0x1a0d00, border: 0x8b4513 },
    guard: { bg: 0x0a1a0a, border: 0x2e7d32 },
    surgeInk: { bg: 0x1a0010, border: 0x7b1fa2 },
};

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this._gameScene = null;
        this._skillButtons = [];
        this._parryFlash = null;
    }

    create() {
        this._buildHUD();
        this._buildSkillButtons();
        this._buildParryUI();
    }

    setGameScene(gs) {
        this._gameScene = gs;
        this._updateFloor(gs.floor);
    }

    _buildHUD() {
        const W = this.scale.width;
        // ---- HP bar area ----
        // Background strip
        this.add.rectangle(0, 0, W, 52, 0x0d0800, 0.9).setOrigin(0, 0).setDepth(20);

        // HP bar bg
        this.add.rectangle(12, 14, 160, 16, 0x2a1a02).setOrigin(0, 0).setDepth(21);
        this._hpBar = this.add.rectangle(12, 14, 160, 16, 0xc8401a).setOrigin(0, 0).setDepth(22);

        // HP label
        this._hpText = this.add.text(16, 14, 'HP  100 / 100', {
            fontFamily: 'serif',
            fontSize: '10px',
            color: '#f0e8cc',
        }).setOrigin(0, 0).setDepth(23);

        // Ink counter
        this._inkIcon = this.add.text(W - 16, 14, '💧 0', {
            fontFamily: 'serif',
            fontSize: '12px',
            color: '#8b6a30',
        }).setOrigin(1, 0).setDepth(23);

        // Phase label
        this._phaseLabel = this.add.text(W / 2, 16, '', {
            fontFamily: '"Palatino Linotype", serif',
            fontSize: '12px',
            color: '#e8c85a',
            letterSpacing: 6,
        }).setOrigin(0.5, 0).setDepth(23);
    }

    _buildSkillButtons() {
        const W = this.scale.width;
        const H = this.scale.height;
        const btnW = (W - 32) / 3;
        const btnH = 76;
        const btnY = H - btnH - 12;

        this._skillButtons = [];

        SKILLS.forEach((skill, i) => {
            const x = 12 + i * (btnW + 4);
            const colors = SKILL_COLORS[skill.id];

            const btn = this.add.container(x, btnY).setDepth(25);

            // Background
            const bg = this.add.rectangle(0, 0, btnW, btnH, colors.bg, 0.95)
                .setOrigin(0, 0)
                .setStrokeStyle(1.5, colors.border, 1);

            // Kanji + label text
            const txt = this.add.text(btnW / 2, btnH / 2, skill.label, {
                fontFamily: '"Palatino Linotype", serif',
                fontSize: '16px',
                color: '#f0e8cc',
                align: 'center',
                lineSpacing: 4,
            }).setOrigin(0.5, 0.5);

            btn.add([bg, txt]);
            btn.setInteractive(
                new Phaser.Geom.Rectangle(0, 0, btnW, btnH),
                Phaser.Geom.Rectangle.Contains,
            );

            btn.on('pointerdown', () => {
                if (!this._gameScene) return;
                const fsm = this._gameScene.fsm;
                if (fsm.state !== STATES.STRATEGY) return;
                this._buttonPress(btn, bg, colors.border);
                fsm.onSkillSelected(skill.id);
            });

            btn.on('pointerover', () => bg.setAlpha(0.7));
            btn.on('pointerout', () => bg.setAlpha(0.95));

            this._skillButtons.push({ btn, bg, txt });
        });
    }

    _buildParryUI() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Full-screen parry flash
        this._parryFlash = this.add.rectangle(W / 2, H / 2, W, H, 0xffd700, 0)
            .setDepth(40);

        // Parry window indicator bar
        this._parryBar = this.add.graphics().setDepth(35);
        this._parryBarActive = false;
        this._parryBarTimer = 0;

        // "PARRY!" text
        this._parryText = this.add.text(W / 2, H * 0.6, 'PARRY!', {
            fontFamily: '"Palatino Linotype", serif',
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(45).setAlpha(0);
    }

    showParryFlash() {
        // Flash the golden border
        this.tweens.add({
            targets: this._parryFlash,
            alpha: 0.12,
            duration: 50,
            yoyo: true,
            repeat: 3,
            onComplete: () => this._parryFlash.setAlpha(0),
        });

        // Show PARRY! prompt
        this._parryText.setAlpha(1).setScale(0.5);
        this.tweens.add({
            targets: this._parryText,
            alpha: 0,
            scaleX: 1.4,
            scaleY: 1.4,
            duration: 700,
            ease: 'Power2',
        });

        // Countdown bar
        this._parryBarActive = true;
        this._parryBarTimer = 0;
    }

    showDamageNumber(x, y, amount, isPlayerDamage) {
        const color = isPlayerDamage ? '#ff4444' : '#ffd700';
        const sign = isPlayerDamage ? '-' : '-';
        const txt = this.add.text(x, y, `${sign}${amount}`, {
            fontFamily: '"Palatino Linotype", serif',
            fontSize: isPlayerDamage ? '28px' : '32px',
            fontStyle: 'bold',
            color,
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: txt,
            y: y - 55,
            alpha: 0,
            duration: 900,
            ease: 'Power2',
            onComplete: () => txt.destroy(),
        });
    }

    updateHP(hp, maxHP) {
        const frac = Math.max(0, hp / maxHP);
        this._hpBar.setScale(frac, 1);
        this._hpText.setText(`HP  ${hp} / ${maxHP}`);
        // Colour shifts
        const r = frac < 0.4 ? 220 : 160;
        const g = frac > 0.6 ? 120 : Math.floor(frac * 200);
        this._hpBar.setFillStyle(Phaser.Display.Color.GetColor(r, g, 20));
    }

    updateInk(amount) {
        this._inkIcon.setText(`💧 ${amount}`);
    }

    _updateFloor(floor) {
        // (floor label is drawn in GameScene)
    }

    onStateChange(from, to, gs) {
        const isStrategy = to === STATES.STRATEGY;
        const isReaction = to === STATES.REACTION;

        this._phaseLabel.setText(
            isStrategy ? '— CHOOSE YOUR STROKE —' :
                isReaction ? '— REACT! —' : '',
        );

        this._skillButtons.forEach(({ btn, bg }) => {
            btn.setAlpha(isStrategy ? 1 : 0.35);
            btn.setInteractive(isStrategy);
        });

        if (gs?.upgradeState) {
            this.updateInk(gs.upgradeState.droppedInk);
        }

        if (gs?.player) {
            this.updateHP(gs.player.hp, gs.player.maxHP);
        }
    }

    _buttonPress(btn, bg, color) {
        this.tweens.add({
            targets: btn,
            scaleX: 0.93,
            scaleY: 0.93,
            duration: 60,
            yoyo: true,
        });
        bg.setFillStyle(color, 0.4);
        this.time.delayedCall(150, () => bg.setFillStyle(0x1a0d00, 0.95));
    }

    showVictoryBanner(inkGained) {
        const W = this.scale.width;
        const panel = this.add.rectangle(W / 2, 320, 340, 120, 0x0d0800, 0.95)
            .setStrokeStyle(2, 0xe8c85a).setDepth(60);

        this.add.text(W / 2, 292, 'ENEMY DISSOLVED', {
            fontFamily: '"Palatino Linotype", serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#e8c85a',
        }).setOrigin(0.5).setDepth(61);

        this.add.text(W / 2, 326, `+${inkGained} Dropped Ink`, {
            fontFamily: 'serif',
            fontSize: '16px',
            color: '#8b6a30',
        }).setOrigin(0.5).setDepth(61);

        this.add.text(W / 2, 356, 'Ascending to next floor…', {
            fontFamily: 'serif',
            fontSize: '12px',
            color: '#5c3a10',
            alpha: 0.8,
        }).setOrigin(0.5).setDepth(61);
    }

    showGameOver() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0, 0).setDepth(70);

        this.add.text(W / 2, H * 0.38, 'THE INK\nRAN DRY', {
            fontFamily: '"Palatino Linotype", serif',
            fontSize: '40px',
            fontStyle: 'bold',
            color: '#cc1111',
            align: 'center',
            lineSpacing: 8,
        }).setOrigin(0.5).setDepth(71);

        this.add.text(W / 2, H * 0.58, 'Your strokes are lost to the page.', {
            fontFamily: 'serif',
            fontSize: '14px',
            color: '#8b6a30',
        }).setOrigin(0.5).setDepth(71);

        const restart = this.add.text(W / 2, H * 0.7, '[ TAP TO RESTART ]', {
            fontFamily: 'serif',
            fontSize: '16px',
            color: '#f0e8cc',
            letterSpacing: 4,
        }).setOrigin(0.5).setDepth(71);

        this.tweens.add({ targets: restart, alpha: 0, duration: 800, yoyo: true, repeat: -1 });

        this.input.once('pointerdown', () => {
            this.scene.stop('UIScene');
            this.scene.stop('GameScene');
            this.scene.start('PreloadScene');
        });
    }

    update(time, delta) {
        // Parry countdown bar
        if (this._parryBarActive && this._gameScene) {
            this._parryBarTimer += delta;
            const frac = 1 - (this._parryBarTimer / 200);
            if (frac <= 0) {
                this._parryBarActive = false;
                this._parryBar.clear();
                return;
            }
            const W = this.scale.width;
            const H = this.scale.height;
            const barW = 200;
            const barX = (W - barW) / 2;
            const barY = H * 0.56;
            this._parryBar.clear();
            this._parryBar.fillStyle(0x333333, 0.8);
            this._parryBar.fillRect(barX, barY, barW, 6);
            this._parryBar.fillStyle(frac > 0.5 ? 0xffd700 : 0xff4444, 1);
            this._parryBar.fillRect(barX, barY, barW * frac, 6);
        }
    }
}
