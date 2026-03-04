import { format, formatDistanceToNowStrict, isPast, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирует дату в читаемый вид на русском языке.
 * Пример: «15 марта 2026»
 */
export function formatDateRu(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: ru });
}

/**
 * Форматирует дату и время на русском языке.
 * Пример: «15 марта, 14:30»
 */
export function formatDateTimeRu(date: Date): string {
  return format(date, 'd MMMM, HH:mm', { locale: ru });
}

/**
 * Форматирует только время.
 * Пример: «14:30»
 */
export function formatTimeRu(date: Date): string {
  return format(date, 'HH:mm', { locale: ru });
}

/**
 * Возвращает строку «N дней назад», «2 часа назад» и т.д.
 */
export function timeAgoRu(date: Date): string {
  return formatDistanceToNowStrict(date, { locale: ru, addSuffix: true });
}

/**
 * Проверяет, просрочен ли дедлайн.
 */
export function isOverdue(deadline: Date): boolean {
  return isPast(deadline);
}

/**
 * Возвращает человекочитаемую строку «Осталось ...» или «Просрочено ...» на русском.
 */
export function getTimeRemaining(deadline: Date): string {
  const now = new Date();

  if (isPast(deadline)) {
    return `Просрочено ${formatDistanceToNowStrict(deadline, { locale: ru })}`;
  }

  const minutes = differenceInMinutes(deadline, now);
  const hours = differenceInHours(deadline, now);
  const days = differenceInDays(deadline, now);

  if (minutes < 60) {
    return `Осталось ${pluralizeMinutes(minutes)}`;
  }

  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `Осталось ${pluralizeHours(hours)}`;
    }
    return `Осталось ${pluralizeHours(hours)} ${pluralizeMinutes(remainingMinutes)}`;
  }

  if (days < 7) {
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `Осталось ${pluralizeDays(days)}`;
    }
    return `Осталось ${pluralizeDays(days)} ${pluralizeHours(remainingHours)}`;
  }

  return `Осталось ${pluralizeDays(days)}`;
}

/**
 * Возвращает короткую строку для дедлайна: «Сегодня», «Завтра», «Просрочено» или дату.
 */
export function getDeadlineLabel(deadline: Date): string {
  const now = new Date();
  const days = differenceInDays(deadline, now);

  if (isPast(deadline)) {
    return 'Просрочено';
  }

  if (days === 0) {
    return `Сегодня, ${formatTimeRu(deadline)}`;
  }

  if (days === 1) {
    return `Завтра, ${formatTimeRu(deadline)}`;
  }

  return formatDateTimeRu(deadline);
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

function pluralizeMinutes(n: number): string {
  return pluralize(n, 'минута', 'минуты', 'минут');
}

function pluralizeHours(n: number): string {
  return pluralize(n, 'час', 'часа', 'часов');
}

function pluralizeDays(n: number): string {
  return pluralize(n, 'день', 'дня', 'дней');
}
