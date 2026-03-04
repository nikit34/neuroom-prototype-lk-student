import React, { useRef, useCallback, useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { Character3DConfig, MascotState } from '@/src/types';
import { createRenderer } from '@/src/3d/createRenderer';
import { buildCharacter } from '@/src/3d/CharacterFactory';
import { getHealthEffect } from '@/src/3d/healthEffects';
import { createRotationPanResponder, RotationState } from '@/src/3d/touchRotation';

interface Props {
  config3d: Character3DConfig;
  mascotState: MascotState;
  width?: number;
  height?: number;
}

interface SceneState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  characterGroup: THREE.Group;
  disposed: boolean;
  animationFrameId: number | null;
}

const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

function MascotViewer3D({ config3d, mascotState, width = 200, height = 200 }: Props) {
  const sceneRef = useRef<SceneState | null>(null);
  const rotationRef = useRef<RotationState>({ y: 0 });
  const configRef = useRef({ config3d, mascotState });
  const [glError, setGlError] = useState(false);

  configRef.current = { config3d, mascotState };

  useEffect(() => {
    return () => {
      const s = sceneRef.current;
      if (s) {
        s.disposed = true;
        if (s.animationFrameId !== null) cancelAnimationFrame(s.animationFrameId);
        s.characterGroup.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            // Don't dispose geometry - it's cached and shared
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
        s.scene.clear();
        s.renderer.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  const panResponder = useRef(
    createRotationPanResponder(rotationRef, (y) => {
      const s = sceneRef.current;
      if (s) s.characterGroup.rotation.y = y;
    }),
  ).current;

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    try {
      const renderer = createRenderer(gl);

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 1.0, 4.5);
      camera.lookAt(0, 0.9, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const dir = new THREE.DirectionalLight(0xffffff, 0.9);
      dir.position.set(3, 4, 5);
      scene.add(dir);

      const characterGroup = new THREE.Group();
      scene.add(characterGroup);

      const group = buildCharacter(configRef.current.config3d, configRef.current.mascotState);
      characterGroup.add(group);

      let lastConfig = configRef.current.config3d;
      let lastState = configRef.current.mascotState;

      const state: SceneState = {
        renderer,
        scene,
        camera,
        characterGroup,
        disposed: false,
        animationFrameId: null,
      };
      sceneRef.current = state;

      let lastFrameTime = 0;

      const loop = (time: number) => {
        if (state.disposed) return;

        // Throttle to TARGET_FPS
        const delta = time - lastFrameTime;
        if (delta < FRAME_INTERVAL) {
          state.animationFrameId = requestAnimationFrame(loop);
          return;
        }
        lastFrameTime = time - (delta % FRAME_INTERVAL);

        const current = configRef.current;

        // Rebuild only when config or state actually changed
        if (current.config3d !== lastConfig || current.mascotState !== lastState) {
          while (characterGroup.children.length > 0) {
            const child = characterGroup.children[0];
            characterGroup.remove(child);
            child.traverse((obj: any) => {
              // Don't dispose geometry - it's cached and shared
              if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
                else obj.material.dispose();
              }
            });
          }
          const newGroup = buildCharacter(current.config3d, current.mascotState);
          characterGroup.add(newGroup);
          lastConfig = current.config3d;
          lastState = current.mascotState;
        }

        // Idle animations
        const fx = getHealthEffect(current.mascotState);
        const t = time * 0.001; // time in seconds

        // Bounce (up-down)
        characterGroup.position.y = Math.sin(t * 2 * fx.bounceSpeed) * 0.15 * fx.bounceAmplitude;

        // Sway (side tilt)
        characterGroup.rotation.z = Math.sin(t * 1.3 * fx.swaySpeed) * fx.swayAmplitude;

        // Breathing (scale pulse)
        const breathe = 1 + Math.sin(t * 1.8 * fx.breatheSpeed) * fx.breatheAmplitude;
        characterGroup.scale.setScalar(breathe);

        // Auto-rotate + manual touch rotation
        const userRotation = rotationRef.current.y;
        if (Math.abs(userRotation) < 0.01) {
          // No touch — slow auto-rotate
          characterGroup.rotation.y = t * fx.autoRotateSpeed;
        } else {
          characterGroup.rotation.y = userRotation;
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
        state.animationFrameId = requestAnimationFrame(loop);
      };

      state.animationFrameId = requestAnimationFrame(loop);
    } catch (e) {
      console.error('[MascotViewer3D] GL init error:', e);
      setGlError(true);
    }
  }, [width, height]);

  if (glError) {
    return (
      <View style={[styles.fallback, { width, height }]}>
        <Text style={styles.fallbackEmoji}>🎮</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]} {...panResponder.panHandlers}>
      <GLView
        style={{ width, height }}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

export default memo(MascotViewer3D);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackEmoji: {
    fontSize: 80,
  },
});
