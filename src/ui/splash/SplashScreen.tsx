import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login'); // go to login after 3s
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        سامانه برنامه‌ریزی پیش از حادثه سازمان آتش نشانی مشهد
      </Text>
      <Image
        source={require('../../assets/ic_firestation_logo.jpg')}
        style={styles.logo}
      />
      <Image
        source={require('../../assets/ic_companies.png')}
        style={styles.companies}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: '100vh',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '700',
  },
  logo: {
    marginBottom: 16,
  },
  companies: {
    width: 520,
    height: 100,
    marginTop: 16,
  },
});
