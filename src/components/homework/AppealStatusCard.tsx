import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { Appeal } from '@/src/types';

interface AppealStatusCardProps {
  appeal: Appeal;
}

export default function AppealStatusCard({ appeal }: AppealStatusCardProps) {
  const theme = useAppTheme();

  // Pending
  if (appeal.status === 'pending') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={styles.pendingRow}>
          <ActivityIndicator size="small" color="#FFB912" />
          <Text style={[styles.pendingText, { color: theme.colors.textSecondary }]}>
            Проверяем
          </Text>
        </View>
        <Text style={[styles.pendingHint, { color: theme.colors.textSecondary }]}>
          Учитель рассмотрит обращение в течение 72 часов
        </Text>
      </View>
    );
  }

  // Decision states
  const isAccepted = appeal.status === 'accepted';
  const isRejected = appeal.status === 'rejected';
  const isMixed = appeal.status === 'mixed';

  if (!isAccepted && !isRejected && !isMixed) return null;

  const bgColor = isAccepted ? '#E6F9F0' : isRejected ? '#FFF9E6' : '#F3EEFF';
  const borderColor = isAccepted ? '#B3E5D1' : isRejected ? '#FFE5B3' : '#D3C5FF';
  const titleText = isAccepted
    ? 'Оценку изменили'
    : isRejected
      ? 'Оценка без изменений'
      : 'Решение частично принято';
  const iconText = isAccepted ? '✓' : isRejected ? '📝' : '◐';
  const iconColor = isAccepted ? '#10B981' : isRejected ? '#FFB912' : theme.colors.primary;

  return (
    <View style={[styles.decisionContainer, { backgroundColor: bgColor, borderColor }]}>
      {/* Header */}
      <View style={styles.decisionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.decisionTitle}>{titleText}</Text>
          {appeal.decisionDate && (
            <Text style={styles.decisionDate}>Решение от {appeal.decisionDate}</Text>
          )}
        </View>
        <Text style={[styles.decisionIcon, { color: iconColor }]}>{iconText}</Text>
      </View>

      {/* Review info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>
          Что проверяли:{' '}
          <Text style={styles.infoValue}>
            {appeal.reviewType === 'whole' ? 'Всю оценку' : 'Конкретные ошибки'}
          </Text>
        </Text>

        {/* Grade display */}
        {isAccepted && appeal.oldGrade !== undefined && appeal.newGrade !== undefined ? (
          <View style={styles.gradeRow}>
            <Text style={styles.gradeLabel}>Было:</Text>
            <Text style={styles.oldGrade}>{appeal.oldGrade}</Text>
            <Text style={styles.gradeArrow}>→</Text>
            <Text style={styles.gradeLabel}>Стало:</Text>
            <Text style={[styles.newGrade, { color: '#10B981' }]}>{appeal.newGrade}</Text>
          </View>
        ) : (
          <Text style={styles.currentGrade}>
            Текущая оценка: <Text style={styles.currentGradeValue}>{appeal.oldGrade}</Text>
          </Text>
        )}

        <Text style={styles.infoHint}>
          {isAccepted
            ? 'Ошибки и оценка обновлены'
            : isRejected
              ? 'Учитель проверил запрос и оставил оценку без изменений'
              : 'По части заданий решение изменено, по части оставлено без изменений'}
        </Text>
      </View>

      {/* Task responses (mixed) */}
      {appeal.teacherTaskResponses && appeal.teacherTaskResponses.length > 0 ? (
        <View style={styles.infoBox}>
          <Text style={styles.responsesTitle}>Ответ по заданиям:</Text>
          {appeal.teacherTaskResponses.map((task) => (
            <View key={task.taskLabel} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskLabel}>{task.taskLabel}</Text>
                <View
                  style={[
                    styles.taskBadge,
                    {
                      backgroundColor:
                        task.decision === 'agree' ? '#E6F9F0' : '#FFE8E8',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.taskBadgeText,
                      {
                        color: task.decision === 'agree' ? '#0FBBA6' : '#FF7070',
                      },
                    ]}
                  >
                    {task.decision === 'agree' ? 'Согласна' : 'Не согласна'}
                  </Text>
                </View>
              </View>
              <Text style={styles.taskComment}>
                {task.teacherComment || 'Комментарий не добавлен'}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        appeal.teacherComment && (
          <View style={styles.infoBox}>
            <Text style={styles.responsesTitle}>Комментарий учителя:</Text>
            <Text style={styles.teacherComment}>{appeal.teacherComment}</Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pendingHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  decisionContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    marginBottom: 12,
    gap: 12,
  },
  decisionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  decisionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#272443',
    marginBottom: 2,
  },
  decisionDate: {
    fontSize: 11,
    color: '#747788',
  },
  decisionIcon: {
    fontSize: 24,
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#747788',
  },
  infoValue: {
    fontWeight: '600',
    color: '#272443',
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gradeLabel: {
    fontSize: 14,
    color: '#747788',
  },
  oldGrade: {
    fontSize: 18,
    fontWeight: '700',
    color: '#747788',
    textDecorationLine: 'line-through',
  },
  gradeArrow: {
    fontSize: 14,
    color: '#747788',
  },
  newGrade: {
    fontSize: 18,
    fontWeight: '700',
  },
  currentGrade: {
    fontSize: 14,
    color: '#272443',
  },
  currentGradeValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoHint: {
    fontSize: 11,
    color: '#747788',
    fontStyle: 'italic',
  },
  responsesTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#747788',
    marginBottom: 4,
  },
  taskCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEFF8',
    padding: 10,
    gap: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#272443',
  },
  taskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taskComment: {
    fontSize: 12,
    color: '#272443',
  },
  teacherComment: {
    fontSize: 12,
    color: '#272443',
  },
});
