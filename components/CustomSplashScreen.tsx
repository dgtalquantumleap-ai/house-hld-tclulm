
import React from 'react';
import { View, Text, Image, StyleSheet, useColorScheme } from 'react-native';

export function CustomSplashScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <Image
        source={require('../assets/images/natively-dark.png')}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={[styles.appName, { color: isDark ? '#FFFFFF' : '#000000' }]}>
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
