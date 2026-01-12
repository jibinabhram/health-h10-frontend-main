// src/components/SuperAdminNavbar.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo';

import ThemeToggle from '../context/ThemeToggle';
import { fetchProfile } from '../../api/auth';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../../utils/constants';
import { logout } from '../../utils/logout';
import type { RootStackParamList } from '../../navigation/AppNavigator';

import {
  saveProfileToCache,
  loadProfileFromCache,
  clearProfileCache,
} from '../../utils/profileCache';

/* ================= TYPES ================= */

type Props = {
  title: string;
  toggleSidebar: () => void;
  sidebarOpen: boolean;
};

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const HEADER_HEIGHT = 56;
const TOP_PADDING =
  Platform.OS === 'android' ? StatusBar.currentHeight || 12 : 20;

const SuperAdminNavbar = () => {
  /* ✅ ALL HOOKS AT TOP — STABLE ORDER */
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigation = useNavigation<NavProp>();

  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  /* ================= LOAD PROFILE ================= */

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      (async () => {
        // 1️⃣ Load cached profile FIRST (offline support)
        const cached = await loadProfileFromCache();
        if (cached && mounted) {
          setUser(cached);
        }

        // 2️⃣ Check network
        const net = await NetInfo.fetch();
        if (!net.isConnected) return;

        // 3️⃣ Fetch fresh profile
        try {
          const profile = await fetchProfile();
          if (!profile || !mounted) return;

          setUser(profile);

          // ✅ Save to cache
          await saveProfileToCache(profile);
        } catch (err: any) {
          console.log(
            'SUPER ADMIN PROFILE ERR',
            err?.response?.data || err?.message || err,
          );
        }
      })();

      return () => {
        mounted = false;
      };
    }, []),
  );

  /* ================= ACTIONS ================= */

  const handleEditProfile = () => {
    setProfileOpen(false);
    navigation.navigate('ProfileEdit');
  };

  const handleLogout = async () => {
    setProfileOpen(false);

    // 🔥 CLEAR PROFILE CACHE ON LOGOUT
    await clearProfileCache();

    await logout(navigation);
  };

  return (
    <View style={styles.container}>
      {/* STATUS BAR */}
      {/* STATUS BAR */}
      <StatusBar
        translucent={false}
        backgroundColor="#2F343B"          // same as navbar
        barStyle="light-content"           // white icons
      />

      <View
        style={[
          styles.navbar,
          {
            backgroundColor: isDark ? '#2F343B' : '#2F343B',
            paddingTop: TOP_PADDING,
            height: HEADER_HEIGHT + TOP_PADDING,
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
          <Ionicons
            name="notifications-outline"
            size={22}
            color={isDark ? '#E5E7EB' : '#FFFFFF'}
          />
        </TouchableOpacity>

        {/*toggle*/}
        <View style={{ marginLeft: 16 }}>
          <ThemeToggle />
        </View>

        {user && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setProfileOpen(prev => !prev)}
          >
            {user.profile_image ? (
              <Image
                source={{
                  uri: user.profile_image.startsWith('http')
                    ? user.profile_image
                    : `${API_BASE_URL}/uploads/${user.profile_image}`,
                }}
                style={[
                  styles.avatar,
                  { borderColor: isDark ? '#22D3EE' : '#2563EB' },
                ]}
                onError={() =>
                  console.log('⚠️ SuperAdmin avatar failed to load')
                }
              />
            ) : (
              <Ionicons
                name="person-circle-outline"
                size={30}
                color={isDark ? '#22D3EE' : '#2563EB'}
              />
            )}
            <Text
              style={[
                styles.userName,
                { color: isDark ? '#FFFFFF' : '#FFFFFF' },
              ]}
            >
              {user.name}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* DROPDOWN */}
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
                navigation.navigate('ProfileEdit');
              }}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={isDark ? '#E5E7EB' : '#020617'}
              />
              <Text
                style={[
                  styles.dropdownText,
                  { color: isDark ? '#E5E7EB' : '#020617' },
                ]}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setProfileOpen(false);
                navigation.navigate('Settings');
              }}
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color={isDark ? '#E5E7EB' : '#020617'}
              />
              <Text
                style={[
                  styles.dropdownText,
                  { color: isDark ? '#E5E7EB' : '#020617' },
                ]}
              >
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
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
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
    top: HEADER_HEIGHT + TOP_PADDING + 6,
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
