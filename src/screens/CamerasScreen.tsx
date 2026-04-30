import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useContext, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraFeed } from '../components/CameraFeed';
import { AuthContext } from '../context/AuthContext';
import { type DeviceConfig } from '../types';
import { Colors } from '../utils/colors';

function getCameraUrls(config?: DeviceConfig | null) {
  return [config?.cameraUrl, config?.cameraUrl2, config?.cameraUrl3].filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0,
  );
}

export function CamerasScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { config } = useContext(AuthContext);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);

  const cameras = useMemo(() => getCameraUrls(config), [config]);
  const tabBarHeight = height < 760 ? 74 : 92;
  const bottomPadding = insets.bottom + tabBarHeight + 24;
  const columns = width >= 720 ? 2 : 1;
  const gap = 10;
  const horizontalPadding = width >= 720 ? 16 : 0;
  const itemWidth = (width - horizontalPadding * 2 - gap * (columns - 1)) / columns;
  const itemHeight = Math.max(180, Math.round(itemWidth * 0.5625));
  const fullscreenIsPortrait = height > width;
  const fullscreenFeedWidth = fullscreenIsPortrait ? height : width;
  const fullscreenFeedHeight = fullscreenIsPortrait ? width : height;
  const fullscreenFeedStyle = fullscreenIsPortrait
    ? {
        width: fullscreenFeedWidth,
        height: fullscreenFeedHeight,
        left: (width - height) / 2,
        top: (height - width) / 2,
        transform: [{ rotate: '90deg' as const }],
      }
    : {
        width: fullscreenFeedWidth,
        height: fullscreenFeedHeight,
        left: 0,
        top: 0,
      };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: bottomPadding,
            gap,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.grid, { gap }]}>
          {cameras.map((url) => (
            <View key={url} style={[styles.cameraTile, { width: itemWidth, height: itemHeight }]}>
              <CameraFeed url={url} height={itemHeight} showOverlays={false} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setFullscreenUrl(url)}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={fullscreenUrl !== null}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setFullscreenUrl(null)}
      >
        <StatusBar hidden />
        <View style={styles.fullscreen}>
          {fullscreenUrl ? (
            <View style={[styles.fullscreenFeed, fullscreenFeedStyle]}>
              <CameraFeed url={fullscreenUrl} height={fullscreenFeedHeight} showOverlays={false} fit="contain" />
              <Pressable
                accessibilityRole="button"
                onPress={() => setFullscreenUrl(null)}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => setFullscreenUrl(null)}
            style={[styles.closeButton, { top: insets.top + 12 }]}
          >
            <MaterialCommunityIcons name="close" size={28} color="#fff" />
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingTop: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cameraTile: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  fullscreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenFeed: {
    position: 'absolute',
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    right: 14,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 22,
  },
});
