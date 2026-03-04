import { MascotState, MascotEmotion } from '../types';

// ─── Character archetypes ────────────────────────────────────────

export type CharacterArchetype =
  | 'cat' | 'warrior' | 'king' | 'astronaut'
  | 'wizard' | 'dragon' | 'ninja' | 'critter';

/** Maps every character ID to its visual archetype */
export const CHARACTER_ARCHETYPE: Record<string, CharacterArchetype> = {
  // CS:GO → warrior
  'csgo-ct': 'warrior', 'csgo-t': 'warrior', 'csgo-awp': 'warrior', 'csgo-spec': 'warrior',
  // Game of Thrones
  'got-dragon': 'dragon', 'got-wolf': 'cat', 'got-lion': 'cat', 'got-raven': 'cat',
  // Twilight
  'tw-vampire': 'wizard', 'tw-werewolf': 'cat', 'tw-shewolf': 'cat', 'tw-mystic': 'wizard',
  // Anime
  'anime-naruto': 'ninja', 'anime-ninja': 'ninja', 'anime-sakura': 'ninja', 'anime-sensei': 'wizard',
  // Sakura
  'sk-hanami': 'king', 'sk-samurai': 'warrior', 'sk-geisha': 'king', 'sk-kitsune': 'cat',
  // Gagarin
  'gg-cosmonaut': 'astronaut', 'gg-rocket': 'astronaut', 'gg-alien': 'astronaut', 'gg-star': 'astronaut',
  // Marvel
  'mv-ironman': 'warrior', 'mv-spider': 'ninja', 'mv-captain': 'warrior', 'mv-thor': 'warrior',
  // One Piece
  'op-luffy': 'ninja', 'op-zoro': 'warrior', 'op-nami': 'ninja', 'op-chopper': 'cat',
  // Frozen
  'fz-elsa': 'king', 'fz-olaf': 'critter', 'fz-anna': 'king', 'fz-sven': 'cat',
  // Minions
  'mn-bob': 'critter', 'mn-kevin': 'critter', 'mn-stuart': 'critter', 'mn-gru': 'critter',
  // Clash Royale
  'cr-king': 'king', 'cr-princess': 'king', 'cr-knight': 'warrior', 'cr-dragon': 'dragon',
  // Pokemon
  'pk-pikachu': 'cat', 'pk-charmander': 'cat', 'pk-squirtle': 'cat', 'pk-bulbasaur': 'cat',
  // Minecraft
  'mc-steve': 'warrior', 'mc-creeper': 'critter', 'mc-enderman': 'dragon', 'mc-pig': 'cat',
  // Brawl Stars
  'bw-shelly': 'warrior', 'bw-colt': 'warrior', 'bw-spike': 'critter', 'bw-crow': 'cat',
  // Hogwarts
  'hw-wizard': 'wizard', 'hw-owl': 'cat', 'hw-witch': 'wizard', 'hw-phoenix': 'dragon',
  // Among Us
  'au-red': 'astronaut', 'au-blue': 'astronaut', 'au-impostor': 'astronaut', 'au-green': 'astronaut',
};

// ─── Lottie source registry ─────────────────────────────────────

export const MASCOT_LOTTIE_SOURCES: Record<CharacterArchetype, Record<MascotState, any>> = {
  cat: {
    sick: require('../../assets/animations/mascot/mascot-cat-sick.json'),
    sad: require('../../assets/animations/mascot/mascot-cat-sad.json'),
    neutral: require('../../assets/animations/mascot/mascot-cat-neutral.json'),
    happy: require('../../assets/animations/mascot/mascot-cat-happy.json'),
    thriving: require('../../assets/animations/mascot/mascot-cat-thriving.json'),
  },
  warrior: {
    sick: require('../../assets/animations/mascot/mascot-warrior-sick.json'),
    sad: require('../../assets/animations/mascot/mascot-warrior-sad.json'),
    neutral: require('../../assets/animations/mascot/mascot-warrior-neutral.json'),
    happy: require('../../assets/animations/mascot/mascot-warrior-happy.json'),
    thriving: require('../../assets/animations/mascot/mascot-warrior-thriving.json'),
  },
  king: {
    sick: require('../../assets/animations/mascot/mascot-king-sick.json'),
    sad: require('../../assets/animations/mascot/mascot-king-sad.json'),
    neutral: require('../../assets/animations/mascot/mascot-king-neutral.json'),
    happy: require('../../assets/animations/mascot/mascot-king-happy.json'),
    thriving: require('../../assets/animations/mascot/mascot-king-thriving.json'),
  },
  astronaut: {
    sick: require('../../assets/animations/mascot/mascot-astronaut-sick.json'),
    sad: require('../../assets/animations/mascot/mascot-astronaut-sad.json'),
    neutral: require('../../assets/animations/mascot/mascot-astronaut-neutral.json'),
    happy: require('../../assets/animations/mascot/mascot-astronaut-happy.json'),
    thriving: require('../../assets/animations/mascot/mascot-astronaut-thriving.json'),
  },
  wizard: {
    sick: require('../../assets/animations/mascot/mascot-wizard-sick.json'),
    sad: require('../../assets/animations/mascot/mascot-wizard-sad.json'),
    neutral: require('../../assets/animations/mascot/mascot-wizard-neutral.json'),
    happy: require('../../assets/animations/mascot/mascot-wizard-happy.json'),
    thriving: require('../../assets/animations/mascot/mascot-wizard-thriving.json'),
  },
  dragon: {
    sick: require('../../assets/animations/mascot/mascot-dragon-sick.json'),
    sad: require('../../assets/animations/mascot/mascot-dragon-sad.json'),
    neutral: require('../../assets/animations/mascot/mascot-dragon-neutral.json'),
    happy: require('../../assets/animations/mascot/mascot-dragon-happy.json'),
    thriving: require('../../assets/animations/mascot/mascot-dragon-thriving.json'),
  },
  ninja: {
    sick: require('../../assets/animations/mascot/mascot-ninja-sick.json'),
    sad: require('../../assets/animations/mascot/mascot-ninja-sad.json'),
    neutral: require('../../assets/animations/mascot/mascot-ninja-neutral.json'),
    happy: require('../../assets/animations/mascot/mascot-ninja-happy.json'),
    thriving: require('../../assets/animations/mascot/mascot-ninja-thriving.json'),
  },
  critter: {
    sick: require('../../assets/animations/mascot/mascot-critter-sick.json'),
    sad: require('../../assets/animations/mascot/mascot-critter-sad.json'),
    neutral: require('../../assets/animations/mascot/mascot-critter-neutral.json'),
    happy: require('../../assets/animations/mascot/mascot-critter-happy.json'),
    thriving: require('../../assets/animations/mascot/mascot-critter-thriving.json'),
  },
};

export const DEFAULT_ARCHETYPE: CharacterArchetype = 'critter';

/** Resolve the archetype for a given character ID */
export function getArchetype(characterId: string): CharacterArchetype {
  return CHARACTER_ARCHETYPE[characterId] ?? DEFAULT_ARCHETYPE;
}

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
