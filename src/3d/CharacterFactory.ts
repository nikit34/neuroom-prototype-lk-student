import * as THREE from 'three';
import { Character3DConfig, MascotState } from '../types';
import { getHealthEffect, desaturateColor } from './healthEffects';

// ─── Geometry cache ──────────────────────────────────────────────
// Reuse geometry instances across builds (geometry is immutable data, only materials change)
const geoCache = new Map<string, THREE.BufferGeometry>();

function cachedGeo(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geo = geoCache.get(key);
  if (!geo) {
    geo = factory();
    geoCache.set(key, geo);
  }
  return geo;
}

function makeMat(hex: string, desaturation: number, emissiveIntensity: number): THREE.MeshStandardMaterial {
  const color = desaturation > 0 ? desaturateColor(hex, desaturation) : parseInt(hex.slice(1), 16);
  const mat = new THREE.MeshStandardMaterial({ color });
  if (emissiveIntensity > 0) {
    mat.emissive = new THREE.Color(color);
    mat.emissiveIntensity = emissiveIntensity;
  }
  return mat;
}

const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

function addEyes(group: THREE.Group, headY: number, headRadius: number) {
  const k = Math.round(headRadius * 100); // cache key by size
  const eyeGeo = cachedGeo(`eye_${k}`, () => new THREE.SphereGeometry(headRadius * 0.12, 8, 8));
  const pupilGeo = cachedGeo(`pupil_${k}`, () => new THREE.SphereGeometry(headRadius * 0.07, 8, 8));

  const spacing = headRadius * 0.3;

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * spacing, headY, headRadius * 0.85);
    group.add(eye);

    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(side * spacing, headY, headRadius * 0.95);
    group.add(pupil);
  }
}

// ─── Body builders ───────────────────────────────────────────────

function buildHumanoid(config: Character3DConfig, primary: THREE.MeshStandardMaterial, secondary: THREE.MeshStandardMaterial, accent: THREE.MeshStandardMaterial): THREE.Group {
  const group = new THREE.Group();

  // Head
  const headRadius = 0.35;
  let headGeo: THREE.BufferGeometry;
  switch (config.headShape) {
    case 'cube':
      headGeo = cachedGeo('head_cube', () => new THREE.BoxGeometry(headRadius * 1.6, headRadius * 1.6, headRadius * 1.6));
      break;
    case 'cone':
      headGeo = cachedGeo('head_cone', () => new THREE.ConeGeometry(headRadius, headRadius * 2, 12));
      break;
    case 'cylinder':
      headGeo = cachedGeo('head_cyl', () => new THREE.CylinderGeometry(headRadius, headRadius, headRadius * 1.4, 12));
      break;
    default:
      headGeo = cachedGeo('head_sphere', () => new THREE.SphereGeometry(headRadius, 16, 16));
  }
  const head = new THREE.Mesh(headGeo, primary);
  head.position.y = 2.0;
  group.add(head);

  addEyes(group, 2.0, headRadius);

  // Body (cylinder)
  const bodyGeo = cachedGeo('hum_body', () => new THREE.CylinderGeometry(0.3, 0.35, 0.9, 12));
  const body = new THREE.Mesh(bodyGeo, secondary);
  body.position.y = 1.25;
  group.add(body);

  // Arms
  const armGeo = cachedGeo('hum_arm', () => new THREE.CylinderGeometry(0.08, 0.08, 0.65, 8));
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, primary);
    arm.position.set(side * 0.45, 1.3, 0);
    arm.rotation.z = side * 0.2;
    group.add(arm);
  }

  // Legs
  const legGeo = cachedGeo('hum_leg', () => new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8));
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, accent);
    leg.position.set(side * 0.18, 0.45, 0);
    group.add(leg);
  }

  return group;
}

