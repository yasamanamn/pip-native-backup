import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, I18nManager } from 'react-native';
import AppRouter from './AppRouter';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, direction: 'rtl' }}>
        <AppRouter />
      </View>
    </SafeAreaProvider>
  );
}
