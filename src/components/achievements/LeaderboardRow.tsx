import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import Avatar from '@/src/components/ui/Avatar';

interface LeaderboardRowProps {
  rank: number;
  name: string;
  points: number;
  avatarEmoji: string;
  isCurrentUser?: boolean;
  onPress?: () => void;
}

function getRankDecoration(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}

export default function LeaderboardRow({
  rank,
  name,
  points,
  avatarEmoji,
  isCurrentUser = false,
  onPress,
}: LeaderboardRowProps) {
  const theme = useAppTheme();

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  return (
    <Wrapper
      {...wrapperProps}
      style={[
        styles.container,
        {
          backgroundColor: isCurrentUser
            ? theme.colors.primary + '20'
            : theme.colors.card,
          borderColor: isCurrentUser ? theme.colors.primary : theme.colors.border,
          borderWidth: isCurrentUser ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, { color: theme.colors.text }]}>
          {getRankDecoration(rank) || `#${rank}`}
        </Text>
      </View>

      <Avatar emoji={avatarEmoji} size={36} backgroundColor={theme.colors.surface} />

      <Text
        style={[
          styles.name,
          {
            color: theme.colors.text,
            fontWeight: isCurrentUser ? '700' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {name}
        {isCurrentUser ? ' (Вы)' : ''}
      </Text>

      <Text style={[styles.points, { color: theme.colors.primary }]}>
        {points} очков
      </Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    marginRight: 10,
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
  points: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
});
