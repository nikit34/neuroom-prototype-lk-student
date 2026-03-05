import React, { memo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottiePlayer, { LottiePlayerRef } from './LottiePlayer';
import { useAppTheme, useCurrentCharacter } from '@/src/hooks/useAppTheme';
import { getMascotState, getMascotStateLabel } from '@/src/utils/gradeHelpers';
import { MASCOT_LOTTIE_SOURCES, emotionToAnimationState, getArchetype, STATE_SPEED } from '@/src/mascot/mascotAnimations';
import { stateToEmotion } from '@/src/mascot/mascotConfig';
import MascotHealthBar from './MascotHealthBar';
import { MascotEmotion, MascotState } from '@/src/types';

interface MascotProps {
  emotion?: MascotEmotion;
  health?: number;
  size?: number;
  showHealthBar?: boolean;
  label?: string;
  compact?: boolean;
}

function Mascot({ emotion, health, size = 120, showHealthBar, label, compact }: MascotProps) {
  const theme = useAppTheme();
  const character = useCurrentCharacter();
  const lottieRef = useRef<LottiePlayerRef>(null);

  const resolvedEmotion: MascotEmotion = emotion ?? (
    health != null ? stateToEmotion(getMascotState(health)) : 'neutral'
  );
  const resolvedState: MascotState = emotionToAnimationState(resolvedEmotion);
  const archetype = getArchetype(character.id);
  const speed = STATE_SPEED[resolvedState];

  const state = health != null ? getMascotState(health) : undefined;
  const stateLabel = label ?? (state ? getMascotStateLabel(state) : undefined);
  const shouldShowHealthBar = showHealthBar ?? (health != null);

  useEffect(() => {
    lottieRef.current?.reset();
    lottieRef.current?.play();
  }, [resolvedState, archetype]);

  const lottieW = size * 1.5;
  const lottieH = size * 1.8;

  if (compact) {
    return (
      <View style={[styles.container, { paddingVertical: 0 }]}>
        <LottiePlayer
          ref={lottieRef}
          source={MASCOT_LOTTIE_SOURCES[archetype]}
          autoPlay
          loop
          speed={speed}
          style={{ width: lottieW, height: lottieH }}
          colorFilters={[{ keypath: 'body', color: theme.colors.primary }]}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LottiePlayer
        ref={lottieRef}
        source={MASCOT_LOTTIE_SOURCES[archetype]}
        autoPlay
        loop
        speed={speed}
        style={{ width: lottieW, height: lottieH }}
        colorFilters={[{ keypath: 'body', color: theme.colors.primary }]}
      />
      <Text style={[styles.characterName, { color: theme.colors.text }]}>
        {character.name}
      </Text>
      {stateLabel && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {stateLabel}
        </Text>
      )}
      {shouldShowHealthBar && health != null && (
        <View style={styles.healthBarWrapper}>
          <MascotHealthBar health={health} />
        </View>
      )}
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
