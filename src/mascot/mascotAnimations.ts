import { MascotState, MascotEmotion } from '../types';

// ─── Character archetypes ────────────────────────────────────────

export type CharacterArchetype =
  | 'cat' | 'warrior' | 'fox'
  | 'wizard' | 'dragon' | 'ninja' | 'critter'
  | 'robot' | 'bear' | 'ghost' | 'alien' | 'owl';

/** Maps every character ID to its visual archetype */
export const CHARACTER_ARCHETYPE: Record<string, CharacterArchetype> = {
  // CS:GO → warrior
  'csgo-ct': 'warrior', 'csgo-t': 'warrior', 'csgo-awp': 'warrior', 'csgo-spec': 'robot',
  // Game of Thrones
  'got-dragon': 'dragon', 'got-wolf': 'cat', 'got-lion': 'cat', 'got-raven': 'owl',
  // Twilight
  'tw-vampire': 'ghost', 'tw-werewolf': 'cat', 'tw-shewolf': 'cat', 'tw-mystic': 'wizard',
  // Anime
  'anime-naruto': 'ninja', 'anime-ninja': 'ninja', 'anime-sakura': 'ninja', 'anime-sensei': 'wizard',
  // Sakura
  'sk-hanami': 'cat', 'sk-samurai': 'warrior', 'sk-geisha': 'wizard', 'sk-kitsune': 'cat',
  // Gagarin
  'gg-cosmonaut': 'fox', 'gg-rocket': 'fox', 'gg-alien': 'alien', 'gg-star': 'fox',
  // Marvel
  'mv-ironman': 'robot', 'mv-spider': 'ninja', 'mv-captain': 'warrior', 'mv-thor': 'warrior',
  // One Piece
  'op-luffy': 'ninja', 'op-zoro': 'warrior', 'op-nami': 'ninja', 'op-chopper': 'bear',
  // Frozen
  'fz-elsa': 'wizard', 'fz-olaf': 'critter', 'fz-anna': 'cat', 'fz-sven': 'bear',
  // Minions
  'mn-bob': 'critter', 'mn-kevin': 'critter', 'mn-stuart': 'critter', 'mn-gru': 'robot',
  // Clash Royale
  'cr-king': 'warrior', 'cr-princess': 'wizard', 'cr-knight': 'warrior', 'cr-dragon': 'dragon',
  // Pokemon
  'pk-pikachu': 'cat', 'pk-charmander': 'dragon', 'pk-squirtle': 'bear', 'pk-bulbasaur': 'critter',
  // Minecraft
  'mc-steve': 'warrior', 'mc-creeper': 'ghost', 'mc-enderman': 'alien', 'mc-pig': 'bear',
  // Brawl Stars
  'bw-shelly': 'warrior', 'bw-colt': 'warrior', 'bw-spike': 'critter', 'bw-crow': 'owl',
  // Hogwarts
  'hw-wizard': 'wizard', 'hw-owl': 'owl', 'hw-witch': 'wizard', 'hw-phoenix': 'dragon',
  // Among Us
  'au-red': 'alien', 'au-blue': 'alien', 'au-impostor': 'ghost', 'au-green': 'fox',
  // K-Pop
  'kp-idol': 'cat', 'kp-dancer': 'ninja', 'kp-rapper': 'fox', 'kp-producer': 'robot',
  // Genshin Impact
  'gs-traveler': 'warrior', 'gs-paimon': 'critter', 'gs-archon': 'wizard', 'gs-adeptus': 'dragon',
  // Witcher
  'wt-geralt': 'warrior', 'wt-sorceress': 'wizard', 'wt-bard': 'fox', 'wt-monster': 'dragon',
  // Attack on Titan
  'aot-eren': 'warrior', 'aot-mikasa': 'ninja', 'aot-levi': 'ninja', 'aot-armin': 'owl',
  // Valorant
  'vl-jett': 'ninja', 'vl-reyna': 'ghost', 'vl-cypher': 'robot', 'vl-phoenix': 'dragon',
  // Lord of the Rings
  'lr-hobbit': 'critter', 'lr-wizard': 'wizard', 'lr-elf': 'fox', 'lr-dwarf': 'bear',
  // SpongeBob
  'sb-spongebob': 'critter', 'sb-patrick': 'bear', 'sb-squidward': 'alien', 'sb-sandy': 'ninja',
  // Mario
  'mr-mario': 'warrior', 'mr-luigi': 'fox', 'mr-toad': 'critter', 'mr-peach': 'cat',
  // Roblox
  'rb-noob': 'critter', 'rb-builder': 'warrior', 'rb-pro': 'ninja', 'rb-robot': 'robot',
  // Sonic
  'sn-sonic': 'ninja', 'sn-tails': 'fox', 'sn-knuckles': 'warrior', 'sn-amy': 'cat',
  // Gravity Falls
  'gf-dipper': 'owl', 'gf-mabel': 'cat', 'gf-stan': 'bear', 'gf-bill': 'ghost',
  // Fortnite
  'fn-jonesy': 'warrior', 'fn-peely': 'critter', 'fn-raven': 'ghost', 'fn-shimmer': 'wizard',
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
