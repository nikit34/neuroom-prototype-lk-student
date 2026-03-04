import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  withSpring,
  Easing,
  runOnJS,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { AchievementRarity } from '@/src/types';

const { width: SW, height: SH } = Dimensions.get('window');

const RARITY_CONFIG: Record<AchievementRarity, {
  glow: string;
  label: string;
  particles: string[];
  ringColor: string;
}> = {
  common: {
    glow: '#10B981',
    label: 'ОБЫЧНЫЙ',
    particles: ['✨', '🌟', '⭐'],
    ringColor: '#10B981',
  },
  rare: {
    glow: '#3B82F6',
    label: 'РЕДКИЙ',
    particles: ['💎', '✨', '🔷', '💠'],
    ringColor: '#3B82F6',
  },
  epic: {
    glow: '#8B5CF6',
    label: 'ЭПИЧЕСКИЙ',
    particles: ['🔮', '💜', '✨', '⚡', '🌀'],
    ringColor: '#8B5CF6',
  },
  legendary: {
    glow: '#F59E0B',
    label: 'ЛЕГЕНДАРНЫЙ',
    particles: ['👑', '🔥', '💫', '⭐', '✨', '🌟'],
    ringColor: '#F59E0B',
  },
};

interface Particle {
  id: number;
  emoji: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  size: number;
  rotation: number;
}

function generateParticles(rarity: AchievementRarity): Particle[] {
  const config = RARITY_CONFIG[rarity];
  const count = rarity === 'legendary' ? 24 : rarity === 'epic' ? 18 : rarity === 'rare' ? 14 : 10;
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 120 + Math.random() * 140;
    particles.push({
      id: i,
      emoji: config.particles[i % config.particles.length],
      startX: SW / 2,
      startY: SH / 2 - 40,
      endX: SW / 2 + Math.cos(angle) * radius,
      endY: SH / 2 - 40 + Math.sin(angle) * radius,
      delay: i * 40,
      size: 16 + Math.random() * 20,
      rotation: Math.random() * 360,
    });
  }
  return particles;
}

function CelebrationParticle({ particle }: { particle: Particle }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(particle.delay, withTiming(1, { duration: 200 }));
    progress.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(1.1, { duration: 400 }),
      )
    );
    // Fade out
    opacity.value = withDelay(
      particle.delay + 800,
      withTiming(0, { duration: 400 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: particle.startX + (particle.endX - particle.startX) * progress.value - particle.size / 2,
    top: particle.startY + (particle.endY - particle.startY) * progress.value - particle.size / 2,
    opacity: opacity.value,
    transform: [
      { rotate: `${particle.rotation * progress.value}deg` },
      { scale: 1 - progress.value * 0.3 },
    ],
  }));

  return (
    <Animated.Text style={[style, { fontSize: particle.size }]}>
      {particle.emoji}
    </Animated.Text>
  );
}

interface BadgeCelebrationProps {
  badge: {
    icon: string;
    title: string;
    description: string;
    rarity: AchievementRarity;
  };
  onDismiss: () => void;
}

export default function BadgeCelebration({ badge, onDismiss }: BadgeCelebrationProps) {
  const theme = useAppTheme();
  const config = RARITY_CONFIG[badge.rarity];
  const particles = useMemo(() => generateParticles(badge.rarity), [badge.rarity]);

  // Animated values
  const iconScale = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(0.4);
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    // Background fade in
    bgOpacity.value = withTiming(1, { duration: 300 });

    // Ring expand
    ringScale.value = withDelay(100, withSpring(1, { damping: 8, stiffness: 100 }));
    ringOpacity.value = withDelay(100, withSequence(
      withTiming(0.8, { duration: 300 }),
      withTiming(0.3, { duration: 600 }),
    ));

    // Icon bounce in
    iconScale.value = withDelay(200, withSpring(1, { damping: 6, stiffness: 120 }));

    // Text fade in
    textOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));

    // Pulsing glow
    glowPulse.value = withDelay(400, withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.4, { duration: 800 }),
      ),
      -1,
      true
    ));
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const handleDismiss = () => {
    bgOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDismiss)();
    });
  };

  return (
    <Animated.View style={[styles.overlay, bgStyle]}>
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        {/* Glow background */}
        <Animated.View
          style={[
            styles.glow,
            glowStyle,
            { backgroundColor: config.glow },
          ]}
        />

        {/* Particles */}
        {particles.map((p) => (
          <CelebrationParticle key={p.id} particle={p} />
        ))}

        {/* Ring */}
        <Animated.View
          style={[
            styles.ring,
            ringStyle,
            { borderColor: config.ringColor },
          ]}
        />

        {/* Badge icon */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <Text style={styles.icon}>{badge.icon}</Text>
        </Animated.View>

        {/* Text */}
        <Animated.View style={[styles.textContainer, textStyle]}>
          <Text style={[styles.rarityLabel, { color: config.glow }]}>
            {config.label}
          </Text>
          <Text style={styles.title}>{badge.title}</Text>
          <Text style={styles.description}>{badge.description}</Text>
          <Text style={styles.tapHint}>Нажмите, чтобы закрыть</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 999,
  },
  touchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    top: SH / 2 - SW * 0.4 - 40,
    left: SW * 0.1,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    top: SH / 2 - 90 - 40,
    left: SW / 2 - 90,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 16,
  },
  rarityLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  tapHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 32,
  },
});
