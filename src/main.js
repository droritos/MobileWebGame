// ============================================================
// main.js — Phaser 3 Game Entry Point
// Project Ink-Flip
// ============================================================
import Phaser from 'phaser';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import ShopScene from './scenes/ShopScene.js';

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#1a1208',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 450,
        height: 800,
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 2 },
            debug: false,
        },
    },
    scene: [BootScene, PreloadScene, GameScene, UIScene, ShopScene],
    parent: document.body,
    dom: {
        createContainer: false,
    },
};

window.game = new Phaser.Game(config);
