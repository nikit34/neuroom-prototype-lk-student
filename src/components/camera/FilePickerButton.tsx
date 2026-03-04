import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '@/src/hooks/useAppTheme';

interface FilePickerButtonProps {
  onPick: (uri: string, type: 'image' | 'document') => void;
  label?: string;
}

export default function FilePickerButton({
  onPick,
  label = 'Прикрепить файл',
}: FilePickerButtonProps) {
  const theme = useAppTheme();

  const handlePress = () => {
    Alert.alert('Выберите источник', undefined, [
      {
        text: 'Фото из галереи',
        onPress: pickImage,
      },
      {
        text: 'Документ',
        onPress: pickDocument,
      },
      {
        text: 'Отмена',
        style: 'cancel',
      },
    ]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onPick(result.assets[0].uri, 'image');
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      onPick(result.assets[0].uri, 'document');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>📎</Text>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
