import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../App';
import { useProfile } from './ProfileViewModel';

type NavProp = StackNavigationProp<RootStackParamList>;

export default function ProfileAndLogoutSection() {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useProfile();

  const goToProfile = () => {
    setMenuVisible(false);
    navigation.navigate('Profile'); 
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
    navigation.navigate('Login'); 
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.btn} onPress={() => setMenuVisible(true)}>
        <Text style={styles.avatarText}>
          {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
        </Text>
      </TouchableOpacity>

      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuBtn} onPress={goToProfile}>
              <Text style={styles.menuBtnTxt}>مشاهده پروفایل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuBtn, styles.logoutBtn]}
              onPress={handleLogout}
            >
              <Text style={styles.menuBtnTxt}>خروج</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 12 },
  btn: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: '#1c2440',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: 'white', fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menu: {
    width: 200,
    backgroundColor: '#0b1020',
    borderRadius: 12,
    padding: 12,
    marginTop: 60,
    marginRight: 12,
  },
  menuBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1c2440',
    marginTop: 8,
    alignItems: 'center',
  },
  logoutBtn: { backgroundColor: '#3b1f2a' },
  menuBtnTxt: { color: 'white', fontWeight: '600' },
});
