import * as THREE from 'three';
import { ExpoWebGLRenderingContext } from 'expo-gl';

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  characterGroup: THREE.Group;
  private gl: ExpoWebGLRenderingContext;
  private animationFrameId: number | null = null;
  private disposed = false;

  constructor(gl: ExpoWebGLRenderingContext, width: number, height: number) {
    this.gl = gl;

    // Create a canvas shim that THREE.WebGLRenderer needs
    const glAny = gl as any;
    const canvasShim = {
      width: glAny.drawingBufferWidth,
      height: glAny.drawingBufferHeight,
      style: {} as CSSStyleDeclaration,
      addEventListener: () => {},
      removeEventListener: () => {},
      clientWidth: glAny.drawingBufferWidth,
      clientHeight: glAny.drawingBufferHeight,
      getContext: () => gl,
    } as unknown as HTMLCanvasElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvasShim,
      context: gl as unknown as WebGLRenderingContext,
    });
    this.renderer.setSize(glAny.drawingBufferWidth, glAny.drawingBufferHeight);
    this.renderer.setClearColor(0x000000, 0);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 1.0, 4.5);
    this.camera.lookAt(0, 0.9, 0);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.9);
    directional.position.set(3, 4, 5);
    this.scene.add(directional);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-2, 2, -3);
    this.scene.add(backLight);

    // Character group
    this.characterGroup = new THREE.Group();
    this.scene.add(this.characterGroup);
  }

  setRotationY(y: number) {
    this.characterGroup.rotation.y = y;
  }

  renderFrame() {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
    // endFrameEXP flushes the GL commands on native expo-gl
    if (typeof this.gl.endFrameEXP === 'function') {
      this.gl.endFrameEXP();
    }
  }

  startRenderLoop(onFrame?: (time: number) => void) {
    const loop = (time: number) => {
      if (this.disposed) return;
      onFrame?.(time);
      this.renderFrame();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stopRenderLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  dispose() {
    this.disposed = true;
    this.stopRenderLoop();

    this.characterGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.scene.clear();
    this.renderer.dispose();
  }
}
