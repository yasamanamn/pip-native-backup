import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreen from './MainScreen';

export type MainStackParamList = {
  Main: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {() => (
          <MainScreen
            onProjectSelected={(code) => {
              console.log('selected project code:', code);
            }}
            onProfileClick={() => console.log('profile')}
            onLogoutClick={() => console.log('logout')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
