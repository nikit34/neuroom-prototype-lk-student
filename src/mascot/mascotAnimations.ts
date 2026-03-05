import { MascotState, MascotEmotion } from '../types';

// ─── Character archetypes ────────────────────────────────────────

export type CharacterArchetype =
  | 'cat' | 'warrior' | 'fox'
  | 'wizard' | 'dragon' | 'ninja' | 'critter'
  | 'robot' | 'bear' | 'ghost' | 'alien' | 'owl';

/** Maps every character ID to its visual archetype (1:1) */
export const CHARACTER_ARCHETYPE: Record<string, CharacterArchetype> = {
  'pk-pikachu': 'cat',
  'sk-samurai': 'warrior',
  'sk-kitsune': 'fox',
  'hw-wizard': 'wizard',
  'got-dragon': 'dragon',
  'anime-naruto': 'ninja',
  'gs-paimon': 'critter',
  'mv-ironman': 'robot',
  'op-chopper': 'bear',
  'au-impostor': 'ghost',
  'mc-enderman': 'alien',
  'hw-owl': 'owl',
};

// ─── Lottie sources (one file per archetype from LottieFiles) ────

export const MASCOT_LOTTIE_SOURCES: Record<CharacterArchetype, any> = {
  cat: require('../../assets/animations/mascot/mascot-cat.json'),
  warrior: require('../../assets/animations/mascot/mascot-warrior.json'),
  fox: require('../../assets/animations/mascot/mascot-fox.json'),
  wizard: require('../../assets/animations/mascot/mascot-wizard.json'),
  dragon: require('../../assets/animations/mascot/mascot-dragon.json'),
  ninja: require('../../assets/animations/mascot/mascot-ninja.json'),
  critter: require('../../assets/animations/mascot/mascot-critter.json'),
  robot: require('../../assets/animations/mascot/mascot-robot.json'),
  bear: require('../../assets/animations/mascot/mascot-bear.json'),
  ghost: require('../../assets/animations/mascot/mascot-ghost.json'),
  alien: require('../../assets/animations/mascot/mascot-alien.json'),
  owl: require('../../assets/animations/mascot/mascot-owl.json'),
};

export const DEFAULT_ARCHETYPE: CharacterArchetype = 'critter';

/** Resolve the archetype for a given character ID */
export function getArchetype(characterId: string): CharacterArchetype {
  return CHARACTER_ARCHETYPE[characterId] ?? DEFAULT_ARCHETYPE;
}

/** Animation speed per MascotState — conveys mood via tempo */
export const STATE_SPEED: Record<MascotState, number> = {
  sick: 0.3,
  sad: 0.5,
  neutral: 0.8,
  happy: 1.0,
  thriving: 1.4,
};

/** Maps 15 MascotEmotions → 5 MascotStates (animation files) */
export function emotionToAnimationState(emotion: MascotEmotion): MascotState {
  switch (emotion) {
    case 'sick':
    case 'tired':
      return 'sick';
    case 'sad':
    case 'confused':
      return 'sad';
    case 'neutral':
    case 'thinking':
    case 'explaining':
    case 'focused':
      return 'neutral';
    case 'happy':
    case 'encouraging':
    case 'proud':
    case 'waving':
    case 'surprised':
      return 'happy';
    case 'celebrating':
    case 'excited':
      return 'thriving';
  }
}
