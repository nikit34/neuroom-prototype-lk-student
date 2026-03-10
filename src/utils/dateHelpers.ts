import { format, formatDistanceToNowStrict, isPast, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирует дату в читаемый вид на русском языке.
 * Пример: «15 марта»
 */
export function formatDateRu(date: Date): string {
  return format(date, 'd MMMM', { locale: ru });
}

/**
 * Форматирует дату на русском языке (без времени).
 * Пример: «15 марта»
 */
export function formatDateTimeRu(date: Date): string {
  return format(date, 'd MMMM', { locale: ru });
}

/**
 * Возвращает строку «N дней назад», «2 часа назад» и т.д.
 */
export function timeAgoRu(date: Date): string {
  return formatDistanceToNowStrict(date, { locale: ru, addSuffix: true });
}

/**
 * Проверяет, просрочен ли срок сдачи.
 */
export function isOverdue(deadline: Date): boolean {
  return isPast(deadline);
}

/**
 * Возвращает человекочитаемую строку «Осталось ...» или «Просрочено ...» на русском.
 */
export function getTimeRemaining(deadline: Date): string {
  if (isPast(deadline)) {
    const days = differenceInDays(new Date(), deadline);
    if (days === 0) return 'Просрочено сегодня';
    return `Просрочено ${pluralizeDays(days)}`;
  }

  const days = differenceInDays(deadline, new Date());

  if (days === 0) return 'Осталось меньше дня';

  return `Осталось ${pluralizeDays(days)}`;
}

/**
 * Возвращает короткую строку для срока сдачи: «Сегодня», «Завтра», «Просрочено» или дату.
 */
export function getDeadlineLabel(deadline: Date): string {
  const now = new Date();
  const days = differenceInDays(deadline, now);

  if (isPast(deadline)) {
    return 'Просрочено';
  }

  if (days === 0) {
    return 'Сегодня';
  }

  if (days === 1) {
    return 'Завтра';
  }

  return formatDateRu(deadline);
}

// ---------------------------------------------------------------------------
// Склонение слов (простое правило для русского языка)
// ---------------------------------------------------------------------------

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const lastDigit = abs % 10;

  if (abs >= 11 && abs <= 19) {
    return `${n} ${many}`;
  }

  if (lastDigit === 1) {
    return `${n} ${one}`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${n} ${few}`;
  }

  return `${n} ${many}`;
}

function pluralizeDays(n: number): string {
  return pluralize(n, 'день', 'дня', 'дней');
}

/**
 * Форматирует дату в короткий вид DD.MM.YY.
 * Пример: «21.09.25»
 */
export function formatDateShortRu(date: Date): string {
  return format(date, 'dd.MM.yy');
}
