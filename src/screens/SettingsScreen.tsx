import React, { useContext, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Alert } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { DEFAULT_DEVICE_CONFIG } from '../services/api';
import { Colors } from '../utils/colors';

export function SettingsScreen() {
  const { config, login } = useContext(AuthContext);
  const [host, setHost] = useState(config?.host ?? DEFAULT_DEVICE_CONFIG.host);
  const [port, setPort] = useState(String(config?.port ?? DEFAULT_DEVICE_CONFIG.port));
  const [token, setToken] = useState(config?.token ?? '');
  const [cameraUrl, setCameraUrl] = useState(config?.cameraUrl ?? DEFAULT_DEVICE_CONFIG.cameraUrl);
  const [cameraUrl2, setCameraUrl2] = useState(config?.cameraUrl2 ?? DEFAULT_DEVICE_CONFIG.cameraUrl2);
  const [cameraUrl3, setCameraUrl3] = useState(config?.cameraUrl3 ?? DEFAULT_DEVICE_CONFIG.cameraUrl3);

  const handleSave = async () => {
    try {
      const parsedPort = Number(port);
      if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
        Alert.alert('Błąd', 'Port musi być liczbą od 1 do 65535.');
        return;
      }
      await login({ host, port: parsedPort, token, cameraUrl, cameraUrl2, cameraUrl3 });
      Alert.alert('OK', 'Ustawienia zapisane.');
    } catch (e) {
      Alert.alert('Błąd', e instanceof Error ? e.message : 'Nie udało się połączyć.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <Text variant="headlineSmall" style={styles.heading}>Ustawienia</Text>
      <Text style={styles.subheading}>Konfiguracja sterownika ChemiX Gate</Text>

      <Card mode="contained" style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Sterownik bramy</Text>
          <InfoRow label="Nazwa" value={DEFAULT_DEVICE_CONFIG.name} />
          <Text style={styles.label}>Host</Text>
          <TextInput
            style={styles.input}
            value={host}
            onChangeText={setHost}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="adres IP lub domena"
            placeholderTextColor={Colors.grey}
          />

          <Text style={styles.label}>Port API</Text>
          <TextInput
            style={styles.input}
            value={port}
            onChangeText={setPort}
            keyboardType="number-pad"
            placeholder="8080"
            placeholderTextColor={Colors.grey}
          />

          <Text style={styles.label}>Token API</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            placeholder="opcjonalny"
            placeholderTextColor={Colors.grey}
            secureTextEntry
          />
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Kamera (HTTP Snapshot)</Text>
          <Text style={styles.hint}>
            URL snapshota HTTP z kamery Hikvision (odświeżany co ~1s).
            Przykład: http://admin:haslo@ip:80/ISAPI/Streaming/channels/2/picture
          </Text>
          <Text style={styles.label}>URL kamery 1</Text>
          <TextInput
            style={[styles.input, styles.inputMono]}
            value={cameraUrl}
            onChangeText={setCameraUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://admin:haslo@ip/ISAPI/Streaming/channels/2/picture"
            placeholderTextColor={Colors.grey}
          />
          <Text style={styles.label}>URL kamery 2</Text>
          <TextInput
            style={[styles.input, styles.inputMono]}
            value={cameraUrl2}
            onChangeText={setCameraUrl2}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://admin:haslo@ip/ISAPI/..."
            placeholderTextColor={Colors.grey}
          />
          <Text style={styles.label}>URL kamery 3</Text>
          <TextInput
            style={[styles.input, styles.inputMono]}
            value={cameraUrl3}
            onChangeText={setCameraUrl3}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://admin:haslo@ip/ISAPI/..."
            placeholderTextColor={Colors.grey}
          />
        </Card.Content>
      </Card>

      <View style={styles.row}>
        <Button mode="contained" onPress={handleSave} style={styles.button}>Zapisz i połącz</Button>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  heading: { color: Colors.text, fontWeight: '900' },
  subheading: { color: Colors.muted, marginBottom: 4 },
  sectionTitle: { color: Colors.primary, fontWeight: '800', fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: 8 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f3249',
  },
  infoLabel: { color: Colors.muted, fontWeight: '700' },
  infoValue: { color: Colors.text, flex: 1, textAlign: 'right' },
  label: { color: Colors.text, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  hint: { color: Colors.muted, fontSize: 12, marginBottom: 10, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: '#1f3249',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#0d1728',
    color: Colors.text,
  },
  inputMono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  row: { marginTop: 4 },
  button: { borderRadius: 8 },
});
