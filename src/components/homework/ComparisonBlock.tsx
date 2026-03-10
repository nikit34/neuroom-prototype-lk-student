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
  const [pageExpanded, setPageExpanded] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <View style={styles.wrapper}>
      {/* Section title */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Разбор ошибок
      </Text>

      {/* Card */}
      <View style={styles.card}>
        {/* Page header */}
        <Pressable style={styles.pageHeader} onPress={() => setPageExpanded(!pageExpanded)}>
          <View style={styles.pageHeaderLeft}>
            <Text style={styles.pageTitle}>Страница №1</Text>
            <View style={[styles.errorCountBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.errorCountText}>Ошибки:{items.length}</Text>
            </View>
          </View>
          <Text style={[styles.collapseArrow, { color: theme.colors.text }]}>
            {pageExpanded ? '▲' : '▼'}
          </Text>
        </Pressable>

        {/* Error items */}
        {pageExpanded &&
          items.map((item, index) => {
            const isExpanded = expandedItems.has(index);
            return (
              <View key={index} style={styles.itemContainer}>
                {/* Error type badge */}
                <View style={styles.itemBadgeRow}>
                  <View style={[styles.itemBadge, { backgroundColor: theme.colors.primary + '33' }]}>
                    <Text style={styles.itemBadgeText}>
                      {index + 1}. {item.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.versionsWrap}>
                  {/* Student version */}
                  <View style={styles.versionBlock}>
                    <Text style={styles.versionLabel}>В твоем ответе:</Text>
                    {item.studentVersion.type === 'image' ? (
                      <Pressable onPress={() => setPreviewUri(item.studentVersion.content)}>
                        <Image
                          source={{ uri: item.studentVersion.content }}
                          style={[styles.image, { borderColor: theme.colors.border }]}
                        />
                      </Pressable>
                    ) : (
                      <Text style={styles.versionContent}>
                        {item.studentVersion.content}
                      </Text>
                    )}
                  </View>

                  {/* Correct version */}
                  <View style={styles.versionBlock}>
                    <Text style={styles.versionLabel}>Как должно быть:</Text>
                    {item.correctVersion.type === 'image' ? (
                      <Pressable onPress={() => setPreviewUri(item.correctVersion.content)}>
                        <Image
                          source={{ uri: item.correctVersion.content }}
                          style={[styles.image, { borderColor: theme.colors.border }]}
                        />
                      </Pressable>
                    ) : (
                      <Text style={styles.versionContent}>
                        {item.correctVersion.content}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Expand / collapse */}
                {item.description && (
                  <>
                    <Pressable style={styles.expandRow} onPress={() => toggleItem(index)}>
                      <Text style={[styles.expandArrow, { color: theme.colors.primary }]}>
                        {isExpanded ? '˄' : '˅'}
                      </Text>
                      <Text style={[styles.expandText, { color: theme.colors.primary }]}>
                        {isExpanded ? 'Свернуть' : 'Развернуть'}
                      </Text>
                    </Pressable>

                    {isExpanded && (
                      <View
                        style={[
                          styles.descriptionBubble,
                          { backgroundColor: theme.colors.primary + '12' },
                        ]}
                      >
                        <Text style={styles.descriptionIcon}>💡</Text>
                        <Text style={[styles.descriptionText, { color: theme.colors.text }]}>
                          {item.description}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          })}
      </View>

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
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEFF8',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  pageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#252836',
  },
  errorCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 4,
    gap: 2,
  },
  errorCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
  },
  collapseArrow: {
    fontSize: 14,
    width: 24,
    textAlign: 'center',
  },
  itemContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E9EAEB',
    padding: 16,
    gap: 8,
  },
  itemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemBadge: {
    paddingLeft: 4,
    paddingRight: 8,
    height: 16,
    borderRadius: 4,
    justifyContent: 'center',
  },
  itemBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E1E1E',
    letterSpacing: 0.4,
  },
  versionsWrap: {
    paddingHorizontal: 8,
    gap: 8,
  },
  versionBlock: {
    gap: 2,
  },
  versionLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#747788',
    letterSpacing: 0.4,
    paddingVertical: 4,
  },
  versionContent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#272443',
    lineHeight: 22,
    letterSpacing: -0.028,
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 16,
  },
  expandArrow: {
    fontSize: 12,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  descriptionBubble: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  descriptionIcon: {
    fontSize: 14,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
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
