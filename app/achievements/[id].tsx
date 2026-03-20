import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAchievementStore } from '@/src/stores/achievementStore';
import { useStudentStore } from '@/src/stores/studentStore';
import Card from '@/src/components/ui/Card';
import Badge from '@/src/components/ui/Badge';
import ProgressBar from '@/src/components/ui/ProgressBar';
import { AchievementRarity, AchievementCategory, AchievementSource, AchievementTier } from '@/src/types';
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

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};

const TIER_LABELS: Record<string, string> = {
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
};

const TIER_EMOJI: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
};

const TIERS_ORDERED: AchievementTier[] = ['bronze', 'silver', 'gold'];

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  early_streak: 'Ранняя сдача',
  team_quest: 'Командный квест',
  challenge: 'Испытание',
  duel: 'Дуэль',
  homework: 'Домашнее задание',
};

const CATEGORY_EMOJI: Record<AchievementCategory, string> = {
  early_streak: '🚀',
  team_quest: '👥',
  challenge: '🎯',
  duel: '⚔️',
  homework: '📝',
};

function SourceCard({ source, theme }: { source: AchievementSource; theme: ReturnType<typeof useAppTheme> }) {
  const router = useRouter();

  switch (source.type) {
    case 'homework':
      return (
        <Card style={styles.sourceCard}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
            Как получено
          </Text>
          <View style={styles.sourceRow}>
            <Text style={styles.sourceEmoji}>📝</Text>
            <Text style={[styles.sourceTitle, { color: theme.colors.text }]}>
              {source.homeworkTitle}
            </Text>
          </View>
          <Text style={[styles.sourceSubject, { color: theme.colors.textSecondary }]}>
            {source.subject}
          </Text>
          {source.grade != null && source.maxGrade != null && (
            <View style={[styles.gradeRow, { backgroundColor: theme.colors.success + '15' }]}>
              <Text style={[styles.gradeText, { color: theme.colors.success }]}>
                Оценка: {source.grade}/{source.maxGrade}
              </Text>
            </View>
          )}
          <Text style={[styles.sourceSummary, { color: theme.colors.text }]}>
            {source.solutionSummary}
          </Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push(`/homework/${source.homeworkId}` as any)}
          >
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              Посмотреть задание →
            </Text>
          </TouchableOpacity>
        </Card>
      );

    case 'early_streak':
      return (
        <Card style={styles.sourceCard}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
            Как получено
          </Text>
          <View style={styles.sourceRow}>
            <Text style={styles.sourceEmoji}>🚀</Text>
            <Text style={[styles.sourceTitle, { color: theme.colors.text }]}>
              {source.earlyCount} вовремя подряд
            </Text>
          </View>
          <Text style={[styles.sourceSummary, { color: theme.colors.text }]}>
            {source.description}
          </Text>
        </Card>
      );

    case 'duel':
      return (
        <Card style={styles.sourceCard}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
            Как получено
          </Text>
          <View style={styles.sourceRow}>
            <Text style={styles.sourceEmoji}>⚔️</Text>
            <Text style={[styles.sourceTitle, { color: theme.colors.text }]}>
              {source.result}
            </Text>
          </View>
          <Text style={[styles.sourceSubject, { color: theme.colors.textSecondary }]}>
            {source.subject}
          </Text>
          <View style={styles.sourceRow}>
            <Text style={styles.sourceEmoji}>👤</Text>
            <Text style={[styles.sourceSummary, { color: theme.colors.text }]}>
              Противник: {source.opponentName}
            </Text>
          </View>
        </Card>
      );

    case 'quest':
      return (
        <Card style={styles.sourceCard}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
            Как получено
          </Text>
          <View style={styles.sourceRow}>
            <Text style={styles.sourceEmoji}>🗺️</Text>
            <Text style={[styles.sourceTitle, { color: theme.colors.text }]}>
              {source.questTitle}
            </Text>
          </View>
          <Text style={[styles.sourceSummary, { color: theme.colors.text }]}>
            {source.description}
          </Text>
          {source.teamMembers && source.teamMembers.length > 0 && (
            <View style={styles.teamSection}>
              <Text style={[styles.teamLabel, { color: theme.colors.textSecondary }]}>
                Команда:
              </Text>
              {source.teamMembers.map((name, i) => (
                <View key={i} style={styles.teamMemberRow}>
                  <Text style={[styles.teamMemberText, { color: theme.colors.text }]}>
                    👤 {name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      );
  }
}

export default function AchievementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const achievements = useAchievementStore((s) => s.achievements);
  const student = useStudentStore((s) => s.student);
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

  const handleShare = async () => {
    const tierText = achievement.tier ? ` (${TIER_LABELS[achievement.tier]})` : '';
    const rarityText = RARITY_LABELS[achievement.rarity];
    const categoryText = `${CATEGORY_EMOJI[achievement.category]} ${CATEGORY_LABELS[achievement.category]}`;
    const studentName = `${student.firstName} ${student.lastName}`;
    const classLabel = student.classId || `${student.grade} класс`;
    const link = `https://neuroom.app/achievements/${achievement.id}`;

    const message = [
      `${achievement.icon} Новая ачивка получена!`,
      '',
      `${achievement.title}${tierText}`,
      `${rarityText} | ${categoryText}`,
      '',
      achievement.description,
      '',
      `${studentName}, ${classLabel}`,
      '',
      link,
      '',
      '#neuroom #достижение',
    ].join('\n');

    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message, url: link }
          : { message, title: `${achievement.icon} ${achievement.title}` },
      );
    } catch (_) {
      // user cancelled
    }
  };

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

        {/* Tier progress */}
        {achievement.tierThresholds && (
          <Card style={styles.tierCard}>
            <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
              Степени
            </Text>
            {TIERS_ORDERED.map((tier) => {
              const threshold = achievement.tierThresholds![tier];
              const reached = achievement.progress >= threshold;
              const isCurrent = achievement.tier === tier;
              return (
                <View
                  key={tier}
                  style={[
                    styles.tierRow,
                    isCurrent && { backgroundColor: TIER_COLORS[tier] + '15', borderRadius: 10 },
                  ]}
                >
                  <Text style={styles.tierRowEmoji}>{TIER_EMOJI[tier]}</Text>
                  <View style={styles.tierRowInfo}>
                    <Text style={[
                      styles.tierRowLabel,
                      { color: reached ? TIER_COLORS[tier] : theme.colors.textSecondary },
                    ]}>
                      {TIER_LABELS[tier]}
                    </Text>
                    <View style={styles.tierBarWrap}>
                      <ProgressBar
                        progress={Math.min(100, (achievement.progress / threshold) * 100)}
                        color={reached ? TIER_COLORS[tier] : theme.colors.border}
                        height={6}
                      />
                    </View>
                  </View>
                  <Text style={[
                    styles.tierRowPct,
                    { color: reached ? TIER_COLORS[tier] : theme.colors.textSecondary },
                  ]}>
                    {reached ? '✓' : `${threshold}%`}
                  </Text>
                </View>
              );
            })}
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

        {/* Source */}
        {isUnlocked && achievement.source && (
          <SourceCard source={achievement.source} theme={theme} />
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

        {/* Share button */}
        {isUnlocked && (
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Text style={styles.shareBtnText}>Поделиться</Text>
          </TouchableOpacity>
        )}
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
  tierCard: {
    width: '100%',
    marginBottom: 16,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  tierRowEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  tierRowInfo: {
    flex: 1,
  },
  tierRowLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  tierBarWrap: {
    width: '100%',
  },
  tierRowPct: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
    minWidth: 36,
    textAlign: 'right',
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
  sourceCard: {
    width: '100%',
    marginBottom: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sourceEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  sourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  sourceSubject: {
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 26,
  },
  gradeRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sourceSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  linkRow: {
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  teamSection: {
    marginTop: 8,
  },
  teamLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamMemberRow: {
    marginLeft: 4,
    marginBottom: 2,
  },
  teamMemberText: {
    fontSize: 14,
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
  shareBtn: {
    width: '100%',
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
