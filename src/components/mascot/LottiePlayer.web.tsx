import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View } from 'react-native';

export interface LottiePlayerRef {
  reset: () => void;
  play: () => void;
}

interface LottiePlayerProps {
  source: any;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
  colorFilters?: Array<{ keypath: string; color: string }>;
}

// Placeholder body color in Lottie files: rgb(114,197,242) → [0.447, 0.773, 0.949]
const BODY_COLOR_PLACEHOLDER = [114 / 255, 197 / 255, 242 / 255];
const COLOR_TOLERANCE = 0.02;

function colorsMatch(a: number[], b: number[]): boolean {
  if (!a || !b || a.length < 3 || b.length < 3) return false;
  return Math.abs(a[0] - b[0]) < COLOR_TOLERANCE &&
         Math.abs(a[1] - b[1]) < COLOR_TOLERANCE &&
         Math.abs(a[2] - b[2]) < COLOR_TOLERANCE;
}

function applyColorFilters(data: any, filters: Array<{ keypath: string; color: string }>): any {
  if (!filters || filters.length === 0) return data;

  const clone = JSON.parse(JSON.stringify(data));
  for (const filter of filters) {
    const hex = filter.color;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    // Replace only fills matching the placeholder body color across all layers
    for (const layer of clone.layers || []) {
      replaceMatchingColors(layer.shapes || [], [r, g, b, 1]);
    }
  }
  return clone;
}

function replaceMatchingColors(shapes: any[], color: number[]) {
  for (const shape of shapes) {
    if (shape.ty === 'fl' && shape.c) {
      const k = shape.c.k;
      if (Array.isArray(k) && colorsMatch(k, BODY_COLOR_PLACEHOLDER)) {
        shape.c.k = color;
      }
    }
    if (shape.ty === 'gr' && shape.it) {
      replaceMatchingColors(shape.it, color);
    }
  }
}

const CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';

let loadPromise: Promise<any> | null = null;

function loadLottieFromCDN(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if ((window as any).lottie) return Promise.resolve((window as any).lottie);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CDN_URL;
    script.onload = () => resolve((window as any).lottie);
    script.onerror = () => reject(new Error('Failed to load lottie-web from CDN'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

const LottiePlayer = forwardRef<LottiePlayerRef, LottiePlayerProps>(
  ({ source, autoPlay = true, loop = true, style, colorFilters }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        animRef.current?.goToAndStop(0, true);
      },
      play: () => {
        animRef.current?.goToAndPlay(0, true);
      },
    }));

    useEffect(() => {
      if (typeof document === 'undefined' || !containerRef.current) return;

      let cancelled = false;

      loadLottieFromCDN().then((lottie) => {
        if (cancelled || !containerRef.current || !lottie) return;

        animRef.current?.destroy();

        const data = applyColorFilters(source, colorFilters || []);

        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay: autoPlay,
          animationData: data,
        });
      }).catch((err) => {
        console.warn('[LottiePlayer.web] CDN load failed:', err);
      });

      return () => {
        cancelled = true;
        animRef.current?.destroy();
        animRef.current = null;
      };
    }, [source, loop, autoPlay, JSON.stringify(colorFilters)]);

    const width = style?.width ?? 180;
    const height = style?.height ?? 216;

    return (
      <View style={[{ width, height, overflow: 'hidden' }, style]}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </View>
    );
  },
);

LottiePlayer.displayName = 'LottiePlayer';
export default LottiePlayer;
