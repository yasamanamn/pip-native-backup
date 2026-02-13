import React from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useLogin } from './useLogin';
import { styles } from './login.styles';

type Props = {
  onLoginSuccess: () => void;
};

export default function LoginScreen({ onLoginSuccess }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const {
    uiState,
    onEmailChange,
    onPasswordChange,
    onLoginClick,
  } = useLogin(onLoginSuccess);

  return (
    <View style={styles.root}>
      {isTablet ? (
        <View style={styles.row}>
          <LoginFormPane {...{ uiState, onEmailChange, onPasswordChange, onLoginClick }} />
          <BrandPane />
        </View>
      ) : (
        <LoginFormPane {...{ uiState, onEmailChange, onPasswordChange, onLoginClick }} />
      )}
    </View>
  );
}

function LoginFormPane({ uiState, onEmailChange, onPasswordChange, onLoginClick }: any) {
  return (
    <View style={styles.form}>
      <Image source={require('../../../assets/email.png')} style={styles.icon} />

      <TextInput
        value={uiState.email}
        onChangeText={onEmailChange}
        placeholder="شماره موبایل"
        editable={!uiState.isLoading}
        style={styles.input}
      />

      <TextInput
        value={uiState.password}
        onChangeText={onPasswordChange}
        placeholder="رمز عبور"
        secureTextEntry
        editable={!uiState.isLoading}
        style={styles.input}
      />

      <Image
        source={require('../../../assets/ic_citizen_id.png')}
        style={styles.citizen}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={onLoginClick}
        disabled={uiState.isLoading}
      >
        {uiState.isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>ورود</Text>
        )}
      </TouchableOpacity>

      {uiState.error && <Text style={styles.error}>{uiState.error}</Text>}
    </View>
  );
}

function BrandPane() {
  return (
    <View style={styles.brand}>
      <Image
        source={require('../../../assets/ic_firestation_logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Fire Station</Text>
    </View>
  );
}
