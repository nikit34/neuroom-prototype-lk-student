import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { AchievementRarity } from '@/src/types';
import { mockAchievements } from '@/src/data/mockData';
import { useCelebrationStore } from '@/src/stores/celebrationStore';
import DevModePanel from './DevModePanel';

import { CelebrationItem } from '@/src/stores/celebrationStore';

const SAMPLE_BADGES: Record<AchievementRarity, CelebrationItem> = {
  common: { id: 'dev-common', icon: '🎯', title: 'Первый шаг', description: 'Сдайте первое домашнее задание', rarity: 'common', category: 'homework' },
  rare: { id: 'dev-rare', icon: '⭐', title: 'Капитан команды', description: 'Станьте лидером в командном квесте', rarity: 'rare', category: 'team_quest' },
  epic: { id: 'dev-epic', icon: '🔬', title: 'Учёный', description: 'Сдайте все лабораторные за четверть', rarity: 'epic', category: 'homework' },
  legendary: { id: 'dev-legendary', icon: '👑', title: 'Легенда пунктуальности', description: '50 заданий вовремя подряд', rarity: 'legendary', category: 'early_streak' },
};

const TAP_COUNT = 5;
const TAP_WINDOW_MS = 2000;

export default function DevModeOverlay() {
  const [visible, setVisible] = useState(false);
  const tapTimestamps = useRef<number[]>([]);

  const handleSecretTap = useCallback(() => {
    const now = Date.now();
    tapTimestamps.current = tapTimestamps.current.filter((t) => now - t < TAP_WINDOW_MS);
    tapTimestamps.current.push(now);
    if (tapTimestamps.current.length >= TAP_COUNT) {
      tapTimestamps.current = [];
      setVisible((v) => !v);
    }
  }, []);

  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const pushCelebration = useCelebrationStore((s) => s.push);

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
    pushCelebration(SAMPLE_BADGES[rarity]);
    setModalVisible(false);
  }, []);

  const handleAwardRandomBadge = useCallback(() => {
    const achWithEmoji = mockAchievements.filter((a) => a.icon);
    const randomAch = achWithEmoji[Math.floor(Math.random() * achWithEmoji.length)];
    pushCelebration({
      id: randomAch.id,
      icon: randomAch.icon,
      title: randomAch.title,
      description: randomAch.description,
      rarity: randomAch.rarity,
      category: randomAch.category,
    });
    setModalVisible(false);
  }, []);

  const handleAwardBadgeSeries = useCallback(() => {
    pushCelebration(SAMPLE_BADGES.common);
    pushCelebration(SAMPLE_BADGES.rare);
    pushCelebration(SAMPLE_BADGES.epic);
    setModalVisible(false);
  }, []);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <>
      {/* Invisible 5-tap zone in top-right corner to toggle dev mode */}
      <TouchableWithoutFeedback onPress={handleSecretTap}>
        <View style={[styles.secretZone, { top: insets.top }]} />
      </TouchableWithoutFeedback>

      {/* FAB Button */}
      {visible && (
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
      )}

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
              onClose={handleClose}
            />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  secretZone: {
    position: 'absolute',
    right: 0,
    width: 44,
    height: 44,
    zIndex: 999,
  },
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
