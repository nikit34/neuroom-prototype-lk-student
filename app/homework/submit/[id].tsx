import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { analyzeHomework } from '@/src/services/aiService';
import CameraCapture from '@/src/components/camera/CameraCapture';
import FilePickerButton from '@/src/components/camera/FilePickerButton';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';
import { Submission } from '@/src/types';

export default function SubmitHomeworkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const assignments = useHomeworkStore((s) => s.assignments);
  const submitHomework = useHomeworkStore((s) => s.submitHomework);
  const setAiFeedback = useHomeworkStore((s) => s.setAiFeedback);
  const homework = assignments.find((a) => a.id === id);

  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'photo' | 'document'>('photo');
  const [loading, setLoading] = useState(false);

  if (!homework) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Задание не найдено
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCapture = (uri: string) => {
    setFileUri(uri);
    setFileType('photo');
  };

  const handleFilePick = (uri: string) => {
    setFileUri(uri);
    setFileType('document');
  };

  const handleSubmit = async () => {
    if (!fileUri) return;

    setLoading(true);

    const submission: Submission = {
      id: `sub-${Date.now()}`,
      homeworkId: homework.id,
      fileUri,
      fileType,
      submittedAt: new Date(),
    };

    submitHomework(homework.id, submission);

    try {
      const feedback = await analyzeHomework(homework.id);
      setAiFeedback(homework.id, feedback);
    } catch {
      // AI analysis failed silently
    }

    setLoading(false);
    router.replace(`/homework/feedback/${homework.id}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Сдача работы
        </Text>
        <Text style={[styles.hwTitle, { color: theme.colors.textSecondary }]}>
          {homework.title} ({homework.subject})
        </Text>

        {/* Upload options */}
        {!fileUri && !loading && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
              Выберите способ загрузки:
            </Text>
            <View style={styles.optionsRow}>
              <CameraCapture onCapture={handleCapture} />
              <View style={styles.optionSpacer} />
              <FilePickerButton onPick={handleFilePick} />
            </View>
          </>
        )}

        {/* Preview */}
        {fileUri && !loading && (
          <Card style={styles.previewCard}>
            <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>
              Предпросмотр:
            </Text>
            {fileType === 'photo' ? (
              <Image
                source={{ uri: fileUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.docPreview}>
                <Text style={styles.docIcon}>📄</Text>
                <Text
                  style={[styles.docName, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {fileUri.split('/').pop()}
                </Text>
              </View>
            )}
            <Button
              title="Выбрать другой файл"
              variant="outline"
              onPress={() => setFileUri(null)}
            />
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text }]}>
              Отправка и анализ работы...
            </Text>
            <Text style={[styles.loadingSubtext, { color: theme.colors.textSecondary }]}>
              ИИ проверяет вашу работу. Это займёт несколько секунд.
            </Text>
          </Card>
        )}

        {/* Submit button */}
        {fileUri && !loading && (
          <View style={styles.submitContainer}>
            <Button
              title="Отправить"
              icon="📤"
              onPress={handleSubmit}
              loading={loading}
            />
          </View>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  hwTitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionSpacer: {
    width: 12,
  },
  previewCard: {
    marginTop: 16,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#000',
  },
  docPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
  },
  docIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  docName: {
    fontSize: 14,
    flex: 1,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: 40,
    marginTop: 20,
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  submitContainer: {
    marginTop: 24,
  },
});
