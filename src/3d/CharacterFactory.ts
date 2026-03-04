import * as THREE from 'three';
import { Character3DConfig, CharacterBodyType, MascotState, CharacterCustomization } from '../types';
import { getHealthEffect, desaturateColor } from './healthEffects';
import { addOutfit, addHat, addHandItem, addBackItem, addFaceItem } from './outfitBuilder';

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
const darkMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

// ─── Expressive face (eyes, eyebrows, mouth, effects) ─────────

function addFace(
  group: THREE.Group,
  headY: number,
  headRadius: number,
  mascotState: MascotState,
  skinMat: THREE.MeshStandardMaterial,
  offsetX = 0,
  eyeScale = 1,
) {
  const k = `${Math.round(headRadius * 100)}_${Math.round(eyeScale * 10)}`;

  const eyeSize = headRadius * 0.12 * eyeScale;
  const spacing = headRadius * 0.3;
  const eyeZ = headRadius * 0.85;
  const pupilZ = headRadius * 0.95;

  // Pupil size varies by emotion
  const pupilScales: Record<MascotState, number> = {
    sick: 0.5, sad: 0.8, neutral: 1.0, happy: 1.15, thriving: 1.35,
  };
  const pupilSize = headRadius * 0.07 * eyeScale * pupilScales[mascotState];

  // ─── Eyes ───
  const eyeGeo = cachedGeo(`face_eye_${k}`, () => new THREE.SphereGeometry(eyeSize, 8, 8));
  const pupilGeo = cachedGeo(`face_pupil_${k}_${mascotState}`, () => new THREE.SphereGeometry(pupilSize, 8, 8));

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(offsetX + side * spacing, headY, eyeZ);
    group.add(eye);

    // Sick/sad: pupils look down
    const pupilYOff = mascotState === 'sick' ? -eyeSize * 0.3
                    : mascotState === 'sad' ? -eyeSize * 0.15
                    : 0;
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(offsetX + side * spacing, headY + pupilYOff, pupilZ);
    group.add(pupil);
  }

  // ─── Eyelids (sick / sad — half-sphere caps drooping over eyes) ───
  if (mascotState === 'sick' || mascotState === 'sad') {
    const lidCover = mascotState === 'sick' ? 0.55 : 0.35;
    const lidGeo = cachedGeo(`face_lid_${k}_${mascotState}`, () =>
      new THREE.SphereGeometry(eyeSize * 1.25, 8, 8, 0, Math.PI * 2, 0, Math.PI * lidCover),
    );
    for (const side of [-1, 1]) {
      const lid = new THREE.Mesh(lidGeo, skinMat);
      lid.position.set(offsetX + side * spacing, headY + eyeSize * 0.15, eyeZ + 0.01);
      lid.rotation.x = Math.PI; // flip so lid covers from top
      group.add(lid);
    }
  }

  // ─── Eyebrows ───
  const browGeo = cachedGeo(`face_brow_${k}`, () =>
    new THREE.BoxGeometry(headRadius * 0.22, headRadius * 0.04, headRadius * 0.04),
  );
  const browY = headY + eyeSize * 1.8;
  const browAngles: Record<MascotState, number> = {
    sick: 0.35,    // worried — inner ends raised
    sad: 0.25,     // sad — inner ends raised
    neutral: 0,    // flat
    happy: -0.15,  // slightly arched up
    thriving: -0.25, // raised and arched
  };
  for (const side of [-1, 1]) {
    const brow = new THREE.Mesh(browGeo, darkMat);
    brow.position.set(offsetX + side * spacing, browY, eyeZ);
    brow.rotation.z = side * browAngles[mascotState];
    group.add(brow);
  }

  // ─── Mouth ───
  const mouthY = headY - headRadius * 0.45;
  const mouthZ = headRadius * 0.88;

  switch (mascotState) {
    case 'sick': {
      // Wavy zigzag mouth
      const segGeo = cachedGeo(`face_msick_${k}`, () =>
        new THREE.BoxGeometry(headRadius * 0.08, headRadius * 0.025, headRadius * 0.025),
      );
      for (let i = -2; i <= 2; i++) {
        const seg = new THREE.Mesh(segGeo, darkMat);
        seg.position.set(
          offsetX + i * headRadius * 0.07,
          mouthY + (i % 2 === 0 ? 0.01 : -0.01),
          mouthZ,
        );
        group.add(seg);
      }
      break;
    }
    case 'sad': {
      // Frown (arc curving upward = ∩)
      const frownGeo = cachedGeo(`face_msad_${k}`, () =>
        new THREE.TorusGeometry(headRadius * 0.15, headRadius * 0.02, 8, 12, Math.PI),
      );
      const frown = new THREE.Mesh(frownGeo, darkMat);
      frown.position.set(offsetX, mouthY, mouthZ);
      frown.rotation.x = -Math.PI / 2;
      group.add(frown);
      break;
    }
    case 'neutral': {
      // Flat line
      const lineGeo = cachedGeo(`face_mneutral_${k}`, () =>
        new THREE.BoxGeometry(headRadius * 0.3, headRadius * 0.025, headRadius * 0.025),
      );
      const line = new THREE.Mesh(lineGeo, darkMat);
      line.position.set(offsetX, mouthY, mouthZ);
      group.add(line);
      break;
    }
    case 'happy': {
      // Smile (arc curving downward = ∪)
      const smileGeo = cachedGeo(`face_mhappy_${k}`, () =>
        new THREE.TorusGeometry(headRadius * 0.15, headRadius * 0.025, 8, 12, Math.PI),
      );
      const smile = new THREE.Mesh(smileGeo, darkMat);
      smile.position.set(offsetX, mouthY, mouthZ);
      smile.rotation.x = Math.PI / 2;
      group.add(smile);
      break;
    }
    case 'thriving': {
      // Big wide grin
      const grinGeo = cachedGeo(`face_mthriving_${k}`, () =>
        new THREE.TorusGeometry(headRadius * 0.22, headRadius * 0.03, 8, 16, Math.PI),
      );
      const grin = new THREE.Mesh(grinGeo, darkMat);
      grin.position.set(offsetX, mouthY, mouthZ);
      grin.rotation.x = Math.PI / 2;
      group.add(grin);
      break;
    }
  }

  // ─── Tears (sad) ───
  if (mascotState === 'sad') {
    const tearGeo = cachedGeo(`face_tear_${k}`, () => new THREE.SphereGeometry(headRadius * 0.04, 6, 6));
    const tearMat = new THREE.MeshStandardMaterial({
      color: 0x4488ff, transparent: true, opacity: 0.7,
    });
    for (const side of [-1, 1]) {
      const tear = new THREE.Mesh(tearGeo, tearMat);
      tear.position.set(offsetX + side * spacing, headY - eyeSize * 1.5, eyeZ + 0.02);
      tear.scale.set(1, 2, 1); // elongated teardrop
      group.add(tear);
    }
  }

  // ─── Sick spiral ───
  if (mascotState === 'sick') {
    const spiralGeo = cachedGeo(`face_spiral_${k}`, () =>
      new THREE.TorusGeometry(headRadius * 0.2, headRadius * 0.015, 6, 16, Math.PI * 1.5),
    );
    const spiralMat = new THREE.MeshStandardMaterial({
      color: 0x88cc44, transparent: true, opacity: 0.6,
    });
    const spiral = new THREE.Mesh(spiralGeo, spiralMat);
    spiral.position.set(offsetX + headRadius * 0.5, headY + headRadius * 0.8, 0);
    spiral.rotation.y = Math.PI / 4;
    group.add(spiral);
  }

  // ─── Stars (thriving) ───
  if (mascotState === 'thriving') {
    const starGeo = cachedGeo(`face_star_${k}`, () => new THREE.OctahedronGeometry(headRadius * 0.06, 0));
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      emissive: new THREE.Color(0xffdd00),
      emissiveIntensity: 0.8,
    });
    const positions: [number, number, number][] = [
      [headRadius * 0.6, headRadius * 0.5, headRadius * 0.3],
      [-headRadius * 0.5, headRadius * 0.7, headRadius * 0.2],
      [headRadius * 0.3, headRadius * 0.8, -headRadius * 0.2],
    ];
    for (const [sx, sy, sz] of positions) {
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(offsetX + sx, headY + sy, sz);
      group.add(star);
    }
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

