import React, { memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';

// ── Types ───────────────────────────────────────────────────────────

interface LottieLayer {
  uri: string;
  opacity: number;
  speed?: number;
}

interface ThemeScene {
  sky: [string, string, string];
  lottie: LottieLayer[];
}

// ── Lottie CDN URLs (LottieFiles free license) ─────────────────────

const CDN = 'https://assets-v2.lottiefiles.com/a';

const SCENES: Record<string, ThemeScene> = {
  csgo: {
    sky: ['#0a0a14', '#1a1a2a', '#1A1A1A'],
    lottie: [
      { uri: `${CDN}/04114a50-1168-11ee-acaf-bfcee2c1067b/QjflTKu348.json`, opacity: 0.25 },
    ],
  },
  got: {
    sky: ['#1a0505', '#2a1020', '#121010'],
    lottie: [
      { uri: `${CDN}/d56f6716-1150-11ee-831a-1727acc7339b/rx8339a6xf.json`, opacity: 0.2 },
    ],
  },
  twilight: {
    sky: ['#0D0020', '#1a0830', '#0D0D12'],
    lottie: [
      { uri: `${CDN}/7f22614a-1152-11ee-87e7-87c9e35ce183/2TRPA4Hye8.json`, opacity: 0.2 },
    ],
  },
  anime: {
    sky: ['#2a1040', '#1a0828', '#140818'],
    lottie: [
      { uri: `${CDN}/fbb3f914-1173-11ee-b1e9-97c6ad380613/i7nkX6A6PB.json`, opacity: 0.22 },
    ],
  },
  sakura: {
    sky: ['#FFE8F0', '#FFF0F5', '#FFF5F9'],
    lottie: [
      { uri: `${CDN}/fbb3f914-1173-11ee-b1e9-97c6ad380613/i7nkX6A6PB.json`, opacity: 0.3 },
    ],
  },
  gagarin: {
    sky: ['#000010', '#0A0A30', '#0A0A1E'],
    lottie: [
      { uri: `${CDN}/17155882-1161-11ee-9582-93fcfa0f9393/IBLlPU0Z3x.json`, opacity: 0.35 },
    ],
  },
  marvel: {
    sky: ['#08081a', '#151530', '#0C0C1A'],
    lottie: [
      { uri: `${CDN}/582c71fc-117f-11ee-b596-ffc5ea6b4b42/ykLzy5qyfc.json`, opacity: 0.2 },
    ],
  },
  onepiece: {
    sky: ['#FF8040', '#4080C0', '#0E1428'],
    lottie: [
      { uri: `${CDN}/a4470c9a-1171-11ee-b93d-a3ecda453b56/rworiWkWZn.json`, opacity: 0.2, speed: 0.5 },
    ],
  },
  frozen: {
    sky: ['#C0E0FF', '#E0F0FF', '#E8F4FC'],
    lottie: [
      { uri: `${CDN}/25d7500e-1167-11ee-8b6b-4f78ff922a46/lJQ3A02vvZ.json`, opacity: 0.35 },
    ],
  },
  minions: {
    sky: ['#FFE8A0', '#FFF0C0', '#FFF8E0'],
    lottie: [
      { uri: `${CDN}/83257b9e-69d8-11ef-9633-7f606dcc518c/RVpbB1z7Pr.json`, opacity: 0.2 },
    ],
  },
  clash: {
    sky: ['#080820', '#101838', '#0E1638'],
    lottie: [
      { uri: `${CDN}/d56f6716-1150-11ee-831a-1727acc7339b/rx8339a6xf.json`, opacity: 0.18 },
    ],
  },
  pokemon: {
    sky: ['#90D0FF', '#C0E8FF', '#FFF5F5'],
    lottie: [
      { uri: `${CDN}/64e1fe54-1165-11ee-a760-9376ed05e1a3/yUdyu0pxXl.json`, opacity: 0.25 },
    ],
  },
  minecraft: {
    sky: ['#80C0FF', '#A0D8A0', '#F0F5E8'],
    lottie: [
      { uri: `${CDN}/a6f07508-1153-11ee-8412-eb9e0060ecef/Z4CC0Ulhlc.json`, opacity: 0.25 },
    ],
  },
  brawl: {
    sky: ['#1a0828', '#281040', '#1A0E28'],
    lottie: [
      { uri: `${CDN}/4b4141a4-1164-11ee-b146-0bb12690ec08/bD2fCRZN4z.json`, opacity: 0.18 },
    ],
  },
  hogwarts: {
    sky: ['#080818', '#101030', '#120A0A'],
    lottie: [
      { uri: `${CDN}/64e1fe54-1165-11ee-a760-9376ed05e1a3/yUdyu0pxXl.json`, opacity: 0.25 },
      { uri: `${CDN}/16b6ea72-117a-11ee-a9e8-8fb4b0141401/DW7VkXsfhl.json`, opacity: 0.15 },
    ],
  },
  amongus: {
    sky: ['#000008', '#080820', '#0A0A18'],
    lottie: [
      { uri: `${CDN}/ee1d69e6-1175-11ee-9271-8b15d01550f0/FCRWu6qW2I.json`, opacity: 0.22 },
    ],
  },
};

// ── Lottie Layer Component ──────────────────────────────────────────

const LottieLayer = memo(function LottieLayer({ uri, opacity, speed }: LottieLayer) {
  const onError = useCallback(() => {
    // Silently ignore load errors — gradient still shows
  }, []);

  return (
    <LottieView
      source={{ uri }}
      autoPlay
      loop
      speed={speed ?? 1}
      resizeMode="cover"
      onAnimationFailure={onError}
      style={[StyleSheet.absoluteFillObject, { opacity }]}
    />
  );
});

// ── Main Component ──────────────────────────────────────────────────

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
      {scene.lottie.map((layer, i) => (
        <LottieLayer key={`${theme.id}-${i}`} {...layer} />
      ))}
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
