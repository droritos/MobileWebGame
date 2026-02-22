// ============================================================
// UpgradeManager.js — Persistent upgrade state via localStorage
// ============================================================
export default class UpgradeManager {
    static DEFAULTS = {
        viscosity: 0,    // extends bullet-time window
        pigment: 0,      // damage multiplier
        tetherTension: 0, // swing speed
        absorbency: 0,   // starting HP bonus
        droppedInk: 0,   // currency
    };

    static UPGRADE_COST = [20, 50, 90, 150]; // cost per level 1-4
    static MAX_LEVEL = 4;

    static load() {
        try {
            const raw = localStorage.getItem('inkflip_upgrades');
            return raw ? { ...UpgradeManager.DEFAULTS, ...JSON.parse(raw) } : { ...UpgradeManager.DEFAULTS };
        } catch {
            return { ...UpgradeManager.DEFAULTS };
        }
    }

    static save(state) {
        try {
            localStorage.setItem('inkflip_upgrades', JSON.stringify(state));
        } catch { /* storage unavailable */ }
    }

    static reset() {
        localStorage.removeItem('inkflip_upgrades');
    }

    /** Returns bullet-time duration in ms (base 300ms + 100ms per level) */
    static getBulletTime(state) {
        return 300 + state.viscosity * 100;
    }

    /** Returns damage multiplier (base 1.0 + 0.25 per level) */
    static getDamageMultiplier(state) {
        return 1.0 + state.pigment * 0.25;
    }

    /** Returns tether speed multiplier (base 1.0 + 0.2 per level) */
    static getTetherSpeed(state) {
        return 1.0 + state.tetherTension * 0.2;
    }

    /** Returns max HP (base 100 + 20 per level) */
    static getMaxHP(state) {
        return 100 + state.absorbency * 20;
    }

    /** Try to purchase upgrade, returns true on success */
    static purchase(state, upgrade) {
        const currentLevel = state[upgrade];
        if (currentLevel >= UpgradeManager.MAX_LEVEL) return false;
        const cost = UpgradeManager.UPGRADE_COST[currentLevel];
        if (state.droppedInk < cost) return false;
        state.droppedInk -= cost;
        state[upgrade] += 1;
        UpgradeManager.save(state);
        return true;
    }
}
