import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { AchievementRarity, AchievementCategory } from '@/src/types';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Category-specific celebration themes ────────────────────────

interface CategoryTheme {
  label: string;
  emoji: string;
  confettiEmoji: string[];
  sparkTrail: string[];
  bgEmoji: string;
  /** Animation style unique to this category */
  animation: 'confetti_rain' | 'rocket_launch' | 'sword_clash' | 'star_spiral' | 'shockwave_burst';
}

const CATEGORY_THEMES: Record<AchievementCategory, CategoryTheme> = {
  homework: {
    label: 'ДОМАШКА',
    emoji: '📝',
    confettiEmoji: ['📝', '✏️', '📖', '🅰️', '💯'],
    sparkTrail: ['✨', '💫', '⭐'],
    bgEmoji: '📚',
    animation: 'confetti_rain',
  },
  early_streak: {
    label: 'РАННЯЯ СДАЧА',
    emoji: '🚀',
    confettiEmoji: ['🚀', '🚀', '⏱️', '⚡', '🎯'],
    sparkTrail: ['🚀', '💫', '✨'],
    bgEmoji: '🚀',
    animation: 'rocket_launch',
  },
  duel: {
    label: 'ДУЭЛЬ',
    emoji: '⚔️',
    confettiEmoji: ['⚔️', '🛡️', '🗡️', '💪', '🏅'],
    sparkTrail: ['⚡', '💫', '✨'],
    bgEmoji: '⚔️',
    animation: 'sword_clash',
  },
  team_quest: {
    label: 'КВЕСТ',
    emoji: '🤝',
    confettiEmoji: ['🤝', '🏆', '🎯', '🧩', '🌟'],
    sparkTrail: ['🌟', '✨', '💫'],
    bgEmoji: '🏆',
    animation: 'star_spiral',
  },
  challenge: {
    label: 'ИСПЫТАНИЕ',
    emoji: '🏋️',
    confettiEmoji: ['🏋️', '💎', '🎖️', '⚡', '🌀'],
    sparkTrail: ['💎', '✨', '💫'],
    bgEmoji: '💎',
    animation: 'shockwave_burst',
  },
};

// ── Rarity configs ──────────────────────────────────────────────

interface RarityTheme {
  glow: string;
  label: string;
  colors: string[];
  confettiCount: number;
  fireworkBursts: number;
  sparkCount: number;
  duration: number;
}

const RARITY_THEMES: Record<AchievementRarity, RarityTheme> = {
  common: {
    glow: '#10B981',
    label: 'ОБЫЧНОЕ',
    colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
    confettiCount: 40,
    fireworkBursts: 0,
    sparkCount: 6,
    duration: 4000,
  },
  rare: {
    glow: '#3B82F6',
    label: 'РЕДКОЕ',
    colors: ['#3B82F6', '#60A5FA', '#93C5FD', '#818CF8', '#A5B4FC'],
    confettiCount: 55,
    fireworkBursts: 1,
    sparkCount: 10,
    duration: 5000,
  },
  epic: {
    glow: '#8B5CF6',
    label: 'ЭПИЧЕСКОЕ',
    colors: ['#8B5CF6', '#A78BFA', '#C084FC', '#E879F9', '#F0ABFC'],
    confettiCount: 70,
    fireworkBursts: 2,
    sparkCount: 14,
    duration: 5500,
  },
  legendary: {
    glow: '#F59E0B',
    label: 'ЛЕГЕНДАРНОЕ',
    colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#EF4444', '#F97316', '#FFD700'],
    confettiCount: 90,
    fireworkBursts: 3,
    sparkCount: 20,
    duration: 6500,
  },
};

// ── Shared particle types ───────────────────────────────────────

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  rotation: number;
  shape: 'rect' | 'circle' | 'star';
  swayAmount: number;
  fallDuration: number;
}

interface EmojiParticle {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  size: number;
  fallDuration: number;
}

// ── Category-specific particle types ────────────────────────────

interface RocketParticle {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  size: number;
  speed: number;
}

interface ClashSpark {
  id: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
  delay: number;
}

interface SpiralStar {
  id: number;
  emoji: string;
  angle: number;
  radius: number;
  delay: number;
  size: number;
}

interface ShockwaveRing {
  id: number;
  delay: number;
  color: string;
  maxRadius: number;
}

interface GroundBurstParticle {
  id: number;
  x: number;
  color: string;
  size: number;
  angle: number;
  distance: number;
  delay: number;
}

