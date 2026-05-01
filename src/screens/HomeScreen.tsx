import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, Vibration, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraFeed } from '../components/CameraFeed';
import { AuthContext } from '../context/AuthContext';
import { GateContext } from '../context/GateContext';
import { useGateStatus } from '../hooks/useGateStatus';
import { Colors } from '../utils/colors';

const HOLD_MS = 500;
const ACTIVE_MS = 700;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function HomeScreen() {
  const { config } = useContext(AuthContext);
  const gate = useContext(GateContext);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { statusLabel, position, limitOpen, limitClosed } = useGateStatus();
  const [pressing, setPressing] = useState(false);
  const [activated, setActivated] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandRunning = useRef(false);

  const tabReserve = insets.bottom + (height < 760 ? 94 : 112);
  const availableHeight = height - insets.top - tabReserve - 34;
  const cameraHeight = clamp(Math.round(width * 0.58), 165, Math.max(170, Math.round(availableHeight * 0.43)));
  const buttonSize = clamp(Math.round(width * 0.38), 124, height < 760 ? 138 : 156);

  useEffect(() => () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (activeTimer.current) clearTimeout(activeTimer.current);
  }, []);

  const runToggle = async () => {
    if (commandRunning.current) return;
    commandRunning.current = true;
    setActivated(true);
    Vibration.vibrate(70);
    try {
      await gate.toggleGate();
    } catch (e) {
      Alert.alert('Sterowanie', e instanceof Error ? e.message : 'Nie udało się wykonać akcji');
    } finally {
      commandRunning.current = false;
      if (activeTimer.current) clearTimeout(activeTimer.current);
      activeTimer.current = setTimeout(() => setActivated(false), ACTIVE_MS);
    }
  };

  const beginHold = () => {
    if (commandRunning.current) return;
    setPressing(true);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      setPressing(false);
      void runToggle();
    }, HOLD_MS);
  };

  const cancelHold = () => {
    setPressing(false);
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={[styles.content, { paddingBottom: tabReserve }]}>
        <View style={styles.cameraCard}>
          <CameraFeed url={config?.cameraUrl ?? ''} height={cameraHeight} framed fit="cover" />
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTop}>
            <View>
              <Text style={styles.label}>Stan bramy</Text>
              <Text style={styles.state}>{statusLabel}</Text>
            </View>
            <View style={styles.positionBox}>
              <Text style={styles.label}>Pozycja</Text>
              <Text style={styles.percent}>{Math.round(position)}%</Text>
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${Math.max(2, position)}%` }]} />
          </View>
          <View style={styles.quickGrid}>
            <SmallMetric label="OTWARCIE" value={limitOpen ? 'OK' : 'NIE'} ok={Boolean(limitOpen)} />
            <SmallMetric label="ZAMKNIĘCIE" value={limitClosed ? 'OK' : 'NIE'} ok={Boolean(limitClosed)} />
            <SmallMetric label="TRYB" value={gate.wsConnected ? 'LIVE' : 'HTTP'} ok={gate.wsConnected} />
          </View>
        </View>

        <View style={styles.buttonZone}>
          <Pressable
            accessibilityRole="button"
            onPressIn={beginHold}
            onPressOut={cancelHold}
            style={[
              styles.mainHold,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
              },
              pressing && styles.mainHoldPressing,
              activated && styles.mainHoldActive,
            ]}
          >
            <Text style={styles.mainArc}>PRZYTRZYMAJ 0,5 s</Text>
            <MaterialCommunityIcons name="gate" size={Math.round(buttonSize * 0.32)} color={activated ? '#FFFFFF' : Colors.primary} />
            <Text style={styles.mainText}>OTWÓRZ / ZAMKNIJ</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SmallMetric({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: ok ? Colors.primary : Colors.warning }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    justifyContent: 'space-between',
    gap: 10,
  },
  cameraCard: {
    borderRadius: 18,
    overflow: 'hidden',
    flexShrink: 0,
  },
  statusCard: {
    flexShrink: 0,
    backgroundColor: 'rgba(7,27,39,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(96,132,154,0.24)',
    borderRadius: 18,
    padding: 14,
    gap: 11,
  },
  statusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  label: { color: Colors.muted, fontSize: 11, fontWeight: '700' },
  state: { color: Colors.primary, fontSize: 16, fontWeight: '900', marginTop: 6 },
  positionBox: { alignItems: 'flex-end' },
  percent: { color: Colors.text, fontSize: 26, fontWeight: '900', marginTop: 2 },
  track: { height: 8, borderRadius: 8, backgroundColor: '#1C3140', overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: 8, backgroundColor: Colors.primary },
  quickGrid: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.035)' },
  metricLabel: { color: Colors.muted, fontSize: 10, fontWeight: '800' },
  metricValue: { marginTop: 5, fontSize: 13, fontWeight: '900' },
  buttonZone: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 142,
  },
  mainHold: {
    borderWidth: 4,
    borderColor: 'rgba(0,224,131,0.76)',
    backgroundColor: Colors.primary + '1E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 16,
  },
  mainHoldPressing: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warning + '22',
  },
  mainHoldActive: {
    borderColor: '#FFFFFF',
    backgroundColor: Colors.primary,
    shadowOpacity: 0.72,
  },
  mainArc: { color: '#D7FFE9', fontSize: 10, fontWeight: '900', marginBottom: 6 },
  mainText: { color: '#E7FFF2', fontSize: 11, fontWeight: '900', marginTop: 6 },
});
