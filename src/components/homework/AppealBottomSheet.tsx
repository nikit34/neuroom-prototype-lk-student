import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '@/src/hooks/useAppTheme';

const DISAGREEMENT_OPTIONS = [
  'Здесь нет ошибки',
  'Неправильно распознал символ',
  'Не понимаю в чем ошибка',
  'Не согласна с отметкой',
  'Другое: напишу в комментарии',
];

const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface Attachment {
  uri: string;
  name: string;
  type: 'photo' | 'document';
}

interface AppealBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    disagreementPoints: string[];
    reviewType: 'whole' | 'specific';
    comment: string;
    attachments: Attachment[];
  }) => void;
}

export default function AppealBottomSheet({
  visible,
  onClose,
  onSubmit,
}: AppealBottomSheetProps) {
  const theme = useAppTheme();
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const togglePoint = (point: string) => {
    setSelectedPoints((prev) =>
      prev.includes(point) ? prev.filter((p) => p !== point) : [...prev, point],
    );
    setErrors((prev) => ({ ...prev, disagreementPoints: '' }));
  };

  const pickPhoto = async () => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      Alert.alert('Максимум файлов', `Можно загрузить не более ${MAX_ATTACHMENTS} файлов`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAttachments((prev) => [
        ...prev,
        { uri: asset.uri, name: asset.fileName || 'Фото', type: 'photo' },
      ]);
      setErrors((prev) => ({ ...prev, attachments: '' }));
    }
  };

  const pickDocument = async () => {
    if (attachments.length >= MAX_ATTACHMENTS) {
      Alert.alert('Максимум файлов', `Можно загрузить не более ${MAX_ATTACHMENTS} файлов`);
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_FILE_SIZE) {
        Alert.alert('Файл слишком большой', 'Максимум 10 МБ');
        return;
      }
      setAttachments((prev) => [
        ...prev,
        { uri: asset.uri, name: asset.name, type: 'document' },
      ]);
      setErrors((prev) => ({ ...prev, attachments: '' }));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (selectedPoints.length === 0) {
      newErrors.disagreementPoints = 'Выбери хотя бы один пункт';
    }
    if (comment.trim().length > 0 && comment.trim().length < 20) {
      newErrors.comment = 'Минимум 20 символов';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const hasSpecific = selectedPoints.includes(DISAGREEMENT_OPTIONS[0]);
    onSubmit({
      disagreementPoints: selectedPoints,
      reviewType: hasSpecific ? 'specific' : 'whole',
      comment: comment.trim(),
      attachments,
    });

    resetForm();
  };

  const resetForm = () => {
    setSelectedPoints([]);
    setComment('');
    setAttachments([]);
    setErrors({});
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.colors.card }]}
            onPress={() => {}}
          >
            {/* Handle */}
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
            </View>

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Попросить перепроверить
              </Text>
              <Text style={[styles.headerDesc, { color: theme.colors.textSecondary }]}>
                Опиши, что кажется неверным. Учитель рассмотрит обращение в течение 72 часов.
              </Text>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollInner}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Disagreement points */}
              <Text style={[styles.label, { color: theme.colors.text }]}>
                С чем вы не согласны? <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.optionsBox,
                  {
                    borderColor: errors.disagreementPoints
                      ? '#FF6B6B'
                      : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                {DISAGREEMENT_OPTIONS.map((point) => {
                  const selected = selectedPoints.includes(point);
                  return (
                    <TouchableOpacity
                      key={point}
                      style={[
                        styles.optionItem,
                        {
                          backgroundColor: theme.colors.card,
                          borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => togglePoint(point)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          {
                            borderColor: selected
                              ? theme.colors.primary
                              : theme.colors.textSecondary,
                            backgroundColor: selected
                              ? theme.colors.primary
                              : 'transparent',
                          },
                        ]}
                      >
                        {selected && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                      <Text
                        style={[styles.optionText, { color: theme.colors.text }]}
                      >
                        {point}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.disagreementPoints ? (
                <Text style={styles.errorText}>{errors.disagreementPoints}</Text>
              ) : null}

              {/* Comment */}
              <Text
                style={[styles.label, { color: theme.colors.text, marginTop: 20 }]}
              >
                Комментарий
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.colors.text,
                    borderColor: errors.comment ? '#FF6B6B' : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                placeholder="Опиши подробно, что именно кажется неверным..."
                placeholderTextColor={theme.colors.textSecondary}
                value={comment}
                onChangeText={(text) => {
                  setComment(text);
                  setErrors((prev) => ({ ...prev, comment: '' }));
                }}
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
                {comment.length}/1000
              </Text>
              {errors.comment ? (
                <Text style={styles.errorText}>{errors.comment}</Text>
              ) : null}

              {/* Attachments */}
              <Text
                style={[styles.label, { color: theme.colors.text, marginTop: 20 }]}
              >
                Вложения (опционально)
              </Text>
              <Text style={[styles.attachHint, { color: theme.colors.textSecondary }]}>
                До {MAX_ATTACHMENTS} файлов, jpg/png/pdf, до 10 МБ каждый
              </Text>

              {/* Uploaded files */}
              {attachments.map((file, index) => (
                <View
                  key={index}
                  style={[
                    styles.attachmentItem,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  {file.type === 'photo' ? (
                    <Image source={{ uri: file.uri }} style={styles.attachThumb} />
                  ) : (
                    <Text style={styles.attachIcon}>📄</Text>
                  )}
                  <Text
                    style={[styles.attachName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {file.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeAttachment(index)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.attachRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Upload buttons */}
              {attachments.length < MAX_ATTACHMENTS && (
                <View style={styles.uploadRow}>
                  <TouchableOpacity
                    style={[
                      styles.uploadBtn,
                      {
                        borderColor: theme.colors.primary,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                    onPress={pickPhoto}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.uploadIcon}>📷</Text>
                    <Text style={[styles.uploadText, { color: theme.colors.primary }]}>
                      Фото
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.uploadBtn,
                      {
                        borderColor: theme.colors.primary,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
                    onPress={pickDocument}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.uploadIcon}>📎</Text>
                    <Text style={[styles.uploadText, { color: theme.colors.primary }]}>
                      Файл
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {errors.attachments ? (
                <Text style={styles.errorText}>{errors.attachments}</Text>
              ) : null}

              {/* Bottom padding for scroll */}
              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.footerBtn,
                  styles.cancelBtn,
                  { borderColor: theme.colors.border },
                ]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: theme.colors.text }]}>
                  Отменить
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.footerBtn,
                  styles.submitBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleSubmit}
                activeOpacity={0.7}
              >
                <Text style={styles.submitText}>Отправить</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerDesc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 24,
    paddingBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  optionsBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 13,
    flex: 1,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
  },
  attachHint: {
    fontSize: 12,
    marginBottom: 10,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  attachThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  attachIcon: {
    fontSize: 24,
  },
  attachName: {
    flex: 1,
    fontSize: 13,
  },
  attachRemove: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 18,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 2,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtn: {},
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
