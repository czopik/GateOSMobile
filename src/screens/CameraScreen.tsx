import React, { useContext } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraFeed } from '../components/CameraFeed';
import { AuthContext } from '../context/AuthContext';
import { Colors } from '../utils/colors';

export function CameraScreen() {
  const { config } = useContext(AuthContext);
  const { height } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Kamera</Text>
      </View>
      <CameraFeed url={config?.cameraUrl ?? ''} height={Math.round(height * 0.56)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  title: { color: Colors.text, fontSize: 20, fontWeight: '900' },
});
