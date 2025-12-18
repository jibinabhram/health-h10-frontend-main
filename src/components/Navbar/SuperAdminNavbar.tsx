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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ThemeToggle from '../context/ThemeToggle';
import { fetchProfile } from '../../api/auth';
import { useTheme } from '../context/ThemeContext';
import { STORAGE_KEYS } from '../../utils/constants';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import ProfileEditScreen from '../../screens/SuperAdmin/ProfileEditScreen';
import { Image } from 'react-native';
import { API_BASE_URL } from '../../utils/constants';
import { useFocusEffect } from '@react-navigation/native';
import { logout } from "../../utils/logout";

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

const SuperAdminNavbar: React.FC<Props> = ({
  title,
  toggleSidebar,
  sidebarOpen,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigation = useNavigation<NavProp>();

  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          const profile = await fetchProfile();
          if (isActive) {
            setUser(profile);
          }
        } catch (err: any) {
          console.log('PROFILE ERR', err?.response?.data || err?.message || err);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout(navigation);
  };

  const handleEditProfile = () => {
    setProfileOpen(false);
    navigation.navigate('ProfileEdit');
  };

  return (
    <View style={{ zIndex: 1000 }}>
      {/* ✅ OUTSIDE CLICK OVERLAY */}
      {profileOpen && (
        <Pressable
          style={styles.overlay}
          onPress={() => setProfileOpen(false)}
        />
      )}

      {/* ✅ NAVBAR */}
      <View
        style={[
          styles.navbar,
          {
            backgroundColor: isDark ? '#020617' : '#FFFFFF',
            paddingTop: TOP_PADDING,
            height: HEADER_HEIGHT + TOP_PADDING,
          },
        ]}
      >
        {/* ✅ SIDEBAR TOGGLE */}
        {!sidebarOpen && (
          <TouchableOpacity onPress={toggleSidebar} style={styles.iconBtn}>
            <Ionicons
              name="menu"
              size={26}
              color={isDark ? '#E5E7EB' : '#020617'}
            />
          </TouchableOpacity>
        )}

        {/* ✅ TITLE */}
        <Text
          style={[
            styles.title,
            { color: isDark ? '#E5E7EB' : '#020617' },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View style={{ flex: 1 }} />

        {/* ✅ THEME TOGGLE */}
        <ThemeToggle />

        {/* ✅ PROFILE ICON */}
        {user && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setProfileOpen(prev => !prev)}
          >
          {user?.profile_image ? (
            <Image
              source={{ uri: `${API_BASE_URL}/uploads/${user.profile_image}` }}
              style={[
                styles.avatar,
                { borderColor: isDark ? '#22D3EE' : '#2563EB' },
              ]}
            />
          ) : (
            <Ionicons
              name="person-circle-outline"
              size={30}
              color={isDark ? '#22D3EE' : '#2563EB'}
            />
          )}
          </TouchableOpacity>
        )}

        {/* ✅ PROFILE DROPDOWN */}
        {profileOpen && user && (
          <View
            style={[
              styles.dropdown,
              { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
            ]}
          >
            <Text
              style={[
                styles.profileName,
                { color: isDark ? '#E5E7EB' : '#020617' },
              ]}
            >
              {user.name}
            </Text>

            <Text
              style={[
                styles.profileEmail,
                { color: isDark ? '#9CA3AF' : '#475569' },
              ]}
            >
              {user.email}
            </Text>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleEditProfile}
            >
              <Ionicons
                name="create-outline"
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
              onPress={handleLogout}
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color="#EF4444"
              />
              <Text
                style={[
                  styles.dropdownText,
                  { color: '#EF4444' },
                ]}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    zIndex: 1000,
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

  dropdown: {
    position: 'absolute',
    top: HEADER_HEIGHT + TOP_PADDING,
    right: 12,
    width: 200,
    borderRadius: 12,
    paddingVertical: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    zIndex: 2000,
  },

  profileName: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 12,
  },

  profileEmail: {
    fontSize: 13,
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 6,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  dropdownText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 999,
  },
  avatar: {
  width: 34,
  height: 34,
  borderRadius: 17,
  borderWidth: 2,
},

});

export default SuperAdminNavbar;
