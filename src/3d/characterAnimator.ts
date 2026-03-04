import { MascotState } from '../types';

/**
 * Periodic character action animations.
 * Returns transform offsets to apply on top of idle animations.
 */

export interface ActionTransform {
  posY: number;       // vertical offset
  rotZ: number;       // tilt
  rotY: number;       // spin
  scaleX: number;     // squash-stretch X
  scaleY: number;     // squash-stretch Y
}

const ZERO: ActionTransform = { posY: 0, rotZ: 0, rotY: 0, scaleX: 1, scaleY: 1 };

// ─── Action definitions ─────────────────────────────────────────

type ActionFn = (p: number) => ActionTransform;

// Jump: quick hop with squash-stretch
const jump: ActionFn = (p) => {
  const arc = Math.sin(p * Math.PI);
  const squash = p < 0.15 ? 1 - p * 1.5 : (p > 0.85 ? 1 - (1 - p) * 1.5 : 1);
  return {
    posY: arc * 0.6,
    rotZ: 0,
    rotY: 0,
    scaleX: 1 + (1 - squash) * 0.3,
    scaleY: squash + (1 - squash) * 0.7,
  };
};

// Double jump: two quick hops
const doubleJump: ActionFn = (p) => {
  const phase = p < 0.45 ? p / 0.45 : (p - 0.55) / 0.45;
  const arc = p < 0.45 ? Math.sin(phase * Math.PI) : (p > 0.55 ? Math.sin(phase * Math.PI) * 0.7 : 0);
  return { posY: arc * 0.5, rotZ: 0, rotY: 0, scaleX: 1, scaleY: 1 };
};

// Spin: full 360° rotation
const spin: ActionFn = (p) => {
  // Ease in-out
  const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  return { posY: 0, rotZ: 0, rotY: ease * Math.PI * 2, scaleX: 1, scaleY: 1 };
};

// Wave: lean side to side
const wave: ActionFn = (p) => {
  const angle = Math.sin(p * Math.PI * 3) * 0.2;
  return { posY: Math.abs(Math.sin(p * Math.PI * 3)) * 0.05, rotZ: angle, rotY: 0, scaleX: 1, scaleY: 1 };
};

// Nod: bow forward and back
const nod: ActionFn = (p) => {
  const tilt = Math.sin(p * Math.PI) * 0.15;
  return { posY: -Math.sin(p * Math.PI) * 0.05, rotZ: tilt, rotY: 0, scaleX: 1, scaleY: 1 };
};

// Wiggle: rapid small side-to-side
const wiggle: ActionFn = (p) => {
  const angle = Math.sin(p * Math.PI * 6) * 0.1 * (1 - p);
  return { posY: 0, rotZ: angle, rotY: 0, scaleX: 1, scaleY: 1 };
};

// Celebrate: jump + arms-up feel (tilt back, scale up)
const celebrate: ActionFn = (p) => {
  const arc = Math.sin(p * Math.PI);
  return {
    posY: arc * 0.5,
    rotZ: Math.sin(p * Math.PI * 4) * 0.08,
    rotY: 0,
    scaleX: 1 + arc * 0.08,
    scaleY: 1 + arc * 0.08,
  };
};

// Dance: rhythmic bounce + tilt
const dance: ActionFn = (p) => {
  const beat = Math.abs(Math.sin(p * Math.PI * 4));
  return {
    posY: beat * 0.2,
    rotZ: Math.sin(p * Math.PI * 2) * 0.15,
    rotY: Math.sin(p * Math.PI) * 0.3,
    scaleX: 1,
    scaleY: 1 - beat * 0.05,
  };
};

// Sad sigh: slight droop
const sigh: ActionFn = (p) => {
  const droop = Math.sin(p * Math.PI);
  return {
    posY: -droop * 0.08,
    rotZ: droop * 0.05,
    rotY: 0,
    scaleX: 1,
    scaleY: 1 - droop * 0.03,
  };
};

// Shiver: sick trembling
const shiver: ActionFn = (p) => {
  const shake = Math.sin(p * Math.PI * 10) * (1 - p) * 0.04;
  return { posY: 0, rotZ: shake, rotY: 0, scaleX: 1, scaleY: 1 };
};

// ─── Action pools by state ──────────────────────────────────────

interface ActionDef {
  fn: ActionFn;
  duration: number; // seconds
}

const ACTIONS: Record<MascotState, ActionDef[]> = {
  sick: [
    { fn: shiver, duration: 1.5 },
    { fn: sigh, duration: 2.0 },
  ],
  sad: [
    { fn: sigh, duration: 2.0 },
    { fn: nod, duration: 1.2 },
  ],
  neutral: [
    { fn: jump, duration: 0.8 },
    { fn: nod, duration: 1.0 },
    { fn: wave, duration: 1.2 },
    { fn: wiggle, duration: 0.8 },
  ],
  happy: [
    { fn: jump, duration: 0.7 },
    { fn: doubleJump, duration: 1.0 },
    { fn: wave, duration: 1.0 },
    { fn: spin, duration: 1.2 },
    { fn: celebrate, duration: 1.2 },
  ],
  thriving: [
    { fn: doubleJump, duration: 0.9 },
    { fn: spin, duration: 1.0 },
    { fn: celebrate, duration: 1.2 },
    { fn: dance, duration: 2.0 },
    { fn: wave, duration: 0.8 },
  ],
};

// Interval between actions (seconds) — shorter when happier
const ACTION_INTERVAL: Record<MascotState, [number, number]> = {
  sick: [6, 10],
  sad: [5, 8],
  neutral: [3, 6],
  happy: [2, 4],
  thriving: [1.5, 3],
};

// ─── Animator state ─────────────────────────────────────────────

export interface AnimatorState {
  currentAction: ActionDef | null;
  actionStartTime: number;
  nextActionTime: number;
  lastState: MascotState;
}

export function createAnimator(): AnimatorState {
  return {
    currentAction: null,
    actionStartTime: 0,
    nextActionTime: 2, // first action after 2 seconds
    lastState: 'neutral',
  };
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Call every frame. Returns the action transform to apply.
 */
export function updateAnimator(
  anim: AnimatorState,
  timeSec: number,
  mascotState: MascotState,
): ActionTransform {
  // State changed — reset timer
  if (mascotState !== anim.lastState) {
    anim.lastState = mascotState;
    anim.currentAction = null;
    anim.nextActionTime = timeSec + 1;
  }

  // Currently playing an action
  if (anim.currentAction) {
    const elapsed = timeSec - anim.actionStartTime;
    const progress = elapsed / anim.currentAction.duration;

    if (progress >= 1) {
      // Action finished
      anim.currentAction = null;
      const [min, max] = ACTION_INTERVAL[mascotState];
      anim.nextActionTime = timeSec + randomRange(min, max);
      return ZERO;
    }

    return anim.currentAction.fn(progress);
  }

  // Time for a new action?
  if (timeSec >= anim.nextActionTime) {
    const pool = ACTIONS[mascotState];
    const action = pool[Math.floor(Math.random() * pool.length)];
    anim.currentAction = action;
    anim.actionStartTime = timeSec;
    return action.fn(0);
  }

  return ZERO;
}
