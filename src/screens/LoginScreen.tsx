import React, { useContext, useState } from 'react';
import { Alert, Image, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { DEFAULT_DEVICE_CONFIG } from '../services/api';
import { Colors } from '../utils/colors';

export function LoginScreen() {
  const { login, isLoading, config } = useContext(AuthContext);
  const [token, setToken] = useState(config?.token ?? '');

  const submit = async () => {
    try {
      await login({ token });
    } catch (e) {
      Alert.alert('Połączenie nieudane', e instanceof Error ? e.message : 'Sterownik nie odpowiada');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text variant="headlineMedium" style={styles.title}>ChemiX Gate</Text>
        <Text style={styles.subtitle}>{DEFAULT_DEVICE_CONFIG.host}:{DEFAULT_DEVICE_CONFIG.port}</Text>
      </View>

      <Card mode="contained" style={styles.card}>
        <Card.Content>
          <Text style={styles.copy}>Aplikacja łączy się stale z zapisanym sterownikiem. Jeśli używasz tokenu API, wpisz go tutaj.</Text>
          <Text style={styles.label}>Token API</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            secureTextEntry
            autoCapitalize="none"
            placeholder="opcjonalny"
            placeholderTextColor={Colors.grey}
          />
          <Button mode="contained" onPress={submit} loading={isLoading} style={styles.button}>
            Połącz
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
    backgroundColor: Colors.background,
  },
  brand: { alignItems: 'center', marginBottom: 22 },
  logo: { width: 112, height: 112, borderRadius: 8, marginBottom: 12 },
  title: { color: Colors.text, fontWeight: '900' },
  subtitle: { color: Colors.muted, marginTop: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 8 },
  copy: { color: Colors.muted, marginBottom: 16, lineHeight: 20 },
  label: { color: Colors.text, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#1f3249',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#0d1728',
    color: Colors.text,
  },
  button: { borderRadius: 8, marginTop: 4 },
});
