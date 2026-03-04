import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAchievementStore } from '@/src/stores/achievementStore';
import Card from '@/src/components/ui/Card';
import Badge from '@/src/components/ui/Badge';
import ProgressBar from '@/src/components/ui/ProgressBar';
import { AchievementRarity, AchievementCategory } from '@/src/types';
import { formatDateRu } from '@/src/utils/dateHelpers';

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: 'Обычная',
  rare: 'Редкая',
  epic: 'Эпическая',
  legendary: 'Легендарная',
};

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  streak: 'Серия',
  team_quest: 'Командный квест',
  challenge: 'Испытание',
  duel: 'Дуэль',
};

const CATEGORY_EMOJI: Record<AchievementCategory, string> = {
  streak: '🔥',
  team_quest: '👥',
  challenge: '🎯',
  duel: '⚔️',
};

export default function AchievementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const achievements = useAchievementStore((s) => s.achievements);
  const achievement = achievements.find((a) => a.id === id);

  if (!achievement) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Достижение не найдено
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const rarityColor = RARITY_COLORS[achievement.rarity];
  const isUnlocked = !achievement.isLocked;
  const isComplete = achievement.progress >= 100;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: rarityColor + '20',
              borderColor: rarityColor,
            },
          ]}
        >
          <Text style={[styles.icon, !isUnlocked && styles.lockedIcon]}>
            {achievement.icon}
          </Text>
          {!isUnlocked && <Text style={styles.lockOverlay}>🔒</Text>}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {achievement.title}
        </Text>

        {/* Rarity Badge */}
        <View style={styles.badgeRow}>
          <Badge text={RARITY_LABELS[achievement.rarity]} color={rarityColor} />
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {achievement.description}
        </Text>

        {/* Progress */}
        {!isComplete && (
          <Card style={styles.progressCard}>
            <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
              Прогресс
            </Text>
            <ProgressBar
              progress={achievement.progress}
              color={rarityColor}
              height={10}
              showLabel
            />
          </Card>
        )}

        {/* Category */}
        <Card style={styles.infoCard}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
            Категория
          </Text>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryEmoji}>
              {CATEGORY_EMOJI[achievement.category]}
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {CATEGORY_LABELS[achievement.category]}
            </Text>
          </View>
        </Card>

        {/* Unlock date */}
        {isUnlocked && achievement.unlockedAt && (
          <Card style={styles.infoCard}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Дата получения
            </Text>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryEmoji}>🗓️</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {formatDateRu(achievement.unlockedAt)}
              </Text>
            </View>
          </Card>
        )}

        {/* Status */}
        <Card style={styles.statusCard}>
          {isComplete && isUnlocked ? (
            <View style={styles.statusContent}>
              <Text style={styles.statusEmoji}>🎉</Text>
              <Text style={[styles.statusText, { color: theme.colors.success }]}>
                Получено!
              </Text>
            </View>
          ) : (
            <View style={styles.statusContent}>
              <Text style={styles.statusEmoji}>🔒</Text>
              <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
                Ещё не получено. Продолжай стараться!
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  content: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
    position: 'relative',
  },
  icon: {
    fontSize: 56,
  },
  lockedIcon: {
    opacity: 0.3,
  },
  lockOverlay: {
    position: 'absolute',
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  progressCard: {
    width: '100%',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoCard: {
    width: '100%',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  statusCard: {
    width: '100%',
    marginTop: 8,
  },
  statusContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
