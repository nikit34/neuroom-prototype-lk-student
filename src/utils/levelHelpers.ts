const XP_PER_LEVEL = 500;

const RANKS: { minLevel: number; title: string; emoji: string }[] = [
  { minLevel: 10, title: 'Легенда', emoji: '🏆' },
  { minLevel: 8, title: 'Гуру', emoji: '🔮' },
  { minLevel: 6, title: 'Мастер', emoji: '🎓' },
  { minLevel: 5, title: 'Отличник', emoji: '📗' },
  { minLevel: 4, title: 'Знаток', emoji: '📘' },
  { minLevel: 3, title: 'Умник', emoji: '💡' },
  { minLevel: 2, title: 'Ученик', emoji: '📖' },
  { minLevel: 1, title: 'Новичок', emoji: '🌱' },
];

export function getLevel(totalPoints: number) {
  const level = Math.floor(totalPoints / XP_PER_LEVEL) + 1;
  const currentLevelXp = totalPoints % XP_PER_LEVEL;
  const rank = RANKS.find((r) => level >= r.minLevel)!;
  return { level, currentLevelXp, xpForNextLevel: XP_PER_LEVEL, rank };
}

export const HOMEWORK_XP_REWARD = 50;
