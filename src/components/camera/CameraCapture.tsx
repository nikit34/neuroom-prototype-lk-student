import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useAppTheme } from '@/src/hooks/useAppTheme';

interface CameraCaptureProps {
  onCapture: (uri: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const theme = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          Загрузка...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.message, { color: theme.colors.text }]}>
          Для съёмки необходим доступ к камере
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Разрешить камеру</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сделать снимок. Попробуйте ещё раз.');
    }
  };

  const toggleFacing = () => {
    setFacing(prev => (prev === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.flipButton} onPress={toggleFacing}>
            <Text style={styles.flipText}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <View style={styles.flipButton} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipText: {
    fontSize: 22,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
