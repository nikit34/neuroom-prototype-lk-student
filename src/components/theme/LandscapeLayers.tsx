import React, { memo } from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, Rect } from 'react-native-svg';

// ── Types ────────────────────────────────────────────────────────────

export type LayerType =
  | 'mountains'
  | 'hills'
  | 'pines'
  | 'forest'
  | 'bushes'
  | 'clouds'
  | 'waves'
  | 'wavesNear'
  | 'skyscrapers'
  | 'buildings'
  | 'buildingsNear'
  | 'dunes'
  | 'dunesMid'
  | 'cacti'
  | 'stars'
  | 'planets'
  | 'surface'
  | 'sakuraHills';

export interface SvgLayerConfig {
  type: LayerType;
  color: string;
  opacity: number;
  /** fraction of screen height (0–1) */
  height: number;
}

interface LayerProps {
  width: number;
  height: number;
  color: string;
}

// ── Individual layer renderers ───────────────────────────────────────

function MountainsLayer({ width: w, height: h, color }: LayerProps) {
  const d = `M0 ${h} L0 ${h * 0.3} L${w * 0.12} ${h * 0.55} L${w * 0.22} ${h * 0.15} L${w * 0.35} ${h * 0.5} L${w * 0.45} ${h * 0.05} L${w * 0.58} ${h * 0.45} L${w * 0.68} ${h * 0.2} L${w * 0.78} ${h * 0.48} L${w * 0.88} ${h * 0.1} L${w} ${h * 0.35} L${w} ${h} Z`;
  return <Path d={d} fill={color} />;
}

function HillsLayer({ width: w, height: h, color }: LayerProps) {
  const d = `M0 ${h} Q${w * 0.1} ${h * 0.2} ${w * 0.25} ${h * 0.45} Q${w * 0.35} ${h * 0.6} ${w * 0.5} ${h * 0.3} Q${w * 0.65} ${h * 0.05} ${w * 0.75} ${h * 0.4} Q${w * 0.88} ${h * 0.65} ${w} ${h * 0.25} L${w} ${h} Z`;
  return <Path d={d} fill={color} />;
}

function PinesLayer({ width: w, height: h, color }: LayerProps) {
  const trees: string[] = [];
  const count = 18;
  const spacing = w / count;
  for (let i = 0; i < count; i++) {
    const cx = spacing * i + spacing * 0.5;
    const treeH = h * (0.5 + Math.sin(i * 1.7) * 0.25);
    const halfW = spacing * 0.35;
    trees.push(`M${cx} ${h - treeH} L${cx + halfW} ${h} L${cx - halfW} ${h} Z`);
    // trunk
    trees.push(`M${cx - halfW * 0.15} ${h} L${cx - halfW * 0.15} ${h - treeH * 0.1} L${cx + halfW * 0.15} ${h - treeH * 0.1} L${cx + halfW * 0.15} ${h} Z`);
  }
  // ground strip
  trees.push(`M0 ${h * 0.85} Q${w * 0.25} ${h * 0.75} ${w * 0.5} ${h * 0.82} Q${w * 0.75} ${h * 0.9} ${w} ${h * 0.8} L${w} ${h} L0 ${h} Z`);
  return <Path d={trees.join(' ')} fill={color} />;
}

function ForestLayer({ width: w, height: h, color }: LayerProps) {
  // round-canopy deciduous trees
  const count = 12;
  const spacing = w / count;
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const cx = spacing * i + spacing * 0.5;
    const r = spacing * (0.4 + Math.sin(i * 2.3) * 0.15);
    const cy = h - r * 0.9;
    // circle approximation via arc
    parts.push(`M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} Z`);
  }
  // ground
  parts.push(`M0 ${h * 0.7} Q${w * 0.3} ${h * 0.6} ${w * 0.5} ${h * 0.68} Q${w * 0.7} ${h * 0.75} ${w} ${h * 0.65} L${w} ${h} L0 ${h} Z`);
  return <Path d={parts.join(' ')} fill={color} />;
}

