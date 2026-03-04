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
// Each theme has a scenic/atmospheric animation with real objects & compositions

const CDN = 'https://assets-v2.lottiefiles.com/a';

const SCENES: Record<string, ThemeScene> = {
  csgo: {
    // Cityscape — dark city scene with buildings
    sky: ['#0a0a14', '#1a1a2a', '#1A1A1A'],
    lottie: [
      { uri: `${CDN}/c3f5da80-1167-11ee-bfec-f703c703d1b1/IyoA3jiROE.json`, opacity: 0.3 },
    ],
  },
  got: {
    // Castle — medieval castle scene
    sky: ['#1a0505', '#2a1020', '#121010'],
    lottie: [
      { uri: `${CDN}/ca259e8e-c73f-11ee-81e7-a7b683506104/3NwNJ5uf2h.json`, opacity: 0.25 },
    ],
  },
  twilight: {
    // Halloween night — dark scene with moon, bats, landscape
    sky: ['#0D0020', '#1a0830', '#0D0D12'],
    lottie: [
      { uri: `${CDN}/cd7d177a-1172-11ee-80c7-b798f4df4131/cYVyj9gBbZ.json`, opacity: 0.25 },
    ],
  },
  anime: {
    // Cyberpunk neon scene
    sky: ['#2a1040', '#1a0828', '#140818'],
    lottie: [
      { uri: `${CDN}/6d938dda-118b-11ee-8a32-ab04cf779dd0/pwT4CYbXlY.json`, opacity: 0.25 },
    ],
  },
  sakura: {
    // Cherry blossom petals — sakura scene
    sky: ['#FFE8F0', '#FFF0F5', '#FFF5F9'],
    lottie: [
      { uri: `${CDN}/fbb3f914-1173-11ee-b1e9-97c6ad380613/i7nkX6A6PB.json`, opacity: 0.35 },
    ],
  },
  gagarin: {
    // Space planets astronaut — solar system scene
    sky: ['#000010', '#0A0A30', '#0A0A1E'],
    lottie: [
      { uri: `${CDN}/d87895e4-1188-11ee-87cc-17dc72bbbe1c/d5bEMAmIAS.json`, opacity: 0.35 },
    ],
  },
  marvel: {
    // Thunderstorm — dramatic storm scene
    sky: ['#08081a', '#151530', '#0C0C1A'],
    lottie: [
      { uri: `${CDN}/35a6b804-5405-11ee-a5b4-6b770abb185b/oarNziiAM1.json`, opacity: 0.25 },
    ],
  },
  onepiece: {
    // Boat in ocean — sailing ship on waves
    sky: ['#FF8040', '#4080C0', '#0E1428'],
    lottie: [
      { uri: `${CDN}/19bf9c50-1166-11ee-9585-27cac48a918b/lMqTv6PeCU.json`, opacity: 0.25, speed: 0.7 },
    ],
  },
  frozen: {
    // Winter snow — snowy winter landscape
    sky: ['#C0E0FF', '#E0F0FF', '#E8F4FC'],
    lottie: [
      { uri: `${CDN}/b812a11e-1183-11ee-a65e-df170e015e38/rlJcgkJBix.json`, opacity: 0.4 },
    ],
  },
  minions: {
    // Happy sun — sunny cartoon scene
    sky: ['#FFE8A0', '#FFF0C0', '#FFF8E0'],
    lottie: [
      { uri: `${CDN}/950c5b0e-1153-11ee-b217-231a657478da/bG6t3JEH8n.json`, opacity: 0.3 },
    ],
  },
  clash: {
    // Day to night cycle — landscape scene
    sky: ['#080820', '#101838', '#0E1638'],
    lottie: [
      { uri: `${CDN}/a87cd646-1167-11ee-a77b-b319fb1b8dc9/nqw0qH6xK3.json`, opacity: 0.25 },
    ],
  },
  pokemon: {
    // Forest — green forest scene with trees
    sky: ['#90D0FF', '#C0E8FF', '#FFF5F5'],
    lottie: [
      { uri: `${CDN}/919958c4-1152-11ee-be40-734f3ebb8fa8/qQxAo03jjB.json`, opacity: 0.3 },
    ],
  },
  minecraft: {
    // Mountain with sun — mountain landscape
    sky: ['#80C0FF', '#A0D8A0', '#F0F5E8'],
    lottie: [
      { uri: `${CDN}/d5646f86-1151-11ee-b296-47294060bc12/9pgqiG7Ue8.json`, opacity: 0.3 },
    ],
  },
  brawl: {
    // Desert sunset — desert scene
    sky: ['#1a0828', '#281040', '#1A0E28'],
    lottie: [
      { uri: `${CDN}/67bd0de6-1168-11ee-8df8-0f1132cc796a/ZlkQYlMykh.json`, opacity: 0.25 },
    ],
  },
  hogwarts: {
    // Clear night moon — night sky with moon and stars
    sky: ['#080818', '#101030', '#120A0A'],
    lottie: [
      { uri: `${CDN}/e9a1c380-1170-11ee-970a-43c443669001/AKPVbTeB6E.json`, opacity: 0.3 },
    ],
  },
  amongus: {
    // Astronaut in space — floating astronaut scene
    sky: ['#000008', '#080820', '#0A0A18'],
    lottie: [
      { uri: `${CDN}/896cac22-1162-11ee-9323-dbc9509ac931/kGrRFKlaSP.json`, opacity: 0.25 },
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
