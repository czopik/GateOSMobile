import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraFeed } from '../components/CameraFeed';
import { AuthContext } from '../context/AuthContext';
import { useGateStatus } from '../hooks/useGateStatus';
import { Colors } from '../utils/colors';

const HOLD_MS = 500;
const COOLDOWN_MS = 650;
const REFRESH_DELAY_MS = 350;
const GREEN = '#22C55E';
const CARD_BG = '#0D1F2D';

type ButtonPhase = 'idle' | 'holding' | 'cooldown';
type GateCommand = 'TOGGLE' | 'STOP';
type ButtonLabel = {
  actionLabel: string;
  subLabel: string;
  iconName: string;
};

function isGateMoving(status: string): boolean {
  return ['opening', 'closing', 'moving', 'active', 'running', 'opening_gate', 'closing_gate'].includes(status);
}

function getNextCommand(status: string): GateCommand {
  if (isGateMoving(status)) return 'STOP';
  return 'TOGGLE';
}

function getButtonLabel(status: string, limitOpen?: boolean | null, limitClosed?: boolean | null): ButtonLabel {
  if (isGateMoving(status)) {
    return {
      actionLabel: 'ZATRZYMAJ',
      subLabel: 'Brama jest w ruchu',
      iconName: 'stop',
    };
  }

  if (status === 'open' || limitOpen === true) {
    return {
      actionLabel: 'ZAMKNIJ',
      subLabel: 'Brama jest otwarta',
      iconName: 'arrow-down',
    };
  }

  if (status === 'closed' || limitClosed === true) {
    return {
      actionLabel: 'OTWÓRZ',
      subLabel: 'Brama jest zamknięta',
      iconName: 'arrow-up',
    };
  }

  return {
    actionLabel: 'STERUJ',
    subLabel: 'Naciśnij, aby przełączyć',
    iconName: 'gesture-tap-button',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Gate control button: wide pill + hold-to-activate
// During movement → pressable progress bar (hold to STOP)
// ─────────────────────────────────────────────────────────────────────────────
function GateControlButton({
  phase,
  gateStatus,
  position,
  limitOpen,
  limitClosed,
  disabled,
  fillProgress,
  pressScale,
  onPressIn,
  onPressOut,
}: {
  phase: ButtonPhase;
  gateStatus: string;
  position: number;
  limitOpen: boolean | null;
  limitClosed: boolean | null;
  disabled: boolean;
  fillProgress: any;
  pressScale: any;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  const [btnWidth, setBtnWidth] = useState(0);
  const isMoving = isGateMoving(gateStatus);
  const buttonLabel = getButtonLabel(gateStatus, limitOpen, limitClosed);

  const onLayout = (e: any) => setBtnWidth(e.nativeEvent.layout.width);

  const fillWidth = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, btnWidth],
    extrapolate: 'clamp',
  });

  // ── Moving state: pressable progress bar (hold to STOP) ───────────────────
  if (isMoving) {
    const pct = Math.max(0, Math.min(100, position));
    const isOpening = gateStatus === 'opening' || gateStatus === 'opening_gate' || gateStatus === 'active';
    const moveColor = isOpening ? GREEN : '#F59E0B';
    const STOP_RED = '#EF4444';
    const isHoldingOrCooldown = phase === 'holding' || phase === 'cooldown';

    return (
      <Animated.View style={[styles.gateButtonOuter, { transform: [{ scale: pressScale }] }]} onLayout={onLayout}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={disabled}
          style={[styles.progressBarShell, isHoldingOrCooldown && { borderColor: STOP_RED + '88' }]}
          android_ripple={{ color: 'rgba(239,68,68,0.2)', borderless: false }}
        >
          {/* Position fill */}
          <View style={[styles.progressBarFill, { width: `${pct}%` as any, backgroundColor: moveColor }]} />
          {/* Hold-to-stop fill overlay */}
          {btnWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[styles.holdFill, { width: fillWidth, backgroundColor: 'rgba(239,68,68,0.35)' }]}
            />
          )}
          <View style={[styles.progressIconCircle, { backgroundColor: STOP_RED + '22', borderColor: STOP_RED + '66' }]}>
            <MaterialCommunityIcons name="stop" size={22} color={STOP_RED} />
          </View>
          <View style={styles.progressTextBlock}>
            <Text style={[styles.progressLabel, { color: STOP_RED }]} allowFontScaling={false}>
              {buttonLabel.actionLabel}
            </Text>
            <Text style={styles.progressPct} allowFontScaling={false}>
              {buttonLabel.subLabel} • {pct}%
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── Idle / holding / cooldown ──────────────────────────────────────────────
  const btnBg = phase === 'cooldown' ? '#15532E' : GREEN;

  return (
    <Animated.View style={[styles.gateButtonOuter, { transform: [{ scale: pressScale }] }]} onLayout={onLayout}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={[styles.gateButton, { backgroundColor: btnBg }]}
        android_ripple={{ color: 'rgba(0,0,0,0.2)', borderless: false }}
      >
        {btnWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.holdFill, { width: fillWidth }]}
          />
        )}
        <View style={styles.btnIconCircle}>
          <MaterialCommunityIcons name={buttonLabel.iconName as any} size={24} color={GREEN} />
        </View>
        <View style={styles.btnTextBlock}>
          <Text style={styles.btnMainLabel} allowFontScaling={false} numberOfLines={1}>
            {buttonLabel.actionLabel}
          </Text>
          <Text style={styles.btnSubLabel} allowFontScaling={false} numberOfLines={1}>
            {buttonLabel.subLabel}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS card