function BushesLayer({ width: w, height: h, color }: LayerProps) {
  const d = `M0 ${h} Q${w * 0.05} ${h * 0.4} ${w * 0.12} ${h * 0.55} Q${w * 0.18} ${h * 0.35} ${w * 0.25} ${h * 0.5} Q${w * 0.32} ${h * 0.3} ${w * 0.4} ${h * 0.45} Q${w * 0.48} ${h * 0.25} ${w * 0.55} ${h * 0.4} Q${w * 0.63} ${h * 0.2} ${w * 0.7} ${h * 0.35} Q${w * 0.78} ${h * 0.15} ${w * 0.85} ${h * 0.38} Q${w * 0.92} ${h * 0.28} ${w} ${h * 0.42} L${w} ${h} Z`;
  return <Path d={d} fill={color} />;
}

function CloudsLayer({ width: w, height: h, color }: LayerProps) {
  // a few fluffy cloud shapes spread across the width
  const clouds = [
    { cx: w * 0.15, cy: h * 0.3, rx: w * 0.1, ry: h * 0.15 },
    { cx: w * 0.45, cy: h * 0.2, rx: w * 0.13, ry: h * 0.18 },
    { cx: w * 0.75, cy: h * 0.35, rx: w * 0.09, ry: h * 0.12 },
    { cx: w * 0.9, cy: h * 0.15, rx: w * 0.07, ry: h * 0.1 },
  ];
  return (
    <>
      {clouds.map((c, i) => (
        <Ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={color} />
      ))}
    </>
  );
}

function WavesLayer({ width: w, height: h, color }: LayerProps) {
  const d = `M0 ${h * 0.5} Q${w * 0.08} ${h * 0.35} ${w * 0.17} ${h * 0.5} Q${w * 0.25} ${h * 0.65} ${w * 0.33} ${h * 0.45} Q${w * 0.42} ${h * 0.3} ${w * 0.5} ${h * 0.5} Q${w * 0.58} ${h * 0.7} ${w * 0.67} ${h * 0.42} Q${w * 0.75} ${h * 0.25} ${w * 0.83} ${h * 0.48} Q${w * 0.92} ${h * 0.65} ${w} ${h * 0.4} L${w} ${h} L0 ${h} Z`;
  return <Path d={d} fill={color} />;
}

function WavesNearLayer({ width: w, height: h, color }: LayerProps) {
  const d = `M0 ${h * 0.6} Q${w * 0.1} ${h * 0.35} ${w * 0.2} ${h * 0.55} Q${w * 0.3} ${h * 0.75} ${w * 0.4} ${h * 0.45} Q${w * 0.5} ${h * 0.25} ${w * 0.6} ${h * 0.5} Q${w * 0.7} ${h * 0.7} ${w * 0.8} ${h * 0.4} Q${w * 0.9} ${h * 0.2} ${w} ${h * 0.5} L${w} ${h} L0 ${h} Z`;
  return <Path d={d} fill={color} />;
}

function SkyscrapersLayer({ width: w, height: h, color }: LayerProps) {
  const count = 10;
  const spacing = w / count;
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = spacing * i + spacing * 0.1;
    const bw = spacing * 0.7;
    const bh = h * (0.4 + Math.sin(i * 2.1 + 1) * 0.3);
    parts.push(`M${x} ${h} L${x} ${h - bh} L${x + bw} ${h - bh} L${x + bw} ${h} Z`);
    // spire on some
    if (i % 3 === 0) {
      const spireX = x + bw * 0.4;
      parts.push(`M${spireX} ${h - bh} L${spireX + bw * 0.1} ${h - bh - h * 0.08} L${spireX + bw * 0.2} ${h - bh} Z`);
    }
  }
  return <Path d={parts.join(' ')} fill={color} />;
}

function BuildingsLayer({ width: w, height: h, color }: LayerProps) {
  const count = 14;
  const spacing = w / count;
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = spacing * i + spacing * 0.05;
    const bw = spacing * 0.8;
    const bh = h * (0.3 + Math.sin(i * 1.5 + 2) * 0.25);
    parts.push(`M${x} ${h} L${x} ${h - bh} L${x + bw} ${h - bh} L${x + bw} ${h} Z`);
  }
  return <Path d={parts.join(' ')} fill={color} />;
}

