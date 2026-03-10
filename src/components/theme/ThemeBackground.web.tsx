import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { LandscapeLayer, type SvgLayerConfig } from './LandscapeLayers';

// ── Types ────────────────────────────────────────────────────────────

interface ThemeScene {
  sky: [string, string, string];
  layers: SvgLayerConfig[];
}

// ── Scene definitions (shared with native) ───────────────────────────

const SCENES: Record<string, ThemeScene> = {
  // Neuroom default
  neuroom: {
    sky: ['#E8E0FF', '#F2F6F8', '#FFFFFF'],
    layers: [
      { type: 'mountains', color: '#D8D0F0', opacity: 0.25, height: 0.35 },
      { type: 'hills',     color: '#C8C0E8', opacity: 0.35, height: 0.25 },
      { type: 'bushes',    color: '#B0A8D8', opacity: 0.5,  height: 0.15 },
    ],
  },
  // Mountains preset
  csgo: {
    sky: ['#0a0a14', '#1a1a2a', '#1A1A1A'],
    layers: [
      { type: 'mountains', color: '#0d0d1a', opacity: 0.4, height: 0.35 },
      { type: 'hills',     color: '#0a0a12', opacity: 0.6, height: 0.25 },
      { type: 'pines',     color: '#060608', opacity: 0.8, height: 0.15 },
    ],
  },
  minecraft: {
    sky: ['#80C0FF', '#A0D8A0', '#F0F5E8'],
    layers: [
      { type: 'mountains', color: '#6A9E5E', opacity: 0.35, height: 0.35 },
      { type: 'hills',     color: '#4E8B3A', opacity: 0.5,  height: 0.25 },
      { type: 'pines',     color: '#2D6B1E', opacity: 0.7,  height: 0.18 },
    ],
  },
  pokemon: {
    sky: ['#90D0FF', '#C0E8FF', '#FFF5F5'],
    layers: [
      { type: 'mountains', color: '#8EC08A', opacity: 0.3, height: 0.35 },
      { type: 'hills',     color: '#6DAA68', opacity: 0.45, height: 0.25 },
      { type: 'pines',     color: '#4A8A45', opacity: 0.6, height: 0.15 },
    ],
  },
  clash: {
    sky: ['#080820', '#101838', '#0E1638'],
    layers: [
      { type: 'mountains', color: '#0E1230', opacity: 0.4, height: 0.35 },
      { type: 'hills',     color: '#0A0E25', opacity: 0.55, height: 0.25 },
      { type: 'pines',     color: '#06081A', opacity: 0.75, height: 0.15 },
    ],
  },

  // Forest preset
  got: {
    sky: ['#1a0505', '#2a1020', '#121010'],
    layers: [
      { type: 'mountains', color: '#1A0A0A', opacity: 0.35, height: 0.35 },
      { type: 'forest',    color: '#120808', opacity: 0.55, height: 0.25 },
      { type: 'bushes',    color: '#0A0505', opacity: 0.75, height: 0.15 },
    ],
  },
  twilight: {
    sky: ['#0D0020', '#1a0830', '#0D0D12'],
    layers: [
      { type: 'mountains', color: '#0D0018', opacity: 0.35, height: 0.35 },
      { type: 'forest',    color: '#0A0012', opacity: 0.55, height: 0.25 },
      { type: 'bushes',    color: '#06000A', opacity: 0.75, height: 0.15 },
    ],
  },
  hogwarts: {
    sky: ['#080818', '#101030', '#120A0A'],
    layers: [
      { type: 'mountains', color: '#0A0A20', opacity: 0.35, height: 0.35 },
      { type: 'forest',    color: '#080815', opacity: 0.55, height: 0.25 },
      { type: 'bushes',    color: '#05050E', opacity: 0.75, height: 0.15 },
    ],
  },

  // Ocean preset
  onepiece: {
    sky: ['#FFA850', '#60B8E8', '#90D0F0'],
    layers: [
      { type: 'clouds',    color: '#FFFFFF', opacity: 0.3,  height: 0.3 },
      { type: 'waves',     color: '#4098D0', opacity: 0.35, height: 0.25 },
      { type: 'wavesNear', color: '#2878B0', opacity: 0.5,  height: 0.15 },
    ],
  },
  frozen: {
    sky: ['#C0E0FF', '#E0F0FF', '#E8F4FC'],
    layers: [
      { type: 'clouds',    color: '#FFFFFF', opacity: 0.3, height: 0.3 },
      { type: 'waves',     color: '#A0C8E8', opacity: 0.4, height: 0.25 },
      { type: 'wavesNear', color: '#80B0D8', opacity: 0.55, height: 0.15 },
    ],
  },

  // City preset
  anime: {
    sky: ['#FF9070', '#E8A0D0', '#C8E0F8'],
    layers: [
      { type: 'skyscrapers',   color: '#D880B8', opacity: 0.25, height: 0.4 },
      { type: 'buildings',     color: '#C070A0', opacity: 0.35, height: 0.3 },
      { type: 'buildingsNear', color: '#A06088', opacity: 0.5,  height: 0.2 },
    ],
  },
  marvel: {
    sky: ['#4088E0', '#60A0F0', '#D0E4FF'],
    layers: [
      { type: 'skyscrapers',   color: '#3868B8', opacity: 0.3,  height: 0.4 },
      { type: 'buildings',     color: '#2850A0', opacity: 0.45, height: 0.3 },
      { type: 'buildingsNear', color: '#1A3878', opacity: 0.6,  height: 0.2 },
    ],
  },

  // Desert preset
  brawl: {
    sky: ['#1a0828', '#281040', '#1A0E28'],
    layers: [
      { type: 'dunes',    color: '#200E30', opacity: 0.35, height: 0.35 },
      { type: 'dunesMid', color: '#180A25', opacity: 0.55, height: 0.25 },
      { type: 'cacti',    color: '#10061A', opacity: 0.75, height: 0.2 },
    ],
  },
  minions: {
    sky: ['#FFE8A0', '#FFF0C0', '#FFF8E0'],
    layers: [
      { type: 'dunes',    color: '#E8C870', opacity: 0.3,  height: 0.35 },
      { type: 'dunesMid', color: '#D8B858', opacity: 0.45, height: 0.25 },
      { type: 'cacti',    color: '#C8A848', opacity: 0.6,  height: 0.2 },
    ],
  },

  // Space preset
  gagarin: {
    sky: ['#000010', '#0A0A30', '#0A0A1E'],
    layers: [
      { type: 'stars',   color: '#FFFFFF', opacity: 0.5,  height: 0.8 },
      { type: 'planets', color: '#3040A0', opacity: 0.4,  height: 0.6 },
      { type: 'surface', color: '#0A0A20', opacity: 0.7,  height: 0.25 },
    ],
  },
  amongus: {
    sky: ['#000008', '#080820', '#0A0A18'],
    layers: [
      { type: 'stars',   color: '#FFFFFF', opacity: 0.45, height: 0.8 },
      { type: 'planets', color: '#203080', opacity: 0.35, height: 0.6 },
      { type: 'surface', color: '#08081A', opacity: 0.7,  height: 0.25 },
    ],
  },
  sakura: {
    sky: ['#FFE8F0', '#FFF0F5', '#FFF5F9'],
    layers: [
      { type: 'sakuraHills', color: '#F0C0D0', opacity: 0.3,  height: 0.4 },
      { type: 'hills',       color: '#E8A8C0', opacity: 0.45, height: 0.28 },
      { type: 'bushes',      color: '#D890A8', opacity: 0.6,  height: 0.15 },
    ],
  },

  // ── New senior themes ──────────────────────────────────────────

  kpop: {
    sky: ['#E8A0FF', '#FFC0E0', '#D0F0FF'],
    layers: [
      { type: 'skyscrapers',   color: '#D0A0E8', opacity: 0.25, height: 0.4 },
      { type: 'buildings',     color: '#C090D8', opacity: 0.35, height: 0.3 },
      { type: 'buildingsNear', color: '#A870C0', opacity: 0.5,  height: 0.2 },
    ],
  },
  genshin: {
    sky: ['#80C8FF', '#B0E0F8', '#F0F8FF'],
    layers: [
      { type: 'mountains', color: '#88C0B0', opacity: 0.3,  height: 0.35 },
      { type: 'hills',     color: '#68A898', opacity: 0.45, height: 0.25 },
      { type: 'pines',     color: '#488878', opacity: 0.6,  height: 0.18 },
    ],
  },
  witcher: {
    sky: ['#0A0808', '#1A1210', '#121010'],
    layers: [
      { type: 'mountains', color: '#18100A', opacity: 0.35, height: 0.35 },
      { type: 'forest',    color: '#100A06', opacity: 0.55, height: 0.25 },
      { type: 'bushes',    color: '#080604', opacity: 0.75, height: 0.15 },
    ],
  },
  aot: {
    sky: ['#180808', '#2A1818', '#1A1010'],
    layers: [
      { type: 'skyscrapers',   color: '#201010', opacity: 0.35, height: 0.4 },
      { type: 'buildings',     color: '#180A0A', opacity: 0.55, height: 0.3 },
      { type: 'buildingsNear', color: '#100606', opacity: 0.75, height: 0.2 },
    ],
  },
  valorant: {
    sky: ['#0A0A18', '#101028', '#0E0E1A'],
    layers: [
      { type: 'skyscrapers',   color: '#0E0E28', opacity: 0.35, height: 0.4 },
      { type: 'buildings',     color: '#0A0A1E', opacity: 0.55, height: 0.3 },
      { type: 'buildingsNear', color: '#060614', opacity: 0.75, height: 0.2 },
    ],
  },
  strangerthings: {
    sky: ['#0A0005', '#1A0810', '#0A0508'],
    layers: [
      { type: 'mountains', color: '#180510', opacity: 0.35, height: 0.35 },
      { type: 'forest',    color: '#10040A', opacity: 0.55, height: 0.25 },
      { type: 'bushes',    color: '#080206', opacity: 0.75, height: 0.15 },
    ],
  },
  lotr: {
    sky: ['#0A0A10', '#151520', '#0D0D15'],
    layers: [
      { type: 'mountains', color: '#0E0E18', opacity: 0.35, height: 0.35 },
      { type: 'forest',    color: '#0A0A12', opacity: 0.55, height: 0.25 },
      { type: 'bushes',    color: '#06060A', opacity: 0.75, height: 0.15 },
    ],
  },

  // ── New junior themes ──────────────────────────────────────────

  spongebob: {
    sky: ['#40C8F0', '#70D8FF', '#A0E8FF'],
    layers: [
      { type: 'clouds',    color: '#FFFFFF', opacity: 0.3,  height: 0.3 },
      { type: 'waves',     color: '#50B0E0', opacity: 0.35, height: 0.25 },
      { type: 'wavesNear', color: '#3090C8', opacity: 0.5,  height: 0.15 },
    ],
  },
  mario: {
    sky: ['#60B0FF', '#90D0FF', '#C0E8FF'],
    layers: [
      { type: 'hills',   color: '#60C060', opacity: 0.3,  height: 0.35 },
      { type: 'hills',   color: '#40A840', opacity: 0.45, height: 0.25 },
      { type: 'bushes',  color: '#288828', opacity: 0.6,  height: 0.15 },
    ],
  },
  roblox: {
    sky: ['#50A8F0', '#80C8FF', '#D0ECFF'],
    layers: [
      { type: 'skyscrapers',   color: '#60A0D8', opacity: 0.25, height: 0.4 },
      { type: 'buildings',     color: '#4888C0', opacity: 0.35, height: 0.3 },
      { type: 'buildingsNear', color: '#3070A0', opacity: 0.5,  height: 0.2 },
    ],
  },
  sonic: {
    sky: ['#3898FF', '#60B0FF', '#A0D8FF'],
    layers: [
      { type: 'hills',   color: '#50C850', opacity: 0.3,  height: 0.35 },
      { type: 'hills',   color: '#38B038', opacity: 0.45, height: 0.25 },
      { type: 'bushes',  color: '#209020', opacity: 0.6,  height: 0.15 },
    ],
  },
  gravityfalls: {
    sky: ['#0A1020', '#182838', '#0E1820'],
    layers: [
      { type: 'mountains', color: '#0E1820', opacity: 0.35, height: 0.35 },
      { type: 'forest',    color: '#0A1218', opacity: 0.55, height: 0.25 },
      { type: 'pines',     color: '#060E10', opacity: 0.75, height: 0.18 },
    ],
  },
  fortnite: {
    sky: ['#0A0818', '#181030', '#100A20'],
    layers: [
      { type: 'mountains', color: '#100A20', opacity: 0.4,  height: 0.35 },
      { type: 'hills',     color: '#0C0818', opacity: 0.55, height: 0.25 },
      { type: 'pines',     color: '#080510', opacity: 0.75, height: 0.15 },
    ],
  },
};

// ── Main Component ───────────────────────────────────────────────────

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
      {scene.layers.map((layer, i) => (
        <LandscapeLayer key={`${theme.id}-${i}`} config={layer} />
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
