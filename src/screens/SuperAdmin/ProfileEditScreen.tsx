// ProfileEditScreen.tsx
import React, { useEffect, useState } from 'react';
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
import { fetchProfile, updateSuperAdminProfile, uploadSuperAdminImage } from '../../api/auth';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../utils/constants';
type PickedImage = {
  uri: string;
  name: string;
  type: string;
};
const ProfileEditScreen = () => {
  const [superAdminId, setSuperAdminId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null); 

  const navigation = useNavigation();

  // 👉 Load current profile on mount
  useEffect(() => {
    (async () => {
      try {
        const user = await fetchProfile();
        // adjust these keys if your backend returns different names
        setSuperAdminId(user.super_admin_id);
        setName(user.name ?? '');
        setEmail(user.email ?? '');
        setPhone(user.phone ?? '');
        setPhoto(user.profile_image ?? '');
        if (user.profile_image) {
          // assuming backend serves files from /uploads/<filename>
          setPhotoUri(`${API_BASE_URL}/uploads/${user.profile_image}`);
        }
      } catch (err) {
        console.log('PROFILE LOAD ERROR', err);
        Alert.alert('Error', 'Failed to load profile');
      }
    })();
  }, []);
  const handleChoosePhoto = () => {
  launchImageLibrary(
      { mediaType: 'photo', quality: 0.8 },
      (response) => {
      if (response.didCancel || response.errorCode) return;

      const asset = response.assets?.[0];
      if (!asset?.uri) return;

      const image = {
          uri: asset.uri,
          name: asset.fileName ?? `profile_${Date.now()}.jpg`,
          type: asset.type ?? 'image/jpeg',
      };

      setPhoto(image);        // ✅ REQUIRED
      setPhotoUri(asset.uri); // for preview
      }
  );
  };

  const handleSave = async () => {
    if (!superAdminId) {
      Alert.alert('Error', 'User ID not found.');
      return;
    }

    try {
      // 1️⃣ Update basic info
      await updateSuperAdminProfile(superAdminId, {
        name,
        email,
        phone,
      });

      // 2️⃣ If user picked a new photo in this screen → upload it
      if (photo) {
        await uploadSuperAdminImage(superAdminId, photo);
      }

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.log('PROFILE UPDATE ERROR', err?.response?.data || err);
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to update profile',
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Picture */}
      <View style={styles.photoContainer}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoPlaceholderText}>Add Photo</Text>
          </View>
        )}
        <TouchableOpacity style={styles.photoButton} onPress={handleChoosePhoto}>
          <Text style={styles.photoButtonText}>Change Picture</Text>
        </TouchableOpacity>
      </View>

      {/* Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Email */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Phone */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#ddd',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: '#666',
    fontSize: 12,
  },
  photoButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  photoButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 15,
  },
  saveButton: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileEditScreen;
