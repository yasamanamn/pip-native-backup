import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../ui/login/LoginScreen';
import MainScreen from '../ui/main/MainScreen';
import ProfileScreen from '../ui/main/components/profile/profileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigation() {
  return (
    <Stack.Navigator initialRouteName="LoginScreen">
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="MainScreen" component={MainScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
