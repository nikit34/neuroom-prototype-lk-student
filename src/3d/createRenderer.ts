import * as THREE from 'three';
import { ExpoWebGLRenderingContext } from 'expo-gl';

/**
 * Creates a THREE.WebGLRenderer that works with expo-gl's GL context.
 * Provides a canvas shim since THREE expects an HTMLCanvasElement
 * but we're in React Native.
 */
export function createRenderer(gl: ExpoWebGLRenderingContext): THREE.WebGLRenderer {
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;

  // Canvas shim for THREE.WebGLRenderer (needed in React Native where no DOM exists)
  const canvas = {
    width,
    height,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    clientWidth: width,
    clientHeight: height,
    getContext: () => gl,
  } as unknown as HTMLCanvasElement;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: gl as unknown as WebGLRenderingContext,
  });

  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);

  return renderer;
}
