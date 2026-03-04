import { MascotState, ThemeCharacter } from '../types';

// ---------------------------------------------------------------------------
// Цвет оценки на основе процента
// ---------------------------------------------------------------------------

/**
 * Возвращает HEX-цвет для оценки на основе процента от максимального балла.
 *
 * - >= 90% — зелёный (отлично)
 * - >= 70% — жёлто-зелёный (хорошо)
 * - >= 50% — оранжевый (удовлетворительно)
 * - < 50%  — красный (плохо)
 */
export function getGradeColor(score: number, maxScore: number): string {
  if (maxScore <= 0) return '#94A3B8'; // серый для некорректных данных

  const percentage = (score / maxScore) * 100;

  if (percentage >= 90) return '#10B981'; // зелёный
  if (percentage >= 70) return '#84CC16'; // жёлто-зелёный
  if (percentage >= 50) return '#F59E0B'; // оранжевый
  return '#EF4444';                       // красный
}

/**
 * Возвращает цвет для процента (0-100) без необходимости передавать maxScore.
 */
export function getGradeColorByPercentage(percentage: number): string {
  if (percentage >= 90) return '#10B981';
  if (percentage >= 70) return '#84CC16';
  if (percentage >= 50) return '#F59E0B';
  return '#EF4444';
}

// ---------------------------------------------------------------------------
// Эмодзи для оценки
// ---------------------------------------------------------------------------

/**
 * Возвращает эмодзи, соответствующее оценке.
 */
export function getGradeEmoji(score: number, maxScore: number): string {
  if (maxScore <= 0) return '❓';

  const percentage = (score / maxScore) * 100;

  if (percentage >= 90) return '🌟';  // блестяще
  if (percentage >= 80) return '😊';  // отлично
  if (percentage >= 70) return '👍';  // хорошо
  if (percentage >= 50) return '🤔';  // можно лучше
  if (percentage >= 30) return '😬';  // слабо
  return '😢';                         // плохо
}

/**
 * Возвращает текстовую оценку на русском.
 */
export function getGradeLabel(score: number, maxScore: number): string {
  if (maxScore <= 0) return 'Нет данных';

  const percentage = (score / maxScore) * 100;

  if (percentage >= 90) return 'Отлично';
  if (percentage >= 70) return 'Хорошо';
  if (percentage >= 50) return 'Удовлетворительно';
  return 'Нужно доработать';
}

// ---------------------------------------------------------------------------
// Состояние маскота
// ---------------------------------------------------------------------------

/**
 * Определяет состояние маскота по уровню здоровья (0-100).
 *
 * - 0-19   — sick (болеет)
 * - 20-39  — sad (грустит)
 * - 40-59  — neutral (нормально)
 * - 60-79  — happy (радуется)
 * - 80-100 — thriving (процветает)
 */
export function getMascotState(health: number): MascotState {
  const clamped = Math.max(0, Math.min(100, health));

  if (clamped < 20) return 'sick';
  if (clamped < 40) return 'sad';
  if (clamped < 60) return 'neutral';
  if (clamped < 80) return 'happy';
  return 'thriving';
}

/**
 * Возвращает эмодзи маскота по его состоянию.
 * Если передан персонаж — берёт эмодзи из его mascotEmojis.
 */
export function getMascotEmoji(state: MascotState, character?: ThemeCharacter): string {
  if (character) {
    return character.mascotEmojis[state];
  }
  switch (state) {
    case 'sick':     return '🤒';
    case 'sad':      return '😿';
    case 'neutral':  return '🐱';
    case 'happy':    return '😺';
    case 'thriving': return '😻';
  }
}

/**
 * Возвращает текстовое описание состояния маскота на русском.
 */
export function getMascotStateLabel(state: MascotState): string {
  switch (state) {
    case 'sick':     return 'Болеет';
    case 'sad':      return 'Грустит';
    case 'neutral':  return 'Нормально';
    case 'happy':    return 'Радуется';
    case 'thriving': return 'Процветает';
  }
}
