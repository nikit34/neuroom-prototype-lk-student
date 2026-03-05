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
}

const CATEGORY_THEMES: Record<AchievementCategory, CategoryTheme> = {
  homework: {
    label: 'ДОМАШКА',
    emoji: '📝',
    confettiEmoji: ['📝', '✏️', '📖', '🅰️', '💯'],
    sparkTrail: ['✨', '💫', '⭐'],
    bgEmoji: '📚',
  },
  streak: {
    label: 'СЕРИЯ',
    emoji: '🔥',
    confettiEmoji: ['🔥', '🔥', '💥', '⚡', '☄️'],
    sparkTrail: ['🔥', '💥', '✨'],
    bgEmoji: '🔥',
  },
  duel: {
    label: 'ДУЭЛЬ',
    emoji: '⚔️',
    confettiEmoji: ['⚔️', '🛡️', '🗡️', '💪', '🏅'],
    sparkTrail: ['⚡', '💫', '✨'],
    bgEmoji: '⚔️',
  },
  team_quest: {
    label: 'КВЕСТ',
    emoji: '🤝',
    confettiEmoji: ['🤝', '🏆', '🎯', '🧩', '🌟'],
    sparkTrail: ['🌟', '✨', '💫'],
    bgEmoji: '🏆',
  },
  challenge: {
    label: 'ИСПЫТАНИЕ',
    emoji: '🏋️',
    confettiEmoji: ['🏋️', '💎', '🎖️', '⚡', '🌀'],
    sparkTrail: ['💎', '✨', '💫'],
    bgEmoji: '💎',
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

// ── Particle types ──────────────────────────────────────────────

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

interface FireworkBurst {
  id: number;
  cx: number;
  cy: number;
  delay: number;
  sparks: FireworkSpark[];
}

interface FireworkSpark {
  id: number;
  angle: number;
  distance: number;
  color: string;
  size: number;
}

interface SparkTrailItem {
  id: number;
  emoji: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  size: number;
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

function generateFireworks(rarity: RarityTheme): FireworkBurst[] {
  const bursts: FireworkBurst[] = [];
  for (let b = 0; b < rarity.fireworkBursts; b++) {
    const cx = SW * 0.2 + Math.random() * SW * 0.6;
    const cy = 60 + Math.random() * 180;
    const sparkCount = 12 + Math.floor(Math.random() * 8);
    const sparks: FireworkSpark[] = [];
    for (let s = 0; s < sparkCount; s++) {
      sparks.push({
        id: s,
        angle: (s / sparkCount) * Math.PI * 2,
        distance: 40 + Math.random() * 60,
        color: rarity.colors[s % rarity.colors.length],
        size: 4 + Math.random() * 4,
      });
    }
    bursts.push({ id: b, cx, cy, delay: 400 + b * 700, sparks });
  }
  return bursts;
}

function generateSparkTrail(catTheme: CategoryTheme, count: number): SparkTrailItem[] {
  const items: SparkTrailItem[] = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    items.push({
      id: i,
      emoji: catTheme.sparkTrail[i % catTheme.sparkTrail.length],
      startX: SW / 2,
      startY: 120,
      endX: SW / 2 + side * (60 + Math.random() * 100),
      endY: 40 + Math.random() * 200,
      delay: 100 + i * 80,
      size: 14 + Math.random() * 10,
    });
  }
  return items;
}

// ── Animated sub-components ─────────────────────────────────────

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

function FireworkSparkView({ spark, cx, cy, delay }: { spark: FireworkSpark; cx: number; cy: number; delay: number }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(400, withTiming(0, { duration: 300 })),
    ));
    progress.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
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

function FireworkBurstView({ burst }: { burst: FireworkBurst }) {
  // Initial flash
  const flashOpacity = useSharedValue(0);
  useEffect(() => {
    flashOpacity.value = withDelay(burst.delay, withSequence(
      withTiming(0.8, { duration: 60 }),
      withTiming(0, { duration: 200 }),
    ));
  }, []);

  const flashStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: burst.cx - 30,
    top: burst.cy - 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    opacity: flashOpacity.value,
  }));

  return (
    <>
      <Animated.View style={flashStyle} />
      {burst.sparks.map((s) => (
        <FireworkSparkView key={s.id} spark={s} cx={burst.cx} cy={burst.cy} delay={burst.delay} />
      ))}
    </>
  );
}

function SparkTrailView({ item }: { item: SparkTrailItem }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(item.delay, withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(500, withTiming(0, { duration: 300 })),
    ));
    progress.value = withDelay(item.delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    scale.value = withDelay(item.delay, withSequence(
      withSpring(1.2, { damping: 6 }),
      withTiming(0.6, { duration: 400 }),
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: item.startX + (item.endX - item.startX) * progress.value - item.size / 2,
    top: item.startY + (item.endY - item.startY) * progress.value - item.size / 2,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[style, { fontSize: item.size }]}>
      {item.emoji}
    </Animated.Text>
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

  const emojiCount = Math.round(rarityTheme.confettiCount * 0.3);

  const confetti = useMemo(() => generateConfetti(rarityTheme), [badge.rarity]);
  const emojis = useMemo(() => generateEmoji(catTheme, emojiCount), [badge.category, badge.rarity]);
  const fireworks = useMemo(() => generateFireworks(rarityTheme), [badge.rarity]);
  const sparks = useMemo(() => generateSparkTrail(catTheme, rarityTheme.sparkCount), [badge.category, badge.rarity]);

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
    // Big background emoji flash
    bgEmojiOpacity.value = withDelay(100, withSequence(
      withTiming(0.15, { duration: 300 }),
      withTiming(0.04, { duration: 800 }),
    ));
    bgEmojiScale.value = withDelay(100, withSequence(
      withSpring(1, { damping: 10 }),
    ));

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

  return (
    <View style={[styles.wrapper, { top: insets.top }]} pointerEvents="box-none">
      {/* Giant background emoji */}
      <Animated.Text style={[styles.bgEmoji, bgEmojiStyle]} pointerEvents="none">
        {catTheme.bgEmoji}
      </Animated.Text>

      {/* Particle layers */}
      <View style={styles.particleContainer} pointerEvents="none">
        {confetti.map((p) => <ConfettiView key={`c${p.id}`} piece={p} />)}
        {emojis.map((p) => <EmojiView key={`e${p.id}`} particle={p} />)}
        {fireworks.map((b) => <FireworkBurstView key={`f${b.id}`} burst={b} />)}
        {sparks.map((s) => <SparkTrailView key={`s${s.id}`} item={s} />)}
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
