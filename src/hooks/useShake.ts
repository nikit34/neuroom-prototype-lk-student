import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

const SHAKE_THRESHOLD = 1.8;
const COOLDOWN_MS = 1000;

export function useShake(onShake: () => void) {
  const lastShake = useRef(0);
  const callbackRef = useRef(onShake);
  callbackRef.current = onShake;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (magnitude > SHAKE_THRESHOLD && now - lastShake.current > COOLDOWN_MS) {
        lastShake.current = now;
        callbackRef.current();
      }
    });

    return () => subscription.remove();
  }, []);
}
