// src/screens/SuperAdmin/ClubsList.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getAllClubs } from '../../api/clubs';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { deleteClub } from '../../api/clubs';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ClubsList = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavProp>();

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      const load = async () => {
        try {
          setLoading(true);
          const data = await getAllClubs();
          if (mounted) setClubs(Array.isArray(data) ? data : []);
        } catch (e) {
          console.log('❌ LOAD CLUBS ERROR:', e);
          setClubs([]);
        } finally {
          setLoading(false);
        }
      };

      load();

      return () => {
        mounted = false;
      };
    }, [])
  );
  // 🗑 Delete confirmation popup
  const handleDelete = (clubId: string, clubName: string) => {
    Alert.alert(
      'Delete Club',
      `Are you sure you want to delete "${clubName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClub(clubId);

              // remove from UI instantly
              setClubs(prev =>
                prev.filter(c => c.club_id !== clubId)
              );
            } catch (e) {
              Alert.alert('Error', 'Failed to delete club');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (clubs.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No clubs found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clubs</Text>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateClub')}
        >
          <Text style={styles.createButtonText}>+ Create Club</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={clubs}
        keyExtractor={item => item.club_id}
        renderItem={({ item }) => (
            <View style={styles.card}>
              {/* CLUB DETAILS */}
              <Text style={styles.name}>{item.club_name}</Text>
              <Text style={styles.label}>Address: {item.address}</Text>
              <Text style={styles.label}>Sport: {item.sport || 'N/A'}</Text>

              {/* DIVIDER */}
              <View style={styles.divider} />

              {/* ADMIN DETAILS */}
              {item.admin ? (
                <>
                  <Text style={styles.subTitle}>Club Admin</Text>
                  <Text>Name: {item.admin.name}</Text>
                  <Text>Email: {item.admin.email}</Text>
                  <Text>Phone: {item.admin.phone || 'N/A'}</Text>
                </>
              ) : (
                <Text style={styles.noAdmin}>No admin assigned</Text>
              )}
              {/* 🔽 ACTION BUTTONS GO HERE */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => navigation.navigate('EditClub', { club: item })}
                >
                  <Ionicons name="create-outline" size={22} color="#2563EB" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() =>
                    handleDelete(item.club_id, item.club_name)
                  }
                >
                  <Ionicons name="trash-outline" size={22} color="#DC2626" />
                </TouchableOpacity>
              </View>
              </View>
          )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  card: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: { fontWeight: '700', fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  createButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },

  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
    subTitle: {
      fontWeight: '700',
      marginBottom: 4,
    },

    divider: {
      height: 1,
      backgroundColor: '#CBD5E1',
      marginVertical: 8,
    },

    label: {
      color: '#334155',
    },

    noAdmin: {
      fontStyle: 'italic',
      color: '#64748B',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
    },

    iconBtn: {
      padding: 6,
      marginLeft: 10,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
});

export default ClubsList;
