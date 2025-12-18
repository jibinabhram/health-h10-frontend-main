// src/screens/SuperAdmin/CreateCoach.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import api from '../../api/axios';

const CreateCoach = () => {
  const [form, setForm] = useState({
    coach_name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.coach_name || !form.email || !form.password) {
      return Alert.alert('Error', 'Coach name, email and password required');
    }

    try {
      setLoading(true);

      const payload = {
        coach_name: form.coach_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone || null,
      };

      console.log('✅ CREATE COACH PAYLOAD:', payload);

      const res = await api.post('/coaches', payload);
      console.log('✅ CREATE COACH RESPONSE:', res.data);

      Alert.alert('Success', 'Coach created successfully');

      setForm({
        coach_name: '',
        email: '',
        password: '',
        phone: '',
      });
    } catch (err: any) {
      const apiError = err?.response?.data;
      console.log('❌ CREATE COACH ERROR FULL:', apiError || err);

      let message = 'Server error while creating coach';

      if (typeof apiError?.message === 'string') {
        message = apiError.message;
      } else if (typeof apiError?.message === 'object') {
        message = Object.values(apiError.message).join('\n');
      } else if (err?.message) {
        message = err.message;
      }

      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Coach</Text>

      <TextInput
        placeholder="Coach Name"
        style={styles.input}
        value={form.coach_name}
        onChangeText={v => setForm({ ...form, coach_name: v })}
      />

      <TextInput
        placeholder="Coach Email"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={v => setForm({ ...form, email: v })}
      />

      <TextInput
        placeholder="Phone (Optional)"
        style={styles.input}
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={v => setForm({ ...form, phone: v })}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={form.password}
        onChangeText={v => setForm({ ...form, password: v })}
      />

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.6 }]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.btnText}>
          {loading ? 'Creating...' : 'Create Coach'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#16A34A',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CreateCoach;
