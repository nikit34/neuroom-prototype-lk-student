import * as THREE from 'three';

// ─── Geometry cache ──────────────────────────────────────────────
const geoCache = new Map<string, THREE.BufferGeometry>();

function geo(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = geoCache.get(key);
  if (!g) {
    g = factory();
    geoCache.set(key, g);
  }
  return g;
}

// ─── Outfits (body) ─────────────────────────────────────────────

export function addOutfit(
  group: THREE.Group,
  type: string,
  mat: THREE.MeshStandardMaterial,
) {
  switch (type) {
    case 'armor': {
      // Chest plate
      const chestGeo = geo('outfit_armor_chest', () => new THREE.BoxGeometry(0.65, 0.5, 0.35));
      const chest = new THREE.Mesh(chestGeo, mat);
      chest.position.set(0, 1.25, 0);
      group.add(chest);
      // Shoulder pads
      const padGeo = geo('outfit_armor_pad', () => new THREE.SphereGeometry(0.14, 8, 8));
      for (const side of [-1, 1]) {
        const pad = new THREE.Mesh(padGeo, mat);
        pad.position.set(side * 0.42, 1.55, 0);
        group.add(pad);
      }
      break;
    }
    case 'cape': {
      const capeGeo = geo('outfit_cape', () => {
        const g = new THREE.PlaneGeometry(0.6, 1.0, 1, 4);
        // Slight curve
        const pos = g.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i);
          pos.setZ(i, pos.getZ(i) - Math.abs(y) * 0.15);
        }
        pos.needsUpdate = true;
        return g;
      });
      const cape = new THREE.Mesh(capeGeo, mat);
      cape.position.set(0, 1.2, -0.3);
      group.add(cape);
      break;
    }
    case 'hoodie': {
      const hoodGeo = geo('outfit_hoodie', () => new THREE.SphereGeometry(0.42, 12, 12));
      const hood = new THREE.Mesh(hoodGeo, mat);
      hood.position.set(0, 2.05, -0.05);
      hood.scale.set(1, 0.8, 1.1);
      group.add(hood);
      // Body part
      const bodyGeo = geo('outfit_hoodie_body', () => new THREE.CylinderGeometry(0.38, 0.4, 0.7, 12));
      const body = new THREE.Mesh(bodyGeo, mat);
      body.position.set(0, 1.25, 0);
      group.add(body);
      break;
    }
    case 'vest': {
      const vestGeo = geo('outfit_vest', () => new THREE.CylinderGeometry(0.36, 0.38, 0.6, 12));
      const vest = new THREE.Mesh(vestGeo, mat);
      vest.position.set(0, 1.25, 0);
      group.add(vest);
      break;
    }
    case 'robe': {
      const robeGeo = geo('outfit_robe', () => new THREE.ConeGeometry(0.5, 1.5, 12));
      const robe = new THREE.Mesh(robeGeo, mat);
      robe.position.set(0, 0.95, 0);
      group.add(robe);
      break;
    }
    case 'jacket': {
      // Torso
      const torsoGeo = geo('outfit_jacket_torso', () => new THREE.BoxGeometry(0.62, 0.55, 0.32));
      const torso = new THREE.Mesh(torsoGeo, mat);
      torso.position.set(0, 1.25, 0);
      group.add(torso);
      // Shoulder parts
      const shoulderGeo = geo('outfit_jacket_shoulder', () => new THREE.BoxGeometry(0.2, 0.15, 0.2));
      for (const side of [-1, 1]) {
        const shoulder = new THREE.Mesh(shoulderGeo, mat);
        shoulder.position.set(side * 0.4, 1.55, 0);
        group.add(shoulder);
      }
      break;
    }
  }
}

// ─── Hats ────────────────────────────────────────────────────────

