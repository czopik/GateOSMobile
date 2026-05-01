import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CamerasScreen } from '../screens/CamerasScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { Colors } from '../utils/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const TAB_META: Record<string, { icon: string; label: string }> = {
  Dashboard: { icon: 'home-outline', label: 'Dashboard' },
  Kamery: { icon: 'cctv', label: 'Kamery' },
  Ustawienia: { icon: 'cog-outline', label: 'Ustawienia' },
};

function GateTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scale = clamp(Math.min(width / 430, height / 900), 0.78, 1);
  const bottomInset = Math.min(Math.max(insets.bottom, 16), 34);
  const horizontal = clamp(width * 0.036, 14, 28);
  const tabHeight = 74 * scale;
  const bottomGap = 12 * scale;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabShell,
        {
          left: horizontal,
          right: horizontal,
          bottom: bottomInset + bottomGap,
          height: tabHeight,
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(13, 30, 44, 0.88)', 'rgba(5, 14, 23, 0.92)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.tabBar, { borderRadius: 24 * scale }]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key].options;
          const meta = TAB_META[route.name] ?? { icon: 'circle-outline', label: options.title ?? route.name };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabItem}
            >
              {focused ? (
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(0, 224, 131, 0.18)', 'rgba(0, 224, 131, 0.04)']}
                  style={[styles.activeTab, { borderRadius: 17 * scale, margin: 8 * scale }]}
                />
              ) : null}
              <MaterialCommunityIcons
                name={meta.icon as any}
                size={(focused ? 31 : 28) * scale}
                color={focused ? Colors.primary : 'rgba(210, 219, 226, 0.66)'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    fontSize: (focused ? 12.5 : 12) * scale,
                    lineHeight: 15 * scale,
                    color: focused ? Colors.primary : 'rgba(210, 219, 226, 0.62)',
                  },
                ]}
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {meta.label}
              </Text>
              {focused ? <View style={[styles.activeDot, { width: 5 * scale, height: 5 * scale, borderRadius: 2.5 * scale }]} /> : null}
            </Pressable>
          );
        })}
      </LinearGradient>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props: BottomTabBarProps) => <GateTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Kamery" component={CamerasScreen} />
      <Tab.Screen name="Ustawienia" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function LoginNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

export function RootNavigation({ authenticated }: { authenticated: boolean }) {
  return (
    <NavigationContainer>
      {authenticated ? <MainTabs /> : <LoginNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabShell: {
    position: 'absolute',
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(126, 169, 193, 0.24)',
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  activeTab: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(24, 232, 255, 0.18)',
  },
  tabLabel: {
    marginTop: 5,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0,
  },
  activeDot: {
    marginTop: 5,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
});
