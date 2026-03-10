import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import type { ComparisonItem, Appeal } from '@/src/types';

interface ComparisonBlockProps {
  items: ComparisonItem[];
  onDisputeError?: (index: number) => void;
  getErrorAppeal?: (index: number) => Appeal | undefined;
}

function InlineAppealStatus({ appeal }: { appeal: Appeal }) {
  const theme = useAppTheme();

  if (appeal.status === 'pending') {
    return (
      <View style={[inlineStyles.container, { backgroundColor: '#FFF9E6', borderColor: '#FFE5B3' }]}>
        <ActivityIndicator size="small" color="#FFB912" />
        <View style={inlineStyles.textWrap}>
          <Text style={inlineStyles.title}>На проверке</Text>
          <Text style={[inlineStyles.hint, { color: theme.colors.textSecondary }]}>
            Учитель рассмотрит в течение 72 ч
          </Text>
        </View>
      </View>
    );
  }

  const isAccepted = appeal.status === 'accepted';
  const isRejected = appeal.status === 'rejected';

  const bgColor = isAccepted ? '#E6F9F0' : isRejected ? '#FFF9E6' : '#F3EEFF';
  const borderColor = isAccepted ? '#B3E5D1' : isRejected ? '#FFE5B3' : '#D3C5FF';
  const icon = isAccepted ? '✓' : isRejected ? '✕' : '◐';
  const iconColor = isAccepted ? '#10B981' : isRejected ? '#FF7070' : '#7C5CFC';
  const label = isAccepted
    ? 'Ошибку сняли'
    : isRejected
      ? 'Ошибка подтверждена'
      : 'Частично принято';

  return (
    <View style={[inlineStyles.container, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[inlineStyles.icon, { color: iconColor }]}>{icon}</Text>
      <View style={inlineStyles.textWrap}>
        <Text style={inlineStyles.title}>{label}</Text>
        {appeal.teacherComment && (
          <Text style={inlineStyles.comment} numberOfLines={2}>
            {appeal.teacherComment}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function ComparisonBlock({
  items,
  onDisputeError,
  getErrorAppeal,
}: ComparisonBlockProps) {
  const theme = useAppTheme();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
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

      {items.map((item, index) => {
        const isExpanded = expandedItems.has(index);
        const errorAppeal = getErrorAppeal?.(index);

        return (
          <View
            key={index}
            style={[
              styles.errorCard,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
            ]}
          >
            {/* Error number badge */}
            <View style={styles.errorHeader}>
              <View
                style={[
                  styles.errorNumberBadge,
                  { backgroundColor: theme.colors.primary + '33' },
                ]}
              >
                <Text style={[styles.errorNumberText, { color: theme.colors.text }]}>
                  {index + 1}. {item.label}
                </Text>
              </View>
            </View>

            {/* Student error block — tinted with overdue color */}
            <View
              style={[styles.studentBlock, { backgroundColor: theme.colors.overdue + '15' }]}
            >
              <Text style={[styles.blockLabel, { color: theme.colors.overdue }]}>
                Ошибка ученика
              </Text>
              {item.studentVersion.type === 'image' ? (
                <Pressable onPress={() => setPreviewUri(item.studentVersion.content)}>
                  <Image
                    source={{ uri: item.studentVersion.content }}
                    style={[styles.blockImage, { backgroundColor: theme.colors.surface }]}
                  />
                  <View
                    style={[
                      styles.expandImageBtn,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={styles.expandImageIcon}>⤢</Text>
                  </View>
                </Pressable>
              ) : (
                <Text style={[styles.blockContent, { color: theme.colors.text }]}>
                  {item.studentVersion.content}
                </Text>
              )}
            </View>

            {/* Correct answer block — tinted with primary color */}
            <View
              style={[styles.correctBlock, { backgroundColor: theme.colors.primary + '10' }]}
            >
              <Text style={[styles.blockLabel, { color: theme.colors.primary }]}>
                Правильный ответ
              </Text>
              {item.correctVersion.type === 'image' ? (
                <Pressable onPress={() => setPreviewUri(item.correctVersion.content)}>
                  <Image
                    source={{ uri: item.correctVersion.content }}
                    style={[styles.blockImage, { backgroundColor: theme.colors.surface }]}
                  />
                  <View
                    style={[
                      styles.expandImageBtn,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={styles.expandImageIcon}>⤢</Text>
                  </View>
                </Pressable>
              ) : (
                <Text style={[styles.blockContent, { color: theme.colors.primary }]}>
                  {item.correctVersion.content}
                </Text>
              )}
            </View>

            {/* Description expand/collapse */}
            {item.description && (
              <>
                <Pressable style={styles.expandRow} onPress={() => toggleExpand(index)}>
                  <Text style={[styles.expandArrow, { color: theme.colors.primary }]}>
                    {isExpanded ? '˄' : '˅'}
                  </Text>
                  <Text style={[styles.expandText, { color: theme.colors.primary }]}>
                    {isExpanded ? 'Свернуть' : 'Подробнее'}
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

            {/* Per-error dispute button or inline appeal status */}
            {errorAppeal ? (
              <InlineAppealStatus appeal={errorAppeal} />
            ) : onDisputeError ? (
              <Pressable
                style={[
                  styles.disputeBtn,
                  { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                ]}
                onPress={() => onDisputeError(index)}
              >
                <Text style={styles.disputeBtnIcon}>✋</Text>
                <Text
                  style={[styles.disputeBtnText, { color: theme.colors.text }]}
                >
                  Оспорить ошибку
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}

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

const inlineStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#272443',
  },
  hint: {
    fontSize: 11,
  },
  comment: {
    fontSize: 11,
    color: '#747788',
  },
});

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

  /* Error card */
  errorCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  errorNumberText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Colored blocks */
  studentBlock: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  correctBlock: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  blockLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  blockContent: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },

  /* Image in blocks */
  blockImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
  expandImageBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandImageIcon: {
    color: '#fff',
    fontSize: 16,
  },

  /* Expand / collapse */
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandArrow: {
    fontSize: 14,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.3,
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

  /* Dispute button */
  disputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  disputeBtnIcon: {
    fontSize: 14,
  },
  disputeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Modal */
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