function BuildingsNearLayer({ width: w, height: h, color }: LayerProps) {
  const count = 8;
  const spacing = w / count;
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = spacing * i;
    const bw = spacing * 0.9;
    const bh = h * (0.5 + Math.sin(i * 1.8) * 0.3);
    parts.push(`M${x} ${h} L${x} ${h - bh} L${x + bw} ${h - bh} L${x + bw} ${h} Z`);
  }
  return <Path d={parts.join(' ')} fill={color} />;
}

function DunesLayer({ width: w, height: h, color }: LayerProps) {
  const d = `M0 ${h} Q${w * 0.1} ${h * 0.25} ${w * 0.25} ${h * 0.45} Q${w * 0.4} ${h * 0.65} ${w * 0.5} ${h * 0.3} Q${w * 0.6} ${h * 0.1} ${w * 0.75} ${h * 0.4} Q${w * 0.9} ${h * 0.6} ${w} ${h * 0.2} L${w} ${h} Z`;
  return <Path d={d} fill={color} />;
}

function DunesMidLayer({ width: w, height: h, color }: LayerProps) {
  const d = `M0 ${h} Q${w * 0.15} ${h * 0.35} ${w * 0.3} ${h * 0.5} Q${w * 0.45} ${h * 0.2} ${w * 0.6} ${h * 0.45} Q${w * 0.75} ${h * 0.6} ${w * 0.85} ${h * 0.3} Q${w * 0.95} ${h * 0.15} ${w} ${h * 0.4} L${w} ${h} Z`;
  return <Path d={d} fill={color} />;
}

function CactiLayer({ width: w, height: h, color }: LayerProps) {
  const parts: string[] = [];
  const cacti = [0.1, 0.3, 0.55, 0.75, 0.9];
  cacti.forEach((frac) => {
    const cx = w * frac;
    const cw = w * 0.02;
    const ch = h * (0.3 + Math.sin(frac * 10) * 0.15);
    // main stem
    parts.push(`M${cx - cw} ${h} L${cx - cw} ${h - ch} Q${cx} ${h - ch - cw * 1.5} ${cx + cw} ${h - ch} L${cx + cw} ${h} Z`);
    // left arm
    const armY = h - ch * 0.55;
    parts.push(`M${cx - cw} ${armY} L${cx - cw * 4} ${armY} L${cx - cw * 4} ${armY - ch * 0.25} Q${cx - cw * 3} ${armY - ch * 0.3} ${cx - cw * 2.5} ${armY - ch * 0.2} L${cx - cw} ${armY - ch * 0.05} Z`);
    // right arm
    const armY2 = h - ch * 0.4;
    parts.push(`M${cx + cw} ${armY2} L${cx + cw * 3.5} ${armY2} L${cx + cw * 3.5} ${armY2 - ch * 0.2} Q${cx + cw * 3} ${armY2 - ch * 0.25} ${cx + cw * 2} ${armY2 - ch * 0.15} L${cx + cw} ${armY2 - ch * 0.05} Z`);
  });
  // ground
  parts.push(`M0 ${h * 0.88} Q${w * 0.25} ${h * 0.82} ${w * 0.5} ${h * 0.86} Q${w * 0.75} ${h * 0.9} ${w} ${h * 0.84} L${w} ${h} L0 ${h} Z`);
  return <Path d={parts.join(' ')} fill={color} />;
}

function StarsLayer({ width: w, height: h, color }: LayerProps) {
  // scattered dots
  const stars = [];
  const seed = [0.05, 0.12, 0.2, 0.28, 0.35, 0.42, 0.5, 0.58, 0.65, 0.72, 0.8, 0.88, 0.95,
    0.08, 0.18, 0.32, 0.48, 0.62, 0.78, 0.92, 0.15, 0.38, 0.55, 0.7, 0.85];
  for (let i = 0; i < seed.length; i++) {
    const cx = w * seed[i];
    const cy = h * ((Math.sin(i * 3.7) * 0.5 + 0.5) * 0.8 + 0.05);
    const r = 1 + (i % 3);
    stars.push(<Circle key={i} cx={cx} cy={cy} r={r} fill={color} />);
  }
  return <>{stars}</>;
}

