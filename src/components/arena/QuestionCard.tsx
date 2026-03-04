import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { DuelQuestion } from '@/src/types';

interface QuestionCardProps {
  question: DuelQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  onAnswer: (index: number) => void;
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswer,
}: QuestionCardProps) {
  const theme = useAppTheme();
  const answered = selectedAnswer !== null;

  return (
    <View style={styles.container}>
      <Text style={[styles.counter, { color: theme.colors.textSecondary }]}>
        Вопрос {questionNumber} из {totalQuestions}
      </Text>
      <Text style={[styles.subject, { color: theme.colors.accent }]}>{question.subject}</Text>
      <Text style={[styles.questionText, { color: theme.colors.text }]}>{question.text}</Text>

      <View style={styles.options}>
        {question.options.map((option, i) => {
          const isSelected = selectedAnswer === i;
          const isCorrect = i === question.correctIndex;
          let bgColor = theme.colors.surface;
          let borderColor = theme.colors.border;

          if (answered) {
            if (isCorrect) {
              bgColor = '#E8F5E9';
              borderColor = '#4CAF50';
            } else if (isSelected && !isCorrect) {
              bgColor = '#FFEBEE';
              borderColor = '#F44336';
            }
          }

          return (
            <TouchableOpacity
              key={i}
              style={[styles.option, { backgroundColor: bgColor, borderColor }]}
              onPress={() => !answered && onAnswer(i)}
              activeOpacity={answered ? 1 : 0.7}
              disabled={answered}
            >
              <Text style={[styles.optionLabel, { color: theme.colors.textSecondary }]}>
                {String.fromCharCode(65 + i)}
              </Text>
              <Text style={[styles.optionText, { color: theme.colors.text }]}>{option}</Text>
              {answered && isCorrect && <Text style={styles.indicator}>✓</Text>}
              {answered && isSelected && !isCorrect && <Text style={styles.indicator}>✗</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 16 },
  counter: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  subject: { fontSize: 12, fontWeight: '600', marginBottom: 12 },
  questionText: { fontSize: 18, fontWeight: '700', marginBottom: 20, lineHeight: 26 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionLabel: { fontSize: 14, fontWeight: '700', marginRight: 12, width: 20 },
  optionText: { fontSize: 15, flex: 1 },
  indicator: { fontSize: 18, fontWeight: '700', marginLeft: 8 },
});