function buildQuadruped(config: Character3DConfig, primary: THREE.MeshStandardMaterial, secondary: THREE.MeshStandardMaterial, accent: THREE.MeshStandardMaterial): THREE.Group {
  const group = new THREE.Group();

  // Head
  const headGeo = cachedGeo('quad_head', () => new THREE.SphereGeometry(0.3, 16, 16));
  const head = new THREE.Mesh(headGeo, primary);
  head.position.set(0.6, 1.1, 0);
  group.add(head);

  addEyes(group, 1.1, 0.25);
  // Shift eyes forward for quadruped
  group.children.forEach(c => {
    if (c.position.z > 0 && c.position.y === 1.1) {
      c.position.x += 0.6;
    }
  });

  // Snout
  const snoutGeo = cachedGeo('quad_snout', () => new THREE.SphereGeometry(0.12, 8, 8));
  const snout = new THREE.Mesh(snoutGeo, secondary);
  snout.position.set(0.85, 1.05, 0);
  group.add(snout);

  // Body (elongated)
  const bodyGeo = cachedGeo('quad_body', () => new THREE.CylinderGeometry(0.25, 0.28, 0.9, 12));
  const body = new THREE.Mesh(bodyGeo, secondary);
  body.position.set(0, 0.85, 0);
  body.rotation.z = Math.PI / 2;
  group.add(body);

  // 4 legs
  const legGeo = cachedGeo('quad_leg', () => new THREE.CylinderGeometry(0.06, 0.06, 0.55, 8));
  const legPositions = [
    [-0.3, 0.3, 0.18],
    [-0.3, 0.3, -0.18],
    [0.3, 0.3, 0.18],
    [0.3, 0.3, -0.18],
  ];
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeo, accent);
    leg.position.set(x, y, z);
    group.add(leg);
  }

  // Tail
  if (config.hasTail !== false) {
    const tailGeo = cachedGeo('quad_tail', () => new THREE.CylinderGeometry(0.03, 0.06, 0.4, 8));
    const tail = new THREE.Mesh(tailGeo, primary);
    tail.position.set(-0.6, 1.0, 0);
    tail.rotation.z = -0.6;
    group.add(tail);
  }

  return group;
}

function buildBlob(config: Character3DConfig, primary: THREE.MeshStandardMaterial, secondary: THREE.MeshStandardMaterial, accent: THREE.MeshStandardMaterial): THREE.Group {
  const group = new THREE.Group();

  // Main body (large sphere)
  const bodyGeo = cachedGeo('blob_body', () => new THREE.SphereGeometry(0.55, 16, 16));
  const body = new THREE.Mesh(bodyGeo, primary);
  body.position.y = 0.9;
  group.add(body);

  // Eyes (big, prominent)
  const eyeGeo = cachedGeo('blob_eye', () => new THREE.SphereGeometry(0.14, 12, 12));
  const blobEyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilGeo = cachedGeo('blob_pupil', () => new THREE.SphereGeometry(0.08, 8, 8));
  const blobPupilMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, blobEyeMat);
    eye.position.set(side * 0.2, 1.05, 0.48);
    group.add(eye);

    const pupil = new THREE.Mesh(pupilGeo, blobPupilMat);
    pupil.position.set(side * 0.2, 1.05, 0.58);
    group.add(pupil);
  }

  // Mouth
  const mouthGeo = cachedGeo('blob_mouth', () => new THREE.TorusGeometry(0.1, 0.02, 8, 16, Math.PI));
  const mouth = new THREE.Mesh(mouthGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
  mouth.position.set(0, 0.78, 0.5);
  mouth.rotation.x = Math.PI;
  group.add(mouth);

  // Small arms
  const armGeo = cachedGeo('blob_arm', () => new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8));
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(armGeo, secondary);
    arm.position.set(side * 0.55, 0.85, 0);
    arm.rotation.z = side * 0.5;
    group.add(arm);
  }

  // Small legs
  const legGeo = cachedGeo('blob_leg', () => new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8));
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, accent);
    leg.position.set(side * 0.2, 0.25, 0);
    group.add(leg);
  }

  return group;
}

function buildSnowman(_config: Character3DConfig, primary: THREE.MeshStandardMaterial, secondary: THREE.MeshStandardMaterial, accent: THREE.MeshStandardMaterial): THREE.Group {
  const group = new THREE.Group();

  // Bottom sphere (largest)
  const bottomGeo = cachedGeo('snow_bottom', () => new THREE.SphereGeometry(0.5, 16, 16));
  const bottom = new THREE.Mesh(bottomGeo, primary);
  bottom.position.y = 0.5;
  group.add(bottom);

  // Middle sphere
  const middleGeo = cachedGeo('snow_middle', () => new THREE.SphereGeometry(0.38, 16, 16));
  const middle = new THREE.Mesh(middleGeo, primary);
  middle.position.y = 1.2;
  group.add(middle);

  // Top sphere (head)
  const topGeo = cachedGeo('snow_top', () => new THREE.SphereGeometry(0.28, 16, 16));
  const top = new THREE.Mesh(topGeo, primary);
  top.position.y = 1.8;
  group.add(top);

  addEyes(group, 1.82, 0.28);

  // Carrot nose
  const noseGeo = cachedGeo('snow_nose', () => new THREE.ConeGeometry(0.05, 0.25, 8));
  const nose = new THREE.Mesh(noseGeo, accent);
  nose.position.set(0, 1.78, 0.3);
  nose.rotation.x = -Math.PI / 2;
  group.add(nose);

  // Buttons
  const buttonGeo = cachedGeo('snow_btn', () => new THREE.SphereGeometry(0.04, 8, 8));
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  for (const y of [1.0, 1.2, 1.4]) {
    const btn = new THREE.Mesh(buttonGeo, buttonMat);
    btn.position.set(0, y, 0.36);
    group.add(btn);
  }

  // Stick arms
  const stickGeo = cachedGeo('snow_stick', () => new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8));
  for (const side of [-1, 1]) {
    const stick = new THREE.Mesh(stickGeo, secondary);
    stick.position.set(side * 0.5, 1.2, 0);
    stick.rotation.z = side * 0.8;
    group.add(stick);
  }

  return group;
}

