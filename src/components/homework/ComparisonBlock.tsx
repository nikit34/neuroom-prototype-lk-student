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
      {items.map((item, index) => (
        <View key={index} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.text }]}>{item.label}</Text>

          <View style={styles.columns}>
            {/* Student version */}
            <View style={styles.column}>
              <Text style={[styles.columnTitle, { color: theme.colors.overdue }]}>Как у тебя</Text>
              {item.studentVersion.type === 'image' ? (
                <Pressable onPress={() => setPreviewUri(item.studentVersion.content)}>
                  <Image
                    source={{ uri: item.studentVersion.content }}
                    style={[styles.image, { borderColor: theme.colors.border }]}
                  />
                </Pressable>
              ) : (
                <View style={[styles.textBox, { backgroundColor: theme.colors.overdue + '15', borderColor: theme.colors.overdue + '40' }]}>
                  <Text style={[styles.versionText, { color: theme.colors.text }]}>
                    {item.studentVersion.content}
                  </Text>
                </View>
              )}
            </View>

            {/* Correct version */}
            <View style={styles.column}>
              <Text style={[styles.columnTitle, { color: theme.colors.success }]}>Как надо</Text>
              {item.correctVersion.type === 'image' ? (
                <Pressable onPress={() => setPreviewUri(item.correctVersion.content)}>
                  <Image
                    source={{ uri: item.correctVersion.content }}
                    style={[styles.image, { borderColor: theme.colors.border }]}
                  />
                </Pressable>
              ) : (
                <View style={[styles.textBox, { backgroundColor: theme.colors.success + '15', borderColor: theme.colors.success + '40' }]}>
                  <Text style={[styles.versionText, { color: theme.colors.text }]}>
                    {item.correctVersion.content}
                  </Text>
                </View>
              )}
            </View>
          </View>
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
    marginBottom: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  columns: {
    gap: 10,
  },
  column: {
  },
  columnTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  versionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
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