// ─────────────────────────────────────────────────────────────────────────────
type BadgeVariant = 'ok' | 'inactive' | 'warn' | 'error';

const BADGE_STYLE: Record<BadgeVariant, { bg: string; color: string }> = {
  ok:       { bg: 'rgba(34,197,94,0.18)',   color: '#22C55E' },
  inactive: { bg: 'rgba(100,116,139,0.18)', color: '#94A3B8' },
  warn:     { bg: 'rgba(245,158,11,0.18)',  color: '#F59E0B' },
  error:    { bg: 'rgba(239,68,68,0.18)',   color: '#EF4444' },
};

function StatusBadge({ variant, label }: { variant: BadgeVariant; label: string }) {
  const s = BADGE_STYLE[variant];
  return (
    <View style={[sBadge.shell, { backgroundColor: s.bg, borderColor: s.color + '55' }]}>
      <Text style={[sBadge.label, { color: s.color }]} allowFontScaling={false}>
        {label}
      </Text>
    </View>
  );
}

const sBadge = StyleSheet.create({
  shell: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 66,
    alignItems: 'center',
  },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});

function SystemRow({
  iconName,
  iconColor,
  title,
  subtitle,
  badge,
  badgeVariant,
}: {
  iconName: string;
  iconColor: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeVariant: BadgeVariant;
}) {
  return (
    <View style={styles.systemRow}>
      <View style={[
        styles.systemIconCircle,
        { borderColor: iconColor + '66', backgroundColor: iconColor + '22' },
      ]}>
        <MaterialCommunityIcons name={iconName as any} size={20} color={iconColor} />
      </View>
      <View style={styles.systemRowText}>
        <Text style={styles.systemRowTitle} allowFontScaling={false}>{title}</Text>
        <Text style={styles.systemRowSub} allowFontScaling={false}>{subtitle}</Text>
      </View>
      <StatusBadge variant={badgeVariant} label={badge} />
    </View>
  );
}

