import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Grid-based composition: 4 columns x 6 rows = 24 cells
const COLS = 4;
const ROWS = 6;
const CELL_W = SCREEN_W / COLS;
const CELL_H = SCREEN_H / ROWS;

function seededRandom(seed: number): number {
  return (Math.sin(seed * 9301 + 49297) % 1 + 1) % 1;
}

function ThemeBackgroundInner() {
  const theme = useAppTheme();
  const emojis = theme.backgroundEmojis;

  const items = useMemo(() => {
    const result: {
      emoji: string;
      x: number;
      y: number;
      size: number;
      rotation: number;
      opacity: number;
      key: number;
    }[] = [];

    let idx = 0;
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const emoji = emojis[idx % emojis.length];
        // Position within cell with jitter (±30% of cell size)
        const jitterX = (seededRandom(idx * 7 + 1) - 0.5) * 0.6;
        const jitterY = (seededRandom(idx * 13 + 3) - 0.5) * 0.6;
        const x = (col + 0.5 + jitterX) * CELL_W;
        const y = (row + 0.5 + jitterY) * CELL_H;
        // Larger sizes: 28-52px
        const size = 28 + seededRandom(idx * 17 + 5) * 24;
        const rotation = (seededRandom(idx * 23 + 7) - 0.5) * 40;
        // More visible: 0.10-0.18
        const opacity = 0.10 + seededRandom(idx * 31 + 11) * 0.08;

        result.push({ emoji, x, y, size, rotation, opacity, key: idx });
        idx++;
      }
    }
    return result;
  }, [emojis]);

  return (
    <View style={styles.container} pointerEvents="none">
      {items.map((item) => (
        <Text
          key={item.key}
          style={[
            styles.emoji,
            {
              left: item.x,
              top: item.y,
              fontSize: item.size,
              opacity: item.opacity,
              transform: [{ rotate: `${item.rotation}deg` }],
            },
          ]}
        >
          {item.emoji}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  emoji: {
    position: 'absolute',
  },
});

export default memo(ThemeBackgroundInner);