export function addHat(
  group: THREE.Group,
  type: string,
  topY: number,
  mat: THREE.MeshStandardMaterial,
) {
  switch (type) {
    case 'helmet': {
      const helmetGeo = geo('hat_helmet', () => new THREE.SphereGeometry(0.38, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2));
      const helmet = new THREE.Mesh(helmetGeo, mat);
      helmet.position.set(0, topY + 0.02, 0);
      group.add(helmet);
      // Visor
      const visorGeo = geo('hat_helmet_visor', () => new THREE.BoxGeometry(0.3, 0.06, 0.15));
      const visor = new THREE.Mesh(visorGeo, mat);
      visor.position.set(0, topY - 0.05, 0.32);
      group.add(visor);
      break;
    }
    case 'wizard_hat': {
      const coneGeo = geo('hat_wizard_cone', () => new THREE.ConeGeometry(0.18, 0.55, 12));
      const cone = new THREE.Mesh(coneGeo, mat);
      cone.position.set(0, topY + 0.4, 0);
      group.add(cone);
      // Brim
      const brimGeo = geo('hat_wizard_brim', () => new THREE.TorusGeometry(0.3, 0.04, 8, 16));
      const brim = new THREE.Mesh(brimGeo, mat);
      brim.position.set(0, topY + 0.12, 0);
      brim.rotation.x = Math.PI / 2;
      group.add(brim);
      break;
    }
    case 'cap': {
      const capGeo = geo('hat_cap', () => new THREE.SphereGeometry(0.36, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.4));
      const cap = new THREE.Mesh(capGeo, mat);
      cap.position.set(0, topY + 0.02, 0);
      group.add(cap);
      // Bill
      const billGeo = geo('hat_cap_bill', () => new THREE.BoxGeometry(0.28, 0.03, 0.18));
      const bill = new THREE.Mesh(billGeo, mat);
      bill.position.set(0, topY + 0.05, 0.32);
      group.add(bill);
      break;
    }
    case 'headband': {
      const bandGeo = geo('hat_headband', () => new THREE.TorusGeometry(0.36, 0.03, 8, 24));
      const band = new THREE.Mesh(bandGeo, mat);
      band.position.set(0, topY + 0.02, 0);
      band.rotation.x = Math.PI / 2;
      group.add(band);
      break;
    }
    // crown and horns handled by CharacterFactory existing code
  }
}

// ─── Hand items ──────────────────────────────────────────────────

export function addHandItem(
  group: THREE.Group,
  type: string,
  mat: THREE.MeshStandardMaterial,
) {
  switch (type) {
    case 'book': {
      const bookGeo = geo('hand_book', () => new THREE.BoxGeometry(0.22, 0.28, 0.06));
      const book = new THREE.Mesh(bookGeo, mat);
      book.position.set(0.55, 1.0, 0.2);
      book.rotation.z = -0.2;
      group.add(book);
      // Pages
      const pageGeo = geo('hand_book_pages', () => new THREE.BoxGeometry(0.18, 0.24, 0.04));
      const pageMat = new THREE.MeshStandardMaterial({ color: 0xfffff0 });
      const pages = new THREE.Mesh(pageGeo, pageMat);
      pages.position.set(0.55, 1.0, 0.22);
      pages.rotation.z = -0.2;
      group.add(pages);
      break;
    }
    case 'wand': {
      const stickGeo = geo('hand_wand_stick', () => new THREE.CylinderGeometry(0.015, 0.025, 0.5, 8));
      const stick = new THREE.Mesh(stickGeo, mat);
      stick.position.set(0.55, 1.2, 0.2);
      stick.rotation.z = -0.3;
      group.add(stick);
      // Star tip
      const starGeo = geo('hand_wand_star', () => new THREE.OctahedronGeometry(0.06, 0));
      const starMat = new THREE.MeshStandardMaterial({
        color: 0xffdd44,
        emissive: new THREE.Color(0xffdd44),
        emissiveIntensity: 0.6,
      });
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(0.62, 1.48, 0.2);
      group.add(star);
      break;
    }
    case 'flag': {
      const poleGeo = geo('hand_flag_pole', () => new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8));
      const pole = new THREE.Mesh(poleGeo, new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
      pole.position.set(0.55, 1.2, 0);
      group.add(pole);
      // Cloth
      const clothGeo = geo('hand_flag_cloth', () => new THREE.PlaneGeometry(0.35, 0.22));
      const cloth = new THREE.Mesh(clothGeo, mat);
      cloth.position.set(0.73, 1.7, 0);
      group.add(cloth);
      break;
    }
    // sword, shield, bow, staff, guitar handled by CharacterFactory existing code
  }
}

