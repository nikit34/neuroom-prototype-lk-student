import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useHomeworkStore } from '@/src/stores/homeworkStore';
import Button from '@/src/components/ui/Button';
import { Submission, SubmissionFile } from '@/src/types';

export default function SubmitHomeworkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const assignments = useHomeworkStore((s) => s.assignments);
  const submitHomework = useHomeworkStore((s) => s.submitHomework);
  const homework = assignments.find((a) => a.id === id);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [showCamera, setShowCamera] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.8)).current;

  const isLate = homework ? homework.deadline && new Date() > new Date(homework.deadline) : false;
  const teacherName = homework?.teacher
    ? `${homework.teacher.firstName} ${homework.teacher.lastName}`
    : '';

  // Auto-navigate after showing success screen
  useEffect(() => {
    if (!submitted) return;
    Animated.parallel([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(successScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/');
    }, 3000);
    return () => clearTimeout(timer);
  }, [submitted]);

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

  // ── Success screen ────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.successTouchable}
          onPress={() => router.replace('/')}
        >
        <Animated.View
          style={[
            styles.successContainer,
            { opacity: successOpacity, transform: [{ scale: successScale }] },
          ]}
        >
          <View style={[styles.successCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.successIcon}>{isLate ? '⏰' : '✅'}</Text>
            <Text style={[styles.successTitle, { color: theme.colors.text }]}>
              Домашка сдана!
            </Text>
            <Text style={[styles.successSubject, { color: theme.colors.primary }]}>
              {homework.subject}
            </Text>
            <View
              style={[
                styles.successBadge,
                { backgroundColor: isLate ? '#FFF3E0' : '#E8F5E9' },
              ]}
            >
              <Text
                style={[
                  styles.successBadgeText,
                  { color: isLate ? '#E65100' : '#2E7D32' },
                ]}
              >
                {isLate ? 'С опозданием' : 'В срок'}
              </Text>
            </View>
            {teacherName ? (
              <Text style={[styles.successTeacher, { color: theme.colors.textSecondary }]}>
                Отправлено учителю: {teacherName}
              </Text>
            ) : null}
          </View>
        </Animated.View>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Handlers ────────────────────────────────────────────────

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        setFiles((prev) => [...prev, { uri: photo.uri, type: 'photo' }]);
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
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newFiles = result.assets.map((a) => ({ uri: a.uri, type: 'photo' as const }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setFiles((prev) => [...prev, { uri: result.assets[0].uri, type: 'document' }]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (files.length === 0) return;

    const submission: Submission = {
      id: `sub-${Date.now()}`,
      homeworkId: homework.id,
      files,
      submittedAt: new Date(),
    };

    submitHomework(homework.id, submission);

    setSubmitted(true);
  };

  // ── Preview state (files selected, camera hidden) ──────────

  if (files.length > 0 && !showCamera) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.headerAction, { color: theme.colors.textSecondary }]}>
              Отмена
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {homework.subject}
          </Text>
          <View style={{ width: 70 }} />
        </View>

        {/* Files grid */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.filesGrid}
          showsVerticalScrollIndicator={false}
        >
          {files.map((file, index) => (
            <View key={index} style={styles.fileCard}>
              {file.type === 'photo' ? (
                <Image source={{ uri: file.uri }} style={styles.fileThumbnail} resizeMode="cover" />
              ) : (
                <View style={[styles.fileThumbnail, styles.docThumbnail, { backgroundColor: theme.colors.surface }]}>
                  <Text style={styles.docThumbnailIcon}>📄</Text>
                  <Text style={[styles.docThumbnailName, { color: theme.colors.text }]} numberOfLines={2}>
                    {file.uri.split('/').pop()}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeFile(index)}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.fileIndex}>
                <Text style={styles.fileIndexText}>{index + 1}</Text>
              </View>
            </View>
          ))}

          {/* Add more button */}
          <TouchableOpacity
            style={[styles.addMoreCard, { borderColor: theme.colors.primary }]}
            onPress={() => {
              Alert.alert('Добавить файл', undefined, [
                { text: 'Камера', onPress: () => setShowCamera(true) },
                { text: 'Галерея', onPress: pickImage },
                { text: 'Документ', onPress: pickDocument },
                { text: 'Отмена', style: 'cancel' },
              ]);
            }}
          >
            <Text style={[styles.addMoreIcon, { color: theme.colors.primary }]}>+</Text>
            <Text style={[styles.addMoreText, { color: theme.colors.primary }]}>Ещё фото</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Submit */}
        <View style={[styles.submitBar, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={[styles.filesCount, { color: theme.colors.textSecondary }]}>
            {files.length} {files.length === 1 ? 'файл' : files.length < 5 ? 'файла' : 'файлов'}
          </Text>
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
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing={facing} />

      {/* Overlay controls — outside CameraView for reliable touches */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        {/* Top bar — homework info + close */}
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (files.length > 0) {
                setShowCamera(false);
              } else {
                router.back();
              }
            }}
            style={styles.closeBtn}
          >
            <Text style={styles.closeBtnText}>{files.length > 0 ? '←' : '✕'}</Text>
          </TouchableOpacity>
          <View style={styles.topInfo}>
            <Text style={styles.topTitle} numberOfLines={1}>{homework.subject}</Text>
            <Text style={styles.topSubtitle} numberOfLines={1}>{homework.description.split('\n')[0]}</Text>
          </View>
          {files.length > 0 ? (
            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowCamera(false)}>
              <Text style={styles.doneBtnText}>Готово ({files.length})</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </SafeAreaView>

        {/* File count badge */}
        {files.length > 0 && (
          <View style={styles.fileBadge}>
            <Text style={styles.fileBadgeText}>
              {files.length} {files.length === 1 ? 'фото' : 'фото'}
            </Text>
          </View>
        )}

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
      </View>
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
  doneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // ── File count badge (camera) ──
  fileBadge: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fileBadgeText: { color: '#fff', fontSize: 14, fontWeight: '600' },

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

  // ── Files grid ──
  filesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
  },
  fileCard: {
    width: '47%',
    aspectRatio: 0.85,
    borderRadius: 14,
    overflow: 'hidden',
  },
  fileThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  docThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  docThumbnailIcon: { fontSize: 40, marginBottom: 6 },
  docThumbnailName: { fontSize: 11, textAlign: 'center', paddingHorizontal: 8 },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  fileIndex: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIndexText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  addMoreCard: {
    width: '47%',
    aspectRatio: 0.85,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreIcon: { fontSize: 32, fontWeight: '300', marginBottom: 4 },
  addMoreText: { fontSize: 13, fontWeight: '600' },

  // ── Submit bar ──
  submitBar: { paddingHorizontal: 20, paddingTop: 12 },
  filesCount: { fontSize: 13, textAlign: 'center', marginBottom: 8 },

  // ── Success screen ──
  successTouchable: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successCard: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  successIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  successSubject: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  successBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  successBadgeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  successTeacher: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
