import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { en, registerTranslation } from 'react-native-paper-dates';
import AppRouter from './AppRouter';

registerTranslation('en', en);

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider
        settings={{
          icon: props => <MaterialCommunityIcons {...props} />
        }}
      >
        <View style={{ flex: 1, direction: 'rtl' }}>
          <AppRouter />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}