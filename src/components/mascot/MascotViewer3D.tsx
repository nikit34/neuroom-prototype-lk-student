import React, { useRef, useCallback, useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { Character3DConfig, MascotState, CharacterCustomization } from '@/src/types';
import { createRenderer } from '@/src/3d/createRenderer';
import { buildCharacter } from '@/src/3d/CharacterFactory';
import { loadCharacterModel } from '@/src/3d/modelLoader';
import { getHealthEffect } from '@/src/3d/healthEffects';
import { createRotationPanResponder, RotationState } from '@/src/3d/touchRotation';
import { createAnimator, updateAnimator, AnimatorState } from '@/src/3d/characterAnimator';

interface Props {
  config3d: Character3DConfig;
  mascotState: MascotState;
  width?: number;
  height?: number;
  customization?: Partial<CharacterCustomization>;
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

function MascotViewer3D({ config3d, mascotState, width = 200, height = 200, customization }: Props) {
  const sceneRef = useRef<SceneState | null>(null);
  const rotationRef = useRef<RotationState>({ y: 0 });
  const configRef = useRef({ config3d, mascotState, customization });
  const [glError, setGlError] = useState(false);
  const [loading, setLoading] = useState(!!config3d.modelUrl);

  configRef.current = { config3d, mascotState, customization };

  useEffect(() => {
    return () => {
      const s = sceneRef.current;
      if (s) {
        s.disposed = true;
        if (s.animationFrameId !== null) cancelAnimationFrame(s.animationFrameId);
        s.characterGroup.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
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

  // Load GLB model and add to scene when ready
  const loadGLBModel = useCallback(async (
    characterGroup: THREE.Group,
    cfg: Character3DConfig,
    state: MascotState,
    cust?: Partial<CharacterCustomization>,
  ) => {
    try {
      const model = await loadCharacterModel(cfg, state, cust);
      if (sceneRef.current?.disposed) return;
      // Clear existing children
      while (characterGroup.children.length > 0) {
        const child = characterGroup.children[0];
        characterGroup.remove(child);
        child.traverse((obj: any) => {
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
            else obj.material.dispose();
          }
        });
      }
      characterGroup.add(model);
      setLoading(false);
    } catch (e) {
      console.warn('[MascotViewer3D] GLB load failed, falling back to procedural:', e);
      // Fallback to procedural model
      const group = buildCharacter(cfg, state, cust);
      if (!sceneRef.current?.disposed) {
        characterGroup.add(group);
      }
      setLoading(false);
    }
  }, []);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    try {
      const renderer = createRenderer(gl);
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 1.2, 4.5);
      camera.lookAt(0, 0.8, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const dir = new THREE.DirectionalLight(0xffffff, 1.0);
      dir.position.set(3, 5, 4);
      scene.add(dir);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
      fillLight.position.set(-3, 2, -2);
      scene.add(fillLight);

      const characterGroup = new THREE.Group();
      scene.add(characterGroup);

      const currentConfig = configRef.current;

      // Use GLB if modelUrl is set, otherwise procedural
      if (currentConfig.config3d.modelUrl) {
        loadGLBModel(characterGroup, currentConfig.config3d, currentConfig.mascotState, currentConfig.customization);
      } else {
        const group = buildCharacter(currentConfig.config3d, currentConfig.mascotState, currentConfig.customization);
        characterGroup.add(group);
        setLoading(false);
      }

      let lastConfig = currentConfig.config3d;
      let lastState = currentConfig.mascotState;
      let lastCustomization = currentConfig.customization;
      const animator = createAnimator();

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

        const delta = time - lastFrameTime;
        if (delta < FRAME_INTERVAL) {
          state.animationFrameId = requestAnimationFrame(loop);
          return;
        }
        lastFrameTime = time - (delta % FRAME_INTERVAL);

        const current = configRef.current;

        // Rebuild when config, state, or customization changes
        if (current.config3d !== lastConfig || current.mascotState !== lastState || current.customization !== lastCustomization) {
          while (characterGroup.children.length > 0) {
            const child = characterGroup.children[0];
            characterGroup.remove(child);
            child.traverse((obj: any) => {
              if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
                else obj.material.dispose();
              }
            });
          }

          if (current.config3d.modelUrl) {
            loadGLBModel(characterGroup, current.config3d, current.mascotState, current.customization);
          } else {
            const newGroup = buildCharacter(current.config3d, current.mascotState, current.customization);
            characterGroup.add(newGroup);
          }

          lastConfig = current.config3d;
          lastState = current.mascotState;
          lastCustomization = current.customization;
        }

        // Idle animations + periodic actions
        const fx = getHealthEffect(current.mascotState);
        const t = time * 0.001;

        // Get action transform (jump, spin, wave, etc.)
        const action = updateAnimator(animator, t, current.mascotState);

        // Bounce + action vertical offset
        const idleBounce = Math.sin(t * 2 * fx.bounceSpeed) * 0.15 * fx.bounceAmplitude;
        characterGroup.position.y = idleBounce + action.posY;

        // Sway + action tilt
        const idleSway = Math.sin(t * 1.3 * fx.swaySpeed) * fx.swayAmplitude;
        characterGroup.rotation.z = idleSway + action.rotZ;

        // Breathing + action squash-stretch
        const breathe = 1 + Math.sin(t * 1.8 * fx.breatheSpeed) * fx.breatheAmplitude;
        characterGroup.scale.set(
          breathe * action.scaleX,
          breathe * action.scaleY,
          breathe * action.scaleX,
        );

        // Rotation: user touch or auto-rotate + action spin
        const userRotation = rotationRef.current.y;
        if (Math.abs(userRotation) < 0.01) {
          characterGroup.rotation.y = t * fx.autoRotateSpeed + action.rotY;
        } else {
          characterGroup.rotation.y = userRotation + action.rotY;
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
  }, [width, height, loadGLBModel]);

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
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
});
