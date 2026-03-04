import { MascotState } from '../types';

export interface HealthEffectParams {
  colorDesaturation: number;   // 0 = full color, 1 = fully desaturated
  emissiveIntensity: number;   // glow strength
  scaleMultiplier: number;
  tiltX: number;               // forward lean in radians
  bounceSpeed: number;         // multiplier for idle animation speed
  bounceAmplitude: number;     // multiplier for idle animation height
  swaySpeed: number;           // side-to-side sway speed
  swayAmplitude: number;       // side-to-side sway angle (radians)
  breatheSpeed: number;        // scale pulse speed
  breatheAmplitude: number;    // scale pulse amount (0.02 = ±2%)
  autoRotateSpeed: number;     // slow auto-rotation speed (rad/sec)
}

const effects: Record<MascotState, HealthEffectParams> = {
  sick: {
    colorDesaturation: 0.5,
    emissiveIntensity: 0,
    scaleMultiplier: 0.85,
    tiltX: 0.15,
    bounceSpeed: 0.5,
    bounceAmplitude: 0.4,
    swaySpeed: 0.3,
    swayAmplitude: 0.02,
    breatheSpeed: 0.4,
    breatheAmplitude: 0.01,
    autoRotateSpeed: 0.05,
  },
  sad: {
    colorDesaturation: 0.25,
    emissiveIntensity: 0,
    scaleMultiplier: 0.95,
    tiltX: 0.08,
    bounceSpeed: 0.7,
    bounceAmplitude: 0.6,
    swaySpeed: 0.5,
    swayAmplitude: 0.03,
    breatheSpeed: 0.6,
    breatheAmplitude: 0.015,
    autoRotateSpeed: 0.1,
  },
  neutral: {
    colorDesaturation: 0,
    emissiveIntensity: 0,
    scaleMultiplier: 1.0,
    tiltX: 0,
    bounceSpeed: 1.0,
    bounceAmplitude: 1.0,
    swaySpeed: 0.8,
    swayAmplitude: 0.05,
    breatheSpeed: 0.8,
    breatheAmplitude: 0.02,
    autoRotateSpeed: 0.15,
  },
  happy: {
    colorDesaturation: 0,
    emissiveIntensity: 0.15,
    scaleMultiplier: 1.0,
    tiltX: 0,
    bounceSpeed: 1.3,
    bounceAmplitude: 1.3,
    swaySpeed: 1.1,
    swayAmplitude: 0.07,
    breatheSpeed: 1.0,
    breatheAmplitude: 0.025,
    autoRotateSpeed: 0.2,
  },
  thriving: {
    colorDesaturation: 0,
    emissiveIntensity: 0.3,
    scaleMultiplier: 1.05,
    tiltX: 0,
    bounceSpeed: 1.6,
    bounceAmplitude: 1.6,
    swaySpeed: 1.4,
    swayAmplitude: 0.1,
    breatheSpeed: 1.3,
    breatheAmplitude: 0.03,
    autoRotateSpeed: 0.3,
  },
};

export function getHealthEffect(state: MascotState): HealthEffectParams {
  return effects[state];
}

/**
 * Desaturates a hex color by a given amount (0 = no change, 1 = grayscale).
 */
export function desaturateColor(hex: string, amount: number): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const gray = 0.299 * r + 0.587 * g + 0.114 * b;

  const dr = r + (gray - r) * amount;
  const dg = g + (gray - g) * amount;
  const db = b + (gray - b) * amount;

  return (
    (Math.round(dr * 255) << 16) |
    (Math.round(dg * 255) << 8) |
    Math.round(db * 255)
  );
}