function buildBird(config: Character3DConfig, primary: THREE.MeshStandardMaterial, secondary: THREE.MeshStandardMaterial, accent: THREE.MeshStandardMaterial): THREE.Group {
  const group = new THREE.Group();

  // Body (ovoid — scaled sphere)
  const bodyGeo = cachedGeo('bird_body', () => new THREE.SphereGeometry(0.35, 16, 16));
  const body = new THREE.Mesh(bodyGeo, primary);
  body.position.y = 0.9;
  body.scale.set(1, 1.2, 0.9);
  group.add(body);

  // Head
  const headGeo = cachedGeo('bird_head', () => new THREE.SphereGeometry(0.22, 16, 16));
  const head = new THREE.Mesh(headGeo, primary);
  head.position.set(0, 1.5, 0.1);
  group.add(head);

  addEyes(group, 1.52, 0.2);

  // Beak
  const beakGeo = cachedGeo('bird_beak', () => new THREE.ConeGeometry(0.06, 0.18, 8));
  const beak = new THREE.Mesh(beakGeo, accent);
  beak.position.set(0, 1.45, 0.35);
  beak.rotation.x = -Math.PI / 2;
  group.add(beak);

  // Wings (flat boxes)
  const wingGeo = cachedGeo('bird_wing', () => new THREE.BoxGeometry(0.45, 0.25, 0.04));
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, secondary);
    wing.position.set(side * 0.45, 0.95, 0);
    wing.rotation.z = side * 0.3;
    group.add(wing);
  }

  // Tail feathers
  const tailGeo = cachedGeo('bird_tail', () => new THREE.BoxGeometry(0.2, 0.1, 0.04));
  const tail = new THREE.Mesh(tailGeo, secondary);
  tail.position.set(0, 0.85, -0.35);
  tail.rotation.x = 0.3;
  group.add(tail);

  // Legs
  const legGeo = cachedGeo('bird_leg', () => new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8));
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(legGeo, accent);
    leg.position.set(side * 0.12, 0.4, 0);
    group.add(leg);
  }

  return group;
}

// ─── Accessories ─────────────────────────────────────────────────

function addCrown(group: THREE.Group, topY: number, mat: THREE.MeshStandardMaterial) {
  const crownGeo = cachedGeo('acc_crown', () => new THREE.CylinderGeometry(0.2, 0.25, 0.15, 5));
  const crown = new THREE.Mesh(crownGeo, mat);
  crown.position.y = topY + 0.2;
  group.add(crown);

  const pointGeo = cachedGeo('acc_crown_pt', () => new THREE.ConeGeometry(0.05, 0.12, 4));
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const point = new THREE.Mesh(pointGeo, mat);
    point.position.set(Math.cos(angle) * 0.18, topY + 0.32, Math.sin(angle) * 0.18);
    group.add(point);
  }
}

function addSword(group: THREE.Group, mat: THREE.MeshStandardMaterial) {
  const bladeGeo = cachedGeo('acc_blade', () => new THREE.BoxGeometry(0.06, 0.7, 0.02));
  const blade = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({ color: 0xc0c0c0 }));
  blade.position.set(0.6, 1.2, 0.2);
  blade.rotation.z = -0.3;
  group.add(blade);

  const handleGeo = cachedGeo('acc_handle', () => new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8));
  const handle = new THREE.Mesh(handleGeo, mat);
  handle.position.set(0.55, 0.82, 0.2);
  group.add(handle);
}

function addShield(group: THREE.Group, mat: THREE.MeshStandardMaterial) {
  const shieldGeo = cachedGeo('acc_shield', () => new THREE.CircleGeometry(0.28, 16));
  const shield = new THREE.Mesh(shieldGeo, mat);
  shield.position.set(-0.55, 1.1, 0.15);
  shield.rotation.y = 0.3;
  group.add(shield);
}

