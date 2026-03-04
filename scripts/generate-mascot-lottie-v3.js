#!/usr/bin/env node
/**
 * Mascot Lottie Generator v3 — Professional quality characters
 * Inspired by Duolingo, Habitica, Finch app mascot design
 *
 * Key improvements over v2:
 * - Pear/bean-shaped body (not a circle)
 * - Real arms and legs
 * - Large expressive eyes with iris, pupil, highlight, and eyelid
 * - Detailed archetype accessories
 * - Multi-layer shadow/highlight system for depth
 * - Smooth easing on all animations
 * - Cheek blush on happy states
 * - Mouth with proper bezier curves
 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'animations', 'mascot');
fs.mkdirSync(OUT, { recursive: true });

const ARCHETYPES = ['cat', 'warrior', 'king', 'astronaut', 'wizard', 'dragon', 'ninja', 'critter'];
const STATES = ['sick', 'sad', 'neutral', 'happy', 'thriving'];

const W = 200, H = 260, FPS = 30, FRAMES = 120;

// ── Easing helpers ──────────────────────────────────────────────

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Bezier ease for Lottie keyframes
const EASE_SMOOTH = { i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } };
const EASE_BOUNCE = { i: { x: [0.34], y: [1.56] }, o: { x: [0.66], y: [0] } };
const EASE_GENTLE = { i: { x: [0.25], y: [1] }, o: { x: [0.75], y: [0] } };

// ── Shape builders ──────────────────────────────────────────────

function ellipseShape(cx, cy, rx, ry) {
  return {
    ty: 'el',
    p: { a: 0, k: [cx, cy] },
    s: { a: 0, k: [rx * 2, ry * 2] },
  };
}

function roundedRect(cx, cy, w, h, r) {
  return {
    ty: 'rc',
    p: { a: 0, k: [cx, cy] },
    s: { a: 0, k: [w, h] },
    r: { a: 0, k: r },
  };
}

function fill(r, g, b, opacity = 100) {
  return {
    ty: 'fl',
    c: { a: 0, k: [r / 255, g / 255, b / 255, 1] },
    o: { a: 0, k: opacity },
    r: 1,
  };
}

function stroke(r, g, b, width = 2, opacity = 100) {
  return {
    ty: 'st',
    c: { a: 0, k: [r / 255, g / 255, b / 255, 1] },
    o: { a: 0, k: opacity },
    w: { a: 0, k: width },
    lc: 2, // round cap
    lj: 2, // round join
  };
}

function pathShape(vertices, inTangents, outTangents, closed = true) {
  return {
    ty: 'sh',
    ks: {
      a: 0,
      k: {
        c: closed,
        v: vertices,
        i: inTangents || vertices.map(() => [0, 0]),
        o: outTangents || vertices.map(() => [0, 0]),
      },
    },
  };
}

function transform(x = 0, y = 0, scaleX = 100, scaleY = 100, rotation = 0, opacity = 100) {
  return {
    o: { a: 0, k: opacity },
    r: { a: 0, k: rotation },
    p: { a: 0, k: [x, y, 0] },
    a: { a: 0, k: [0, 0, 0] },
    s: { a: 0, k: [scaleX, scaleY, 100] },
  };
}

function group(name, items, tx = 0, ty = 0) {
  return {
    ty: 'gr',
    nm: name,
    it: [
      ...items,
      { ty: 'tr', p: { a: 0, k: [tx, ty] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
    ],
  };
}

function layer(ind, name, shapes, ks, parentInd) {
  const l = {
    ddd: 0,
    ind,
    ty: 4,
    nm: name,
    sr: 1,
    ks,
    shapes,
    ao: 0,
    ip: 0,
    op: FRAMES,
    st: 0,
  };
  if (parentInd != null) l.parent = parentInd;
  return l;
}

// ── Animated value builders ─────────────────────────────────────

function animateFloat(baseline, amplitude, speed = 1) {
  // Gentle up-down float
  const halfCycle = Math.round(FRAMES / (2 * speed));
  const kfs = [];
  for (let i = 0; i <= FRAMES; i += halfCycle) {
    const phase = (i / halfCycle) % 2 === 0 ? 0 : 1;
    kfs.push({
      t: Math.min(i, FRAMES),
      s: [baseline + (phase === 0 ? -amplitude : amplitude)],
      ...(i < FRAMES ? EASE_GENTLE : {}),
    });
  }
  return { a: 1, k: kfs };
}

function animateScale(base, amplitude, speed = 1) {
  const halfCycle = Math.round(FRAMES / (2 * speed));
  const kfs = [];
  for (let i = 0; i <= FRAMES; i += halfCycle) {
    const phase = (i / halfCycle) % 2 === 0 ? 0 : 1;
    const s = base + (phase === 0 ? -amplitude : amplitude);
    kfs.push({
      t: Math.min(i, FRAMES),
      s: [s, s, 100],
      ...(i < FRAMES ? EASE_SMOOTH : {}),
    });
  }
  return { a: 1, k: kfs };
}

function animateBlink() {
  // Realistic blink at frames 50 and 100
  return {
    a: 1,
    k: [
      { t: 0, s: [100, 100, 100], ...EASE_SMOOTH },
      { t: 48, s: [100, 100, 100], ...EASE_SMOOTH },
      { t: 51, s: [100, 10, 100], ...EASE_SMOOTH },
      { t: 54, s: [100, 100, 100], ...EASE_SMOOTH },
      { t: 96, s: [100, 100, 100], ...EASE_SMOOTH },
      { t: 99, s: [100, 10, 100], ...EASE_SMOOTH },
      { t: 102, s: [100, 100, 100], ...EASE_SMOOTH },
      { t: FRAMES, s: [100, 100, 100] },
    ],
  };
}

function animateBreathing(base = 100, amount = 1.5) {
  return animateScale(base, amount, 0.5);
}

function animateRotation(amplitude = 3, speed = 1) {
  const halfCycle = Math.round(FRAMES / (2 * speed));
  const kfs = [];
  for (let i = 0; i <= FRAMES; i += halfCycle) {
    const phase = (i / halfCycle) % 2 === 0 ? 0 : 1;
    kfs.push({
      t: Math.min(i, FRAMES),
      s: [phase === 0 ? -amplitude : amplitude],
      ...(i < FRAMES ? EASE_GENTLE : {}),
    });
  }
  return { a: 1, k: kfs };
}

// ── Body builders ───────────────────────────────────────────────

function buildBody() {
  // Pear/bean body shape using bezier path
  // Wider at bottom, narrower at top — like Duolingo's owl
  const bodyPath = pathShape(
    // vertices: top-center, right-shoulder, right-hip, bottom-center, left-hip, left-shoulder
    [[0, -55], [40, -35], [48, 20], [30, 55], [-30, 55], [-48, 20], [-40, -35]],
    // in tangents (cubic bezier handles)
    [[-15, 0], [0, -15], [10, -20], [20, 0], [-20, 0], [-10, -20], [0, -15]],
    // out tangents
    [[15, 0], [10, 15], [0, 20], [-15, 10], [15, 10], [0, 20], [-10, 15]],
    true
  );

  return [
    // Main body fill (will be colored by colorFilters)
    group('body_shape', [bodyPath, fill(114, 197, 242)]),
    // Body highlight (top-left glow for 3D effect)
    group('body_highlight', [
      ellipseShape(-12, -30, 28, 22),
      fill(255, 255, 255, 15),
    ]),
    // Body shadow (bottom darkening)
    group('body_shadow', [
      ellipseShape(0, 45, 35, 12),
      fill(0, 0, 0, 10),
    ]),
  ];
}

function buildEye(side) {
  const x = side === 'left' ? -18 : 18;
  return [
    // Eye white (sclera)
    group('eye_white', [
      ellipseShape(0, 0, 14, 16),
      fill(255, 255, 255),
    ], x, -22),
    // Iris
    group('iris', [
      ellipseShape(0, 1, 10, 11),
      fill(60, 60, 60),
    ], x, -22),
    // Pupil
    group('pupil', [
      ellipseShape(0, 1, 6, 7),
      fill(15, 15, 15),
    ], x, -22),
    // Eye highlight (top-left reflection dot)
    group('eye_highlight', [
      ellipseShape(-3, -3, 4, 4),
      fill(255, 255, 255, 95),
    ], x, -22),
    // Secondary smaller highlight
    group('eye_highlight2', [
      ellipseShape(3, 3, 2, 2),
      fill(255, 255, 255, 60),
    ], x, -22),
  ];
}

function buildMouth(state) {
  switch (state) {
    case 'sick':
      // Wavy/queasy line
      return [group('mouth', [
        pathShape(
          [[-12, 8], [-4, 5], [4, 11], [12, 8]],
          [[0, 0], [0, 0], [0, 0], [0, 0]],
          [[0, 0], [0, 0], [0, 0], [0, 0]],
          false
        ),
        stroke(80, 60, 60, 2.5),
      ], 0, 0)];

    case 'sad':
      // Downturned frown
      return [group('mouth', [
        pathShape(
          [[-10, 10], [0, 6], [10, 10]],
          [[0, 0], [-5, 3], [0, 0]],
          [[0, 0], [5, 3], [0, 0]],
          false
        ),
        stroke(80, 60, 60, 2.5),
      ], 0, 0)];

    case 'neutral':
      // Simple line with slight upturn
      return [group('mouth', [
        pathShape(
          [[-8, 8], [0, 9], [8, 8]],
          [[0, 0], [-4, 0], [0, 0]],
          [[0, 0], [4, 0], [0, 0]],
          false
        ),
        stroke(80, 60, 60, 2.5),
      ], 0, 0)];

    case 'happy':
      // Big smile curve
      return [group('mouth', [
        pathShape(
          [[-12, 5], [0, 16], [12, 5]],
          [[0, 0], [-8, 0], [0, 0]],
          [[0, 0], [8, 0], [0, 0]],
          false
        ),
        stroke(80, 60, 60, 2.8),
      ], 0, 0)];

    case 'thriving':
      // Open grin (filled mouth)
      return [
        group('mouth_fill', [
          pathShape(
            [[-14, 4], [0, 20], [14, 4]],
            [[0, 0], [-10, 0], [0, 0]],
            [[0, 0], [10, 0], [0, 0]],
            true
          ),
          fill(80, 40, 40),
        ], 0, 0),
        group('mouth_outline', [
          pathShape(
            [[-14, 4], [0, 20], [14, 4]],
            [[0, 0], [-10, 0], [0, 0]],
            [[0, 0], [10, 0], [0, 0]],
            false
          ),
          stroke(80, 60, 60, 2.8),
        ], 0, 0),
        // Tongue
        group('tongue', [
          ellipseShape(0, 14, 6, 5),
          fill(220, 100, 100),
        ], 0, 0),
      ];
  }
}

function buildBlush() {
  return [
    group('blush_left', [
      ellipseShape(-30, -2, 10, 6),
      fill(255, 150, 150, 40),
    ]),
    group('blush_right', [
      ellipseShape(30, -2, 10, 6),
      fill(255, 150, 150, 40),
    ]),
  ];
}

function buildArm(side) {
  const x = side === 'left' ? -50 : 50;
  const dir = side === 'left' ? -1 : 1;
  return group(`arm_${side}`, [
    // Upper arm
    roundedRect(dir * 8, 0, 14, 24, 7),
    fill(114, 197, 242),
    // Hand (circle)
    group('hand', [
      ellipseShape(dir * 10, 16, 8, 8),
      fill(114, 197, 242),
    ]),
  ], x, -5);
}

function buildLeg(side) {
  const x = side === 'left' ? -18 : 18;
  return group(`leg_${side}`, [
    // Leg
    roundedRect(0, 0, 16, 20, 8),
    fill(114, 197, 242),
    // Foot
    group('foot', [
      ellipseShape(0, 12, 10, 6),
      fill(114, 197, 242),
    ]),
  ], x, 60);
}

// ── Archetype decorations ───────────────────────────────────────

function buildArchetypeDecor(archetype) {
  const decors = [];

  switch (archetype) {
    case 'cat':
      // Pointed ears with inner ear
      decors.push(group('ear_left', [
        pathShape([[-8, 0], [0, -22], [8, 0]], [[-3, -5], [0, 0], [3, -5]], [[0, 0], [0, 0], [0, 0]], true),
        fill(114, 197, 242),
      ], -28, -55));
      decors.push(group('ear_left_inner', [
        pathShape([[-5, 0], [0, -15], [5, 0]], [[-2, -3], [0, 0], [2, -3]], [[0, 0], [0, 0], [0, 0]], true),
        fill(255, 180, 180, 60),
      ], -28, -53));
      decors.push(group('ear_right', [
        pathShape([[-8, 0], [0, -22], [8, 0]], [[-3, -5], [0, 0], [3, -5]], [[0, 0], [0, 0], [0, 0]], true),
        fill(114, 197, 242),
      ], 28, -55));
      decors.push(group('ear_right_inner', [
        pathShape([[-5, 0], [0, -15], [5, 0]], [[-2, -3], [0, 0], [2, -3]], [[0, 0], [0, 0], [0, 0]], true),
        fill(255, 180, 180, 60),
      ], 28, -53));
      // Whiskers
      decors.push(group('whiskers', [
        pathShape([[-40, -6], [-20, -4]], null, null, false), stroke(100, 80, 80, 1.5),
      ], 0, 0));
      decors.push(group('whiskers2', [
        pathShape([[-40, 2], [-20, 0]], null, null, false), stroke(100, 80, 80, 1.5),
      ], 0, 0));
      decors.push(group('whiskers3', [
        pathShape([[40, -6], [20, -4]], null, null, false), stroke(100, 80, 80, 1.5),
      ], 0, 0));
      decors.push(group('whiskers4', [
        pathShape([[40, 2], [20, 0]], null, null, false), stroke(100, 80, 80, 1.5),
      ], 0, 0));
      // Nose
      decors.push(group('nose', [
        pathShape([[-3, 0], [0, 3], [3, 0]], null, null, true),
        fill(255, 140, 140),
      ], 0, -6));
      break;

    case 'warrior':
      // Helmet with visor
      decors.push(group('helmet', [
        pathShape(
          [[0, -72], [35, -55], [38, -30], [-38, -30], [-35, -55]],
          [[-15, -5], [5, -10], [0, 0], [0, 0], [-5, -10]],
          [[15, -5], [5, 10], [0, 0], [0, 0], [-5, 10]],
          true
        ),
        fill(120, 130, 140),
      ]));
      // Helmet crest
      decors.push(group('crest', [
        pathShape(
          [[0, -82], [5, -72], [-5, -72]],
          [[-3, -3], [0, 0], [0, 0]],
          [[3, -3], [0, 0], [0, 0]],
          true
        ),
        fill(200, 60, 60),
      ]));
      // Visor slit
      decors.push(group('visor', [
        roundedRect(0, -38, 50, 8, 4),
        fill(40, 40, 50),
      ]));
      break;

    case 'king':
      // Crown
      decors.push(group('crown_base', [
        roundedRect(0, -62, 52, 16, 3),
        fill(255, 200, 50),
      ]));
      // Crown points
      decors.push(group('crown_points', [
        pathShape(
          [[-26, -70], [-18, -82], [-10, -70], [0, -88], [10, -70], [18, -82], [26, -70]],
          null, null, false
        ),
        fill(255, 200, 50),
      ]));
      // Crown jewels
      decors.push(group('jewel_center', [
        ellipseShape(0, -63, 4, 4),
        fill(220, 50, 50),
      ]));
      decors.push(group('jewel_left', [
        ellipseShape(-14, -63, 3, 3),
        fill(50, 100, 220),
      ]));
      decors.push(group('jewel_right', [
        ellipseShape(14, -63, 3, 3),
        fill(50, 200, 100),
      ]));
      // Collar/robe
      decors.push(group('collar', [
        pathShape(
          [[-35, 10], [-20, 20], [0, 15], [20, 20], [35, 10]],
          [[0, 0], [-5, 5], [0, 3], [5, 5], [0, 0]],
          [[0, 0], [5, -5], [0, -3], [-5, -5], [0, 0]],
          false
        ),
        fill(160, 50, 50),
      ]));
      break;

    case 'astronaut':
      // Helmet dome (glass)
      decors.push(group('helmet_dome', [
        ellipseShape(0, -28, 50, 48),
        fill(200, 220, 240, 25),
      ]));
      // Helmet rim
      decors.push(group('helmet_rim', [
        ellipseShape(0, -28, 50, 48),
        stroke(180, 190, 200, 3),
      ]));
      // Visor glare
      decors.push(group('visor_glare', [
        ellipseShape(-12, -36, 14, 10),
        fill(255, 255, 255, 20),
      ]));
      // Antenna
      decors.push(group('antenna_rod', [
        pathShape([[0, -75], [0, -60]], null, null, false),
        stroke(180, 190, 200, 2),
      ]));
      decors.push(group('antenna_ball', [
        ellipseShape(0, -78, 4, 4),
        fill(255, 80, 80),
      ]));
      break;

    case 'wizard':
      // Pointed hat
      decors.push(group('hat', [
        pathShape(
          [[-32, -52], [0, -95], [32, -52]],
          [[-8, -10], [-10, 0], [8, -10]],
          [[0, 0], [10, 0], [0, 0]],
          true
        ),
        fill(80, 50, 140),
      ]));
      // Hat brim
      decors.push(group('hat_brim', [
        ellipseShape(0, -52, 42, 8),
        fill(80, 50, 140),
      ]));
      // Star on hat
      decors.push(group('star', [
        pathShape(
          [[0, -82], [3, -76], [9, -76], [5, -72], [6, -66], [0, -69], [-6, -66], [-5, -72], [-9, -76], [-3, -76]],
          null, null, true
        ),
        fill(255, 220, 80),
      ]));
      // Beard
      decors.push(group('beard', [
        pathShape(
          [[-15, 15], [-10, 35], [0, 42], [10, 35], [15, 15]],
          [[0, 0], [-5, 5], [0, 5], [5, 5], [0, 0]],
          [[0, 0], [5, 5], [0, 5], [-5, 5], [0, 0]],
          true
        ),
        fill(220, 220, 220, 70),
      ]));
      break;

    case 'dragon':
      // Horns
      decors.push(group('horn_left', [
        pathShape(
          [[-25, -48], [-35, -75], [-18, -50]],
          [[0, 0], [-5, -5], [0, 0]],
          [[0, 0], [5, -5], [0, 0]],
          true
        ),
        fill(180, 150, 50),
      ]));
      decors.push(group('horn_right', [
        pathShape(
          [[25, -48], [35, -75], [18, -50]],
          [[0, 0], [5, -5], [0, 0]],
          [[0, 0], [-5, -5], [0, 0]],
          true
        ),
        fill(180, 150, 50),
      ]));
      // Small wings
      decors.push(group('wing_left', [
        pathShape(
          [[-45, -20], [-70, -40], [-65, -10], [-55, 5], [-45, -5]],
          [[0, 0], [-5, -5], [0, 0], [0, 0], [0, 0]],
          [[0, 0], [5, 5], [0, 0], [0, 0], [0, 0]],
          true
        ),
        fill(114, 197, 242, 60),
      ]));
      decors.push(group('wing_right', [
        pathShape(
          [[45, -20], [70, -40], [65, -10], [55, 5], [45, -5]],
          [[0, 0], [5, -5], [0, 0], [0, 0], [0, 0]],
          [[0, 0], [-5, 5], [0, 0], [0, 0], [0, 0]],
          true
        ),
        fill(114, 197, 242, 60),
      ]));
      // Belly patch
      decors.push(group('belly', [
        ellipseShape(0, 15, 25, 28),
        fill(255, 240, 200, 30),
      ]));
      // Nostrils
      decors.push(group('nostril_l', [ellipseShape(-6, -8, 3, 2), fill(60, 40, 40, 50)]));
      decors.push(group('nostril_r', [ellipseShape(6, -8, 3, 2), fill(60, 40, 40, 50)]));
      break;

    case 'ninja':
      // Headband
      decors.push(group('headband', [
        roundedRect(0, -42, 60, 10, 3),
        fill(40, 40, 40),
      ]));
      // Headband knot (back)
      decors.push(group('knot', [
        pathShape(
          [[30, -42], [45, -50], [42, -35]],
          [[0, 0], [3, -5], [0, 0]],
          [[0, 0], [3, 5], [0, 0]],
          true
        ),
        fill(40, 40, 40),
      ]));
      // Headband tail
      decors.push(group('tail1', [
        pathShape([[42, -42], [55, -48]], null, null, false),
        stroke(40, 40, 40, 3),
      ]));
      decors.push(group('tail2', [
        pathShape([[42, -40], [58, -38]], null, null, false),
        stroke(40, 40, 40, 3),
      ]));
      // Face mask (lower face)
      decors.push(group('mask', [
        pathShape(
          [[-30, -8], [-25, 12], [0, 16], [25, 12], [30, -8]],
          [[0, 0], [-5, 5], [0, 3], [5, 5], [0, 0]],
          [[0, 0], [5, -5], [0, -3], [-5, -5], [0, 0]],
          true
        ),
        fill(50, 50, 50, 50),
      ]));
      break;

    case 'critter':
      // Extra-fluffy tuft on head
      decors.push(group('tuft1', [
        ellipseShape(0, -62, 10, 12),
        fill(114, 197, 242),
      ]));
      decors.push(group('tuft2', [
        ellipseShape(-8, -58, 8, 10),
        fill(114, 197, 242),
      ]));
      decors.push(group('tuft3', [
        ellipseShape(8, -58, 8, 10),
        fill(114, 197, 242),
      ]));
      // Rosy cheeks (always visible for critter)
      decors.push(group('rosy_l', [
        ellipseShape(-30, -4, 8, 5),
        fill(255, 160, 160, 35),
      ]));
      decors.push(group('rosy_r', [
        ellipseShape(30, -4, 8, 5),
        fill(255, 160, 160, 35),
      ]));
      // Tiny tail
      decors.push(group('tail', [
        ellipseShape(42, 30, 10, 8),
        fill(114, 197, 242),
      ]));
      break;
  }

  return decors;
}

// ── State-specific animation parameters ─────────────────────────

function getStateParams(state) {
  switch (state) {
    case 'sick':
      return { floatAmp: 2, floatSpeed: 0.3, breathAmp: 0.8, rotAmp: 0, scaleBase: 98 };
    case 'sad':
      return { floatAmp: 4, floatSpeed: 0.5, breathAmp: 1, rotAmp: 2, scaleBase: 99 };
    case 'neutral':
      return { floatAmp: 6, floatSpeed: 0.7, breathAmp: 1.2, rotAmp: 0, scaleBase: 100 };
    case 'happy':
      return { floatAmp: 10, floatSpeed: 1, breathAmp: 1.5, rotAmp: 0, scaleBase: 101 };
    case 'thriving':
      return { floatAmp: 14, floatSpeed: 1.5, breathAmp: 2, rotAmp: 0, scaleBase: 102 };
  }
}

// ── Main generator ──────────────────────────────────────────────

function generateMascot(archetype, state) {
  const params = getStateParams(state);
  const showBlush = state === 'happy' || state === 'thriving';

  // Collect all shape groups for the main body layer
  // In Lottie, FIRST shape in array renders ON TOP (like layers)
  const bodyShapes = [];

  // Face features ON TOP (rendered first = in front)
  // Blush
  if (showBlush) {
    bodyShapes.push(...buildBlush());
  }

  // Mouth
  bodyShapes.push(...buildMouth(state));

  // Eyes (with highlights on top)
  bodyShapes.push(...buildEye('left'));
  bodyShapes.push(...buildEye('right'));

  // Archetype decorations (helmets, crowns etc above body but below face)
  bodyShapes.push(...buildArchetypeDecor(archetype));

  // Arms (on sides of body)
  bodyShapes.push(buildArm('left'));
  bodyShapes.push(buildArm('right'));

  // Body (behind everything)
  bodyShapes.push(...buildBody());

  // Legs (behind body, at the very back)
  bodyShapes.push(buildLeg('left'));
  bodyShapes.push(buildLeg('right'));

  // Build the main body layer with animations
  const bodyKs = {
    o: { a: 0, k: 100 },
    r: params.rotAmp > 0 ? animateRotation(params.rotAmp, 0.5) : { a: 0, k: 0 },
    p: {
      a: 1,
      k: (() => {
        const cx = W / 2, cy = H / 2 + 10;
        const amp = params.floatAmp;
        const halfCycle = Math.round(FRAMES / (2 * params.floatSpeed));
        const kfs = [];
        for (let i = 0; i <= FRAMES; i += halfCycle) {
          const phase = (i / halfCycle) % 2 === 0 ? 0 : 1;
          kfs.push({
            t: Math.min(i, FRAMES),
            s: [cx, cy + (phase === 0 ? -amp : amp), 0],
            ...(i < FRAMES ? EASE_GENTLE : {}),
          });
        }
        return kfs;
      })(),
    },
    a: { a: 0, k: [0, 0, 0] },
    s: animateBreathing(params.scaleBase, params.breathAmp),
  };

  // Eye blink layer (separate for animation)
  const eyeBlinkKs = {
    o: { a: 0, k: 100 },
    r: { a: 0, k: 0 },
    p: { a: 0, k: [W / 2, H / 2 + 10, 0] },
    a: { a: 0, k: [0, 0, 0] },
    s: animateBlink(),
  };

  // Build eye shapes for blink layer
  const eyeBlinkShapes = [
    // Left eyelid (skin-colored to cover eye on blink)
    group('eyelid_left', [
      ellipseShape(-18, -22, 15, 17),
      fill(114, 197, 242),
    ]),
    // Right eyelid
    group('eyelid_right', [
      ellipseShape(18, -22, 15, 17),
      fill(114, 197, 242),
    ]),
  ];

  // Shadow under character
  const shadowKs = {
    o: { a: 0, k: 100 },
    r: { a: 0, k: 0 },
    p: { a: 0, k: [W / 2, H - 20, 0] },
    a: { a: 0, k: [0, 0, 0] },
    s: animateScale(100, params.floatAmp * 0.3, params.floatSpeed),
  };

  const shadowShapes = [
    group('ground_shadow', [
      ellipseShape(0, 0, 45, 8),
      fill(0, 0, 0, 15),
    ]),
  ];

  const layers = [
    // Body + everything (topmost layer rendered last = on top)
    layer(1, 'body', bodyShapes, bodyKs),
    // Ground shadow
    layer(3, 'shadow', shadowShapes, shadowKs),
  ];

  // Lottie spec: layers array renders top=first, so shadow should be last
  layers.reverse();

  return {
    v: '5.7.1',
    fr: FPS,
    ip: 0,
    op: FRAMES,
    w: W,
    h: H,
    nm: `mascot-${archetype}-${state}`,
    ddd: 0,
    assets: [],
    layers,
  };
}

// ── Generate all files ──────────────────────────────────────────

let count = 0;
for (const arch of ARCHETYPES) {
  for (const state of STATES) {
    const anim = generateMascot(arch, state);
    const filename = `mascot-${arch}-${state}.json`;
    fs.writeFileSync(path.join(OUT, filename), JSON.stringify(anim));
    count++;
  }
}

console.log(`✓ Generated ${count} mascot animations in ${OUT}`);
