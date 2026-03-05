import React, { memo, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import RivePlayer, { RivePlayerRef } from './RivePlayer';
import { useAppTheme, useCurrentCharacter } from '@/src/hooks/useAppTheme';
import { getMascotState, getMascotStateLabel } from '@/src/utils/gradeHelpers';
import { RIVE_CONFIG } from '@/src/mascot/riveConfig';
import { MASCOT_RIVE_SOURCE } from '@/src/mascot/mascotAnimations';
import MascotHealthBar from './MascotHealthBar';
import { MascotState } from '@/src/types';

interface MascotProps {
  health?: number;
  size?: number;
  showHealthBar?: boolean;
  label?: string;
}

const { inputs } = RIVE_CONFIG;

function applyState(ref: RivePlayerRef, state: MascotState) {
  // Reset all booleans first
  ref.setBoolean(inputs.isChecking, false);
  ref.setBoolean(inputs.isHandsUp, false);

  switch (state) {
    case 'sick':
      ref.setBoolean(inputs.isChecking, true);
      ref.fire(inputs.trigFail);
      break;
    case 'sad':
      ref.setBoolean(inputs.isChecking, true);
      break;
    case 'neutral':
      // defaults — all off
      break;
    case 'happy':
      ref.fire(inputs.trigSuccess);
      break;
    case 'thriving':
      ref.setBoolean(inputs.isHandsUp, true);
      ref.fire(inputs.trigSuccess);
      break;
  }
}

function Mascot({ health, size = 120, showHealthBar, label }: MascotProps) {
  const theme = useAppTheme();
  const character = useCurrentCharacter();
  const riveRef = useRef<RivePlayerRef>(null);
  const prevStateRef = useRef<MascotState | null>(null);

  const state: MascotState = health != null ? getMascotState(health) : 'neutral';
  const stateLabel = label ?? (health != null ? getMascotStateLabel(state) : undefined);
  const shouldShowHealthBar = showHealthBar ?? (health != null);

  // Apply Rive state when health changes
  useEffect(() => {
    if (!riveRef.current) return;
    if (prevStateRef.current === state) return;
    prevStateRef.current = state;
    applyState(riveRef.current, state);
  }, [state]);

  // Visible area for the cropped mascot
  const visibleWidth = size * 1.5;
  const visibleHeight = size * 1.8;
  // Rive canvas is larger so we can crop out the background
  const canvasScale = 2.2;
  const canvasWidth = visibleWidth * canvasScale;
  const canvasHeight = visibleHeight * canvasScale;
  // Offset to center the character within the crop
  const offsetX = (canvasWidth - visibleWidth) / -2;
  const offsetY = (canvasHeight - visibleHeight) / -2.5;

  // Touch tracking → numLook
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (evt) => {
          const { locationX } = evt.nativeEvent;
          const normalized = Math.max(0, Math.min(100, (locationX / visibleWidth) * 100));
          riveRef.current?.setNumber(inputs.numLook, normalized);
        },
        onPanResponderRelease: () => {
          riveRef.current?.setNumber(inputs.numLook, 50);
        },
        onPanResponderTerminate: () => {
          riveRef.current?.setNumber(inputs.numLook, 50);
        },
      }),
    [visibleWidth],
  );

  return (
    <View style={styles.container}>
      <View
        {...panResponder.panHandlers}
        style={{
          width: visibleWidth,
          height: visibleHeight,
          overflow: 'hidden',
          borderRadius: 16,
        }}
      >
        <RivePlayer
          ref={riveRef}
          source={MASCOT_RIVE_SOURCE}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            marginLeft: offsetX,
            marginTop: offsetY,
          }}
        />
      </View>
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
