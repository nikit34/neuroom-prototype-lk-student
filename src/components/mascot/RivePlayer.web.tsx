import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, ViewStyle } from 'react-native';

export interface RivePlayerRef {
  setBoolean: (name: string, value: boolean) => void;
  setNumber: (name: string, value: number) => void;
  fire: (name: string) => void;
  reset: () => void;
  play: () => void;
}

interface RivePlayerProps {
  source: number;
  style?: ViewStyle;
}

const RivePlayer = forwardRef<RivePlayerRef, RivePlayerProps>(
  ({ style }, ref) => {
    useImperativeHandle(ref, () => ({
      setBoolean() {},
      setNumber() {},
      fire() {},
      reset() {},
      play() {},
    }));

    const width = (style as any)?.width ?? 180;
    const height = (style as any)?.height ?? 216;

    return (
      <View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Text style={{ fontSize: Math.min(width, height) * 0.5 }}>🧸</Text>
      </View>
    );
  },
);

RivePlayer.displayName = 'RivePlayer';
export default RivePlayer;
