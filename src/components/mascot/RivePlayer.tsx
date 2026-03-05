import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { RIVE_CONFIG } from '@/src/mascot/riveConfig';

let RiveComponent: any = null;
let RiveFit: any = null;
let hasNativeModule = false;

try {
  const rive = require('rive-react-native');
  RiveComponent = rive.default;
  RiveFit = rive.Fit;
  hasNativeModule = true;
} catch {
  // rive-react-native not available (Expo Go) — will use fallback
}

export { hasNativeModule as hasRive };

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
  ({ source, style }, ref) => {
    const riveRef = useRef<any>(null);
    const sm = RIVE_CONFIG.stateMachineName;

    useImperativeHandle(ref, () => ({
      setBoolean(name: string, value: boolean) {
        if (sm) riveRef.current?.setInputState?.(sm, name, value);
      },
      setNumber(name: string, value: number) {
        if (sm) riveRef.current?.setInputState?.(sm, name, value);
      },
      fire(name: string) {
        if (sm) riveRef.current?.fireState?.(sm, name);
      },
      reset() {
        riveRef.current?.reset?.();
      },
      play() {
        riveRef.current?.play?.();
      },
    }));

    if (!hasNativeModule) {
      const width = (style as any)?.width ?? 180;
      const height = (style as any)?.height ?? 216;
      return (
        <View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
          <Text style={{ fontSize: Math.min(width, height) * 0.5 }}>🧸</Text>
        </View>
      );
    }

    return (
      <RiveComponent
        ref={riveRef}
        source={source}
        artboardName={RIVE_CONFIG.artboardName}
        stateMachineName={sm}
        autoplay
        fit={RiveFit.Contain}
        style={style}
        onError={(e: any) => console.warn('[RivePlayer]', e?.nativeEvent ?? e)}
      />
    );
  },
);

RivePlayer.displayName = 'RivePlayer';
export default RivePlayer;
