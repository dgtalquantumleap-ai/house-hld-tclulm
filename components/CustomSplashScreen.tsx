
import React from 'react';
import { View, Text, Image, StyleSheet, useColorScheme } from 'react-native';

export function CustomSplashScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1A1A1A' : '#F5F7FA' }]}>
      <Image
        source={require('../assets/images/d0b91751-d7d5-4486-a5c4-71cf4d50c705.png')}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={[styles.appName, { color: isDark ? '#FFFFFF' : '#333333' }]}>
        HOUSEHLD
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