function addBow(group: THREE.Group, mat: THREE.MeshStandardMaterial) {
  const bowGeo = cachedGeo('acc_bow', () => new THREE.TorusGeometry(0.3, 0.02, 8, 16, Math.PI));
  const bow = new THREE.Mesh(bowGeo, mat);
  bow.position.set(-0.55, 1.2, 0.1);
  bow.rotation.z = Math.PI / 2;
  group.add(bow);

  const stringGeo = cachedGeo('acc_string', () => new THREE.CylinderGeometry(0.005, 0.005, 0.6, 4));
  const string = new THREE.Mesh(stringGeo, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
  string.position.set(-0.55, 1.2, 0.1);
  group.add(string);
}

function addStaff(group: THREE.Group, mat: THREE.MeshStandardMaterial) {
  const staffGeo = cachedGeo('acc_staff', () => new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8));
  const staff = new THREE.Mesh(staffGeo, mat);
  staff.position.set(0.55, 1.0, 0);
  group.add(staff);

  const orbGeo = cachedGeo('acc_orb', () => new THREE.SphereGeometry(0.1, 12, 12));
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0x8844ff,
    emissive: new THREE.Color(0x8844ff),
    emissiveIntensity: 0.5,
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  orb.position.set(0.55, 1.75, 0);
  group.add(orb);
}

function addGuitar(group: THREE.Group, mat: THREE.MeshStandardMaterial) {
  const bodyGeo = cachedGeo('acc_guitar', () => new THREE.SphereGeometry(0.2, 12, 12));
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.set(0.35, 0.8, 0.25);
  body.scale.set(1, 1.3, 0.5);
  group.add(body);

  const neckGeo = cachedGeo('acc_guitar_neck', () => new THREE.BoxGeometry(0.06, 0.5, 0.03));
  const neck = new THREE.Mesh(neckGeo, new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
  neck.position.set(0.35, 1.3, 0.25);
  group.add(neck);
}

function addHorns(group: THREE.Group, topY: number, mat: THREE.MeshStandardMaterial) {
  const hornGeo = cachedGeo('acc_horn', () => new THREE.ConeGeometry(0.05, 0.25, 8));
  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(hornGeo, mat);
    horn.position.set(side * 0.2, topY + 0.18, 0);
    horn.rotation.z = side * 0.3;
    group.add(horn);
  }
}

function addWings(group: THREE.Group, mat: THREE.MeshStandardMaterial) {
  const wingGeo = cachedGeo('acc_wing', () => new THREE.BoxGeometry(0.6, 0.35, 0.03));
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeo, mat);
    wing.position.set(side * 0.6, 1.3, -0.15);
    wing.rotation.z = side * 0.4;
    wing.rotation.y = side * 0.2;
    group.add(wing);
  }
}

// ─── Main factory ────────────────────────────────────────────────

export function buildCharacter(config3d: Character3DConfig, mascotState: MascotState): THREE.Group {
  const fx = getHealthEffect(mascotState);

  const primary = makeMat(config3d.primaryColor, fx.colorDesaturation, fx.emissiveIntensity);
  const secondary = makeMat(config3d.secondaryColor, fx.colorDesaturation, fx.emissiveIntensity);
  const accent = makeMat(config3d.accentColor, fx.colorDesaturation, fx.emissiveIntensity);

  let bodyGroup: THREE.Group;

  switch (config3d.bodyType) {
    case 'humanoid':
      bodyGroup = buildHumanoid(config3d, primary, secondary, accent);
      break;
    case 'quadruped':
      bodyGroup = buildQuadruped(config3d, primary, secondary, accent);
      break;
    case 'blob':
      bodyGroup = buildBlob(config3d, primary, secondary, accent);
      break;
    case 'snowman':
      bodyGroup = buildSnowman(config3d, primary, secondary, accent);
      break;
    case 'bird':
      bodyGroup = buildBird(config3d, primary, secondary, accent);
      break;
  }

  // Determine top Y for accessories
  let topY = 2.0;
  if (config3d.bodyType === 'quadruped') topY = 1.1;
  if (config3d.bodyType === 'blob') topY = 1.45;
  if (config3d.bodyType === 'snowman') topY = 2.08;
  if (config3d.bodyType === 'bird') topY = 1.72;

  // Add accessories
  if (config3d.hasCrown) addCrown(bodyGroup, topY, accent);
  if (config3d.hasHorns) addHorns(bodyGroup, topY, accent);
  if (config3d.hasWings) addWings(bodyGroup, secondary);

  if (config3d.hasWeapon) {
    switch (config3d.hasWeapon) {
      case 'sword':  addSword(bodyGroup, accent); break;
      case 'shield': addShield(bodyGroup, accent); break;
      case 'bow':    addBow(bodyGroup, accent); break;
      case 'staff':  addStaff(bodyGroup, accent); break;
      case 'guitar': addGuitar(bodyGroup, accent); break;
    }
  }

  // Apply scale
  const s = config3d.scale * fx.scaleMultiplier;
  bodyGroup.scale.set(s, s, s);

  // Apply tilt
  bodyGroup.rotation.x = fx.tiltX;

  return bodyGroup;
}
