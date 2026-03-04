import React, { forwardRef } from 'react';
import LottieView from 'lottie-react-native';

export interface LottiePlayerRef {
  reset: () => void;
  play: () => void;
}

interface LottiePlayerProps {
  source: any;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  style?: any;
  colorFilters?: Array<{ keypath: string; color: string }>;
}

const LottiePlayer = forwardRef<LottiePlayerRef, LottiePlayerProps>(
  ({ source, autoPlay = true, loop = true, speed, style, colorFilters }, ref) => {
    return (
      <LottieView
        ref={ref as any}
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={style}
        colorFilters={colorFilters}
      />
    );
  },
);

LottiePlayer.displayName = 'LottiePlayer';
export default LottiePlayer;
