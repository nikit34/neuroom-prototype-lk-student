import { PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';

const SENSITIVITY = 0.01; // radians per pixel

export interface RotationState {
  y: number;
}

export function createRotationPanResponder(
  rotationRef: { current: RotationState },
  onRotationChange: (y: number) => void,
) {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_e: GestureResponderEvent, gs: PanResponderGestureState) => {
      // Only capture horizontal swipes (don't conflict with ScrollView)
      return Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 && Math.abs(gs.dx) > 5;
    },
    onPanResponderMove: (_e: GestureResponderEvent, gs: PanResponderGestureState) => {
      const newY = rotationRef.current.y + gs.dx * SENSITIVITY;
      rotationRef.current.y = newY;
      onRotationChange(newY);
    },
    onPanResponderRelease: () => {
      // Rotation persists
    },
  });
}
