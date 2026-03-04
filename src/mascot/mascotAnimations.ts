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

// ─── One Lottie source per archetype (high-quality pure vector) ──

export const MASCOT_LOTTIE_SOURCES: Record<CharacterArchetype, any> = {
  cat: require('../../assets/animations/mascot/mascot-cat.json'),
  warrior: require('../../assets/animations/mascot/mascot-warrior.json'),
  king: require('../../assets/animations/mascot/mascot-king.json'),
  astronaut: require('../../assets/animations/mascot/mascot-astronaut.json'),
  wizard: require('../../assets/animations/mascot/mascot-wizard.json'),
  dragon: require('../../assets/animations/mascot/mascot-dragon.json'),
  ninja: require('../../assets/animations/mascot/mascot-ninja.json'),
  critter: require('../../assets/animations/mascot/mascot-critter.json'),
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
