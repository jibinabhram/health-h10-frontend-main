// src/screens/ClubAdmin/MyClubCoaches.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { fetchMyClubCoaches } from '../../api/coaches';

const MyClubCoaches = () => {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    try {
      const data = await fetchMyClubCoaches();
      setCoaches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('❌ LOAD COACH ERROR:', err);
      setCoaches([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (coaches.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16 }}>No coaches found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Club Coaches</Text>

      <FlatList
        data={coaches}
        keyExtractor={item => item.coach_id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.coach_name}</Text>
            <Text>Email: {item.email}</Text>
            <Text>Phone: {item.phone || 'Not Provided'}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 18 },
  card: {
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: { fontWeight: '700', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default MyClubCoaches;
