import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../LoginScreen';

const Stack = createNativeStackNavigator();

export function LoginStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {props => (
          <LoginScreen
            {...props}
            onLoginSuccess={() => props.navigation.replace('Main')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
