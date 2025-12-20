// src/screens/SuperAdmin/EditClub.tsx
import React, { useState , useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { updateClub } from '../../api/clubs';
import { updateAdminByClub } from '../../api/admin';
import { Picker } from '@react-native-picker/picker';
import api from '../../api/axios';

const EditClub = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { club } = route.params;
  const admin = club.admin;

  const [clubName, setClubName] = useState(club.club_name);
  const [address, setAddress] = useState(club.address);
  const [sport, setSport] = useState(club.sport);
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState(admin?.name || '');
  const [adminEmail, setAdminEmail] = useState(admin?.email || '');
  const [adminPhone, setAdminPhone] = useState(admin?.phone || '');
  const [podHolders, setPodHolders] = useState<any[]>([]);
  const [podHolder, setPodHolder] = useState('');
  // ✅ LOAD POD HOLDERS (same as CreateClub)
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
      Alert.alert('Error', 'Failed to load pod holders');
      setPodHolders([]);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateClub(club.club_id, {
        club_name: clubName,
        address,
        sport,
        pod_holder_id: podHolder || null,
      });
      // 2️⃣ Update admin (only if exists)
      if (club.admin) {
        await updateAdminByClub(club.club_id, {
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
        });
      }
      Alert.alert('Success', 'Club & admin updated', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Club</Text>
      <Text style={styles.sectionTitle}>Club Admin Details</Text>

      <TextInput style={styles.input} value={clubName} onChangeText={setClubName} />
      <TextInput style={styles.input} value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} value={sport} onChangeText={setSport} />
      <TextInput
        style={styles.input}
        placeholder="Admin Name"
        value={adminName}
        onChangeText={setAdminName}
      />

      <TextInput
        style={styles.input}
        placeholder="Admin Email"
        value={adminEmail}
        onChangeText={setAdminEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Admin Phone"
        value={adminPhone}
        onChangeText={setAdminPhone}
        keyboardType="phone-pad"
      />
      {/* POD HOLDER */}
      <Text style={styles.sectionTitle}>Assign Pod Holder</Text>

      <View style={styles.pickerBox}>
        <Picker
          selectedValue={podHolder}
          onValueChange={setPodHolder}
        >
          <Picker.Item label="Select Pod Holder" value="" />
          {podHolders.map((p: any) => (
            <Picker.Item
              key={p.pod_holder_id}
              label={p.serial_number || 'Unknown Pod'}
              value={p.pod_holder_id}
            />
          ))}
        </Picker>
      </View>
      <TouchableOpacity style={styles.btn} onPress={handleUpdate} disabled={loading}>
        <Text style={styles.btnText}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
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
  },
  btnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  sectionTitle: {
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
});

export default EditClub;
