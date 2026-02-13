import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signin } from '../../services/auth.service';
import Logo from '../../assets/ic_firestation_logo.jpg';
import CitizenID from '../../assets/signin.png';
import { MdEmail, MdLock } from 'react-icons/md';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطا', 'لطفاً ایمیل و رمز عبور را وارد کنید');
      return;
    }

    try {
      setLoading(true);
      const res = await signin(email, password);
      console.log("SERVER RESPONSE:", res.data);
            await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/main', { replace: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'خطا در ورود، دوباره تلاش کنید';
      Alert.alert('ورود ناموفق', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.fullCenter}
      >
        <View style={styles.centerWrapper}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Image source={Logo} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>ورود به سامانه</Text>
              <Text style={styles.subtitle}>
                خوش آمدید، لطفا اطلاعات خود را وارد کنید
              </Text>
            </View>

            <View style={styles.form}>
              {/* ایمیل */}
              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <MdEmail size={20} color="#8b93a7" style={styles.icon} />
                  <TextInput
                    placeholder="ایمیل یا شماره همراه"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    textAlign="right"
                    autoCapitalize="none"
                    placeholderTextColor="#718096"
                  />
                </View>
              </View>

              {/* رمز عبور */}
              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <MdLock size={20} color="#8b93a7" style={styles.icon} />
                  <TextInput
                    placeholder="رمز عبور"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                    textAlign="right"
                    placeholderTextColor="#718096"
                  />
                </View>
              </View>

              <Image source={CitizenID} style={styles.citizenID} resizeMode="contain" />

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>ورود به حساب</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: '100vh', backgroundColor: '#0b1020' },
  fullCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  centerWrapper: { width: '100%', maxWidth: 400, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', backgroundColor: '#fff', borderRadius: 25, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  header: { alignItems: 'center', marginBottom: 25 },
  logo: { width: 500, height: 150, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#718096', marginTop: 5, textAlign: 'center' },
  form: { width: '100%', alignItems: 'center' },
  inputGroup: { width: '100%', marginBottom: 15 },
  inputWrapper: {
    position: 'relative',
    width: '100%',
    height: 50,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    height: '100%',
    paddingRight: 35, 
    paddingLeft: 10,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 0,
    backgroundColor: 'transparent',
    textAlign: 'right',
  },
  icon: {
    position: 'absolute',
    right: 10, 
  },
  loginButton: { backgroundColor: '#FF3F33', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  citizenID: { width: 200, height: 70 },
});
