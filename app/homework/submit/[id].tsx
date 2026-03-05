import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import { analyzeHomework } from '@/src/services/aiService';
import Button from '@/src/components/ui/Button';
import { Submission } from '@/src/types';

export default function SubmitHomeworkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const assignments = useHomeworkStore((s) => s.assignments);
  const submitHomework = useHomeworkStore((s) => s.submitHomework);
  const setAiFeedback = useHomeworkStore((s) => s.setAiFeedback);
  const homework = assignments.find((a) => a.id === id);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

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

  // ── Handlers ────────────────────────────────────────────────

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        setFileUri(photo.uri);
        setFileType('photo');
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось сделать снимок.');
    }
  };

  const handleFilePick = () => {
    Alert.alert('Выберите источник', undefined, [
      { text: 'Фото из галереи', onPress: pickImage },
      { text: 'Документ', onPress: pickDocument },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setFileUri(result.assets[0].uri);
      setFileType('photo');
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setFileUri(result.assets[0].uri);
      setFileType('document');
    }
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

  // ── Loading state ───────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Отправка и анализ работы...
          </Text>
          <Text style={[styles.loadingSubtext, { color: theme.colors.textSecondary }]}>
            ИИ проверяет вашу работу
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Preview state (file selected) ──────────────────────────

  if (fileUri) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={() => setFileUri(null)}>
            <Text style={[styles.headerAction, { color: theme.colors.primary }]}>
              Переснять
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {homework.subject}
          </Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Preview */}
        <View style={styles.previewBody}>
          {fileType === 'photo' ? (
            <Image
              source={{ uri: fileUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.docPreview}>
              <Text style={styles.docIcon}>📄</Text>
              <Text style={[styles.docName, { color: theme.colors.text }]} numberOfLines={2}>
                {fileUri.split('/').pop()}
              </Text>
            </View>
          )}
        </View>

        {/* Submit */}
        <View style={[styles.submitBar, { paddingBottom: insets.bottom + 16 }]}>
          <Button title="Отправить" icon="📤" onPress={handleSubmit} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Camera permission ───────────────────────────────────────

  if (!permission || !permission.granted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.permMessage, { color: theme.colors.text }]}>
            Для съёмки необходим доступ к камере
          </Text>
          <TouchableOpacity
            style={[styles.permButton, { backgroundColor: theme.colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permButtonText}>Разрешить камеру</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fileAlt} onPress={handleFilePick}>
            <Text style={[styles.fileAltText, { color: theme.colors.primary }]}>
              Или выбрать из файлов
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Fullscreen camera ───────────────────────────────────────

  return (
    <View style={styles.fullscreen}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing={facing}>
        {/* Top bar — homework info + close */}
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.topInfo}>
            <Text style={styles.topTitle} numberOfLines={1}>{homework.subject}</Text>
            <Text style={styles.topSubtitle} numberOfLines={1}>{homework.description.split('\n')[0]}</Text>
          </View>
          <View style={{ width: 44 }} />
        </SafeAreaView>

        {/* Bottom controls */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
          {/* Left — file picker */}
          <TouchableOpacity style={styles.sideBtn} onPress={handleFilePick}>
            <Text style={styles.sideBtnIcon}>📁</Text>
            <Text style={styles.sideBtnLabel}>Файлы</Text>
          </TouchableOpacity>

          {/* Center — capture */}
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.7}>
            <View style={styles.captureOuter}>
              <View style={styles.captureInner} />
            </View>
          </TouchableOpacity>

          {/* Right — flip camera */}
          <TouchableOpacity
            style={styles.sideBtn}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <Text style={styles.sideBtnIcon}>🔄</Text>
            <Text style={styles.sideBtnLabel}>Камера</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fullscreen: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { fontSize: 16 },

  // ── Top bar (camera) ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  topInfo: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
  topTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  topSubtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },

  // ── Bottom bar (camera) ──
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  captureBtn: { alignItems: 'center', justifyContent: 'center' },
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  sideBtn: { alignItems: 'center', width: 64 },
  sideBtnIcon: { fontSize: 26 },
  sideBtnLabel: { color: '#fff', fontSize: 11, marginTop: 4, fontWeight: '500' },

  // ── Permission ──
  permMessage: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  permButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  fileAlt: { marginTop: 20 },
  fileAltText: { fontSize: 15, fontWeight: '500' },

  // ── Preview ──
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerAction: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  previewBody: { flex: 1, padding: 16 },
  previewImage: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#000',
  },
  docPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIcon: { fontSize: 64, marginBottom: 12 },
  docName: { fontSize: 15, textAlign: 'center' },
  submitBar: { paddingHorizontal: 20, paddingTop: 12 },
  loadingText: { fontSize: 17, fontWeight: '600', marginTop: 16 },
  loadingSubtext: { fontSize: 13, marginTop: 8 },
});
