// ============================================================
// config.js — Shared game constants
// ============================================================

/** Width & height of the game canvas (portrait 9:16) */
export const GAME_WIDTH = 450;
export const GAME_HEIGHT = 800;

/** Gravity magnitude — positive = down, negative = up */
export const GRAVITY_MAGNITUDE = 2;

/** Duration of the parry timing window in milliseconds */
export const PARRY_WINDOW_MS = 200;

/** Duration of bullet-time slow-mo after a parry (base, before upgrades) */
export const BULLET_TIME_BASE_MS = 300;

/** Time scale during bullet time */
export const BULLET_TIME_SCALE = 0.25;

/** How much Dropped Ink an Ink-Blot drops on death */
export const INKBLOT_INK_DROP = 15;

/** Base player HP */
export const PLAYER_BASE_HP = 100;

/** Base enemy HP per floor */
export const ENEMY_BASE_HP = 60;

/** Damage values */
export const PLAYER_ATTACK_DAMAGE = 20;
export const ENEMY_ATTACK_DAMAGE = 25;
export const PARRY_REFLECT_MULTIPLIER = 1.5; // reflected damage multiplier

/** Tether physics */
export const TETHER_MAX_LENGTH = 220;
export const TETHER_STRENGTH = 0.015;

/** Floor & enemy spawn config */
export const ENEMY_X = GAME_WIDTH / 2;
export const ENEMY_Y = GAME_HEIGHT * 0.3;
export const PLAYER_START_X = GAME_WIDTH / 2;
export const PLAYER_START_Y = GAME_HEIGHT * 0.7;

/** Skill definitions */
export const SKILLS = [
    { id: 'slash', label: '斬\nSlash', damage: 20, description: 'A precise ink blade.' },
    { id: 'guard', label: '防\nGuard', damage: 0, description: 'Brace for impact. Halves next hit.' },
    { id: 'surgeInk', label: '湧\nInk Surge', damage: 35, description: 'Channel raw ink. High damage, no parry window.' },
];