// ── Generators ──────────────────────────────────────────────────

function generateConfetti(rarity: RarityTheme): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = [];
  const shapes: ConfettiPiece['shape'][] = ['rect', 'circle', 'star'];
  for (let i = 0; i < rarity.confettiCount; i++) {
    pieces.push({
      id: i,
      x: Math.random() * SW,
      color: rarity.colors[i % rarity.colors.length],
      size: 5 + Math.random() * 7,
      delay: Math.random() * 800,
      rotation: Math.random() * 360,
      shape: shapes[i % 3],
      swayAmount: 20 + Math.random() * 40,
      fallDuration: 1600 + Math.random() * 1200,
    });
  }
  return pieces;
}

function generateEmoji(catTheme: CategoryTheme, count: number): EmojiParticle[] {
  const particles: EmojiParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      emoji: catTheme.confettiEmoji[i % catTheme.confettiEmoji.length],
      x: Math.random() * SW,
      delay: 200 + Math.random() * 1000,
      size: 16 + Math.random() * 14,
      fallDuration: 2000 + Math.random() * 1200,
    });
  }
  return particles;
}

// Rocket launch: emoji rockets shooting upward
function generateRockets(catTheme: CategoryTheme, count: number): RocketParticle[] {
  const rockets: RocketParticle[] = [];
  for (let i = 0; i < count; i++) {
    rockets.push({
      id: i,
      emoji: catTheme.confettiEmoji[i % catTheme.confettiEmoji.length],
      x: SW * 0.1 + Math.random() * SW * 0.8,
      delay: Math.random() * 1200,
      size: 18 + Math.random() * 14,
      speed: 1200 + Math.random() * 800,
    });
  }
  return rockets;
}

// Sword clash: sparks flying radially from center
function generateClashSparks(rarity: RarityTheme, count: number): ClashSpark[] {
  const sparks: ClashSpark[] = [];
  for (let i = 0; i < count; i++) {
    sparks.push({
      id: i,
      angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3,
      distance: 60 + Math.random() * 100,
      color: rarity.colors[i % rarity.colors.length],
      size: 4 + Math.random() * 5,
      delay: Math.random() * 200,
    });
  }
  return sparks;
}

// Star spiral: stars orbiting inward
function generateSpiralStars(catTheme: CategoryTheme, count: number): SpiralStar[] {
  const stars: SpiralStar[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      emoji: catTheme.confettiEmoji[i % catTheme.confettiEmoji.length],
      angle: (i / count) * Math.PI * 2,
      radius: 80 + Math.random() * 60,
      delay: i * 60,
      size: 14 + Math.random() * 12,
    });
  }
  return stars;
}

// Shockwave: expanding rings
function generateShockwaves(rarity: RarityTheme): ShockwaveRing[] {
  const rings: ShockwaveRing[] = [];
  const count = 2 + rarity.fireworkBursts;
  for (let i = 0; i < count; i++) {
    rings.push({
      id: i,
      delay: i * 350,
      color: rarity.colors[i % rarity.colors.length],
      maxRadius: 100 + i * 30,
    });
  }
  return rings;
}

// Ground burst: particles shooting upward from bottom
function generateGroundBurst(rarity: RarityTheme, count: number): GroundBurstParticle[] {
  const particles: GroundBurstParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: SW * 0.2 + Math.random() * SW * 0.6,
      color: rarity.colors[i % rarity.colors.length],
      size: 5 + Math.random() * 6,
      angle: -Math.PI / 2 + (Math.random() - 0.5) * 1.2,
      distance: 150 + Math.random() * 200,
      delay: Math.random() * 400,
    });
  }
  return particles;
}

// ── Animated sub-components ─────────────────────────────────────

