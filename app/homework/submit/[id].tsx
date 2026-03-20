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
import { useStudentStore } from '@/src/stores/studentStore';
import { useAchievementStore } from '@/src/stores/achievementStore';
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

  const [rewardData, setRewardData] = useState<{
    xpGained: number;
    healthDelta: number;
    newHealth: number;
    streak: number;
    multiplier: number;
    isOnTime: boolean;
    closestAchievement: {
      title: string;
      icon: string;
      description: string;
      progress: number;
      progressDelta: number;
    } | null;
  } | null>(null);

  const isLate = homework ? homework.deadline && new Date() > new Date(homework.deadline) : false;
  const teacherName = homework?.teacher
    ? `${homework.teacher.firstName} ${homework.teacher.lastName}`
    : '';

  // Animate success screen appearance
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
    const descPreview = homework.description.split('\n')[0];
    const deadlineStr = homework.deadline.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    const rd = rewardData;

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <Animated.View
          style={[
            styles.successContainer,
            { opacity: successOpacity, transform: [{ scale: successScale }] },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.successScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Text style={styles.successIcon}>{rd?.isOnTime ? '✅' : '⏰'}</Text>
            <Text style={[styles.successTitle, { color: theme.colors.text }]}>
              Домашка сдана!
            </Text>

            {/* Assignment Info Card */}
            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.infoSubject, { color: theme.colors.primary }]}>
                {homework.subject}
              </Text>
              <Text
                style={[styles.infoDesc, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {descPreview}
              </Text>
              <Text style={[styles.infoDeadline, { color: theme.colors.textSecondary }]}>
                📅 Дедлайн: {deadlineStr}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: rd?.isOnTime ? '#E8F5E9' : '#FFF3E0' },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: rd?.isOnTime ? '#2E7D32' : '#E65100' },
                  ]}
                >
                  {rd?.isOnTime ? '✅ Сдано в срок' : '⏰ С опозданием'}
                </Text>
              </View>
              {teacherName ? (
                <Text style={[styles.infoTeacher, { color: theme.colors.textSecondary }]}>
                  Учитель: {teacherName}
                </Text>
              ) : null}
            </View>

            {/* Rewards Section */}
            {rd && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Награды
                </Text>
                <View style={styles.rewardsRow}>
                  {/* XP */}
                  <View style={[styles.rewardCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={styles.rewardEmoji}>⭐</Text>
                    <Text style={[styles.rewardValue, { color: theme.colors.text }]}>
                      +{rd.xpGained}
                    </Text>
                    <Text style={[styles.rewardLabel, { color: theme.colors.textSecondary }]}>
                      XP
                    </Text>
                    {rd.multiplier > 1 && (
                      <Text style={[styles.multiplierBadge, { color: theme.colors.primary }]}>
                        ×{rd.multiplier}
                      </Text>
                    )}
                  </View>

                  {/* Health */}
                  <View style={[styles.rewardCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={styles.rewardEmoji}>❤️</Text>
                    <Text
                      style={[
                        styles.rewardValue,
                        { color: rd.healthDelta > 0 ? '#2E7D32' : theme.colors.textSecondary },
                      ]}
                    >
                      {rd.healthDelta > 0 ? `+${rd.healthDelta}` : '—'}
                    </Text>
                    <Text style={[styles.rewardLabel, { color: theme.colors.textSecondary }]}>
                      Здоровье
                    </Text>
                    <View style={styles.healthBarBg}>
                      <View
                        style={[
                          styles.healthBarFill,
                          {
                            width: `${rd.newHealth}%`,
                            backgroundColor:
                              rd.newHealth > 60
                                ? '#4CAF50'
                                : rd.newHealth > 30
                                  ? '#FF9800'
                                  : '#F44336',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Streak */}
                  <View style={[styles.rewardCard, { backgroundColor: theme.colors.surface }]}>
                    <Text style={styles.rewardEmoji}>🔥</Text>
                    <Text style={[styles.rewardValue, { color: theme.colors.text }]}>
                      {rd.streak}
                    </Text>
                    <Text style={[styles.rewardLabel, { color: theme.colors.textSecondary }]}>
                      Серия
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Closest Achievement */}
            {rd?.closestAchievement && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Ближайшая ачивка
                </Text>
                <View style={[styles.achCard, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.achHeader}>
                    <Text style={styles.achIcon}>{rd.closestAchievement.icon}</Text>
                    <View style={styles.achInfo}>
                      <Text style={[styles.achTitle, { color: theme.colors.text }]}>
                        {rd.closestAchievement.title}
                      </Text>
                      <Text style={[styles.achDesc, { color: theme.colors.textSecondary }]}>
                        {rd.closestAchievement.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.achProgressRow}>
                    <View style={styles.achProgressBg}>
                      <View
                        style={[
                          styles.achProgressFill,
                          {
                            width: `${rd.closestAchievement.progress}%`,
                            backgroundColor: theme.colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.achProgressText, { color: theme.colors.text }]}>
                      {rd.closestAchievement.progress}%
                    </Text>
                  </View>
                  {rd.closestAchievement.progressDelta > 0 && (
                    <Text style={[styles.achDelta, { color: theme.colors.primary }]}>
                      +{rd.closestAchievement.progressDelta}% за эту сдачу
                    </Text>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {/* Bottom button */}
          <View style={[styles.successFooter, { paddingBottom: insets.bottom + 16 }]}>
            <Button title="Отлично!" onPress={() => router.replace('/')} />
          </View>
        </Animated.View>
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

    // Snapshot state before rewards are applied
    const studentBefore = useStudentStore.getState().student;
    const achievementsBefore = useAchievementStore.getState().achievements;

    const submission: Submission = {
      id: `sub-${Date.now()}`,
      homeworkId: homework.id,
      files,
      submittedAt: new Date(),
    };

    submitHomework(homework.id, submission);

    // Read state after rewards
    const studentAfter = useStudentStore.getState().student;
    const achievementsAfter = useAchievementStore.getState().achievements;

    const xpGained = studentAfter.totalPoints - studentBefore.totalPoints;
    const healthDelta = studentAfter.mascotHealth - studentBefore.mascotHealth;
    const onTime = !(homework.deadline && new Date() > homework.deadline);

    // Find closest locked homework/early_streak achievement
    const relevant = achievementsAfter
      .filter((a) => a.progress < 100 && (a.category === 'homework' || a.category === 'early_streak'))
      .sort((a, b) => b.progress - a.progress);
    const closest = relevant[0] || null;

    let progressDelta = 0;
    if (closest) {
      const before = achievementsBefore.find((a) => a.id === closest.id);
      progressDelta = closest.progress - (before?.progress ?? 0);
    }

    setRewardData({
      xpGained,
      healthDelta,
      newHealth: studentAfter.mascotHealth,
      streak: studentAfter.earlyStreak,
      multiplier: studentAfter.xpMultiplier,
      isOnTime: onTime,
      closestAchievement: closest
        ? {
            title: closest.title,
            icon: closest.icon,
            description: closest.description,
            progress: closest.progress,
            progressDelta,
          }
        : null,
    });

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
  successContainer: {
    flex: 1,
  },
  successScroll: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  successIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  successFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  // ── Info card ──
  infoCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoSubject: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  infoDeadline: {
    fontSize: 13,
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoTeacher: {
    fontSize: 13,
    marginTop: 10,
  },

  // ── Rewards ──
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  rewardCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  rewardEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  multiplierBadge: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  healthBarBg: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginTop: 8,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ── Achievement ──
  achCard: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  achHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  achInfo: {
    flex: 1,
  },
  achTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  achDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  achProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  achProgressBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  achProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  achProgressText: {
    fontSize: 13,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
  achDelta: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
});
