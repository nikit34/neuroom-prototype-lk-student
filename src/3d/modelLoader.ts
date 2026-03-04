import * as THREE from 'three';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { parseGLB, recolorModel } from './GLBParser';
import { Character3DConfig, MascotState, CharacterCustomization } from '../types';
import { getHealthEffect, desaturateColor } from './healthEffects';

// Cache parsed models (geometry only — cloned and recolored per use)
const modelCache = new Map<string, THREE.Group>();

function makeMat(hex: string, desaturation: number, emissiveIntensity: number): THREE.MeshStandardMaterial {
  const color = desaturation > 0 ? desaturateColor(hex, desaturation) : parseInt(hex.slice(1), 16);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.15 });
  if (emissiveIntensity > 0) {
    mat.emissive = new THREE.Color(color);
    mat.emissiveIntensity = emissiveIntensity;
  }
  return mat;
}

/**
 * Load a GLB model, parse it, and apply character colors.
 */
export async function loadCharacterModel(
  config3d: Character3DConfig,
  mascotState: MascotState,
  customization?: Partial<CharacterCustomization>,
): Promise<THREE.Group> {
  if (!config3d.modelUrl) {
    throw new Error('No modelUrl in config3d');
  }

  const cacheKey = config3d.modelUrl;

  // Load and parse model (cached)
  if (!modelCache.has(cacheKey)) {
    const assetModule = modelAssets[config3d.modelUrl];
    if (!assetModule) {
      throw new Error(`Unknown model: ${config3d.modelUrl}`);
    }

    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();

    const localUri = asset.localUri;
    if (!localUri) throw new Error('Failed to download model asset');

    // Read as ArrayBuffer using new expo-file-system API
    const file = new File(localUri);
    const buffer = await file.arrayBuffer();

    const group = parseGLB(buffer);
    modelCache.set(cacheKey, group);
  }

  // Clone the cached model
  const original = modelCache.get(cacheKey)!;
  const clone = original.clone();

  // Apply colors (with customization overrides)
  const fx = getHealthEffect(mascotState);
  const primaryColor = customization?.skinColor || config3d.primaryColor;
  const secondaryColor = customization?.clothesColor || config3d.secondaryColor;
  const accentColor = customization?.shoesColor || config3d.accentColor;
  const primary = makeMat(primaryColor, fx.colorDesaturation, fx.emissiveIntensity);
  const secondary = makeMat(secondaryColor, fx.colorDesaturation, fx.emissiveIntensity);
  const accent = makeMat(accentColor, fx.colorDesaturation, fx.emissiveIntensity);

  recolorModel(clone, primary, secondary, accent);

  // Apply scale and health effects
  const s = config3d.scale * fx.scaleMultiplier;
  clone.scale.set(s, s, s);
  clone.rotation.x = fx.tiltX;

  // Center the model vertically, feet on ground
  const box = new THREE.Box3().setFromObject(clone);
  const center = box.getCenter(new THREE.Vector3());
  clone.position.x = -center.x;
  clone.position.z = -center.z;
  clone.position.y = -box.min.y;

  return clone;
}

// Registry of model assets — maps model name to require() call
const modelAssets: Record<string, number> = {
  // KayKit Adventurers
  'Barbarian': require('@/assets/models/Barbarian.glb'),
  'Knight': require('@/assets/models/Knight.glb'),
  'Mage': require('@/assets/models/Mage.glb'),
  'Rogue': require('@/assets/models/Rogue.glb'),
  'Rogue_Hooded': require('@/assets/models/Rogue_Hooded.glb'),
  // KayKit Skeletons
  'Skeleton_Mage': require('@/assets/models/Skeleton_Mage.glb'),
  'Skeleton_Minion': require('@/assets/models/Skeleton_Minion.glb'),
  'Skeleton_Rogue': require('@/assets/models/Skeleton_Rogue.glb'),
  'Skeleton_Warrior': require('@/assets/models/Skeleton_Warrior.glb'),
  // Quaternius Animals
  'Wolf': require('@/assets/models/Wolf.glb'),
  'Fox': require('@/assets/models/Fox.glb'),
  'Husky': require('@/assets/models/Husky.glb'),
  'ShibaInu': require('@/assets/models/ShibaInu.glb'),
  'Stag': require('@/assets/models/Stag.glb'),
  // Quaternius Dinosaurs
  'Trex': require('@/assets/models/Trex.glb'),
  'Velociraptor': require('@/assets/models/Velociraptor.glb'),
  // Quaternius Humans
  'King': require('@/assets/models/King.glb'),
  'Swat': require('@/assets/models/Swat.glb'),
  'Adventurer': require('@/assets/models/Adventurer.glb'),
  'Punk': require('@/assets/models/Punk.glb'),
  'Woman_Medieval': require('@/assets/models/Woman_Medieval.glb'),
  'Woman_Witch': require('@/assets/models/Woman_Witch.glb'),
  'Woman_Adventurer': require('@/assets/models/Woman_Adventurer.glb'),
  'KnightCharacter': require('@/assets/models/KnightCharacter.glb'),
  'Character': require('@/assets/models/Character.glb'),
};
