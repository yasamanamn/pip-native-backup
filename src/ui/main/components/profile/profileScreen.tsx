import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useProfile } from './ProfileViewModel';

export default function ProfileScreen({ onBackClick }: { onBackClick: () => void }) {
  const { user, loading, logout } = useProfile();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleProfileClick = () => {
    setMenuVisible(false);
    console.log('مشاهده پروفایل');
  };

  const handleLogoutClick = async () => {
    setMenuVisible(false);
    await logout();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBackClick}>
            <Icon name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>پروفایل</Text>
        </View>

        {/* دکمه پروفایل + Dropdown */}
        <TouchableOpacity style={styles.profileBtn} onPress={() => setMenuVisible(true)}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menu}>
              <View style={styles.userInfo}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarTextLarge}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <Text style={styles.userName}>{user?.name || 'کاربر ناشناس'}</Text>
                <Text style={styles.userEmail}>{user?.email || '-'}</Text>
                {user?.role && <Text style={styles.userRole}>{user.role}</Text>}
              </View>

              <TouchableOpacity style={styles.menuBtn} onPress={handleProfileClick}>
                <Text style={styles.menuBtnTxt}>مشاهده پروفایل</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuBtn, styles.logoutBtn]}
                onPress={handleLogoutClick}
              >
                <Text style={styles.menuBtnTxt}>خروج</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

      {/* User Info Cards */}
      {user ? (
        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Icon name="person" size={36} color="white" />
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>{user.role || '-'}</Text>

            <View style={styles.userDetail}>
              <Text style={styles.label}>ایمیل</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            <View style={styles.userDetail}>
              <Text style={styles.label}>شناسه</Text>
              <Text style={styles.value}>{user.id}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.permissionsTitle}>مجوزها</Text>
            <PermissionItem permission="ایجاد پروژه" hasPermission={true} />
            <PermissionItem permission="بررسی پروژه" hasPermission={false} />
            <PermissionItem permission="مدیریت کاربران" hasPermission={true} />
          </View>
        </View>
      ) : (
        <View style={styles.noUserCard}>
          <Icon name="person" size={24} color="#999" />
          <Text style={styles.noUserText}>اطلاعات کاربری در دسترس نیست</Text>
        </View>
      )}
    </ScrollView>
  );
}

type PermissionItemProps = {
  permission: string;
  hasPermission: boolean;
};

const PermissionItem = ({ permission, hasPermission }: PermissionItemProps) => (
  <View style={styles.permissionItem}>
    <Text style={styles.permissionText}>{permission}</Text>
    <Icon
      name={hasPermission ? 'check' : 'close'}
      size={16}
      color={hasPermission ? 'green' : 'red'}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16 },
  loadingContainer: {     minHeight: '100vh',
    justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { marginLeft: 8, fontSize: 18, fontWeight: 'bold' },

  profileBtn: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: '#1c2440',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 16 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menu: {
    width: 220,
    backgroundColor: '#0b1020',
    borderRadius: 12,
    padding: 12,
    marginTop: 60,
    marginRight: 12,
    elevation: 5,
  },
  userInfo: { alignItems: 'center', marginBottom: 12 },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1c2440',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextLarge: { color: 'white', fontWeight: '700', fontSize: 20 },
  userName: { color: 'white', fontSize: 16, fontWeight: '700', marginTop: 8 },
  userEmail: { color: '#bbb', fontSize: 12 },
  userRole: { color: '#999', fontSize: 12, marginTop: 4 },
  menuBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1c2440',
    marginTop: 8,
    alignItems: 'center',
  },
  logoutBtn: { backgroundColor: '#3b1f2a' },
  menuBtnTxt: { color: 'white', fontWeight: '600' },

  logoutButton: {
    backgroundColor: '#ff4d4f',
    padding: 8,
    borderRadius: 8,
  },

  cardsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    elevation: 2,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1890ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userDetail: { alignItems: 'center', marginVertical: 4 },
  label: { fontSize: 12, color: '#999' },
  value: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  permissionsTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  permissionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 },
  permissionText: { fontSize: 12, flex: 1 },
  noUserCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  noUserText: { marginLeft: 12, color: '#999', fontSize: 14 },
});
