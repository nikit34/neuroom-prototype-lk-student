import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAgeStyles } from '@/src/hooks/useAgeStyles';
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
  const age = useAgeStyles();

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
          padding: age.isJunior ? 14 : 12,
          borderRadius: age.cardBorderRadius,
        },
      ]}
    >
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, { color: theme.colors.text, fontSize: age.isJunior ? 19 : 16 }]}>
          {getRankDecoration(rank) || `#${rank}`}
        </Text>
      </View>

      <Avatar emoji={avatarEmoji} size={age.isJunior ? 42 : 36} backgroundColor={theme.colors.surface} />

      <Text
        style={[
          styles.name,
          {
            color: theme.colors.text,
            fontWeight: isCurrentUser ? '700' : '500',
            fontSize: age.isJunior ? 17 : 15,
          },
        ]}
        numberOfLines={1}
      >
        {name}
        {isCurrentUser ? ' (Вы)' : ''}
      </Text>

      <Text style={[styles.points, { color: theme.colors.primary, fontSize: age.isJunior ? 16 : 14 }]}>
        {points} очков
      </Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    marginRight: 10,
  },
  rank: {
    fontWeight: '700',
  },
  name: {
    flex: 1,
    marginLeft: 10,
  },
  points: {
    fontWeight: '700',
    marginLeft: 8,
  },
});
