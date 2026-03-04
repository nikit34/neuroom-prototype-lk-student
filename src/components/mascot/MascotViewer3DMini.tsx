import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Character3DConfig } from '@/src/types';

interface Props {
  config3d: Character3DConfig;
  size?: number;
}

/**
 * Lightweight 2D avatar representation of a 3D character.
 * Uses colored shapes instead of WebGL to avoid the browser limit
 * on active GL contexts (profile page alone needs 5+ mini viewers).
 */
function MascotViewer3DMini({ config3d, size = 60 }: Props) {
  const s = size;
  const primary = config3d.primaryColor;
  const secondary = config3d.secondaryColor;
  const accent = config3d.accentColor;

  return (
    <View style={[styles.container, { width: s, height: s }]}>
      {config3d.bodyType === 'humanoid' && (
        <HumanoidAvatar size={s} primary={primary} secondary={secondary} accent={accent} config={config3d} />
      )}
      {config3d.bodyType === 'quadruped' && (
        <QuadrupedAvatar size={s} primary={primary} secondary={secondary} accent={accent} config={config3d} />
      )}
      {config3d.bodyType === 'blob' && (
        <BlobAvatar size={s} primary={primary} secondary={secondary} accent={accent} />
      )}
      {config3d.bodyType === 'snowman' && (
        <SnowmanAvatar size={s} primary={primary} accent={accent} />
      )}
      {config3d.bodyType === 'bird' && (
        <BirdAvatar size={s} primary={primary} secondary={secondary} accent={accent} />
      )}
    </View>
  );
}

