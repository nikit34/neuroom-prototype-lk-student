import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { useThemeStore } from '@/src/stores/themeStore';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { themes, allCharacters, seniorThemes, juniorThemes } from '@/src/theme/themes';
import { mockClassStudents, StudentListItem } from '@/src/data/mockData';
import { AppTheme, ThemeCharacter } from '@/src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const student = useStudentStore((s) => s.student);
  const selectStudent = useStudentStore((s) => s.selectStudent);
  const setGender = useStudentStore((s) => s.setGender);
  const themeId = useThemeStore((s) => s.themeId);
  const characterId = useThemeStore((s) => s.characterId);
  const setThemeId = useThemeStore((s) => s.setTheme);
  const setCharacterId = useThemeStore((s) => s.setCharacter);
  const completeOnboarding = useOnboardingStore((s) => s.complete);

  const ageGroup = useThemeStore((s) => s.ageGroup);

  const genderTheme = (g: 'male' | 'female') => g === 'male' ? 'genshin' : 'sakura';

  useEffect(() => {
    setCharacterId('pk-pikachu');
  }, []);

  const [step, setStep] = useState(0);
  const [selectedStudentItem, setSelectedStudentItem] = useState<StudentListItem | null>(null);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>(student.gender);
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const availableThemes = ageGroup === 'senior' ? seniorThemes : juniorThemes;
  const ageLabel = ageGroup === 'senior' ? '8–11 класс' : '5–7 класс';

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

  const canProceed = step === 0 ? selectedStudentItem !== null : true;

  const handleNext = () => {
    if (step === 0) {
      if (!selectedStudentItem) return;
      selectStudent(selectedStudentItem);
      setSelectedGender(selectedStudentItem.gender);
      setThemeId(genderTheme(selectedStudentItem.gender));
    }
    if (step === 2) {
      setGender(selectedGender);
    }
    if (step < TOTAL_STEPS - 1) {
      animateTransition(step + 1);
    } else {
      completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateTransition(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      // ── Шаг 1: Выбор себя из списка ──
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
                    <Text style={styles.studentEmoji}>{item.avatarEmoji}</Text>
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
                        {item.grade} класс, {item.classId}
                      </Text>
                    </View>
                    {isSelected && (
                      <Text style={[styles.studentCheck, { color: theme.colors.primary }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      // ── Шаг 2: Подтверждение имени ──
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
                {student.grade} класс, {student.classId}
              </Text>
            </View>

            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
              Если данные неверны — обратись к классному руководителю
            </Text>
          </View>
        );

      // ── Шаг 3: Выбор пола ──
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>
              {selectedGender === 'male' ? '🧑' : '👩'}
            </Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Кто ты?
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Это нужно для правильного обращения
            </Text>

            <View style={styles.genderRow}>
              {(['male', 'female'] as const).map((g) => {
                const isSelected = selectedGender === g;
                const emoji = g === 'male' ? '🧑' : '👩';
                const label = g === 'male' ? 'Парень' : 'Девушка';

                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderCard,
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
                    onPress={() => {
                      setSelectedGender(g);
                      setThemeId(genderTheme(g));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.genderEmoji}>{emoji}</Text>
                    <Text
                      style={[
                        styles.genderLabel,
                        {
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.text,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {label}
                    </Text>
                    {isSelected && (
                      <Text style={[styles.checkMark, { color: theme.colors.primary }]}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      // ── Шаг 4: Выбор оформления (франшизы) ──
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🎨</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Выбери оформление
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Его всегда можно сменить в профиле
            </Text>

            <Text style={[styles.ageGroupLabel, { color: theme.colors.textSecondary }]}>
              {ageLabel}
            </Text>
            <View style={styles.themesGrid}>
              {availableThemes.map((t: AppTheme) => renderThemeCard(t))}
            </View>
          </View>
        );

      // ── Шаг 5: Выбор персонажа ──
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>{'🧑‍🎤'}</Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Выбери персонажа
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Выбери любого персонажа
            </Text>

            <View style={styles.charactersGrid}>
              {allCharacters.map((char: ThemeCharacter) => {
                  const isSelected = char.id === characterId;
                  return (
                    <TouchableOpacity
                      key={char.id}
                      style={[
                        styles.characterCard,
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
                      onPress={() => setCharacterId(char.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.characterEmoji}>{char.emoji}</Text>
                      <Text
                        style={[
                          styles.characterName,
                          {
                            color: isSelected
                              ? theme.colors.primary
                              : theme.colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {char.name}
                      </Text>
                      {isSelected && (
                        <View
                          style={[
                            styles.selectedBadge,
                            { backgroundColor: theme.colors.primary },
                          ]}
                        >
                          <Text style={styles.selectedBadgeText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                },
              )}
            </View>

          </View>
        );

      default:
        return null;
    }
  };

  const renderThemeCard = (t: AppTheme) => {
    const isSelected = t.id === themeId;
    return (
      <TouchableOpacity
        key={t.id}
        style={[
          styles.themeCard,
          {
            backgroundColor: t.colors.surface,
            borderColor: isSelected
              ? t.colors.primary
              : t.colors.border,
            borderWidth: isSelected ? 3 : 1,
          },
        ]}
        onPress={() => setThemeId(t.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.themeEmoji}>{t.emoji}</Text>
        <Text style={[styles.themeName, { color: t.colors.text }]}>
          {t.name}
        </Text>
        <View style={styles.colorPreview}>
          <View
            style={[styles.colorDot, { backgroundColor: t.colors.primary }]}
          />
          <View
            style={[styles.colorDot, { backgroundColor: t.colors.secondary }]}
          />
          <View
            style={[styles.colorDot, { backgroundColor: t.colors.accent }]}
          />
        </View>
        {isSelected && (
          <View
            style={[
              styles.selectedBadge,
              { backgroundColor: t.colors.primary },
            ]}
          >
            <Text style={styles.selectedBadgeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        {/* Progress dots */}
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

        {/* Step content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderStep()}
          </Animated.View>
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.bottomBar}>
          {step > 0 ? (
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
  studentEmoji: {
    fontSize: 28,
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

  // Step 3 — Gender
  genderRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  genderCard: {
    flex: 1,
    paddingVertical: 28,
    borderRadius: 20,
    alignItems: 'center',
    position: 'relative',
  },
  genderEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  genderLabel: {
    fontSize: 17,
  },
  checkMark: {
    position: 'absolute',
    top: 12,
    right: 14,
    fontSize: 18,
    fontWeight: '700',
  },

  // Step 4 — Themes
  ageGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    alignSelf: 'flex-start',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  themeCard: {
    width: (SCREEN_WIDTH - 48 - 24) / 2.5,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  themeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 5,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Step 5 — Characters
  charactersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  characterCard: {
    width: (SCREEN_WIDTH - 48 - 24) / 2,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  characterEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  characterName: {
    fontSize: 14,
    textAlign: 'center',
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
