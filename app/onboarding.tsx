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
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { useChatStore } from '@/src/stores/chatStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { useHomeworkStore, HomeLayout } from '@/src/stores/homeworkStore';
import { mockClassStudents, StudentListItem } from '@/src/data/mockData';
import { allCharacters } from '@/src/theme/themes';
import Avatar from '@/src/components/ui/Avatar';

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const student = useStudentStore((s) => s.student);
  const selectStudent = useStudentStore((s) => s.selectStudent);
  const completeOnboarding = useOnboardingStore((s) => s.complete);
  const initChatOnboarding = useChatStore((s) => s.initChatOnboarding);
  const setCharacterId = useThemeStore((s) => s.setCharacter);
  const setHomeLayout = useHomeworkStore((s) => s.setHomeLayout);

  const [step, setStep] = useState(0);
  const [selectedStudentItem, setSelectedStudentItem] = useState<StudentListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualLastName, setManualLastName] = useState('');
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualPatronymic, setManualPatronymic] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<HomeLayout | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const hasCharacter = selectedCharacter !== null && selectedCharacter !== 'none';
  const totalSteps = hasCharacter ? 4 : 3;

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
      : step === 2
        ? selectedCharacter !== null
        : step === 3
          ? selectedLayout !== null
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
      avatarEmoji: '👤',
    });
    setShowManualForm(false);
    animateTransition(1);
  };

  const finishOnboarding = () => {
    initChatOnboarding();
    completeOnboarding();
  };

  const handleNext = () => {
    if (step === 0) {
      if (!selectedStudentItem) return;
      selectStudent(selectedStudentItem);
    }
    if (step === 2) {
      if (!selectedCharacter) return;
      if (selectedCharacter === 'none') {
        setHomeLayout('achievement');
        finishOnboarding();
        return;
      }
      setCharacterId(selectedCharacter);
    }
    if (step === 3) {
      if (!selectedLayout) return;
      setHomeLayout(selectedLayout);
      finishOnboarding();
      return;
    }
    if (step < totalSteps - 1) {
      animateTransition(step + 1);
    } else {
      finishOnboarding();
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
              Привет, {student.firstName}!
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Ты {student.gender === 'male' ? 'добавился' : 'добавилась'} к{' '}
              {student.classId.replace(/(\d+)(\D)/, '$1-$2')} классу
            </Text>

            <View
              style={[
                styles.welcomeCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Avatar size={64} neutral />
              <Text style={[styles.nameValue, { color: theme.colors.text, marginTop: 12 }]}>
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

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🎭</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Выбери персонажа
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Он будет сопровождать тебя в приложении
            </Text>

            <View style={styles.characterGrid}>
              <TouchableOpacity
                style={[
                  styles.characterOption,
                  {
                    backgroundColor:
                      selectedCharacter === 'none'
                        ? theme.colors.primary + '20'
                        : theme.colors.surface,
                    borderColor:
                      selectedCharacter === 'none'
                        ? theme.colors.primary
                        : theme.colors.border,
                    borderWidth: selectedCharacter === 'none' ? 2.5 : 1,
                  },
                ]}
                onPress={() => setSelectedCharacter('none')}
                activeOpacity={0.7}
              >
                <Text style={styles.characterOptionEmoji}>🚫</Text>
                <Text
                  style={[
                    styles.characterOptionName,
                    {
                      color:
                        selectedCharacter === 'none'
                          ? theme.colors.primary
                          : theme.colors.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  Без персонажа
                </Text>
              </TouchableOpacity>
              {allCharacters.map((c) => {
                const isSelected = selectedCharacter === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.characterOption,
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
                    onPress={() => setSelectedCharacter(c.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.characterOptionEmoji}>{c.emoji}</Text>
                    <Text
                      style={[
                        styles.characterOptionName,
                        {
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.text,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🏠</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Вид главной
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Как будет выглядеть главный экран?
            </Text>

            <View style={styles.layoutOptions}>
              <TouchableOpacity
                style={[
                  styles.layoutOption,
                  {
                    backgroundColor:
                      selectedLayout === 'mascot'
                        ? theme.colors.primary + '20'
                        : theme.colors.surface,
                    borderColor:
                      selectedLayout === 'mascot'
                        ? theme.colors.primary
                        : theme.colors.border,
                    borderWidth: selectedLayout === 'mascot' ? 2.5 : 1,
                  },
                ]}
                onPress={() => setSelectedLayout('mascot')}
                activeOpacity={0.7}
              >
                <Text style={styles.layoutOptionEmoji}>🐾</Text>
                <Text
                  style={[
                    styles.layoutOptionTitle,
                    {
                      color:
                        selectedLayout === 'mascot'
                          ? theme.colors.primary
                          : theme.colors.text,
                    },
                  ]}
                >
                  Маскот
                </Text>
                <Text style={[styles.layoutOptionDesc, { color: theme.colors.textSecondary }]}>
                  Персонаж на главном экране
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.layoutOption,
                  {
                    backgroundColor:
                      selectedLayout === 'dashboard'
                        ? theme.colors.primary + '20'
                        : theme.colors.surface,
                    borderColor:
                      selectedLayout === 'dashboard'
                        ? theme.colors.primary
                        : theme.colors.border,
                    borderWidth: selectedLayout === 'dashboard' ? 2.5 : 1,
                  },
                ]}
                onPress={() => setSelectedLayout('dashboard')}
                activeOpacity={0.7}
              >
                <Text style={styles.layoutOptionEmoji}>📊</Text>
                <Text
                  style={[
                    styles.layoutOptionTitle,
                    {
                      color:
                        selectedLayout === 'dashboard'
                          ? theme.colors.primary
                          : theme.colors.text,
                    },
                  ]}
                >
                  Дашборд
                </Text>
                <Text style={[styles.layoutOptionDesc, { color: theme.colors.textSecondary }]}>
                  Оценки и статистика
                </Text>
              </TouchableOpacity>
            </View>
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
            {Array.from({ length: totalSteps }).map((_, i) => (
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
                  {step === totalSteps - 1 || (step === 2 && selectedCharacter === 'none') ? 'Начать' : 'Далее'}
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

  // Step 2 — Welcome
  welcomeCard: {
    width: '100%',
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
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

  // Step 3 — Character selection
  characterGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  characterOption: {
    width: 100,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    gap: 6,
  },
  characterOptionEmoji: {
    fontSize: 32,
  },
  characterOptionName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Step 4 — Layout selection
  layoutOptions: {
    width: '100%',
    gap: 12,
  },
  layoutOption: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
  },
  layoutOptionEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  layoutOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  layoutOptionDesc: {
    fontSize: 14,
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
