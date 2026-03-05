import { useThemeStore } from '@/src/stores/themeStore';
import { themes, allCharacters } from '@/src/theme/themes';
import { ThemeCharacter } from '@/src/types';

export function useAppTheme() {
  const themeId = useThemeStore(s => s.themeId);
  return themes.find(t => t.id === themeId) || themes[0];
}

export function useCurrentCharacter(): ThemeCharacter {
  const characterId = useThemeStore(s => s.characterId);
  return allCharacters.find(c => c.id === characterId) || allCharacters[0];
}
