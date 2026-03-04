import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/src/hooks/useAppTheme';

const SCENES: Record<string, { sky: [string, string, string] }> = {
  csgo:      { sky: ['#0a0a14', '#1a1a2a', '#1A1A1A'] },
  got:       { sky: ['#1a0505', '#2a1020', '#121010'] },
  twilight:  { sky: ['#0D0020', '#1a0830', '#0D0D12'] },
  anime:     { sky: ['#2a1040', '#1a0828', '#140818'] },
  sakura:    { sky: ['#FFE8F0', '#FFF0F5', '#FFF5F9'] },
  gagarin:   { sky: ['#000010', '#0A0A30', '#0A0A1E'] },
  marvel:    { sky: ['#08081a', '#151530', '#0C0C1A'] },
  onepiece:  { sky: ['#FF8040', '#4080C0', '#0E1428'] },
  frozen:    { sky: ['#C0E0FF', '#E0F0FF', '#E8F4FC'] },
  minions:   { sky: ['#FFE8A0', '#FFF0C0', '#FFF8E0'] },
  clash:     { sky: ['#080820', '#101838', '#0E1638'] },
  pokemon:   { sky: ['#90D0FF', '#C0E8FF', '#FFF5F5'] },
  minecraft: { sky: ['#80C0FF', '#A0D8A0', '#F0F5E8'] },
  brawl:     { sky: ['#1a0828', '#281040', '#1A0E28'] },
  hogwarts:  { sky: ['#080818', '#101030', '#120A0A'] },
  amongus:   { sky: ['#000008', '#080820', '#0A0A18'] },
};

function ThemeBackgroundInner() {
  const theme = useAppTheme();
  const scene = SCENES[theme.id];
  if (!scene) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <LinearGradient
        colors={scene.sky}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});

export default memo(ThemeBackgroundInner);
