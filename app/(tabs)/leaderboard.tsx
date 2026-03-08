import React, { useRef, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { mockClassmates } from '@/src/data/mockData';
import LeaderboardRow from '@/src/components/achievements/LeaderboardRow';
import ThemeBackground from '@/src/components/theme/ThemeBackground';

const ROW_HEIGHT = 60 + 8;

export default function LeaderboardScreen() {
  const theme = useAppTheme();
  const student = useStudentStore((s) => s.student);
  const [tipVisible, setTipVisible] = useState(false);
  const leaderboardRef = useRef<FlatList>(null);

  const leaderboard = useMemo(() => {
    const all = [
      ...mockClassmates
        .filter((c) => c.id !== student.id)
        .map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          totalPoints: c.totalPoints,
          avatarEmoji: c.avatarEmoji,
          isCurrentUser: false,
        })),
      {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        totalPoints: student.totalPoints,
        avatarEmoji: '🐺',
        isCurrentUser: true,
      },
    ];
    return all.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [student.totalPoints, student.firstName, student.lastName, student.id]);

  const currentUserIndex = leaderboard.findIndex((e) => e.isCurrentUser);

  const scrollToStudent = useCallback(() => {
    if (currentUserIndex >= 0 && leaderboardRef.current) {
      leaderboardRef.current.scrollToIndex({
        index: currentUserIndex,
        viewPosition: 0.5,
        animated: false,
      });
    }
  }, [currentUserIndex]);

  const tip = useMemo(() => {
    if (currentUserIndex <= 0) return 'Вы на первом месте! Продолжайте в том же духе!';
    const above = leaderboard[currentUserIndex - 1];
    const gap = above.totalPoints - student.totalPoints;
    const hints = [
      `До ${above.name.split(' ')[0]} — всего ${gap} очков. Сдайте ДЗ пораньше для бонуса!`,
      `Не хватает ${gap} очков до ${currentUserIndex}-го места. Выполняйте задания вовремя!`,
      `${gap} очков отделяют вас от ${above.name.split(' ')[0]}. Серия ДЗ вовремя даст множитель!`,
    ];
    return hints[currentUserIndex % hints.length];
  }, [currentUserIndex, leaderboard, student.totalPoints]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ThemeBackground />
      <View style={styles.container}>
        <Text style={[styles.header, { color: theme.colors.text }]}>Рейтинг</Text>

        <FlatList
          ref={leaderboardRef}
          data={leaderboard}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, index) => ({
            length: ROW_HEIGHT,
            offset: ROW_HEIGHT * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              leaderboardRef.current?.scrollToIndex({
                index: info.index,
                viewPosition: 0.5,
                animated: false,
              });
            }, 100);
          }}
          renderItem={({ item, index }) => (
            <>
              <LeaderboardRow
                rank={index + 1}
                name={item.name}
                points={item.totalPoints}
                avatarEmoji={item.avatarEmoji}
                isCurrentUser={item.isCurrentUser}
                onPress={item.isCurrentUser ? () => setTipVisible((v) => !v) : undefined}
              />
              {item.isCurrentUser && tipVisible && (
                <TouchableOpacity
                  style={[styles.tipCard, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]}
                  onPress={() => setTipVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tipText, { color: theme.colors.text }]}>{tip}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          onLayout={scrollToStudent}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { fontSize: 26, fontWeight: '700', marginTop: 16, marginBottom: 12 },
  list: { paddingBottom: 100 },
  tipCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  tipText: { fontSize: 14, lineHeight: 20 },
});
