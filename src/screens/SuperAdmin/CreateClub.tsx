// src/screens/SuperAdmin/CreateClub.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../../api/axios';
import { createClub } from '../../api/clubs';

const CreateClub = () => {
  const [clubName, setClubName] = useState('');
  const [address, setAddress] = useState('');
  const [sport, setSport] = useState('');

  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [podHolder, setPodHolder] = useState('');
  const [podHolders, setPodHolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPodHolders();
  }, []);

  const loadPodHolders = async () => {
    try {
      const res = await api.get('/pod-holders');
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setPodHolders(list);
    } catch (err) {
      console.log('❌ POD HOLDER LOAD ERROR:', err);
      Alert.alert('Error', 'Failed to load pod holders');
      setPodHolders([]);
    }
  };

  const handleCreate = async () => {
    if (
      !clubName.trim() ||
      !address.trim() ||
      !sport.trim() ||
      !adminName.trim() ||
      !adminEmail.trim() ||
      !adminPassword ||
      !confirmPassword
    ) {
      return Alert.alert('Error', 'All fields are required');
    }

    if (adminPassword !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }

    try {
      setLoading(true);

      const payload = {
        club_name: clubName,
        address,
        sport,
        admin_name: adminName,
        admin_email: adminEmail,
        admin_password: adminPassword,
        pod_holder_id: podHolder || null,
      };

      console.log('✅ CREATE CLUB PAYLOAD:', payload);

      await createClub(payload);

      Alert.alert('Success', 'Club & Admin Created Successfully');

      setClubName('');
      setAddress('');
      setSport('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      setConfirmPassword('');
      setPodHolder('');
    } catch (err: any) {
      console.log('❌ CREATE CLUB ERROR FULL:', err?.response?.data || err);

      const safeMessage =
        typeof err?.response?.data?.message === 'string'
          ? err.response.data.message
          : 'Server error while creating club';

      Alert.alert('Error', safeMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Club</Text>

      <TextInput
        placeholder="Club Name"
        style={styles.input}
        value={clubName}
        onChangeText={setClubName}
      />

      <TextInput
        placeholder="Address"
        style={styles.input}
        value={address}
        onChangeText={setAddress}
      />

      <TextInput
        placeholder="Sport"
        style={styles.input}
        value={sport}
        onChangeText={setSport}
      />

      <Text style={styles.sectionTitle}>Club Admin Details</Text>

      <TextInput
        placeholder="Admin Name"
        style={styles.input}
        value={adminName}
        onChangeText={setAdminName}
      />

      <TextInput
        placeholder="Admin Email"
        style={styles.input}
        value={adminEmail}
        onChangeText={setAdminEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={adminPassword}
        onChangeText={setAdminPassword}
      />

      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Text style={styles.sectionTitle}>Assign Pod Holder</Text>

      <View style={styles.pickerBox}>
        <Picker selectedValue={podHolder} onValueChange={setPodHolder}>
          <Picker.Item label="Select Pod Holder" value="" />
          {Array.isArray(podHolders) &&
            podHolders.map((p: any) => (
              <Picker.Item
                key={p.pod_holder_id}
                label={p.serial_number || 'Unknown Pod'}
                value={p.pod_holder_id}
              />
            ))}
        </Picker>
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.6 }]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.btnText}>
          {loading ? 'Creating...' : 'Create Club'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  sectionTitle: { fontWeight: '700', marginTop: 20, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default CreateClub;
