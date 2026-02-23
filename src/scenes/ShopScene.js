// ============================================================
// ShopScene.js — The Inkwell: persistent upgrade shop
// ============================================================
import UpgradeManager from '../systems/UpgradeManager.js';

const UPGRADE_DEFS = [
    {
        key: 'viscosity',
        kanji: '粘',
        name: 'Viscosity',
        desc: 'Extends bullet-time\nafter parry',
        statLabel: 'Bullet Time',
        statFn: (s) => `${UpgradeManager.getBulletTime(s)}ms`,
    },
    {
        key: 'pigment',
        kanji: '顔',
        name: 'Pigment',
        desc: 'Increases stroke\ndamage multiplier',
        statLabel: 'Damage Mult',
        statFn: (s) => `×${UpgradeManager.getDamageMultiplier(s).toFixed(2)}`,
    },
    {
        key: 'tetherTension',
        kanji: '張',
        name: 'Tether Tension',
        desc: 'Faster ink-tether\nswing & launch',
        statLabel: 'Swing Speed',
        statFn: (s) => `×${UpgradeManager.getTetherSpeed(s).toFixed(2)}`,
    },
    {
        key: 'absorbency',
        kanji: '吸',
        name: 'Absorbency',
        desc: 'Start each run\nwith more HP',
        statLabel: 'Max HP',
        statFn: (s) => `${UpgradeManager.getMaxHP(s)}`,
    },
];

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    init(data) {
        this.floor = data?.floor ?? 1;
        this.upgradeState = data?.upgradeState ?? UpgradeManager.load();
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // Background — parchment
        this.add.tileSprite(0, 0, W, H, 'parchment').setOrigin(0, 0);
        // Dark overlay
        this.add.rectangle(0, 0, W, H, 0x0d0800, 0.6).setOrigin(0, 0);

        // ---- Header ----
        this.add.text(W / 2, 28, 'THE INKWELL', {
            fontFamily: '"Palatino Linotype", serif',
            fontSize: '26px',
            fontStyle: 'bold',
            color: '#e8c85a',
            letterSpacing: 8,
        }).setOrigin(0.5);

        this.add.text(W / 2, 60, `FLOOR ${this.floor} CLEARED`, {
            fontFamily: 'serif',
            fontSize: '12px',
            color: '#8b6a30',
            letterSpacing: 6,
        }).setOrigin(0.5);

        // Divider
        this.add.line(W / 2, 78, 0, 0, W * 0.7, 0, 0x8b6a30, 0.5).setOrigin(0.5);

        // Ink balance
        this._inkText = this.add.text(W / 2, 96, '', {
            fontFamily: 'serif',
            fontSize: '18px',
            color: '#e8c85a',
        }).setOrigin(0.5);
        this._refreshInkText();

        // ---- Upgrade cards ----
        this._cards = [];
        UPGRADE_DEFS.forEach((def, i) => {
            const cardY = 150 + i * 128;
            this._buildCard(W, def, cardY);
        });

        // ---- Continue button ----
        const continueBtn = this.add.text(W / 2, H - 36, '[ DESCEND FURTHER ]', {
            fontFamily: 'serif',
            fontSize: '16px',
            color: '#f0e8cc',
            backgroundColor: '#1a0d00',
            padding: { x: 20, y: 10 },
            letterSpacing: 4,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        continueBtn.on('pointerover', () => continueBtn.setColor('#e8c85a'));
        continueBtn.on('pointerout', () => continueBtn.setColor('#f0e8cc'));
        continueBtn.on('pointerdown', () => {
            this.cameras.main.fade(350, 13, 10, 0);
            this.time.delayedCall(360, () => {
                this.scene.start('GameScene', { floor: this.floor + 1, upgradeState: this.upgradeState });
                this.scene.launch('UIScene');
            });
        });
    }

    _buildCard(W, def, cardY) {
        const cardW = W - 40;
        const cardH = 110;
        const cardX = 20;

        const bg = this.add.rectangle(cardX, cardY, cardW, cardH, 0x0d0800, 0.92)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x5c3a10, 0.8);

        // Kanji
        this.add.text(cardX + 18, cardY + cardH / 2, def.kanji, {
            fontFamily: '"Palatino Linotype", serif',
            fontSize: '36px',
            color: '#e8c85a',
        }).setOrigin(0, 0.5);

        // Name + desc
        this.add.text(cardX + 66, cardY + 18, def.name, {
            fontFamily: '"Palatino Linotype", serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#f0e8cc',
        });
        this.add.text(cardX + 66, cardY + 38, def.desc, {
            fontFamily: 'serif',
            fontSize: '11px',
            color: '#8b6a30',
            lineSpacing: 3,
        });

        // Current stat value
        const statTxt = this.add.text(cardX + 66, cardY + 72, '', {
            fontFamily: 'serif',
            fontSize: '12px',
            color: '#e8c85a',
        });

        // Level pips
        const pipContainer = this.add.container(cardX + cardW - 90, cardY + 22);
        const pips = [];
        for (let p = 0; p < UpgradeManager.MAX_LEVEL; p++) {
            const pip = this.add.circle(p * 14, 0, 5, 0x2a1a02)
                .setStrokeStyle(1, 0x8b6a30);
            pipContainer.add(pip);
            pips.push(pip);
        }

        // Buy button
        const buyBtn = this.add.text(cardX + cardW - 86, cardY + 60, '', {
            fontFamily: 'serif',
            fontSize: '13px',
            backgroundColor: '#1a0d00',
            padding: { x: 10, y: 6 },
            color: '#e8c85a',
        }).setInteractive({ useHandCursor: true });

        buyBtn.on('pointerdown', () => {
            const success = UpgradeManager.purchase(this.upgradeState, def.key);
            if (success) {
                this._refreshCard(def, statTxt, pips, buyBtn);
                this._refreshInkText();
                // Bounce animation
                this.tweens.add({ targets: bg, scaleY: 1.04, duration: 60, yoyo: true });
            } else {
                // Not enough ink shake
                this.tweens.add({
                    targets: bg, x: cardX + 6, duration: 40, yoyo: true, repeat: 3,
                    onComplete: () => bg.setX(cardX)
                });
            }
        });

        buyBtn.on('pointerover', () => buyBtn.setBackgroundColor('#2a1a04'));
        buyBtn.on('pointerout', () => buyBtn.setBackgroundColor('#1a0d00'));

        this._refreshCard(def, statTxt, pips, buyBtn);
        this._cards.push({ def, statTxt, pips, buyBtn });
    }

    _refreshCard(def, statTxt, pips, buyBtn) {
        const level = this.upgradeState[def.key];
        const isMaxed = level >= UpgradeManager.MAX_LEVEL;

        statTxt.setText(`${def.statLabel}: ${def.statFn(this.upgradeState)}`);

        pips.forEach((pip, i) => {
            pip.setFillStyle(i < level ? 0xe8c85a : 0x2a1a02);
        });

        if (isMaxed) {
            buyBtn.setText('✦ MAX');
            buyBtn.disableInteractive();
            buyBtn.setColor('#8b6a30');
        } else {
            const cost = UpgradeManager.UPGRADE_COST[level];
            const canAfford = this.upgradeState.droppedInk >= cost;
            buyBtn.setText(`BUY (${cost}💧)`);
            buyBtn.setColor(canAfford ? '#e8c85a' : '#5c3a10');
        }
    }

    _refreshInkText() {
        this._inkText.setText(`💧 Dropped Ink: ${this.upgradeState.droppedInk}`);
    }
}