// === SHARED: Confetti rain ===
function ConfettiView({ piece }: { piece: ConfettiPiece }) {
  const translateY = useSharedValue(-30);
  const translateX = useSharedValue(piece.x);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(piece.rotation);

  useEffect(() => {
    translateY.value = withDelay(
      piece.delay,
      withTiming(400, { duration: piece.fallDuration, easing: Easing.in(Easing.quad) }),
    );
    translateX.value = withDelay(
      piece.delay,
      withSequence(
        withTiming(piece.x + piece.swayAmount, { duration: piece.fallDuration / 3 }),
        withTiming(piece.x - piece.swayAmount * 0.6, { duration: piece.fallDuration / 3 }),
        withTiming(piece.x + piece.swayAmount * 0.3, { duration: piece.fallDuration / 3 }),
      ),
    );
    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + 720, { duration: piece.fallDuration }),
    );
    opacity.value = withDelay(piece.delay + piece.fallDuration * 0.7, withTiming(0, { duration: 400 }));
  }, []);

  const style = useAnimatedStyle(() => {
    const w = piece.size;
    const h = piece.shape === 'rect' ? piece.size * 2.5 : piece.size;
    const br = piece.shape === 'circle' ? piece.size / 2 : piece.shape === 'star' ? 1 : 2;
    return {
      position: 'absolute' as const,
      left: translateX.value - w / 2,
      top: translateY.value,
      width: w,
      height: h,
      borderRadius: br,
      backgroundColor: piece.color,
      opacity: opacity.value,
      transform: [{ rotate: `${rotate.value}deg` }],
    };
  });

  return <Animated.View style={style} />;
}

// === SHARED: Emoji falling ===
function EmojiView({ particle }: { particle: EmojiParticle }) {
  const translateY = useSharedValue(-40);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(particle.delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(
      particle.delay,
      withTiming(380, { duration: particle.fallDuration, easing: Easing.in(Easing.quad) }),
    );
    rotate.value = withDelay(
      particle.delay,
      withTiming(-15 + Math.random() * 30, { duration: particle.fallDuration }),
    );
    opacity.value = withDelay(particle.delay + particle.fallDuration * 0.65, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: particle.x - particle.size / 2,
    top: translateY.value,
    opacity: opacity.value,
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.Text style={[style, { fontSize: particle.size }]}>
      {particle.emoji}
    </Animated.Text>
  );
}

// === ROCKET LAUNCH: emoji shooting upward with exhaust trail ===
function RocketView({ rocket }: { rocket: RocketParticle }) {
  const translateY = useSharedValue(420);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(rocket.delay, withTiming(1, { duration: 100 }));
    translateY.value = withDelay(
      rocket.delay,
      withTiming(-60, { duration: rocket.speed, easing: Easing.out(Easing.cubic) }),
    );
    scale.value = withDelay(rocket.delay, withSequence(
      withSpring(1.3, { damping: 4 }),
      withTiming(0.8, { duration: rocket.speed * 0.5 }),
    ));
    opacity.value = withDelay(rocket.delay + rocket.speed * 0.7, withTiming(0, { duration: 300 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: rocket.x - rocket.size / 2,
    top: translateY.value,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[style, { fontSize: rocket.size }]}>
      {rocket.emoji}
    </Animated.Text>
  );
}

// Exhaust trail for rockets
function ExhaustTrail({ x, delay }: { x: number; delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(380);
  const scaleX = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(0.6, { duration: 100 }),
      withTiming(0, { duration: 600 }),
    ));
    translateY.value = withDelay(delay, withTiming(200, { duration: 600, easing: Easing.out(Easing.quad) }));
    scaleX.value = withDelay(delay, withSequence(
      withTiming(1.5, { duration: 300 }),
      withTiming(0.3, { duration: 300 }),
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: x - 3,
    top: translateY.value,
    width: 6,
    height: 40,
    borderRadius: 3,
    backgroundColor: '#FFA500',
    opacity: opacity.value,
    transform: [{ scaleX: scaleX.value }],
  }));

  return <Animated.View style={style} />;
}

// Speed lines for rocket launch effect
function SpeedLine({ index, delay }: { index: number; delay: number }) {
  const x = SW * 0.1 + Math.random() * SW * 0.8;
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50 + Math.random() * 300);
  const height = 20 + Math.random() * 40;

  useEffect(() => {
    opacity.value = withDelay(delay + index * 40, withSequence(
      withTiming(0.3, { duration: 80 }),
      withTiming(0, { duration: 200 }),
    ));
    translateY.value = withDelay(delay + index * 40,
      withTiming(translateY.value + 60, { duration: 250, easing: Easing.in(Easing.quad) }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: x,
    top: translateY.value,
    width: 2,
    height,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
    opacity: opacity.value,
  }));

  return <Animated.View style={style} />;
}

// === SWORD CLASH: sparks radiating from center impact ===
function ClashSparkView({ spark, cx, cy }: { spark: ClashSpark; cx: number; cy: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(spark.delay, withSequence(
      withTiming(1, { duration: 60 }),
      withDelay(300, withTiming(0, { duration: 250 })),
    ));
    progress.value = withDelay(spark.delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: cx + Math.cos(spark.angle) * spark.distance * progress.value - spark.size / 2,
    top: cy + Math.sin(spark.angle) * spark.distance * progress.value - spark.size / 2,
    width: spark.size,
    height: spark.size,
    borderRadius: spark.size / 2,
    backgroundColor: spark.color,
    opacity: opacity.value,
  }));

  return <Animated.View style={style} />;
}

