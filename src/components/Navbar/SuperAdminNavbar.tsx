import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ThemeToggle from '../context/ThemeToggle';
import { fetchProfile } from '../../api/auth';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../../utils/constants';
import { logout } from '../../utils/logout';
import type { ScreenType } from '../Sidebar/SidebarSuperAdmin';

const { width, height } = Dimensions.get('window');

const NAVBAR_HEIGHT = 56;
const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;


/* ================= PROPS ================= */
interface Props {
  toggleSidebar?: () => void;
  onNavigate: (screen: ScreenType) => void;
  profileRefreshKey: number;
}

const SuperAdminNavbar = ({
  onNavigate,
  profileRefreshKey,
}: Props) => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const isDark = theme === 'dark';

  const textColor = isDark ? '#E5E7EB' : '#020617';
  const subTextColor = isDark ? '#94A3B8' : '#64748B';
  const dividerColor = isDark ? '#1E293B' : '#CBD5E1';


  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  /* ===== LOAD / REFRESH PROFILE ===== */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const profile = await fetchProfile();
        if (mounted) setUser(profile);
      } catch (err) {
        console.log('NAVBAR PROFILE ERROR', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [profileRefreshKey]);
  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        hidden={false}
        translucent={false}
        backgroundColor="#2F343B"
        barStyle="light-content"
      />



      {/* ===== NAVBAR ===== */}
      <View
        style={[
          styles.navbar,
          {
            backgroundColor: '#2F343B',
            height: NAVBAR_HEIGHT,
          },
        ]}
      >
        {/* LOGO */}
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={{ flex: 1 }} />

        {/* NOTIFICATION */}
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {/* THEME */}
        <View style={{ marginLeft: 16 }}>
          <ThemeToggle />
        </View>

        {/* USER */}
        {user && (
          <TouchableOpacity
            style={styles.userBtn}
            onPress={() => setProfileOpen(v => !v)}
          >
            {user.profile_image ? (
              <Image
                source={{
                  uri: `${API_BASE_URL}/uploads/${user.profile_image}`,
                }}
                style={[
                  styles.avatar,
                  { borderColor: '#22D3EE' },
                ]}
              />
            ) : (
              <Ionicons
                name="person-circle-outline"
                size={34}
                color="#FFFFFF"
              />
            )}
            <Text style={styles.userName}>{user.name}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ===== DROPDOWN ===== */}
      {profileOpen && (
        <>
          <View
            style={[
              styles.dropdown,
              { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            <Text
              style={[
                styles.dropdownTitle,
                { color: isDark ? '#E5E7EB' : '#020617' },
              ]}
            >
              My Account
            </Text>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setProfileOpen(false);
                onNavigate('ProfileEdit');
              }}
            >
              <Ionicons name="person-outline" size={18} color={subTextColor} />
              <Text style={[styles.dropdownText, { color: textColor }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setProfileOpen(false);
                onNavigate('Settings');
              }}
            >
              <Ionicons name="settings-outline" size={18} color={subTextColor} />
              <Text style={[styles.dropdownText, { color: textColor }]}>
                Settings
              </Text>

            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              <Text style={[styles.dropdownText, { color: '#EF4444' }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>

          {/* OVERLAY */}
          <Pressable
            style={styles.overlay}
            onPress={() => setProfileOpen(false)}
          />
        </>
      )}
    </View>
  );
};

export default SuperAdminNavbar;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { zIndex: 100 },

  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  logo: {
    width: 120,
    height: 36,
  },

  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  userBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },

  userName: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    maxWidth: 100,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
  },

  dropdown: {
    position: 'absolute',
    top: NAVBAR_HEIGHT + 6,
    right: 12,
    width: 220,
    borderRadius: 14,
    paddingVertical: 10,
    elevation: 16,
    zIndex: 1000,
  },

  dropdownTitle: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 14,
    marginBottom: 6,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  dropdownText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 6,
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 500,
  },
});
