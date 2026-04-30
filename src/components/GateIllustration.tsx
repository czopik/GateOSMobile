import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../utils/colors';

export function GateIllustration({
  progress,
  size,
}: {
  progress: number;
  size: number;
}) {
  const animated = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: progress,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [animated, progress]);

  const ringSize = size * 0.9;
  const sceneWidth = size * 0.72;
  const sceneHeight = size * 0.4;
  const postWidth = Math.max(12, size * 0.045);
  const gateWidth = sceneWidth * 0.64;
  const gateHeight = sceneHeight * 0.76;
  const sideInset = (sceneWidth - gateWidth - postWidth * 2) / 2;
  const gateLeft = postWidth + sideInset;
  const translateRange = gateWidth - postWidth + sideInset;
  const ornamentGlow = animated.interpolate({
    inputRange: [0, 100],
    outputRange: [0.2, 0.95],
  });

  const gateTranslate = animated.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -translateRange],
  });

  return (
    <View style={[styles.wrap, { width: size, height: size * 0.88 }]}>
      <View style={[styles.outerRing, { width: size, height: size, borderRadius: size / 2 }]} />
      <View style={[styles.innerRing, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]} />

      <View style={[styles.scene, { width: sceneWidth, height: sceneHeight }]}>
        <View style={[styles.post, { width: postWidth, height: gateHeight + size * 0.06 }]} />
        <View style={[styles.post, styles.rightPost, { width: postWidth, height: gateHeight + size * 0.06 }]} />
        <View style={[styles.rail, { left: postWidth, width: sceneWidth - postWidth, bottom: size * 0.07 }]} />

        <Animated.View
          style={[
            styles.gateLeaf,
            {
              width: gateWidth,
              height: gateHeight,
              left: gateLeft,
              transform: [{ translateX: gateTranslate }],
            },
          ]}
        >
          <View style={styles.gateFrame} />
          <View style={styles.topBar} />
          <View style={styles.archBar} />
          <View style={styles.midBar} />
          <View style={styles.bottomBar} />
          <Animated.View style={[styles.coreOrnament, { opacity: ornamentGlow }]} />
          <View style={styles.verticals}>
            {Array.from({ length: 8 }).map((_, index) => (
              <View key={index} style={styles.verticalBar} />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(41, 242, 255, 0.32)',
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(141, 251, 231, 0.9)',
    shadowColor: Colors.glow,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  scene: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
  post: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    borderRadius: 3,
    backgroundColor: Colors.text,
  },
  rightPost: {
    left: undefined,
    right: 0,
  },
  rail: {
    position: 'absolute',
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(238, 248, 255, 0.35)',
  },
  gateLeaf: {
    position: 'absolute',
    bottom: 10,
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.text,
    backgroundColor: 'rgba(13, 27, 44, 0.18)',
  },
  gateFrame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: Colors.text,
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
    height: 3,
    backgroundColor: Colors.text,
  },
  archBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 3,
    height: 20,
    borderTopWidth: 3,
    borderColor: Colors.text,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  midBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '43%',
    height: 3,
    backgroundColor: Colors.text,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    height: 3,
    backgroundColor: Colors.text,
  },
  verticals: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-evenly',
    paddingVertical: 12,
  },
  coreOrnament: {
    position: 'absolute',
    alignSelf: 'center',
    top: '32%',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(41, 242, 255, 0.08)',
    shadowColor: Colors.glow,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  verticalBar: {
    width: 2,
    backgroundColor: Colors.text,
  },
});