export function buildCharacter(
  config3d: Character3DConfig,
  mascotState: MascotState,
  customization?: Partial<CharacterCustomization>,
): THREE.Group {
  const fx = getHealthEffect(mascotState);

  // Apply customization color overrides
  const primaryColor = customization?.skinColor || config3d.primaryColor;
  const secondaryColor = customization?.clothesColor || config3d.secondaryColor;
  const accentColor = customization?.shoesColor || config3d.accentColor;

  const primary = makeMat(primaryColor, fx.colorDesaturation, fx.emissiveIntensity);
  const secondary = makeMat(secondaryColor, fx.colorDesaturation, fx.emissiveIntensity);
  const accent = makeMat(accentColor, fx.colorDesaturation, fx.emissiveIntensity);

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

  // ─── Face (eyes, eyebrows, mouth, emotion effects) ───
  const faceMap: Record<CharacterBodyType, { hy: number; hr: number; ox?: number; es?: number }> = {
    humanoid: { hy: 2.0, hr: 0.35 },
    quadruped: { hy: 1.1, hr: 0.25, ox: 0.6 },
    blob: { hy: 1.05, hr: 0.55, es: 2.0 },
    snowman: { hy: 1.82, hr: 0.28 },
    bird: { hy: 1.52, hr: 0.2 },
  };
  const fp = faceMap[config3d.bodyType];
  addFace(bodyGroup, fp.hy, fp.hr, mascotState, primary, fp.ox ?? 0, fp.es ?? 1);

  // Determine top Y for accessories
  let topY = 2.0;
  if (config3d.bodyType === 'quadruped') topY = 1.1;
  if (config3d.bodyType === 'blob') topY = 1.45;
  if (config3d.bodyType === 'snowman') topY = 2.08;
  if (config3d.bodyType === 'bird') topY = 1.72;

  // Outfit color material
  const outfitColor = customization?.outfitColor || config3d.secondaryColor;
  const outfitMat = makeMat(outfitColor, fx.colorDesaturation, fx.emissiveIntensity);

  // Hat color material
  const hatColor = customization?.hatColor || config3d.accentColor;
  const hatMat = makeMat(hatColor, fx.colorDesaturation, fx.emissiveIntensity);

  // ─── Outfit ───
  if (customization?.outfit && customization.outfit !== 'default') {
    addOutfit(bodyGroup, customization.outfit, outfitMat);
  }

  // ─── Hat ───
  const hatType = customization?.hat;
  if (hatType && hatType !== 'none') {
    if (hatType === 'crown') {
      addCrown(bodyGroup, topY, hatMat);
    } else if (hatType === 'horns') {
      addHorns(bodyGroup, topY, hatMat);
    } else {
      addHat(bodyGroup, hatType, topY, hatMat);
    }
  } else if (!customization?.hat) {
    // No customization set — use original config accessories
    if (config3d.hasCrown) addCrown(bodyGroup, topY, accent);
    if (config3d.hasHorns) addHorns(bodyGroup, topY, accent);
  }

  // ─── Wings (from config or back item) ───
  const backItem = customization?.backItem;
  if (backItem && backItem !== 'none') {
    if (backItem === 'wings') {
      addWings(bodyGroup, secondary);
    } else if (backItem === 'cape') {
      addOutfit(bodyGroup, 'cape', outfitMat);
    } else {
      addBackItem(bodyGroup, backItem, outfitMat);
    }
  } else if (!customization?.backItem) {
    if (config3d.hasWings) addWings(bodyGroup, secondary);
  }

  // ─── Hand item ───
  const handItem = customization?.handItem;
  if (handItem && handItem !== 'none') {
    switch (handItem) {
      case 'sword':  addSword(bodyGroup, accent); break;
      case 'shield': addShield(bodyGroup, accent); break;
      case 'bow':    addBow(bodyGroup, accent); break;
      case 'staff':  addStaff(bodyGroup, accent); break;
      case 'guitar': addGuitar(bodyGroup, accent); break;
      default:       addHandItem(bodyGroup, handItem, accent); break;
    }
  } else if (!customization?.handItem && config3d.hasWeapon) {
    switch (config3d.hasWeapon) {
      case 'sword':  addSword(bodyGroup, accent); break;
      case 'shield': addShield(bodyGroup, accent); break;
      case 'bow':    addBow(bodyGroup, accent); break;
      case 'staff':  addStaff(bodyGroup, accent); break;
      case 'guitar': addGuitar(bodyGroup, accent); break;
    }
  }

  // ─── Face item ───
  if (customization?.faceItem && customization.faceItem !== 'none') {
    addFaceItem(bodyGroup, customization.faceItem, topY, accent);
  }

  // Apply scale
  const s = config3d.scale * fx.scaleMultiplier;
  bodyGroup.scale.set(s, s, s);

  // Apply tilt
  bodyGroup.rotation.x = fx.tiltX;

  return bodyGroup;
}
