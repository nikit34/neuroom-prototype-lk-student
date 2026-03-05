import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useStudentStore } from '@/src/stores/studentStore';
import { createRoom, joinRoom } from '@/src/services/onlineDuel';

const SUBJECTS = ['Математика', 'Физика', 'История'];

export default function OnlineDuelScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const student = useStudentStore((s) => s.student);

  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [subject, setSubject] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const playerInfo = {
    id: student.id,
    name: `${student.firstName} ${student.lastName}`,
    avatarEmoji: '🐺',
  };

  const handleCreate = async () => {
    if (!subject) return;
    setLoading(true);
    try {
      const code = await createRoom(subject, playerInfo);
      setCreatedCode(code);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось создать комнату');
    }
    setLoading(false);
  };

  const handleGoToRoom = () => {
    if (createdCode) {
      router.replace(`/arena/online/${createdCode}?role=player1`);
    }
  };

  const handleJoin = async () => {
    if (joinCode.length !== 4) return;
    setLoading(true);
    try {
      const room = await joinRoom(joinCode, playerInfo);
      if (!room) {
        Alert.alert('Ошибка', 'Комната не найдена или уже занята');
        setLoading(false);
        return;
      }
      router.replace(`/arena/online/${joinCode}?role=player2`);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось подключиться');
    }
    setLoading(false);
  };

  // Choose mode
  if (mode === 'choose') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.container}>
          <Text style={[styles.header, { color: theme.colors.text }]}>Онлайн-дуэль</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Играйте с другом на двух устройствах
          </Text>
          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => setMode('create')}
          >
            <Text style={styles.modeBtnEmoji}>⚔️</Text>
            <Text style={styles.modeBtnText}>Создать дуэль</Text>
            <Text style={styles.modeBtnHint}>Выберите предмет и дайте код другу</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, { backgroundColor: theme.colors.accent }]}
            onPress={() => setMode('join')}
          >
            <Text style={styles.modeBtnEmoji}>🎯</Text>
            <Text style={styles.modeBtnText}>Присоединиться</Text>
            <Text style={styles.modeBtnHint}>Введите код от друга</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Create mode
  if (mode === 'create') {
    if (createdCode) {
      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
          <View style={styles.container}>
            <Text style={[styles.header, { color: theme.colors.text }]}>Комната создана!</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Скажите этот код другу:
            </Text>
            <View style={[styles.codeBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
              <Text style={[styles.codeText, { color: theme.colors.primary }]}>{createdCode}</Text>
            </View>
            <Text style={[styles.waitHint, { color: theme.colors.textSecondary }]}>
              Когда друг введёт код, дуэль начнётся
            </Text>
            <TouchableOpacity
              style={[styles.goBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handleGoToRoom}
            >
              <Text style={styles.goBtnText}>Перейти в комнату</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => setMode('choose')}>
            <Text style={[styles.back, { color: theme.colors.textSecondary }]}>← Назад</Text>
          </TouchableOpacity>
          <Text style={[styles.header, { color: theme.colors.text }]}>Создать дуэль</Text>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Выберите предмет</Text>
          <View style={styles.subjectRow}>
            {SUBJECTS.map((s) => {
              const active = subject === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.subjectBtn,
                    { backgroundColor: active ? theme.colors.primary : theme.colors.surface, borderColor: active ? theme.colors.primary : theme.colors.border },
                  ]}
                  onPress={() => setSubject(s)}
                >
                  <Text style={[styles.subjectText, { color: active ? '#FFF' : theme.colors.text }]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.goBtn, { backgroundColor: subject ? theme.colors.primary : theme.colors.border }]}
            onPress={handleCreate}
            disabled={!subject || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.goBtnText}>Создать комнату</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Join mode
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity onPress={() => setMode('choose')}>
          <Text style={[styles.back, { color: theme.colors.textSecondary }]}>← Назад</Text>
        </TouchableOpacity>
        <Text style={[styles.header, { color: theme.colors.text }]}>Присоединиться</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Введите 4-значный код от друга
        </Text>
        <TextInput
          style={[styles.codeInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
          value={joinCode}
          onChangeText={(t) => setJoinCode(t.replace(/[^0-9]/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="0000"
          placeholderTextColor={theme.colors.textSecondary}
          autoFocus
        />
        <TouchableOpacity
          style={[styles.goBtn, { backgroundColor: joinCode.length === 4 ? theme.colors.primary : theme.colors.border }]}
          onPress={handleJoin}
          disabled={joinCode.length !== 4 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.goBtnText}>Войти в дуэль</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  header: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  back: { fontSize: 16, marginBottom: 20 },
  modeBtn: { borderRadius: 20, padding: 24, marginBottom: 16, alignItems: 'center' },
  modeBtnEmoji: { fontSize: 40, marginBottom: 8 },
  modeBtnText: { color: '#FFF', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  modeBtnHint: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  subjectRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  subjectBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  subjectText: { fontSize: 14, fontWeight: '600' },
  codeBox: { borderWidth: 3, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  codeText: { fontSize: 48, fontWeight: '900', letterSpacing: 12 },
  waitHint: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
  codeInput: { fontSize: 40, fontWeight: '800', textAlign: 'center', letterSpacing: 16, borderWidth: 2, borderRadius: 16, padding: 20, marginBottom: 24 },
  goBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  goBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
