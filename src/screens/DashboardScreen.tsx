import React, { useContext } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { GateContext } from '../context/GateContext';
import { Colors } from '../utils/colors';

export function DashboardScreen() {
  const { gateState, metrics } = useContext(GateContext);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.heading}>Status sterownika</Text>
      <Text style={styles.subheading}>Dane z aktywnego połączenia</Text>

      <View style={styles.grid}>
        <Metric label="Pozycja" value={`${gateState?.position ?? 0}%`} />
        <Metric label="Wi‑Fi" value={gateState?.wifiConnected ? `${gateState.wifiRssi} dBm` : 'offline'} />
        <Metric label="RPM" value={gateState?.rpm ?? '—'} />
        <Metric label="Prąd" value={gateState?.currentAmp !== null && gateState?.currentAmp !== undefined ? `${gateState.currentAmp.toFixed(2)} A` : '—'} />
        <Metric label="MQTT" value={metrics?.mqttConnected ? 'połączone' : 'offline'} />
        <Metric label="IP" value={gateState?.ip || '—'} />
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card mode="contained" style={styles.metric}>
      <Card.Content>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 14 },
  heading: { color: Colors.text, fontWeight: '900' },
  subheading: { color: Colors.muted, marginBottom: 4 },
  grid: { gap: 12 },
  metric: { backgroundColor: Colors.surface, borderRadius: 8 },
  metricLabel: { color: Colors.muted, fontWeight: '700' },
  metricValue: { color: Colors.text, fontSize: 24, fontWeight: '900', marginTop: 8 },
});