function PlanetsLayer({ width: w, height: h, color }: LayerProps) {
  return (
    <>
      <Circle cx={w * 0.2} cy={h * 0.35} r={w * 0.04} fill={color} />
      <Circle cx={w * 0.7} cy={h * 0.25} r={w * 0.06} fill={color} />
      {/* ring around second planet */}
      <Ellipse cx={w * 0.7} cy={h * 0.25} rx={w * 0.09} ry={w * 0.015} fill="none" stroke={color} strokeWidth={1.5} />
      <Circle cx={w * 0.45} cy={h * 0.55} r={w * 0.025} fill={color} />
    </>
  );
}

function SurfaceLayer({ width: w, height: h, color }: LayerProps) {
  const d = `M0 ${h * 0.6} Q${w * 0.08} ${h * 0.5} ${w * 0.15} ${h * 0.55} L${w * 0.18} ${h * 0.45} Q${w * 0.22} ${h * 0.4} ${w * 0.28} ${h * 0.5} L${w * 0.35} ${h * 0.6} Q${w * 0.45} ${h * 0.65} ${w * 0.55} ${h * 0.55} L${w * 0.6} ${h * 0.42} Q${w * 0.65} ${h * 0.38} ${w * 0.72} ${h * 0.48} L${w * 0.8} ${h * 0.58} Q${w * 0.9} ${h * 0.62} ${w} ${h * 0.5} L${w} ${h} L0 ${h} Z`;
  return <Path d={d} fill={color} />;
}

function SakuraHillsLayer({ width: w, height: h, color }: LayerProps) {
  // gentle rolling hills with cherry tree silhouettes
  const parts: string[] = [];
  // base hills
  parts.push(`M0 ${h} Q${w * 0.15} ${h * 0.3} ${w * 0.3} ${h * 0.5} Q${w * 0.45} ${h * 0.7} ${w * 0.55} ${h * 0.35} Q${w * 0.7} ${h * 0.15} ${w * 0.85} ${h * 0.45} Q${w * 0.95} ${h * 0.6} ${w} ${h * 0.3} L${w} ${h} Z`);
  // tree silhouettes (round canopy like cherry trees)
  const trees = [0.15, 0.4, 0.65, 0.85];
  trees.forEach((frac) => {
    const cx = w * frac;
    const r = w * 0.035;
    const baseY = h * (0.35 + Math.sin(frac * 7) * 0.12);
    parts.push(`M${cx - r} ${baseY} A${r} ${r * 0.9} 0 1 1 ${cx + r} ${baseY} A${r} ${r * 0.9} 0 1 1 ${cx - r} ${baseY} Z`);
    // trunk
    parts.push(`M${cx - r * 0.12} ${baseY} L${cx - r * 0.12} ${baseY + r * 1.2} L${cx + r * 0.12} ${baseY + r * 1.2} L${cx + r * 0.12} ${baseY} Z`);
  });
  return <Path d={parts.join(' ')} fill={color} />;
}

// ── Layer registry ───────────────────────────────────────────────────

const LAYER_RENDERERS: Record<LayerType, React.FC<LayerProps>> = {
  mountains: MountainsLayer,
  hills: HillsLayer,
  pines: PinesLayer,
  forest: ForestLayer,
  bushes: BushesLayer,
  clouds: CloudsLayer,
  waves: WavesLayer,
  wavesNear: WavesNearLayer,
  skyscrapers: SkyscrapersLayer,
  buildings: BuildingsLayer,
  buildingsNear: BuildingsNearLayer,
  dunes: DunesLayer,
  dunesMid: DunesMidLayer,
  cacti: CactiLayer,
  stars: StarsLayer,
  planets: PlanetsLayer,
  surface: SurfaceLayer,
  sakuraHills: SakuraHillsLayer,
};

// ── Public component ─────────────────────────────────────────────────

interface LandscapeLayerProps {
  config: SvgLayerConfig;
}

export const LandscapeLayer = memo(function LandscapeLayer({ config }: LandscapeLayerProps) {
  const { width, height: screenH } = useWindowDimensions();
  const layerH = screenH * config.height;
  const Renderer = LAYER_RENDERERS[config.type];
  if (!Renderer) return null;

  return (
    <View style={[styles.layer, { height: layerH }]} pointerEvents="none">
      <Svg width={width} height={layerH} viewBox={`0 0 ${width} ${layerH}`}>
        <Renderer width={width} height={layerH} color={config.color} />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
