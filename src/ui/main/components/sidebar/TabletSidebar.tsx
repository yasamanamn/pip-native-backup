import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    MdMap,
    MdAssignment,
    MdChecklist,
    MdNotifications,
    MdPerson,
    MdLogout,
    MdSettings,
    MdApartment,
} from 'react-icons/md';

type SidebarTab = 'pip' | 'checklist' | 'notifications' | 'profile' | 'map';

type Props = {
    activeTab?: SidebarTab;
    onTabChange?: (tab: SidebarTab) => void;
    notificationCount?: number;
    onLogout?: () => void;
};

const NAV_ITEMS: {
    id: SidebarTab;
    label: string;
    icon: React.ReactNode;
    accent: string;
}[] = [
        { id: 'map', label: 'نقشه', icon: <MdMap size={22} />, accent: '#b45309' },
        { id: 'pip', label: 'فرم PIP', icon: <MdAssignment size={22} />, accent: '#b45309' },
        { id: 'checklist', label: 'چک‌لیست', icon: <MdChecklist size={22} />, accent: '#b45309' },
        { id: 'notifications', label: 'اعلان‌ها', icon: <MdNotifications size={22} />, accent: '#b45309' },
    ];

export default function TabletSidebar({
    activeTab = 'map',
    onTabChange,
    notificationCount = 0,
    onLogout,
}: Props) {
    const [expanded, setExpanded] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // ─── بارگذاری اطلاعات کاربر از AsyncStorage ───
    const [userPhone, setUserPhone] = useState<string>('');
    const [userRole, setUserRole] = useState<string>('');
    const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const raw = await AsyncStorage.getItem('user');
                if (raw) {
                    const user = JSON.parse(raw);
                    // شماره موبایل یا ایمیل — هر فیلدی که سرور برمی‌گردونه
                    setUserPhone(user.phoneNumber ?? user.phone ?? user.mobile ?? user.email ?? '');
                    setUserRole(user.role ?? user.userRole ?? '');
                    setUserAvatarUrl(user.avatarUrl ?? user.profilePicture ?? null);
                }
            } catch (e) {
                console.warn('TabletSidebar: خطا در خواندن اطلاعات کاربر', e);
            }
        };
        loadUser();
    }, []);

    const sidebarWidth = expanded ? 200 : 72;

    return (
        <View style={[styles.sidebar, { width: sidebarWidth }]}>
            {/* ─── Logo / Toggle ─── */}
            <TouchableOpacity
                style={styles.logoArea}
                onPress={() => { setExpanded((p) => !p); setProfileOpen(false); }}
                activeOpacity={0.8}
            >
                <View style={styles.logoIcon}>
                    <MdApartment size={22} color="#fff" />
                </View>
                {expanded && <Text style={[styles.appName, { flexWrap: 'wrap' }]}>سامانه برنامه‌ریزی پیش از حادثه
                </Text>}
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* ─── Nav Items ─── */}
            <View style={styles.navList}>
                {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    const isNotif = item.id === 'notifications';
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.navItem, isActive && { backgroundColor: item.accent + '18' }]}
                            onPress={() => onTabChange?.(item.id)}
                            activeOpacity={0.75}
                        >
                            {isActive && <View style={[styles.activeBar, { backgroundColor: item.accent }]} />}
                            <View style={[styles.iconWrap, isActive && { backgroundColor: item.accent + '22' }]}>
                                <View style={{ color: isActive ? item.accent : '#9ca3af' } as any}>
                                    {item.icon}
                                </View>
                                {isNotif && notificationCount > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>
                                            {notificationCount > 9 ? '۹+' : String(notificationCount)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {expanded && (
                                <Text style={[styles.navLabel, isActive && { color: item.accent, fontWeight: '700' }]} numberOfLines={1}>
                                    {item.label}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={{ flex: 1 }} />
            <View style={styles.divider} />

            {/* ─── Settings ─── */}
            <TouchableOpacity style={styles.navItem} activeOpacity={0.75}>
                <View style={styles.iconWrap}>
                    <MdSettings size={20} color="#9ca3af" />
                </View>
                {expanded && <Text style={styles.navLabel} numberOfLines={1}>تنظیمات</Text>}
            </TouchableOpacity>

            {/* ─── Profile Button ─── */}
            <TouchableOpacity
                style={[styles.profileBtn, profileOpen && styles.profileBtnActive]}
                onPress={() => setProfileOpen((p) => !p)}
                activeOpacity={0.85}
            >
                <View style={styles.avatarWrap}>
                    {userAvatarUrl ? (
                        <Image source={{ uri: userAvatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <MdPerson size={20} color="#fff" />
                        </View>
                    )}
                    <View style={styles.onlineDot} />
                </View>
                {expanded && (
                    <View style={styles.profileText}>
                        <Text style={styles.profileName} numberOfLines={1}>{userPhone || '---'}</Text>
                        {!!userRole && <Text style={styles.profileRole} numberOfLines={1}>{userRole}</Text>}
                    </View>
                )}
            </TouchableOpacity>

            {/* ─── Profile Popup ─── */}
            {profileOpen && (
                <View style={[styles.profilePopup, expanded ? { left: 208 } : { left: 80 }]}>
                    <View style={styles.popupHeader}>
                        <View style={styles.avatarFallbackLarge}>
                            <MdPerson size={28} color="#fff" />
                        </View>
                        <View style={{ marginRight: 10, flex: 1 }}>
                            <Text style={styles.popupName} numberOfLines={1}>{userPhone || '---'}</Text>
                            {!!userRole && <Text style={styles.popupRole} numberOfLines={1}>{userRole}</Text>}
                        </View>
                    </View>
                    <View style={styles.popupDivider} />
                    <TouchableOpacity style={styles.popupItem} onPress={() => { setProfileOpen(false); onTabChange?.('profile'); }}>
                        <MdPerson size={16} color="#374151" />
                        <Text style={styles.popupItemText}>پروفایل من</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.popupItem} onPress={() => { setProfileOpen(false); onLogout?.(); }}>
                        <MdLogout size={16} color="#dc2626" />
                        <Text style={[styles.popupItemText, { color: '#dc2626' }]}>خروج</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    sidebar: {
        height: '100vh' as any,
        backgroundColor: '#ffffff',
        borderRightWidth: 1,
        borderRightColor: '#f1f5f9',
        flexDirection: 'column',
        alignItems: 'stretch',
        paddingVertical: 8,
        shadowColor: '#94a3b8',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        position: 'relative',
        overflow: 'visible',
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
    } as any,
    logoArea: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
    logoIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#ef8354', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    appName: { fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1 },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 12, marginVertical: 8 },
    navList: { flexDirection: 'column', gap: 2, paddingHorizontal: 8 },
    navItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6, gap: 10, position: 'relative', overflow: 'hidden', marginBottom: 2 },
    activeBar: { position: 'absolute', right: 0, top: '20%' as any, bottom: '20%' as any, width: 3, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
    iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
    badge: { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    badgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
    navLabel: { fontSize: 13, color: '#6b7280', flex: 1, fontWeight: '500' },
    profileBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, marginBottom: 4, borderRadius: 12, padding: 8, gap: 10, backgroundColor: 'transparent' },
    profileBtnActive: { backgroundColor: '#f1f5f9' },
    avatarWrap: { position: 'relative', flexShrink: 0 },
    avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: '#e2e8f0' },
    avatarFallback: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#3e5c76', alignItems: 'center', justifyContent: 'center' },
    avatarFallbackLarge: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#3e5c76', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    onlineDot: { position: 'absolute', bottom: 1, left: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#fff' },
    profileText: { flex: 1 },
    profileName: { fontSize: 13, fontWeight: '600', color: '#0f172a', display: 'flex', justifyContent: 'flex-end' },
    profileRole: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
    profilePopup: { position: 'absolute', bottom: 8, backgroundColor: '#fff', borderRadius: 16, width: 200, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', zIndex: 999 } as any,
    popupHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f8fafc' },
    popupName: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
    popupRole: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
    popupDivider: { height: 1, backgroundColor: '#f1f5f9' },
    popupItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
    popupItemText: { fontSize: 13, color: '#374151', fontWeight: '500' },
});
