import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Colors } from '../utils/colors';

export function ToggleButton({
  label,
  onPress,
  loading,
  width,
}: {
  label: string;
  onPress: () => void;
  loading: boolean;
  width: number;
}) {
  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        { width },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? <ActivityIndicator color={Colors.primaryDark} /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 68,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    shadowColor: Colors.glow,
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 10,
    paddingHorizontal: 24,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  label: {
    color: Colors.primaryDark,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
});
