import * as THREE from 'three';

/**
 * Minimal GLB parser for React Native.
 * Extracts mesh geometry from GLB binary data and builds a THREE.Group.
 * Skips textures/images (we apply our own materials).
 */

// glTF component type → TypedArray constructor
const COMPONENT_TYPES: Record<number, any> = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};

// glTF type → number of components
const TYPE_SIZES: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

interface GLTFJson {
  scenes?: { nodes: number[] }[];
  scene?: number;
  nodes?: {
    mesh?: number;
    children?: number[];
    translation?: number[];
    rotation?: number[];
    scale?: number[];
    name?: string;
  }[];
  meshes?: {
    primitives: {
      attributes: Record<string, number>;
      indices?: number;
      material?: number;
    }[];
    name?: string;
  }[];
  accessors?: {
    bufferView?: number;
    byteOffset?: number;
    componentType: number;
    count: number;
    type: string;
    min?: number[];
    max?: number[];
  }[];
  bufferViews?: {
    buffer: number;
    byteOffset?: number;
    byteLength: number;
    byteStride?: number;
  }[];
  materials?: {
    pbrMetallicRoughness?: {
      baseColorFactor?: number[];
    };
    name?: string;
  }[];
}

/**
 * Parse a GLB ArrayBuffer into a THREE.Group with geometry only.
 * Materials are replaced by the provided material or default gray.
 */
export function parseGLB(
  buffer: ArrayBuffer,
  material?: THREE.Material,
): THREE.Group {
  const view = new DataView(buffer);

  // Header
  const magic = view.getUint32(0, true);
  if (magic !== 0x46546C67) throw new Error('Not a valid GLB file');

  const version = view.getUint32(4, true);
  if (version !== 2) throw new Error(`Unsupported GLB version: ${version}`);

  // Chunk 0: JSON
  const jsonChunkLength = view.getUint32(12, true);
  const jsonChunkType = view.getUint32(16, true);
  if (jsonChunkType !== 0x4E4F534A) throw new Error('First chunk is not JSON');

  const jsonBytes = new Uint8Array(buffer, 20, jsonChunkLength);
  const jsonStr = new TextDecoder().decode(jsonBytes);
  const json: GLTFJson = JSON.parse(jsonStr);

  // Chunk 1: BIN
  const binOffset = 20 + jsonChunkLength;
  let binData: ArrayBuffer | null = null;
  if (binOffset + 8 < buffer.byteLength) {
    const binChunkLength = view.getUint32(binOffset, true);
    const binChunkType = view.getUint32(binOffset + 4, true);
    if (binChunkType === 0x004E4942) {
      binData = buffer.slice(binOffset + 8, binOffset + 8 + binChunkLength);
    }
  }

  if (!binData) throw new Error('No binary chunk found in GLB');

  // Helper: read accessor data
  function readAccessor(accessorIdx: number): { data: any; count: number; itemSize: number } {
    const accessor = json.accessors![accessorIdx];
    const bv = json.bufferViews![accessor.bufferView ?? 0];
    const TypedArr = COMPONENT_TYPES[accessor.componentType];
    const itemSize = TYPE_SIZES[accessor.type];
    const byteOffset = (bv.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const data = new TypedArr(binData!, byteOffset, accessor.count * itemSize);
    return { data, count: accessor.count, itemSize };
  }

  // Build meshes
  function buildMesh(meshIdx: number): THREE.Group {
    const mesh = json.meshes![meshIdx];
    const group = new THREE.Group();
    group.name = mesh.name || `mesh_${meshIdx}`;

    for (const prim of mesh.primitives) {
      const geo = new THREE.BufferGeometry();

      // Position
      if (prim.attributes.POSITION !== undefined) {
        const { data, count, itemSize } = readAccessor(prim.attributes.POSITION);
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(data), itemSize));
      }

      // Normal
      if (prim.attributes.NORMAL !== undefined) {
        const { data, count, itemSize } = readAccessor(prim.attributes.NORMAL);
        geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(data), itemSize));
      }

      // UV (optional, for future texture support)
      if (prim.attributes.TEXCOORD_0 !== undefined) {
        const { data, count, itemSize } = readAccessor(prim.attributes.TEXCOORD_0);
        geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(data), itemSize));
      }

      // Vertex colors (some models use these)
      if (prim.attributes.COLOR_0 !== undefined) {
        const { data, count, itemSize } = readAccessor(prim.attributes.COLOR_0);
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(data), itemSize));
      }

      // Indices
      if (prim.indices !== undefined) {
        const { data } = readAccessor(prim.indices);
        // Convert to Uint16 or Uint32 based on size
        if (data instanceof Uint32Array) {
          geo.setIndex(new THREE.BufferAttribute(new Uint32Array(data), 1));
        } else {
          geo.setIndex(new THREE.BufferAttribute(new Uint16Array(data), 1));
        }
      }

      geo.computeBoundingSphere();

      // Use provided material or extract base color from glTF material
      let mat = material;
      if (!mat && prim.material !== undefined && json.materials) {
        const gltfMat = json.materials[prim.material];
        const factor = gltfMat?.pbrMetallicRoughness?.baseColorFactor;
        if (factor) {
          mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(factor[0], factor[1], factor[2]),
            roughness: 0.7,
            metalness: 0.1,
          });
        }
      }

      if (!mat) {
        // Check for vertex colors
        if (geo.getAttribute('color')) {
          mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.1 });
        } else {
          mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7, metalness: 0.1 });
        }
      }

      const meshObj = new THREE.Mesh(geo, mat);
      group.add(meshObj);
    }

    return group;
  }

  // Build node hierarchy
  function buildNode(nodeIdx: number): THREE.Object3D {
    const node = json.nodes![nodeIdx];
    let obj: THREE.Object3D;

    if (node.mesh !== undefined) {
      obj = buildMesh(node.mesh);
    } else {
      obj = new THREE.Group();
    }

    obj.name = node.name || `node_${nodeIdx}`;

    if (node.translation) {
      obj.position.set(node.translation[0], node.translation[1], node.translation[2]);
    }
    if (node.rotation) {
      obj.quaternion.set(node.rotation[0], node.rotation[1], node.rotation[2], node.rotation[3]);
    }
    if (node.scale) {
      obj.scale.set(node.scale[0], node.scale[1], node.scale[2]);
    }

    if (node.children) {
      for (const childIdx of node.children) {
        obj.add(buildNode(childIdx));
      }
    }

    return obj;
  }

  // Build scene
  const root = new THREE.Group();
  const sceneIdx = json.scene ?? 0;
  const scene = json.scenes?.[sceneIdx];

  if (scene?.nodes) {
    for (const nodeIdx of scene.nodes) {
      root.add(buildNode(nodeIdx));
    }
  }

  return root;
}

/**
 * Recolor all meshes in a group with the given materials.
 */
export function recolorModel(
  group: THREE.Group,
  primary: THREE.MeshStandardMaterial,
  secondary: THREE.MeshStandardMaterial,
  accent: THREE.MeshStandardMaterial,
): void {
  const meshes: THREE.Mesh[] = [];
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) meshes.push(obj);
  });

  // Distribute colors across meshes: primary for most, secondary for middle parts, accent for details
  for (let i = 0; i < meshes.length; i++) {
    const ratio = meshes.length > 1 ? i / (meshes.length - 1) : 0;
    if (ratio < 0.4) {
      meshes[i].material = primary;
    } else if (ratio < 0.7) {
      meshes[i].material = secondary;
    } else {
      meshes[i].material = accent;
    }
  }
}
