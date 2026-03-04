import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { AchievementRarity } from '@/src/types';
import { mockAchievements } from '@/src/data/mockData';
import DevModePanel from './DevModePanel';
import BadgeCelebration from './BadgeCelebration';

const SAMPLE_BADGES: Record<AchievementRarity, { icon: string; title: string; description: string; rarity: AchievementRarity }> = {
  common: { icon: '🎯', title: 'Первый шаг', description: 'Сдайте первое домашнее задание', rarity: 'common' },
  rare: { icon: '⭐', title: 'Капитан команды', description: 'Станьте лидером в командном квесте', rarity: 'rare' },
  epic: { icon: '🔬', title: 'Учёный', description: 'Сдайте все лабораторные за четверть', rarity: 'epic' },
  legendary: { icon: '👑', title: 'Легенда школы', description: 'Серия 100 дней подряд', rarity: 'legendary' },
};

export default function DevModeOverlay() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [celebrationBadge, setCelebrationBadge] = useState<{
    icon: string; title: string; description: string; rarity: AchievementRarity;
  } | null>(null);
  const badgeQueueRef = useRef<typeof SAMPLE_BADGES[AchievementRarity][]>([]);

  const fabScale = useSharedValue(1);

  const handleOpen = useCallback(() => {
    fabScale.value = withSpring(0.85, { damping: 15 }, () => {
      fabScale.value = withSpring(1, { damping: 12 });
    });
    setModalVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleAwardBadge = useCallback((rarity: AchievementRarity) => {
    setCelebrationBadge(SAMPLE_BADGES[rarity]);
    setModalVisible(false);
  }, []);

  const handleAwardRandomBadge = useCallback(() => {
    const achWithEmoji = mockAchievements.filter((a) => a.icon);
    const randomAch = achWithEmoji[Math.floor(Math.random() * achWithEmoji.length)];
    setCelebrationBadge({
      icon: randomAch.icon,
      title: randomAch.title,
      description: randomAch.description,
      rarity: randomAch.rarity,
    });
    setModalVisible(false);
  }, []);

  const handleAwardBadgeSeries = useCallback(() => {
    const series = [
      SAMPLE_BADGES.common,
      SAMPLE_BADGES.rare,
      SAMPLE_BADGES.epic,
    ];
    badgeQueueRef.current = series.slice(1);
    setCelebrationBadge(series[0]);
    setModalVisible(false);
  }, []);

  const handleDismissCelebration = useCallback(() => {
    setCelebrationBadge(null);
    setTimeout(() => {
      if (badgeQueueRef.current.length > 0) {
        const next = badgeQueueRef.current.shift()!;
        setCelebrationBadge(next);
      }
    }, 300);
  }, []);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <>
      {/* FAB Button */}
      <Animated.View
        style={[
          styles.fabContainer,
          fabStyle,
          { bottom: insets.bottom + 90 },
        ]}
      >
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.accent }]}
          onPress={handleOpen}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>🔧</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Dev Mode Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleLeft}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Dev Mode
                </Text>
                <View style={[styles.devDot, { backgroundColor: '#EF4444' }]} />
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={[styles.closeBtn, { backgroundColor: theme.colors.surface }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.closeBtnText, { color: theme.colors.textSecondary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal Content */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <DevModePanel
              onAwardBadge={handleAwardBadge}
              onAwardRandomBadge={handleAwardRandomBadge}
              onAwardBadgeSeries={handleAwardBadgeSeries}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Badge Celebration Overlay */}
      {celebrationBadge && (
        <BadgeCelebration
          badge={celebrationBadge}
          onDismiss={handleDismissCelebration}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 900,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 22,
  },

  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  devDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
