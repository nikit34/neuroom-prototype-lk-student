import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Modal, Dimensions } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import type { ComparisonItem } from '@/src/types';

interface ComparisonBlockProps {
  items: ComparisonItem[];
}

export default function ComparisonBlock({ items }: ComparisonBlockProps) {
  const theme = useAppTheme();
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  return (
    <View style={styles.wrapper}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Разбор ошибок</Text>
        <View style={[styles.badge, { backgroundColor: theme.colors.overdue + '20' }]}>
          <Text style={[styles.badgeText, { color: theme.colors.overdue }]}>
            Ошибок: {items.length}
          </Text>
        </View>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.itemContainer}>
          {/* Error title */}
          <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
            {index + 1}. {item.label}
          </Text>

          {/* Description */}
          {item.description && (
            <Text style={[styles.itemDescription, { color: theme.colors.textSecondary }]}>
              {item.description}
            </Text>
          )}

          {/* Student version */}
          <Text style={[styles.blockLabel, { color: theme.colors.overdue }]}>Ошибка ученика</Text>
          {item.studentVersion.type === 'image' ? (
            <Pressable onPress={() => setPreviewUri(item.studentVersion.content)}>
              <Image
                source={{ uri: item.studentVersion.content }}
                style={[styles.image, { borderColor: theme.colors.border }]}
              />
            </Pressable>
          ) : (
            <View style={[styles.textBox, { backgroundColor: theme.colors.overdue + '12', borderColor: theme.colors.overdue + '30' }]}>
              <Text style={[styles.versionText, { color: theme.colors.text }]}>
                {item.studentVersion.content}
              </Text>
            </View>
          )}

          {/* Correct version */}
          <Text style={[styles.blockLabel, { color: theme.colors.success, marginTop: 12 }]}>Правильный ответ</Text>
          {item.correctVersion.type === 'image' ? (
            <Pressable onPress={() => setPreviewUri(item.correctVersion.content)}>
              <Image
                source={{ uri: item.correctVersion.content }}
                style={[styles.image, { borderColor: theme.colors.border }]}
              />
            </Pressable>
          ) : (
            <View style={[styles.textBox, { backgroundColor: theme.colors.success + '12', borderColor: theme.colors.success + '30' }]}>
              <Text style={[styles.versionText, { color: theme.colors.text }]}>
                {item.correctVersion.content}
              </Text>
            </View>
          )}
        </View>
      ))}

      {/* Fullscreen preview */}
      <Modal visible={!!previewUri} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPreviewUri(null)}>
          {previewUri && (
            <Image
              source={{ uri: previewUri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.modalClose}>Закрыть</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemContainer: {
    marginBottom: 20,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  blockLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  versionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#f0f0f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: Dimensions.get('window').width - 32,
    height: Dimensions.get('window').height * 0.7,
  },
  modalClose: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    padding: 12,
  },
});
