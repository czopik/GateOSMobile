import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraFeed } from '../components/CameraFeed';
import { AuthContext } from '../context/AuthContext';
import { Colors } from '../utils/colors';

const CARD_BG = '#0D1F2D';
const GREEN = '#22C55E';

function CameraCard({ label, url }: { label: string; url: string }) {
  const hasUrl = !!url;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <MaterialCommunityIcons name="cctv" size={16} color={Colors.muted} />
          <Text style={styles.cardTitle} allowFontScaling={false}>
            {label}
          </Text>
        </View>
        {hasUrl ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText} allowFontScaling={false}>LIVE</Text>
          </View>
        ) : (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText} allowFontScaling={false}>BRAK URL</Text>
          </View>
        )}
      </View>
      <View style={styles.feedWrapper}>
        <CameraFeed url={url} height={200} framed />
      </View>
    </View>
  );
}

export function CamerasScreen() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = height < 760 ? 74 : 92;
  const bottomPadding = insets.bottom + tabBarHeight + 24;
  const { config } = useContext(AuthContext);

  const cameras = [
    { label: 'Kamera 1', url: config?.cameraUrl ?? '' },
    { label: 'Kamera 2', url: config?.cameraUrl2 ?? '' },
    { label: 'Kamera 3', url: config?.cameraUrl3 ?? '' },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <Text style={styles.heading} allowFontScaling={false}>Kamery</Text>
          <Text style={styles.subheading} allowFontScaling={false}>
            PodglÄ…d na ĹĽywo
          </Text>
        </View>
        {cameras.map((cam) => {
          return (
            <View key={cam.label}>
              <CameraCard label={cam.label} url={cam.url} />
            </View>
          );
        })}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 14,
  },
  header: {
    paddingVertical: 6,
    gap: 2,
  },
  heading: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subheading: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.10)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  feedWrapper: {
    overflow: 'hidden',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: GREEN + '55',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  liveText: {
    color: GREEN,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  offlineBadge: {
    backgroundColor: 'rgba(100,116,139,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.3)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  offlineText: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

