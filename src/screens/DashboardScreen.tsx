import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useContext, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GateContext } from '../context/GateContext';
import { api } from '../services/api';
import { GateDiagnostics } from '../types';
import { Colors } from '../utils/colors';

export function DashboardScreen() {
  const gate = useContext(GateContext);
  const insets = useSafeAreaInsets();
  const [diag, setDiag] = useState(null as GateDiagnostics | null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setDiag(await api.getDiagnostics());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Diagnostyka</Text>
        <View style={styles.tabs}>
          {['Status', 'System', 'Sieć', 'MQTT', 'OTA'].map((item, index) => (
            <View key={item} style={[styles.tab, index === 0 && styles.tabActive]}>
              <Text style={[styles.tabText, index === 0 && styles.tabTextActive]}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Urządzenie</Text>
          <Info label="Uptime" value={formatDuration(diag?.uptimeMs ?? 0)} />
          <Info label="Reset reason" value={diag?.resetReason ?? '-'} />
          <Info label="Heap free" value={formatBytes(diag?.heapFree ?? 0)} />
          <Info label="Min heap" value={formatBytes(diag?.minFreeHeap ?? 0)} />
          <Info label="Firmware" value={diag?.firmware ?? '-'} />
          <Info label="API requesty" value={String(diag?.apiRequests ?? 0)} />
          <Info label="Błędy API" value={String(diag?.apiErrors ?? 0)} danger={(diag?.apiErrors ?? 0) > 0} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Wejścia / Wyjścia</Text>
          <Signal icon="camera-control" label="Fotokomórka" ok={gate.gateState?.rawState !== 'error'} />
          <Signal icon="ray-start-arrow" label="Limit otwarcia" ok={Boolean(gate.gateState?.limitOpen)} muted={!gate.gateState?.limitOpen} />
          <Signal icon="ray-end-arrow" label="Limit zamknięcia" ok={Boolean(gate.gateState?.limitClosed)} muted={!gate.gateState?.limitClosed} />
          <Signal icon="engine" label="Hover fault" ok={!diag?.hoverFault} />
          <Signal icon="battery-charging" label="Ładowarka" ok={Boolean(diag?.chargerConnected)} muted={!diag?.chargerConnected} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Łączność i OTA</Text>
          <Info label="WebSocket" value={gate.wsConnected ? 'LIVE' : 'fallback HTTP'} ok={gate.wsConnected} />
          <Info label="Wi-Fi RSSI" value={`${diag?.wifiRssi ?? gate.gateState?.wifiRssi ?? -100} dBm`} />
          <Info label="MQTT" value={diag?.mqttConnected ? 'połączone' : 'offline'} ok={Boolean(diag?.mqttConnected)} />
          <Info label="Telemetry age" value={diag?.telAgeMs == null ? '-' : `${diag.telAgeMs} ms`} danger={(diag?.telAgeMs ?? 0) > 2000} />
          <Info label="OTA ready" value={diag?.otaReady ? 'tak' : 'nie'} ok={Boolean(diag?.otaReady)} />
          <Info label="OTA active" value={diag?.otaActive ? `${diag.otaProgress}%` : 'nie'} danger={Boolean(diag?.otaActive)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value, ok, danger }: { label: string; value: string; ok?: boolean; danger?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, ok && styles.ok, danger && styles.danger]}>{value}</Text>
    </View>
  );
}

function Signal({ icon, label, ok, muted }: { icon: string; label: string; ok: boolean; muted?: boolean }) {
  return (
    <View style={styles.signalRow}>
      <MaterialCommunityIcons name={icon as any} size={18} color={muted ? Colors.muted : ok ? Colors.primary : Colors.danger} />
      <Text style={styles.signalLabel}>{label}</Text>
      <Text style={[styles.signalValue, muted ? styles.muted : ok ? styles.ok : styles.danger]}>{muted ? 'NIEAKTYWNE' : ok ? 'OK' : 'ALARM'}</Text>
    </View>
  );
}

function formatBytes(bytes: number) {
  if (!bytes) return '-';
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} kB`;
}

function formatDuration(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return `${days}d ${hours}h ${mins}m`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, gap: 14 },
  title: { color: Colors.text, fontSize: 20, fontWeight: '900' },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(96,132,154,0.20)' },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { color: Colors.muted, fontSize: 11, fontWeight: '800' },
  tabTextActive: { color: Colors.text },
  card: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(96,132,154,0.22)', padding: 16 },
  cardTitle: { color: Colors.text, fontSize: 15, fontWeight: '900', marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: 'rgba(154,167,182,0.09)' },
  infoLabel: { color: Colors.muted, fontSize: 13 },
  infoValue: { color: Colors.text, fontSize: 13, fontWeight: '800', flex: 1, textAlign: 'right' },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: 'rgba(154,167,182,0.09)' },
  signalLabel: { color: Colors.text, fontSize: 13, flex: 1 },
  signalValue: { color: Colors.text, fontSize: 12, fontWeight: '900' },
  ok: { color: Colors.primary },
  danger: { color: Colors.danger },
  muted: { color: Colors.muted },
});