function SystemStatusCard({
  limitOpen,
  limitClosed,
}: {
  limitOpen: boolean | null;
  limitClosed: boolean | null;
}) {
  const closedOk = limitClosed === true;
  const openOk   = limitOpen === true;

  return (
    <View style={styles.card}>
      <Text style={styles.sectionHeader}>STATUS</Text>
      <SystemRow
        iconName="lock"
        iconColor={closedOk ? GREEN : '#64748B'}
        title="Krańcówka zamknięcia"
        subtitle={closedOk ? 'Aktywna' : 'Nieaktywna'}
        badge={closedOk ? 'OK' : 'NIEAKTYWNA'}
        badgeVariant={closedOk ? 'ok' : 'inactive'}
      />
      <View style={styles.systemRowDivider} />
      <SystemRow
        iconName="circle-outline"
        iconColor={openOk ? GREEN : '#64748B'}
        title="Krańcówka otwarcia"
        subtitle={openOk ? 'Aktywna' : 'Nieaktywna'}
        badge={openOk ? 'OK' : 'NIEAKTYWNA'}
        badgeVariant={openOk ? 'ok' : 'inactive'}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen
// ─────────────────────────────────────────────────────────────────────────────
export function HomeScreen() {
  const { config } = useContext(AuthContext);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { status, position, refresh, limitOpen, limitClosed } = useGateStatus();
  const compact = height < 760;
  const tabBarHeight = height < 760 ? 74 : 92;
  const cameraHeight = Math.max(compact ? 150 : 170, Math.min(width * 0.62, compact ? 210 : 260));
  const bottomPadding = insets.bottom + tabBarHeight + 24;

  const [phase, setPhase] = useState('idle' as ButtonPhase);
  const phaseRef      = useRef('idle' as ButtonPhase);
  const cooldownTimer = useRef(null as ReturnType<typeof setTimeout> | null);
  const [isSendingCommand, setIsSendingCommand] = useState(false);
  const isSendingRef = useRef(false);
  const setSending = (val: boolean) => { isSendingRef.current = val; setIsSendingCommand(val); };

  const fillProgress = useRef(new Animated.Value(0)).current;
  const pressScale   = useRef(new Animated.Value(1)).current;
  const pulseAnim    = useRef(new Animated.Value(0)).current;
  const pulseLoop    = useRef(null as any);

  const setPhaseSync = (next: ButtonPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const isMoving = isGateMoving(status);

  useEffect(() => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(0);
    if (phase !== 'idle') return;

    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.current.start();
  }, [phase, pulseAnim]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      pulseLoop.current?.stop();
    };
  }, []);

  const beginHold = () => {
    if (isSendingRef.current || phaseRef.current !== 'idle') return;
    setPhaseSync('holding');
    fillProgress.setValue(0);

    Animated.spring(pressScale, {
      toValue: 0.97,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();

    Animated.timing(fillProgress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }: { finished: boolean }) => {
      if (!finished || phaseRef.current !== 'holding') return;

      Vibration.vibrate([0, 50, 80, 50]);

      const cmd = getNextCommand(status);
      const sendCmd = async () => {
        setSending(true);
        try {
          await api.sendGateCommand(cmd);
        } catch (_e) {
          // Gate context polling will reflect the error state
        } finally {
          setSending(false);
          setTimeout(() => { void refresh(); }, REFRESH_DELAY_MS);
        }
      };
      void sendCmd();

      setPhaseSync('cooldown');

      Animated.spring(pressScale, {
        toValue: 1,
        friction: 7,
        tension: 100,
        useNativeDriver: true,
      }).start();

      cooldownTimer.current = setTimeout(() => {
        fillProgress.setValue(0);
        setPhaseSync('idle');
      }, COOLDOWN_MS);
    });
  };

  const cancelHold = () => {
    if (phaseRef.current !== 'holding') return;
    fillProgress.stopAnimation();
    setPhaseSync('idle');
    Animated.parallel([
      Animated.timing(fillProgress, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.spring(pressScale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });
  const pulseShadow = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.65],
  });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, compact && styles.contentCompact, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Camera ─────────────────────────────────────────────────────── */}
        <View style={styles.cameraWrapper}>
          <CameraFeed url={config?.cameraUrl ?? ''} height={cameraHeight} framed />
        </View>

        {/* ── STEROWANIE ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, compact && styles.sectionHeaderCompact]}>STEROWANIE</Text>
          <Animated.View
            style={[
              styles.buttonShadowWrapper,
              { opacity: isMoving ? 1 : pulseOpacity },
              phase === 'idle' && !isMoving ? { shadowOpacity: pulseShadow } : undefined,
            ]}
          >
            <GateControlButton
              phase={phase}
              gateStatus={status}
              position={position}
              limitOpen={limitOpen}
              limitClosed={limitClosed}
              disabled={isSendingCommand}
              fillProgress={fillProgress}
              pressScale={pressScale}
              onPressIn={beginHold}
              onPressOut={cancelHold}
            />
          </Animated.View>
          {phase === 'idle' && !isMoving && (
            <Text style={styles.holdHint} allowFontScaling={false}>
              Przytrzymaj przycisk, aby aktywować
            </Text>
          )}
          {isMoving && phase === 'idle' && (
            <Text style={styles.holdHint} allowFontScaling={false}>
              Przytrzymaj, aby zatrzymać bramę
            </Text>
          )}
        </View>

        {/* ── STATUS ─────────────────────────────────────────────────────── */}
        <SystemStatusCard
          limitOpen={limitOpen}
          limitClosed={limitClosed}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  contentCompact: {
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 10,
  },

  // Camera
  cameraWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },

  // Generic section / card
  section: { gap: 8 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.10)',
    gap: 12,
  },
  sectionHeader: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  sectionHeaderCompact: {
    fontSize: 10,
    marginBottom: 0,
  },

  buttonShadowWrapper: {
    borderRadius: 18,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 12,
  },

  gateButtonOuter: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  gateButton: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    minHeight: 62,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    overflow: 'hidden',
  },
  holdFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 18,
    zIndex: 0,
  },
  btnIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 2,
    elevation: 2,
  },
  btnTextBlock: {
    flex: 1,
    minWidth: 0,
    zIndex: 2,
    elevation: 2,
  },
  btnMainLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  btnSubLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  holdHint: {
    color: 'rgba(148,163,184,0.55)',
    fontSize: 11,
    textAlign: 'center',
  },

  progressBarShell: {
    position: 'relative',
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    opacity: 0.3,
    borderRadius: 18,
    zIndex: 0,
  },
  progressIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
    zIndex: 2,
    elevation: 2,
  },
  progressTextBlock: {
    flex: 1,
    minWidth: 0,
    zIndex: 2,
    elevation: 2,
  },
  progressLabel: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  progressPct: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  systemIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  systemRowText: { flex: 1, minWidth: 0 },
  systemRowTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  systemRowSub: {
    color: Colors.muted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  systemRowDivider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.09)',
    marginLeft: 52,
  },
});


