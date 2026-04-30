import React, { useContext } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { GateContext } from '../context/GateContext';
import { GateEvent } from '../types';
import { Colors } from '../utils/colors';

export function NotificationsScreen() {
  const { events } = useContext(GateContext);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.heading}>Historia zdarzeń</Text>
      <Text style={styles.subheading}>Ostatnie informacje ze sterownika</Text>

      {events.length === 0 ? (
        <Card mode="contained" style={styles.card}>
          <Card.Content>
            <Text style={styles.empty}>Brak nowych zdarzeń.</Text>
          </Card.Content>
        </Card>
      ) : (
        events.map((event: GateEvent) => (
          <Card key={`${event.ts}-${event.message}`} mode="contained" style={styles.card}>
            <Card.Content style={styles.row}>
              <View style={[styles.dot, event.level === 'error' ? styles.dotError : event.level === 'warn' ? styles.dotWarn : styles.dotInfo]} />
              <View style={styles.copy}>
                <Text style={styles.message}>{event.message}</Text>
                <Text style={styles.meta}>{event.level.toUpperCase()} • {formatAge(event.ts)}</Text>
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

function formatAge(ms: number) {
  if (!ms) return 'teraz';
  const seconds = Math.floor(ms / 1000);
  return `${seconds}s`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12 },
  heading: { color: Colors.text, fontWeight: '900' },
  subheading: { color: Colors.muted, marginBottom: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  dotInfo: { backgroundColor: Colors.primary },
  dotWarn: { backgroundColor: Colors.warning },
  dotError: { backgroundColor: Colors.danger },
  copy: { flex: 1 },
  message: { color: Colors.text, fontWeight: '700' },
  meta: { color: Colors.muted, marginTop: 6 },
  empty: { color: Colors.muted },
});
