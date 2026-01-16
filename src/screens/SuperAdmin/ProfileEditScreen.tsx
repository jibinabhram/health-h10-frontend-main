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

interface Props {
  goBack: () => void;
}

/* ================= CONSTANTS ================= */
const PROFILE_CACHE_KEY = 'CACHED_PROFILE';

/* ================= COMPONENT ================= */
const ProfileEditScreen = ({ goBack }: Props) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isMounted = useRef(true);

  const [role, setRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  /* ===== FORM STATE ===== */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  /* ================= HELPERS ================= */
  const hydrateProfile = (profile: any) => {
    if (!profile) return;

    setRole(profile.role);
    setUserId(
      profile.role === 'SUPER_ADMIN'
        ? profile.super_admin_id
        : profile.admin_id,
    );

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
      if (raw) hydrateProfile(JSON.parse(raw));
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
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      await loadCachedProfile();

      const net = await NetInfo.fetch();
      if (!net.isConnected) return;

      try {
        const profile = await fetchProfile();
        if (!active || !profile) return;

        hydrateProfile(profile);
        await saveProfileToCache(profile);
      } catch (err) {
        Alert.alert('Error', 'Failed to load profile');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  /* ================= IMAGE PICKER ================= */
  const handleChoosePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, res => {
      if (res.didCancel || res.errorCode) return;

      const asset = res.assets?.[0];
      if (!asset?.uri) return;

      setPhoto({
        uri: asset.uri,
        name: asset.fileName ?? `profile_${Date.now()}.jpg`,
        type: asset.type ?? 'image/jpeg',
      });

      setPhotoUri(asset.uri);
    });
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      Alert.alert(
        'Offline',
        'Internet connection required to update profile.',
      );
      return;
    }

    if (!userId || !role) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    try {
      if (role === 'SUPER_ADMIN') {
        await updateSuperAdminProfile(userId, { name, email, phone });
        if (photo) await uploadSuperAdminImage(userId, photo);
      } else {
        await updateClubAdminProfile(userId, { name, email, phone });
        if (photo) await uploadClubAdminImage(userId, photo);
      }

      if (!isMounted.current) return;

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: goBack },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Update failed',
      );
    }
  };

  /* ================= UI ================= */
  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { backgroundColor: isDark ? '#020617' : '#F1F5F9' },
      ]}
    >
      {/* BACK */}
      <TouchableOpacity style={styles.backRow} onPress={goBack}>
        <Ionicons
          name="arrow-back-outline"
          size={20}
          color={isDark ? '#E5E7EB' : '#020617'}
        />
        <Text
          style={[
            styles.backText,
            { color: isDark ? '#E5E7EB' : '#020617' },
          ]}
        >
          Back
        </Text>
      </TouchableOpacity>

      {/* CARD */}
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? '#0F172A' : '#FFFFFF' },
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
        <TouchableOpacity onPress={handleChoosePhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={36} color="#9ca3af" />
            </View>
          )}
        </TouchableOpacity>

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
  );
};

export default ProfileEditScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
  },

  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  backText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
  },

  card: {
    borderRadius: 18,
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 13,
    marginBottom: 20,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 20,
  },

  avatarPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  label: {
    fontSize: 13,
    marginBottom: 6,
  },

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
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },

  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
});