// ─── Back items ──────────────────────────────────────────────────

export function addBackItem(
  group: THREE.Group,
  type: string,
  mat: THREE.MeshStandardMaterial,
) {
  switch (type) {
    case 'backpack': {
      const bpGeo = geo('back_backpack', () => new THREE.BoxGeometry(0.35, 0.4, 0.2));
      const bp = new THREE.Mesh(bpGeo, mat);
      bp.position.set(0, 1.15, -0.3);
      group.add(bp);
      // Flap
      const flapGeo = geo('back_backpack_flap', () => new THREE.BoxGeometry(0.3, 0.08, 0.18));
      const flap = new THREE.Mesh(flapGeo, mat);
      flap.position.set(0, 1.38, -0.3);
      group.add(flap);
      break;
    }
    case 'quiver': {
      const quiverGeo = geo('back_quiver', () => new THREE.CylinderGeometry(0.08, 0.1, 0.5, 8));
      const quiver = new THREE.Mesh(quiverGeo, mat);
      quiver.position.set(0.12, 1.3, -0.25);
      quiver.rotation.z = 0.15;
      group.add(quiver);
      // Arrows
      const arrowGeo = geo('back_quiver_arrow', () => new THREE.CylinderGeometry(0.008, 0.008, 0.55, 4));
      const arrowMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      for (let i = 0; i < 3; i++) {
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.position.set(0.12 + (i - 1) * 0.03, 1.38, -0.25 + (i - 1) * 0.02);
        arrow.rotation.z = 0.15;
        group.add(arrow);
      }
      break;
    }
    // wings and cape handled elsewhere
  }
}

// ─── Face items ──────────────────────────────────────────────────

export function addFaceItem(
  group: THREE.Group,
  type: string,
  topY: number,
  mat: THREE.MeshStandardMaterial,
) {
  // Face is roughly at topY (head center for humanoid ~2.0)
  const faceY = topY - 0.02;

  switch (type) {
    case 'glasses': {
      const lensGeo = geo('face_glasses_lens', () => new THREE.TorusGeometry(0.08, 0.015, 8, 16));
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      for (const side of [-1, 1]) {
        const lens = new THREE.Mesh(lensGeo, frameMat);
        lens.position.set(side * 0.12, faceY, 0.34);
        group.add(lens);
      }
      // Bridge
      const bridgeGeo = geo('face_glasses_bridge', () => new THREE.CylinderGeometry(0.01, 0.01, 0.1, 4));
      const bridge = new THREE.Mesh(bridgeGeo, frameMat);
      bridge.position.set(0, faceY, 0.34);
      bridge.rotation.z = Math.PI / 2;
      group.add(bridge);
      break;
    }
    case 'eyepatch': {
      const patchGeo = geo('face_eyepatch', () => new THREE.BoxGeometry(0.12, 0.1, 0.02));
      const patchMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const patch = new THREE.Mesh(patchGeo, patchMat);
      patch.position.set(0.12, faceY + 0.02, 0.35);
      group.add(patch);
      // Strap
      const strapGeo = geo('face_eyepatch_strap', () => new THREE.TorusGeometry(0.34, 0.01, 4, 16));
      const strap = new THREE.Mesh(strapGeo, patchMat);
      strap.position.set(0, faceY + 0.02, 0);
      strap.rotation.y = Math.PI / 2;
      group.add(strap);
      break;
    }
    case 'mask': {
      const maskGeo = geo('face_mask', () => new THREE.SphereGeometry(0.3, 12, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.35));
      const mask = new THREE.Mesh(maskGeo, mat);
      mask.position.set(0, faceY, 0.05);
      group.add(mask);
      break;
    }
  }
}
