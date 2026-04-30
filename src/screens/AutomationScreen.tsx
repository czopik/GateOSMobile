import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';
import { Colors } from '../utils/colors';

const automations = [
  { icon: 'weather-sunset-down', title: 'Domknij po zmroku', subtitle: 'Gotowe do podłączenia z harmonogramem' },
  { icon: 'home-assistant', title: 'Home Assistant', subtitle: 'Sceny i zdarzenia z lokalnej instalacji' },
  { icon: 'shield-check', title: 'Tryb nocny', subtitle: 'Ciche powiadomienia i kontrola stanu' },
];

export function AutomationScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.heading}>Automacje</Text>
      <Text style={styles.subheading}>Scenariusze dla bramy</Text>

      {automations.map((item) => (
        <Card key={item.title} mode="contained" style={styles.card}>
          <Card.Content style={styles.row}>
            <View style={styles.iconBox}>
              <IconButton icon={item.icon} size={26} iconColor={Colors.primary} />
            </View>
            <View style={styles.copy}>
              <Text variant="titleMedium" style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12 },
  heading: { color: Colors.primaryDark, fontWeight: '900' },
  subheading: { color: Colors.muted, marginBottom: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  copy: { flex: 1 },
  title: { color: Colors.text, fontWeight: '800' },
  subtitle: { color: Colors.muted, marginTop: 4 },
});
