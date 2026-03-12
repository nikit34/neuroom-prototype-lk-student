import { useThemeStore } from '@/src/stores/themeStore';

interface AgeStyles {
  isJunior: boolean;
  // Fonts
  greetingSize: number;
  headerSize: number;
  sectionTitleSize: number;
  bodySize: number;
  smallSize: number;
  // Progress
  progressTrackHeight: number;
  progressLabelSize: number;
  // Cards
  cardBorderRadius: number;
  cardPadding: number;
  // Buttons
  filterBtnPaddingH: number;
  filterBtnPaddingV: number;
  filterBtnRadius: number;
  filterTextSize: number;
  actionBtnHeight: number;
  actionBtnRadius: number;
  actionBtnIconSize: number;
  actionBtnLabelSize: number;
  // Tab bar
  tabIconSize: number;
  tabLabelSize: number;
  tabBarHeight: number;
  // Mascot
  mascotSize: number;
  emptyMascotSize: number;
  // Spacing
  contentPadding: number;
}

const SENIOR: AgeStyles = {
  isJunior: false,
  greetingSize: 26,
  headerSize: 26,
  sectionTitleSize: 20,
  bodySize: 15,
  smallSize: 13,
  progressTrackHeight: 8,
  progressLabelSize: 14,
  cardBorderRadius: 16,
  cardPadding: 16,
  filterBtnPaddingH: 14,
  filterBtnPaddingV: 8,
  filterBtnRadius: 20,
  filterTextSize: 13,
  actionBtnHeight: 34,
  actionBtnRadius: 10,
  actionBtnIconSize: 14,
  actionBtnLabelSize: 12,
  tabIconSize: 22,
  tabLabelSize: 11,
  tabBarHeight: 88,
  mascotSize: 70,
  emptyMascotSize: 160,
  contentPadding: 20,
};

const JUNIOR: AgeStyles = {
  isJunior: true,
  greetingSize: 30,
  headerSize: 30,
  sectionTitleSize: 24,
  bodySize: 17,
  smallSize: 15,
  progressTrackHeight: 14,
  progressLabelSize: 16,
  cardBorderRadius: 22,
  cardPadding: 18,
  filterBtnPaddingH: 18,
  filterBtnPaddingV: 11,
  filterBtnRadius: 24,
  filterTextSize: 15,
  actionBtnHeight: 42,
  actionBtnRadius: 14,
  actionBtnIconSize: 18,
  actionBtnLabelSize: 14,
  tabIconSize: 28,
  tabLabelSize: 13,
  tabBarHeight: 96,
  mascotSize: 90,
  emptyMascotSize: 200,
  contentPadding: 22,
};

export function useAgeStyles(): AgeStyles {
  const ageGroup = useThemeStore((s) => s.ageGroup);
  return ageGroup === 'junior' ? JUNIOR : SENIOR;
}
