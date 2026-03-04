import { useCurrentCharacter } from './useAppTheme';
import { useCustomizationStore } from '../stores/customizationStore';

export function useCustomizedCharacter() {
  const character = useCurrentCharacter();
  const customization = useCustomizationStore((s) => s.customizations[character.id]);
  return { character, customization };
}