// Clash flash in center
function ClashFlash({ cx, cy, delay, color }: { cx: number; cy: number; delay: number; color: string }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(0.9, { duration: 50 }),
      withTiming(0, { duration: 300 }),
    ));
    scale.value = withDelay(delay, withSpring(1.5, { damping: 6 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: cx - 35,
    top: cy - 35,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: color,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={style} />;
}

// Crossed swords appearing
function SwordCrossView({ cx, cy }: { cx: number; cy: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.2);
  const rotate = useSharedValue(-30);

  useEffect(() => {
    opacity.value = withDelay(50, withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(600, withTiming(0, { duration: 400 })),
    ));
    scale.value = withDelay(50, withSpring(1, { damping: 5, stiffness: 150 }));
    rotate.value = withDelay(50, withSpring(0, { damping: 8 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: cx - 25,
    top: cy - 25,
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return <Animated.Text style={[style, { fontSize: 50 }]}>⚔️</Animated.Text>;
}

// Lightning bolts for duel
function LightningBolt({ index, color, delay }: { index: number; color: string; delay: number }) {
  const x = SW * 0.15 + (index / 6) * SW * 0.7;
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay + index * 100, withSequence(
      withTiming(0.8, { duration: 40 }),
      withTiming(0, { duration: 150 }),
      withTiming(0.5, { duration: 40 }),
      withTiming(0, { duration: 200 }),
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: x,
    top: 20 + Math.random() * 80,
    opacity: opacity.value,
  }));

  return <Animated.Text style={[style, { fontSize: 30, color }]}>⚡</Animated.Text>;
}

// === STAR SPIRAL: stars orbiting inward ===
function SpiralStarView({ star, cx, cy }: { star: SpiralStar; cx: number; cy: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const starScale = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(star.delay, withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(800, withTiming(0, { duration: 400 })),
    ));
    progress.value = withDelay(star.delay, withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.cubic) }));
    starScale.value = withDelay(star.delay, withSequence(
      withSpring(1.2, { damping: 5 }),
      withTiming(0.4, { duration: 800 }),
    ));
  }, []);

  const style = useAnimatedStyle(() => {
    const currentAngle = star.angle + progress.value * Math.PI * 3;
    const currentRadius = star.radius * (1 - progress.value * 0.85);
    return {
      position: 'absolute' as const,
      left: cx + Math.cos(currentAngle) * currentRadius - star.size / 2,
      top: cy + Math.sin(currentAngle) * currentRadius - star.size / 2,
      opacity: opacity.value,
      transform: [{ scale: starScale.value }],
    };
  });

  return (
    <Animated.Text style={[style, { fontSize: star.size }]}>
      {star.emoji}
    </Animated.Text>
  );
}

// Glow pulse at center for team_quest
function GlowPulse({ cx, cy, color, delay }: { cx: number; cy: number; color: string; delay: number }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.25, { duration: 500 }),
        withTiming(0.05, { duration: 500 }),
      ),
      3,
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.3, { duration: 500, easing: Easing.out(Easing.quad) }),
        withTiming(0.8, { duration: 500, easing: Easing.in(Easing.quad) }),
      ),
      3,
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: cx - 60,
    top: cy - 60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: color,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={style} />;
}

