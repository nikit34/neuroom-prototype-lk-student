import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { useChatStore, AI_TUTOR_ID } from '@/src/stores/chatStore';
import { mockClassStudents, StudentListItem } from '@/src/data/mockData';
import Avatar from '@/src/components/ui/Avatar';

const TOTAL_STEPS = 2;

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const student = useStudentStore((s) => s.student);
  const selectStudent = useStudentStore((s) => s.selectStudent);
  const completeOnboarding = useOnboardingStore((s) => s.complete);
  const initChatOnboarding = useChatStore((s) => s.initChatOnboarding);

  const [step, setStep] = useState(0);
  const [selectedStudentItem, setSelectedStudentItem] = useState<StudentListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualLastName, setManualLastName] = useState('');
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualPatronymic, setManualPatronymic] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const filteredStudents = searchQuery.trim()
    ? mockClassStudents.filter((s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockClassStudents;

  const animateTransition = (next: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const canProceed = showManualForm
    ? manualLastName.trim() !== '' && manualFirstName.trim() !== ''
    : step === 0
      ? selectedStudentItem !== null
      : true;

  const handleManualRegister = () => {
    if (!manualLastName.trim() || !manualFirstName.trim()) return;
    selectStudent({
      id: `manual-${Date.now()}`,
      firstName: manualFirstName.trim(),
      lastName: manualLastName.trim(),
      gender: 'female',
      grade: 10,
      classId: '10A',
    });
    completeOnboarding();
    initChatOnboarding();
    router.replace('/(tabs)');
    setTimeout(() => router.push(`/chat/${AI_TUTOR_ID}`), 100);
  };

  const handleNext = () => {
    if (step === 0) {
      if (!selectedStudentItem) return;
      selectStudent(selectedStudentItem);
    }
    if (step < TOTAL_STEPS - 1) {
      animateTransition(step + 1);
    } else {
      completeOnboarding();
      initChatOnboarding();
      router.replace('/(tabs)');
      setTimeout(() => router.push(`/chat/${AI_TUTOR_ID}`), 100);
    }
  };

  const handleBack = () => {
    if (showManualForm) {
      setShowManualForm(false);
      return;
    }
    if (step > 0) {
      animateTransition(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🏫</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Найди себя
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Выбери своё имя из списка класса
            </Text>

            <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Поиск по имени..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>

            <View style={styles.studentList}>
              {filteredStudents.map((item) => {
                const isSelected = selectedStudentItem?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.studentCard,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary + '20'
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                        borderWidth: isSelected ? 2.5 : 1,
                      },
                    ]}
                    onPress={() => setSelectedStudentItem(item)}
                    activeOpacity={0.7}
                  >
                    <Avatar size={36} neutral />
                    <View style={styles.studentInfo}>
                      <Text
                        style={[
                          styles.studentName,
                          {
                            color: isSelected ? theme.colors.primary : theme.colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {item.lastName} {item.firstName}
                      </Text>
                      <Text style={[styles.studentClass, { color: theme.colors.textSecondary }]}>
                        {item.classId.replace(/(\d+)(\D)/, '$1-$2')} класс
                      </Text>
                    </View>
                    {isSelected && (
                      <Text style={[styles.studentCheck, { color: theme.colors.primary }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.notInListBtn}
              onPress={() => setShowManualForm(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.notInListText, { color: theme.colors.primary }]}>
                Меня нет в списке
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>👋</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Привет!
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Давай проверим, что всё верно
            </Text>

            <View
              style={[
                styles.nameCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.nameLabel, { color: theme.colors.textSecondary }]}>
                Твоё имя
              </Text>
              <Text style={[styles.nameValue, { color: theme.colors.text }]}>
                {student.firstName} {student.lastName}
              </Text>
              <Text style={[styles.classValue, { color: theme.colors.textSecondary }]}>
                {student.classId.replace(/(\d+)(\D)/, '$1-$2')} класс
              </Text>
            </View>

            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
              Если данные неверны — обратись к классному руководителю
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const renderManualForm = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Представьтесь, пожалуйста
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Это имя будет видно преподавателям и родителям
      </Text>

      <View style={styles.formFields}>
        <View style={styles.formField}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>Фамилия*</Text>
          <TextInput
            style={[styles.formInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            placeholder="Введите фамилию"
            placeholderTextColor={theme.colors.textSecondary}
            value={manualLastName}
            onChangeText={setManualLastName}
            autoCorrect={false}
          />
        </View>

        <View style={styles.formField}>
          <Text style={[styles.formLabel, { color: theme.colors.text }]}>Имя*</Text>
          <TextInput
            style={[styles.formInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            placeholder="Введите имя"
            placeholderTextColor={theme.colors.textSecondary}
            value={manualFirstName}
            onChangeText={setManualFirstName}
            autoCorrect={false}
          />
        </View>

        <View style={styles.formField}>
          <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>Отчество</Text>
          <TextInput
            style={[styles.formInput, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            placeholder="Введите отчество"
            placeholderTextColor={theme.colors.textSecondary}
            value={manualPatronymic}
            onChangeText={setManualPatronymic}
            autoCorrect={false}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        {/* Progress dots — hide on manual form */}
        {!showManualForm && (
          <View style={styles.progressRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i <= step ? theme.colors.primary : theme.colors.border,
                    width: i === step ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Step content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {showManualForm ? renderManualForm() : renderStep()}
          </Animated.View>
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.bottomBar}>
          {step > 0 || showManualForm ? (
            <TouchableOpacity
              style={[
                styles.backBtn,
                {
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Text style={[styles.backBtnText, { color: theme.colors.textSecondary }]}>
                Назад
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}

          {showManualForm ? (
            <TouchableOpacity
              onPress={handleManualRegister}
              activeOpacity={canProceed ? 0.8 : 1}
              disabled={!canProceed}
            >
              <LinearGradient
                colors={canProceed ? theme.colors.gradient : ['#CCCCCC', '#AAAAAA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>
                  Завершить регистрацию
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={canProceed ? 0.8 : 1}
              disabled={!canProceed}
            >
              <LinearGradient
                colors={canProceed ? theme.colors.gradient : ['#CCCCCC', '#AAAAAA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>
                  {step === TOTAL_STEPS - 1 ? 'Начать' : 'Далее'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingTop: 8,
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  stepEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  // Step 1 — Student selection
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  studentList: {
    width: '100%',
    gap: 8,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
  },
  studentClass: {
    fontSize: 13,
    marginTop: 2,
  },
  studentCheck: {
    fontSize: 18,
    fontWeight: '700',
  },

  notInListBtn: {
    marginTop: 16,
    paddingVertical: 12,
  },
  notInListText: {
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Manual registration form
  formFields: {
    width: '100%',
    gap: 16,
  },
  formField: {
    width: '100%',
    gap: 4,
  },
  formLabel: {
    fontSize: 12,
    paddingHorizontal: 17,
    letterSpacing: -0.4,
  },
  formInput: {
    width: '100%',
    fontSize: 18,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    lineHeight: 24,
  },

  // Step 2 — Name
  nameCard: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  nameLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  nameValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  classValue: {
    fontSize: 15,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Bottom
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
