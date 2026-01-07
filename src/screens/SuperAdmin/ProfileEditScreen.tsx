import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import SidebarSuperAdmin, {
  ScreenType,
} from '../../components/Sidebar/SidebarSuperAdmin';
import SuperAdminNavbar from '../../components/Navbar/SuperAdminNavbar';

import {
  fetchProfile,
  updateSuperAdminProfile,
  uploadSuperAdminImage,
  updateClubAdminProfile,
  uploadClubAdminImage,
} from '../../api/auth';
import { API_BASE_URL } from '../../utils/constants';
import { useTheme } from '../../components/context/ThemeContext';

/* ================= TYPES ================= */
type PickedImage = {
  uri: string;
  name: string;
  type: string;
};

type Role = 'SUPER_ADMIN' | 'CLUB_ADMIN';

/* ================= CONSTANTS ================= */

const PROFILE_CACHE_KEY = 'CACHED_PROFILE';

/* ================= COMPONENT ================= */

const ProfileEditScreen = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const isMounted = useRef(true);

  const isDark = theme === 'dark';
  const [role, setRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  /* ===== SIDEBAR STATE ===== */
  const [activeScreen, setActiveScreen] =
    useState<ScreenType>('ProfileEdit');
  const [collapsed, setCollapsed] = useState(false);

  /* ===== FORM STATE ===== */
  const [superAdminId, setSuperAdminId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  /* ================= HELPERS ================= */

  const hydrateProfile = (profile: any) => {
    if (!profile) return;

    setRole(profile.role);

    if (profile.role === 'SUPER_ADMIN') {
      setUserId(profile.super_admin_id);
    } else {
      setUserId(profile.admin_id);
    }

    setName(profile.name ?? '');
    setEmail(profile.email ?? '');
    setPhone(profile.phone ?? '');

    if (profile.profile_image) {
      setPhotoUri(`${API_BASE_URL}/uploads/${profile.profile_image}`);
    }
  };

  const loadCachedProfile = async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (raw) {
        hydrateProfile(JSON.parse(raw));
      }
    } catch (e) {
      console.log('❌ Failed to load cached profile', e);
    }
  };

  const saveProfileToCache = async (profile: any) => {
    try {
      await AsyncStorage.setItem(
        PROFILE_CACHE_KEY,
        JSON.stringify(profile),
      );
    } catch (e) {
      console.log('❌ Failed to save profile cache', e);
    }
  };

  /* ================= LOAD PROFILE ================= */
  /* ===== CLEANUP ===== */
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* ===== LOAD PROFILE ===== */
  useEffect(() => {
    let active = true;

    (async () => {
      // 1️⃣ Load cached profile first (OFFLINE SUPPORT)
      await loadCachedProfile();

      // 2️⃣ Check internet
      const net = await NetInfo.fetch();
      if (!net.isConnected) return;

      // 3️⃣ Fetch latest from server
      try {
        const profile = await fetchProfile();
        if (!active || !profile) return;

        hydrateProfile(profile);
        await saveProfileToCache(profile);
      } catch (err) {
        console.log('PROFILE LOAD ERROR', err);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  /* ================= IMAGE PICKER ================= */

  const handleChoosePhoto = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8 },
      response => {
        if (response.didCancel || response.errorCode) return;

      const asset = response.assets?.[0];
      if (!asset?.uri) return;

      setPhoto({
        uri: asset.uri,
        name: asset.fileName ?? `profile_${Date.now()}.jpg`,
        type: asset.type ?? 'image/jpeg',
      });

        setPhotoUri(asset.uri);
      },
    );
  };

  /* ================= SAVE PROFILE ================= */

  const handleSave = async () => {
    const net = await NetInfo.fetch();

    if (!net.isConnected) {
      Alert.alert(
        'Offline',
        'You are offline. Profile updates require internet.',
      );
      return;
    }

    if (!userId || !role) {
      Alert.alert('Error', 'User not found. Please re-login.');
      return;
    }

    try {
      if (role === 'SUPER_ADMIN') {
        await updateSuperAdminProfile(userId, { name, email, phone });
        if (photo) await uploadSuperAdminImage(userId, photo);
      }

      if (role === 'CLUB_ADMIN') {
        await updateClubAdminProfile(userId, { name, email, phone });
        if (photo) await uploadClubAdminImage(userId, photo);
      }

      setTimeout(() => {
        if (!isMounted.current) return;

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => {
              setActiveScreen('Dashboard');
              navigation.replace('SuperAdminHome');
            },
          },
        ]);
      }, 100);
    } catch (err: any) {
      if (isMounted.current) {
        Alert.alert(
          'Error',
          err?.response?.data?.message || 'Failed to update profile',
        );
      }
    }
  };

  /* ================= UI ================= */

  return (
    <View
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? '#020617' : '#F1F5F9' },
      ]}
    >
      <SuperAdminNavbar />

      <View style={styles.body}>
        {/* SIDEBAR */}
        <SidebarSuperAdmin
          active={activeScreen}
          setActive={setActiveScreen}
          collapsed={collapsed}
          toggleSidebar={() => setCollapsed(v => !v)}
        />

        {/* CONTENT (FIXED) */}
        <View style={styles.contentWrapper}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { backgroundColor: isDark ? '#020617' : '#f4f5f7' },
            ]}
          >
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? '#0F172A' : '#ffffff' },
              ]}
            >
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#E5E7EB' : '#020617' },
                ]}
              >
                Edit Profile
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? '#94A3B8' : '#64748b' },
                ]}
              >
                Manage your personal information
              </Text>

              {/* AVATAR */}
            <View style={styles.profileHeader}>
              <TouchableOpacity onPress={handleChoosePhoto}>
                <View>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={36} color="#9ca3af" />
                    </View>
                  )}

                  {/* CAMERA ICON – RIGHT */}
                  <View style={styles.cameraIconRight}>
                    <Ionicons name="camera" size={14} color="#020617" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>


              {/* FORM */}
              <Text style={[styles.label, { color: isDark ? '#E5E7EB' : '#020617' }]}>
                Full Name
              </Text>
              <TextInput
                style={[styles.input, { color: isDark ? '#E5E7EB' : '#020617' }]}
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.label, { color: isDark ? '#E5E7EB' : '#020617' }]}>
                Email Address
              </Text>
              <TextInput
                style={[styles.input, { color: isDark ? '#E5E7EB' : '#020617' }]}
                value={email}
                onChangeText={setEmail}
              />

              <Text style={[styles.label, { color: isDark ? '#E5E7EB' : '#020617' }]}>
                Phone Number
              </Text>
              <TextInput
                style={[styles.input, { color: isDark ? '#E5E7EB' : '#020617' }]}
                value={phone}
                onChangeText={setPhone}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default ProfileEditScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  body: {
    flex: 1,
    flexDirection: 'row',
  },

  contentWrapper: {
    flex: 1, // 🔥 THIS IS THE FIX
  },

  content: {
    flexGrow: 1,
    padding: 20,
  },

  card: { borderRadius: 18, padding: 20 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginBottom: 20 },

profileHeader: {
  alignItems: 'flex-start',   // 👈 LEFT alignment
  marginBottom: 20,
},

avatar: {
  width: 96,
  height: 96,
  borderRadius: 48,
},

avatarPlaceholder: {
  backgroundColor: '#e5e7eb',
  justifyContent: 'center',
  alignItems: 'center',
},

cameraIconRight: {
  position: 'absolute',
  bottom: 0,
  right: 0,          // ✅ RIGHT SIDE
  backgroundColor: '#e5e7eb',
  padding: 6,
  borderRadius: 16,
},


  cameraIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#e5e7eb',
    padding: 6,
    borderRadius: 20,
  },

  label: { fontSize: 13, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },

 saveButton: {
   backgroundColor: '#3b82f6',
   paddingVertical: 14,
   paddingHorizontal: 28,
   borderRadius: 12,
   alignSelf: 'flex-start',
 },

  saveText: { color: '#fff', fontWeight: '700' },
});
