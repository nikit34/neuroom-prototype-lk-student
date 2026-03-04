import { useThemeStore } from '@/src/stores/themeStore';
import { themes } from '@/src/theme/themes';
import { ThemeCharacter } from '@/src/types';

export function useAppTheme() {
  const themeId = useThemeStore(s => s.themeId);
  return themes.find(t => t.id === themeId) || themes[0];
}

export function useCurrentCharacter(): ThemeCharacter {
  const characterId = useThemeStore(s => s.characterId);
  const allCharacters = themes.flatMap(t => t.characters);
  return allCharacters.find(c => c.id === characterId) || themes[0].characters[0];
}
