import React, { useContext } from 'react';
import { StatusBar, View } from 'react-native';
import { ActivityIndicator, MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { GateProvider } from './context/GateContext';
import { RootNavigation } from './navigation/BottomTabNavigator';
import { Colors } from './utils/colors';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primary,
    secondary: Colors.accent,
    background: Colors.background,
    surface: Colors.surface,
    surfaceVariant: Colors.surfaceAlt,
    onSurface: Colors.text,
    onBackground: Colors.text,
    error: Colors.danger,
  },
};

function AppBody() {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return isAuthenticated ? (
    <GateProvider>
      <RootNavigation authenticated />
    </GateProvider>
  ) : (
    <RootNavigation authenticated={false} />
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <StatusBar hidden barStyle="light-content" backgroundColor={Colors.background} />
        <AppBody />
      </AuthProvider>
    </PaperProvider>
  );
}
