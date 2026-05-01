import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { GateContext } from '../context/GateContext';
import { api, DEFAULT_DEVICE_CONFIG } from '../services/api';
import { Colors } from '../utils/colors';

export function SettingsScreen() {
  const { config, login } = useContext(AuthContext);
  const gate = useContext(GateContext);
  const [host, setHost] = useState(config?.host ?? DEFAULT_DEVICE_CONFIG.host);
  const [port, setPort] = useState(String(config?.port ?? DEFAULT_DEVICE_CONFIG.port));
  const [token, setToken] = useState(config?.token ?? '');
  const [cameraUrl, setCameraUrl] = useState(config?.cameraUrl ?? DEFAULT_DEVICE_CONFIG.cameraUrl);
  const [cameraUrl2, setCameraUrl2] = useState(config?.cameraUrl2 ?? DEFAULT_DEVICE_CONFIG.cameraUrl2);
  const [cameraUrl3, setCameraUrl3] = useState(config?.cameraUrl3 ?? DEFAULT_DEVICE_CONFIG.cameraUrl3);

  const requireToken = () => {
    if (!token.trim()) {
      Alert.alert('Tryb serwisowy', 'Najpierw wpisz i zapisz token API.');
      return false;
    }
    return true;
  };

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

  const restart = () => {
    if (!requireToken()) return;
    Alert.alert('Restart urządzenia', 'Zrestartować sterownik GateOS?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Restart', style: 'destructive', onPress: () => api.reboot().then(() => Alert.alert('OK', 'Wysłano restart.')).catch((e) => Alert.alert('Błąd', String(e?.message ?? e))) },
    ]);
  };

  const testMqtt = async () => {
    if (!requireToken()) return;
    try {
      const ok = await api.testMqtt();
      Alert.alert('MQTT', ok ? 'Test MQTT wysłany poprawnie.' : 'Sterownik odpowiedział, ale MQTT nie potwierdził połączenia.');
    } catch (e) {
      Alert.alert('MQTT', e instanceof Error ? e.message : 'Test MQTT nieudany.');
    }
  };

  const openOta = async () => {
    if (!requireToken()) return;
    const url = `http://${host}:${port}/settings.html`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('OTA', `Otwórz w przeglądarce: ${url}`);
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
            <Text style={styles.sectionTitle}>Połączenie</Text>
            <InfoRow label="Host / IP" value={`${host}:${port}`} />
            <Text style={styles.label}>Host</Text>
            <TextInput style={styles.input} value={host} onChangeText={setHost} autoCapitalize="none" autoCorrect={false} placeholder="chemixxx.duckdns.org albo adres IP" placeholderTextColor={Colors.grey} />
            <Text style={styles.label}>Port API</Text>
            <TextInput style={styles.input} value={port} onChangeText={setPort} keyboardType="number-pad" placeholder="8080" placeholderTextColor={Colors.grey} />
            <Text style={styles.label}>Token API</Text>
            <TextInput style={styles.input} value={token} onChangeText={setToken} autoCapitalize="none" placeholder="wymagany do serwisu" placeholderTextColor={Colors.grey} secureTextEntry />
          </Card.Content>
        </Card>

        <Card mode="contained" style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Kamera (HTTP Snapshot)</Text>
            <Text style={styles.hint}>URL snapshota HTTP z kamery Hikvision (odświeżany co około 1 s).</Text>
            <Text style={styles.label}>URL kamery 1</Text>
            <TextInput style={[styles.input, styles.inputMono]} value={cameraUrl} onChangeText={setCameraUrl} autoCapitalize="none" autoCorrect={false} placeholder="http://admin:haslo@ip/ISAPI/Streaming/channels/2/picture" placeholderTextColor={Colors.grey} />
            <Text style={styles.label}>URL kamery 2</Text>
            <TextInput style={[styles.input, styles.inputMono]} value={cameraUrl2} onChangeText={setCameraUrl2} autoCapitalize="none" autoCorrect={false} placeholder="http://admin:haslo@ip/ISAPI/..." placeholderTextColor={Colors.grey} />
            <Text style={styles.label}>URL kamery 3</Text>
            <TextInput style={[styles.input, styles.inputMono]} value={cameraUrl3} onChangeText={setCameraUrl3} autoCapitalize="none" autoCorrect={false} placeholder="http://admin:haslo@ip/ISAPI/..." placeholderTextColor={Colors.grey} />
          </Card.Content>
        </Card>

        <View style={styles.row}>
          <Button mode="contained" onPress={handleSave} style={styles.button}>Zapisz i połącz</Button>
        </View>

        <Card mode="contained" style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Serwis / narzędzia</Text>
            <ServiceTool icon="restart" label="Restart urządzenia" onPress={restart} />
            <ServiceTool icon="upload" label="Aktualizacja OTA" onPress={openOta} />
            <ServiceTool icon="lan-connect" label="Test MQTT" onPress={testMqtt} />
            <ServiceTool icon="file-document-outline" label="Pobierz log zdarzeń" onPress={() => Alert.alert('Zdarzenia', gate.events.slice(0, 8).map((e) => `${e.level}: ${e.message}`).join('\n') || 'Brak zdarzeń.')} />
          </Card.Content>
        </Card>

        <Card mode="contained" style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Ostatnie zdarzenia</Text>
            {gate.events.slice(0, 5).map((event) => (
              <View key={`${event.ts}-${event.message}`} style={styles.eventRow}>
                <View style={[styles.eventDot, event.level === 'error' ? styles.eventError : event.level === 'warn' ? styles.eventWarn : styles.eventOk]} />
                <Text style={styles.eventText} numberOfLines={1}>{event.message}</Text>
                <Text style={styles.eventLevel}>{event.level.toUpperCase()}</Text>
              </View>
            ))}
            {gate.events.length === 0 ? <Text style={styles.hint}>Brak zdarzeń z WebSocket/API.</Text> : null}
          </Card.Content>
        </Card>

        <View style={styles.serviceWarn}>
          <MaterialCommunityIcons name="alert-outline" size={22} color={Colors.danger} />
          <Text style={styles.serviceWarnText}>Tryb serwisowy. Upewnij się, że nikt nie korzysta z bramy.</Text>
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

function ServiceTool({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.toolRow} onPress={onPress}>
      <MaterialCommunityIcons name={icon as any} size={20} color={Colors.text} />
      <Text style={styles.toolLabel}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 120 },
  heading: { color: Colors.text, fontWeight: '900' },
  subheading: { color: Colors.muted, marginBottom: 4 },
  sectionTitle: { color: Colors.text, fontWeight: '900', fontSize: 13, marginBottom: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(96,132,154,0.22)' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(154,167,182,0.10)' },
  infoLabel: { color: Colors.muted, fontWeight: '700' },
  infoValue: { color: Colors.primary, flex: 1, textAlign: 'right', fontWeight: '900' },
  label: { color: Colors.text, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  hint: { color: Colors.muted, fontSize: 12, marginBottom: 10, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: 'rgba(96,132,154,0.25)', borderRadius: 10, padding: 12, backgroundColor: '#071620', color: Colors.text },
  inputMono: { fontFamily: 'monospace', fontSize: 12 },
  row: { marginTop: 4 },
  button: { borderRadius: 10 },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(154,167,182,0.10)' },
  toolLabel: { color: Colors.text, flex: 1, fontWeight: '700' },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  eventDot: { width: 9, height: 9, borderRadius: 5 },
  eventOk: { backgroundColor: Colors.primary },
  eventWarn: { backgroundColor: Colors.warning },
  eventError: { backgroundColor: Colors.danger },
  eventText: { flex: 1, color: Colors.text },
  eventLevel: { color: Colors.primary, fontSize: 11, fontWeight: '900' },
  serviceWarn: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,77,77,0.35)', backgroundColor: 'rgba(255,77,77,0.12)' },
  serviceWarnText: { color: '#FFB4B4', flex: 1, lineHeight: 19 },
});
