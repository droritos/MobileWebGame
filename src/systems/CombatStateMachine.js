// ============================================================
// CombatStateMachine.js — Turns, phases, and state management
// ============================================================
export const STATES = {
    IDLE: 'IDLE',
    STRATEGY: 'STATE_STRATEGY',
    REACTION: 'STATE_REACTION',
    TRANSITION: 'STATE_TRANSITION',
    SHOP: 'STATE_SHOP',
    GAME_OVER: 'STATE_GAME_OVER',
    VICTORY: 'STATE_VICTORY',
};

export default class CombatStateMachine extends Phaser.Events.EventEmitter {
    constructor(scene) {
        super();
        this.scene = scene;
        this.state = STATES.IDLE;
        this.floor = 1;
        this.turn = 0;
    }

    get currentState() {
        return this.state;
    }

    transitionTo(newState) {
        if (this.state === newState) return;
        const prev = this.state;
        this.state = newState;
        this.emit('statechange', { from: prev, to: newState });
        console.log(`[FSM] ${prev} → ${newState}`);
    }

    startCombat() {
        this.turn = 0;
        this.transitionTo(STATES.STRATEGY);
    }

    onSkillSelected(skillId) {
        if (this.state !== STATES.STRATEGY) return;
        this.turn++;
        this.emit('skill-selected', skillId);
        this.transitionTo(STATES.REACTION);
    }

    onReactionPhaseEnded(playerAlive, enemyAlive) {
        if (this.state !== STATES.REACTION) return;
        if (!playerAlive) {
            this.transitionTo(STATES.GAME_OVER);
        } else if (!enemyAlive) {
            this.transitionTo(STATES.VICTORY);
        } else {
            this.transitionTo(STATES.STRATEGY);
        }
    }

    onVictoryAnimDone() {
        if (this.state !== STATES.VICTORY) return;
        this.floor++;
        this.transitionTo(STATES.SHOP);
    }

    onShopClosed() {
        if (this.state !== STATES.SHOP) return;
        this.transitionTo(STATES.STRATEGY);
    }
}
