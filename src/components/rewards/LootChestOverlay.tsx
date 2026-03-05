import React, { useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useRewardStore } from '@/src/stores/rewardStore';

const AUTO_DISMISS_MS = 3500;

export default function LootChestOverlay() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const pendingChest = useRewardStore((s) => s.pendingChest);
  const dismissChest = useRewardStore((s) => s.dismissChest);

  useEffect(() => {
    if (!pendingChest) return;
    const timer = setTimeout(dismissChest, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [pendingChest]);

  if (!pendingChest) return null;

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(14)}
      exiting={SlideOutUp.duration(250)}
      style={[styles.container, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}
        onPress={dismissChest}
        activeOpacity={0.9}
      >
        <Text style={styles.icon}>🎁</Text>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Сундук с наградой!{' '}
          <Text style={[styles.amount, { color: theme.colors.primary }]}>
            +{pendingChest.amount} XP
          </Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 850,
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  icon: {
    fontSize: 24,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  amount: {
    fontWeight: '800',
  },
});
