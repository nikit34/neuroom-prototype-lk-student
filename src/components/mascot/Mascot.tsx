import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useCustomizedCharacter } from '@/src/hooks/useCustomizedCharacter';
import { getMascotState, getMascotStateLabel } from '@/src/utils/gradeHelpers';
import MascotHealthBar from './MascotHealthBar';
import MascotViewer3D from './MascotViewer3D';

interface MascotProps {
  health: number; // 0-100
}

function Mascot({ health }: MascotProps) {
  const theme = useAppTheme();
  const { character, customization } = useCustomizedCharacter();
  const state = getMascotState(health);
  const label = getMascotStateLabel(state);

  return (
    <View style={styles.container}>
      <MascotViewer3D
        config3d={character.config3d}
        mascotState={state}
        width={200}
        height={200}
        customization={customization}
      />
      <Text style={[styles.characterName, { color: theme.colors.text }]}>
        {character.name}
      </Text>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <View style={styles.healthBarWrapper}>
        <MascotHealthBar health={health} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  characterName: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  healthBarWrapper: {
    width: '80%',
  },
});

export default memo(Mascot);