function HumanoidAvatar({ size, primary, secondary, accent, config }: { size: number; primary: string; secondary: string; accent: string; config: Character3DConfig }) {
  const u = size / 10; // unit
  return (
    <View style={[styles.avatarWrap, { width: size, height: size }]}>
      {/* Head */}
      <View style={{
        width: u * 3,
        height: u * 3,
        borderRadius: config.headShape === 'cube' ? u * 0.4 : u * 1.5,
        backgroundColor: primary,
        marginBottom: u * 0.3,
      }} />
      {/* Eyes */}
      <View style={{ position: 'absolute', top: u * 1.5, flexDirection: 'row', gap: u * 0.6 }}>
        <View style={{ width: u * 0.5, height: u * 0.5, borderRadius: u * 0.25, backgroundColor: '#fff' }} />
        <View style={{ width: u * 0.5, height: u * 0.5, borderRadius: u * 0.25, backgroundColor: '#fff' }} />
      </View>
      {/* Body */}
      <View style={{
        width: u * 2.8,
        height: u * 3,
        borderRadius: u * 0.6,
        backgroundColor: secondary,
        marginBottom: u * 0.3,
      }} />
      {/* Arms */}
      <View style={{ position: 'absolute', top: u * 3.8, flexDirection: 'row' }}>
        <View style={{ width: u * 0.7, height: u * 2.2, borderRadius: u * 0.35, backgroundColor: primary, marginRight: u * 2.2 }} />
        <View style={{ width: u * 0.7, height: u * 2.2, borderRadius: u * 0.35, backgroundColor: primary }} />
      </View>
      {/* Legs */}
      <View style={{ flexDirection: 'row', gap: u * 0.5 }}>
        <View style={{ width: u * 0.9, height: u * 2, borderRadius: u * 0.4, backgroundColor: accent }} />
        <View style={{ width: u * 0.9, height: u * 2, borderRadius: u * 0.4, backgroundColor: accent }} />
      </View>
      {/* Crown */}
      {config.hasCrown && (
        <View style={{ position: 'absolute', top: u * -0.2 }}>
          <View style={{ width: u * 2.5, height: u * 1, backgroundColor: accent, borderTopLeftRadius: u * 0.3, borderTopRightRadius: u * 0.3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: -u * 0.4 }}>
              {[0, 1, 2].map(i => (
                <View key={i} style={{ width: 0, height: 0, borderLeftWidth: u * 0.3, borderRightWidth: u * 0.3, borderBottomWidth: u * 0.5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: accent }} />
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function QuadrupedAvatar({ size, primary, secondary, accent, config }: { size: number; primary: string; secondary: string; accent: string; config: Character3DConfig }) {
  const u = size / 10;
  return (
    <View style={[styles.avatarWrap, { width: size, height: size, justifyContent: 'center' }]}>
      {/* Head */}
      <View style={{ position: 'absolute', top: u * 1.5, left: u * 5.5 }}>
        <View style={{ width: u * 2.5, height: u * 2.5, borderRadius: u * 1.25, backgroundColor: primary }} />
        {/* Eyes */}
        <View style={{ position: 'absolute', top: u * 0.7, left: u * 1, flexDirection: 'row', gap: u * 0.3 }}>
          <View style={{ width: u * 0.35, height: u * 0.35, borderRadius: u * 0.2, backgroundColor: '#fff' }} />
          <View style={{ width: u * 0.35, height: u * 0.35, borderRadius: u * 0.2, backgroundColor: '#fff' }} />
        </View>
        {/* Horns */}
        {config.hasHorns && (
          <View style={{ position: 'absolute', top: -u * 0.6, flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
            <View style={{ width: u * 0.4, height: u * 0.8, backgroundColor: accent, borderRadius: u * 0.2, transform: [{ rotate: '-15deg' }] }} />
            <View style={{ width: u * 0.4, height: u * 0.8, backgroundColor: accent, borderRadius: u * 0.2, transform: [{ rotate: '15deg' }] }} />
          </View>
        )}
      </View>
      {/* Body */}
      <View style={{
        width: u * 5,
        height: u * 2.8,
        borderRadius: u * 1.2,
        backgroundColor: secondary,
        marginTop: u * 1,
      }} />
      {/* Legs */}
      <View style={{ flexDirection: 'row', gap: u * 2.5, marginTop: u * 0.1 }}>
        <View style={{ flexDirection: 'row', gap: u * 0.4 }}>
          <View style={{ width: u * 0.6, height: u * 1.5, borderRadius: u * 0.3, backgroundColor: accent }} />
          <View style={{ width: u * 0.6, height: u * 1.5, borderRadius: u * 0.3, backgroundColor: accent }} />
        </View>
        <View style={{ flexDirection: 'row', gap: u * 0.4 }}>
          <View style={{ width: u * 0.6, height: u * 1.5, borderRadius: u * 0.3, backgroundColor: accent }} />
          <View style={{ width: u * 0.6, height: u * 1.5, borderRadius: u * 0.3, backgroundColor: accent }} />
        </View>
      </View>
      {/* Tail */}
      {config.hasTail && (
        <View style={{ position: 'absolute', top: u * 3.5, left: u * 0.5, width: u * 1.5, height: u * 0.5, borderRadius: u * 0.25, backgroundColor: primary, transform: [{ rotate: '-20deg' }] }} />
      )}
      {/* Wings */}
      {config.hasWings && (
        <>
          <View style={{ position: 'absolute', top: u * 2.5, left: u * 1, width: u * 2.5, height: u * 1.5, borderRadius: u * 0.5, backgroundColor: secondary, opacity: 0.7, transform: [{ rotate: '-20deg' }] }} />
          <View style={{ position: 'absolute', top: u * 2.5, right: u * 1, width: u * 2.5, height: u * 1.5, borderRadius: u * 0.5, backgroundColor: secondary, opacity: 0.7, transform: [{ rotate: '20deg' }] }} />
        </>
      )}
    </View>
  );
}

function BlobAvatar({ size, primary, secondary, accent }: { size: number; primary: string; secondary: string; accent: string }) {
  const u = size / 10;
  return (
    <View style={[styles.avatarWrap, { width: size, height: size }]}>
      {/* Main body */}
      <View style={{
        width: u * 6,
        height: u * 7,
        borderRadius: u * 3,
        backgroundColor: primary,
        marginTop: u * 1,
      }}>
        {/* Eyes (big, Minion-style) */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: u * 0.5, marginTop: u * 1.5 }}>
          <View style={{ width: u * 1.4, height: u * 1.4, borderRadius: u * 0.7, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: u * 0.7, height: u * 0.7, borderRadius: u * 0.35, backgroundColor: '#222' }} />
          </View>
          <View style={{ width: u * 1.4, height: u * 1.4, borderRadius: u * 0.7, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: u * 0.7, height: u * 0.7, borderRadius: u * 0.35, backgroundColor: '#222' }} />
          </View>
        </View>
        {/* Mouth */}
        <View style={{ width: u * 1.5, height: u * 0.6, borderBottomLeftRadius: u * 0.5, borderBottomRightRadius: u * 0.5, backgroundColor: '#333', alignSelf: 'center', marginTop: u * 0.5 }} />
      </View>
      {/* Arms */}
      <View style={{ position: 'absolute', top: u * 4, left: u * 0.8, width: u * 0.7, height: u * 2, borderRadius: u * 0.35, backgroundColor: secondary, transform: [{ rotate: '15deg' }] }} />
      <View style={{ position: 'absolute', top: u * 4, right: u * 0.8, width: u * 0.7, height: u * 2, borderRadius: u * 0.35, backgroundColor: secondary, transform: [{ rotate: '-15deg' }] }} />
      {/* Legs */}
      <View style={{ flexDirection: 'row', gap: u * 1.2, marginTop: -u * 0.3 }}>
        <View style={{ width: u * 0.8, height: u * 1, borderRadius: u * 0.4, backgroundColor: accent }} />
        <View style={{ width: u * 0.8, height: u * 1, borderRadius: u * 0.4, backgroundColor: accent }} />
      </View>
    </View>
  );
}

function SnowmanAvatar({ size, primary, accent }: { size: number; primary: string; accent: string }) {
  const u = size / 10;
  return (
    <View style={[styles.avatarWrap, { width: size, height: size }]}>
      {/* Top sphere (head) */}
      <View style={{ width: u * 2.5, height: u * 2.5, borderRadius: u * 1.25, backgroundColor: primary, zIndex: 2, alignItems: 'center', justifyContent: 'center' }}>
        {/* Eyes */}
        <View style={{ flexDirection: 'row', gap: u * 0.5, marginTop: -u * 0.2 }}>
          <View style={{ width: u * 0.35, height: u * 0.35, borderRadius: u * 0.2, backgroundColor: '#222' }} />
          <View style={{ width: u * 0.35, height: u * 0.35, borderRadius: u * 0.2, backgroundColor: '#222' }} />
        </View>
        {/* Carrot nose */}
        <View style={{ width: 0, height: 0, borderLeftWidth: u * 0.3, borderRightWidth: u * 0.3, borderTopWidth: u * 0.7, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: accent, marginTop: u * 0.1 }} />
      </View>
      {/* Middle sphere */}
      <View style={{ width: u * 3.2, height: u * 3.2, borderRadius: u * 1.6, backgroundColor: primary, marginTop: -u * 0.4, zIndex: 1, alignItems: 'center' }}>
        {/* Buttons */}
        <View style={{ gap: u * 0.4, marginTop: u * 0.5 }}>
          <View style={{ width: u * 0.35, height: u * 0.35, borderRadius: u * 0.2, backgroundColor: '#222' }} />
          <View style={{ width: u * 0.35, height: u * 0.35, borderRadius: u * 0.2, backgroundColor: '#222' }} />
        </View>
      </View>
      {/* Bottom sphere */}
      <View style={{ width: u * 4, height: u * 3.5, borderRadius: u * 2, backgroundColor: primary, marginTop: -u * 0.5 }} />
    </View>
  );
}

function BirdAvatar({ size, primary, secondary, accent }: { size: number; primary: string; secondary: string; accent: string }) {
  const u = size / 10;
  return (
    <View style={[styles.avatarWrap, { width: size, height: size }]}>
      {/* Head */}
      <View style={{ width: u * 2.5, height: u * 2.5, borderRadius: u * 1.25, backgroundColor: primary, zIndex: 2, alignItems: 'center', justifyContent: 'center' }}>
        {/* Eyes */}
        <View style={{ flexDirection: 'row', gap: u * 0.4, marginTop: -u * 0.3 }}>
          <View style={{ width: u * 0.4, height: u * 0.4, borderRadius: u * 0.2, backgroundColor: '#fff' }} />
          <View style={{ width: u * 0.4, height: u * 0.4, borderRadius: u * 0.2, backgroundColor: '#fff' }} />
        </View>
        {/* Beak */}
        <View style={{ width: 0, height: 0, borderLeftWidth: u * 0.4, borderRightWidth: u * 0.4, borderTopWidth: u * 0.6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: accent, marginTop: u * 0.2 }} />
      </View>
      {/* Body */}
      <View style={{
        width: u * 4,
        height: u * 4.5,
        borderRadius: u * 2,
        backgroundColor: primary,
        marginTop: -u * 0.4,
      }} />
      {/* Wings */}
      <View style={{ position: 'absolute', top: u * 3, left: u * 0.5, width: u * 2.5, height: u * 1.5, borderRadius: u * 0.7, backgroundColor: secondary, transform: [{ rotate: '-15deg' }] }} />
      <View style={{ position: 'absolute', top: u * 3, right: u * 0.5, width: u * 2.5, height: u * 1.5, borderRadius: u * 0.7, backgroundColor: secondary, transform: [{ rotate: '15deg' }] }} />
      {/* Legs */}
      <View style={{ flexDirection: 'row', gap: u * 0.8, marginTop: -u * 0.2 }}>
        <View style={{ width: u * 0.5, height: u * 1.2, borderRadius: u * 0.25, backgroundColor: accent }} />
        <View style={{ width: u * 0.5, height: u * 1.2, borderRadius: u * 0.25, backgroundColor: accent }} />
      </View>
    </View>
  );
}

export default memo(MascotViewer3DMini);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