// === SHOCKWAVE BURST: expanding rings + upward ground burst ===
function ShockwaveRingView({ ring, cx, cy }: { ring: ShockwaveRing; cx: number; cy: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(ring.delay, withSequence(
      withTiming(0.7, { duration: 100 }),
      withTiming(0, { duration: 600 }),
    ));
    scale.value = withDelay(ring.delay, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: cx - ring.maxRadius,
    top: cy - ring.maxRadius,
    width: ring.maxRadius * 2,
    height: ring.maxRadius * 2,
    borderRadius: ring.maxRadius,
    borderWidth: 3,
    borderColor: ring.color,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={style} />;
}

function GroundBurstView({ particle }: { particle: GroundBurstParticle }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(particle.delay, withSequence(
      withTiming(1, { duration: 80 }),
      withDelay(400, withTiming(0, { duration: 300 })),
    ));
    progress.value = withDelay(particle.delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => {
    const dx = Math.cos(particle.angle) * particle.distance * progress.value;
    const dy = Math.sin(particle.angle) * particle.distance * progress.value;
    return {
      position: 'absolute' as const,
      left: particle.x + dx - particle.size / 2,
      top: 380 + dy - particle.size / 2,
      width: particle.size,
      height: particle.size,
      borderRadius: particle.size / 2,
      backgroundColor: particle.color,
      opacity: opacity.value,
    };
  });

  return <Animated.View style={style} />;
}

// Central burst flash for challenge
function CentralFlash({ cx, cy, delay, color }: { cx: number; cy: number; delay: number; color: string }) {
  const scale = useSharedValue(0.1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(0.6, { duration: 80 }),
      withTiming(0, { duration: 400 }),
    ));
    scale.value = withDelay(delay, withTiming(2.5, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: cx - 40,
    top: cy - 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: color,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={style} />;
}

// ── Category-specific particle layers ───────────────────────────

function HomeworkParticles({ rarity, catTheme }: { rarity: RarityTheme; catTheme: CategoryTheme }) {
  const emojiCount = Math.round(rarity.confettiCount * 0.3);
  const confetti = useMemo(() => generateConfetti(rarity), []);
  const emojis = useMemo(() => generateEmoji(catTheme, emojiCount), []);
  return (
    <>
      {confetti.map((p) => <ConfettiView key={`c${p.id}`} piece={p} />)}
      {emojis.map((p) => <EmojiView key={`e${p.id}`} particle={p} />)}
    </>
  );
}

function RocketParticles({ rarity, catTheme }: { rarity: RarityTheme; catTheme: CategoryTheme }) {
  const count = Math.round(rarity.confettiCount * 0.4);
  const rockets = useMemo(() => generateRockets(catTheme, count), []);
  const speedLineCount = Math.round(rarity.confettiCount * 0.3);
  return (
    <>
      {Array.from({ length: speedLineCount }, (_, i) => (
        <SpeedLine key={`sl${i}`} index={i} delay={200} />
      ))}
      {rockets.map((r) => (
        <React.Fragment key={`r${r.id}`}>
          <ExhaustTrail x={r.x} delay={r.delay} />
          <RocketView rocket={r} />
        </React.Fragment>
      ))}
    </>
  );
}

function DuelParticles({ rarity }: { rarity: RarityTheme }) {
  const cx = SW / 2;
  const cy = 140;
  const sparkCount = rarity.confettiCount;
  const sparks = useMemo(() => generateClashSparks(rarity, sparkCount), []);
  const boltCount = Math.min(6, 2 + rarity.fireworkBursts * 2);
  return (
    <>
      <ClashFlash cx={cx} cy={cy} delay={0} color={rarity.glow} />
      <ClashFlash cx={cx} cy={cy} delay={500} color={rarity.colors[1] ?? rarity.glow} />
      <SwordCrossView cx={cx} cy={cy} />
      {sparks.map((s) => <ClashSparkView key={`cs${s.id}`} spark={s} cx={cx} cy={cy} />)}
      {Array.from({ length: boltCount }, (_, i) => (
        <LightningBolt key={`lb${i}`} index={i} color={rarity.glow} delay={100} />
      ))}
    </>
  );
}

function QuestParticles({ rarity, catTheme }: { rarity: RarityTheme; catTheme: CategoryTheme }) {
  const cx = SW / 2;
  const cy = 140;
  const starCount = Math.round(rarity.confettiCount * 0.4);
  const stars = useMemo(() => generateSpiralStars(catTheme, starCount), []);
  return (
    <>
      <GlowPulse cx={cx} cy={cy} color={rarity.glow} delay={0} />
      {stars.map((s) => <SpiralStarView key={`ss${s.id}`} star={s} cx={cx} cy={cy} />)}
    </>
  );
}

function ChallengeParticles({ rarity, catTheme }: { rarity: RarityTheme; catTheme: CategoryTheme }) {
  const cx = SW / 2;
  const cy = 160;
  const shockwaves = useMemo(() => generateShockwaves(rarity), []);
  const burstCount = Math.round(rarity.confettiCount * 0.5);
  const groundBurst = useMemo(() => generateGroundBurst(rarity, burstCount), []);
  const emojiCount = Math.round(rarity.confettiCount * 0.2);
  const emojis = useMemo(() => generateEmoji(catTheme, emojiCount), []);
  return (
    <>
      <CentralFlash cx={cx} cy={cy} delay={0} color={rarity.glow} />
      {shockwaves.map((r) => <ShockwaveRingView key={`sw${r.id}`} ring={r} cx={cx} cy={cy} />)}
      {groundBurst.map((p) => <GroundBurstView key={`gb${p.id}`} particle={p} />)}
      {emojis.map((p) => <EmojiView key={`e${p.id}`} particle={p} />)}
    </>
  );
}

// ── Main component ──────────────────────────────────────────────

interface BadgeCelebrationProps {
  badge: {
    icon: string;
    title: string;
    description: string;
    rarity: AchievementRarity;
    category?: AchievementCategory;
  };
  onDismiss: () => void;
}

export default function BadgeCelebration({ badge, onDismiss }: BadgeCelebrationProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const rarityTheme = RARITY_THEMES[badge.rarity];
  const catTheme = CATEGORY_THEMES[badge.category ?? 'homework'];

  const iconScale = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const bgEmojiOpacity = useSharedValue(0);
  const bgEmojiScale = useSharedValue(3);

  useEffect(() => {
    iconScale.value = withDelay(150, withSpring(1, { damping: 6, stiffness: 140 }));
    shimmer.value = withDelay(300, withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0.6, { duration: 600 }),
    ));
    bgEmojiOpacity.value = withDelay(100, withSequence(
      withTiming(0.15, { duration: 300 }),
      withTiming(0.04, { duration: 800 }),
    ));
    bgEmojiScale.value = withDelay(100, withSpring(1, { damping: 10 }));

    const timer = setTimeout(onDismiss, rarityTheme.duration);
    return () => clearTimeout(timer);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  const bgEmojiStyle = useAnimatedStyle(() => ({
    opacity: bgEmojiOpacity.value,
    transform: [{ scale: bgEmojiScale.value }],
  }));

  function renderParticles() {
    switch (catTheme.animation) {
      case 'rocket_launch':
        return <RocketParticles rarity={rarityTheme} catTheme={catTheme} />;
      case 'sword_clash':
        return <DuelParticles rarity={rarityTheme} />;
      case 'star_spiral':
        return <QuestParticles rarity={rarityTheme} catTheme={catTheme} />;
      case 'shockwave_burst':
        return <ChallengeParticles rarity={rarityTheme} catTheme={catTheme} />;
      case 'confetti_rain':
      default:
        return <HomeworkParticles rarity={rarityTheme} catTheme={catTheme} />;
    }
  }

  return (
    <View style={[styles.wrapper, { top: insets.top }]} pointerEvents="box-none">
      {/* Giant background emoji */}
      <Animated.Text style={[styles.bgEmoji, bgEmojiStyle]} pointerEvents="none">
        {catTheme.bgEmoji}
      </Animated.Text>

      {/* Particle layers */}
      <View style={styles.particleContainer} pointerEvents="none">
        {renderParticles()}
      </View>

      {/* Banner card */}
      <Animated.View
        entering={SlideInUp.springify().damping(12).stiffness(100)}
        exiting={SlideOutUp.duration(250)}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onDismiss}
          style={[
            styles.banner,
            {
              backgroundColor: theme.colors.card,
              borderColor: rarityTheme.glow,
              shadowColor: rarityTheme.glow,
            },
          ]}
        >
          {/* Glow accent line */}
          <Animated.View style={[styles.accentLine, shimmerStyle, { backgroundColor: rarityTheme.glow }]} />

          <Animated.View style={[styles.iconCircle, iconStyle, { backgroundColor: rarityTheme.glow + '20' }]}>
            <Text style={styles.icon}>{badge.icon}</Text>
          </Animated.View>

          <View style={styles.textBlock}>
            <View style={styles.labelRow}>
              <Text style={[styles.rarityLabel, { color: rarityTheme.glow }]}>{rarityTheme.label}</Text>
              <Text style={styles.categoryChip}>{catTheme.emoji} {catTheme.label}</Text>
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {badge.title}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {badge.description}
            </Text>
          </View>

          <Text style={styles.sparkle}>🎉</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 900,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bgEmoji: {
    position: 'absolute',
    fontSize: 160,
    alignSelf: 'center',
    top: 20,
  },
  particleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 420,
    overflow: 'hidden',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 26,
  },
  textBlock: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  rarityLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  categoryChip: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(128,128,128,0.7)',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 12,
    marginTop: 1,
  },
  sparkle: {
    fontSize: 24,
    marginLeft: 8,
  },
});
