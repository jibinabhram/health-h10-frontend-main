// src/components/Sidebar/SidebarCoach.tsx
import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { STORAGE_KEYS } from '../../utils/constants';
import { useTheme } from '../context/ThemeContext';

const SidebarCoach = ({ closeSidebar }: any) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.ROLE,
      STORAGE_KEYS.USER_NAME,
    ]);

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View
      style={[
        styles.sidebar,
        { backgroundColor: isDark ? '#050816' : '#F1F5F9' },
      ]}
    >
      <View style={styles.topRow}>
        <Text
          style={[
            styles.title,
            { color: isDark ? '#E5E7EB' : '#020617' },
          ]}
        >
          Coach Panel
        </Text>

        <TouchableOpacity onPress={closeSidebar} style={styles.drawerBtn}>
          <Ionicons
            name="menu"
            size={24}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text
          style={[
            styles.logoutText,
            { color: isDark ? '#F97373' : '#DC2626' },
          ]}
        >
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    paddingTop: 28,
    paddingHorizontal: 16,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
  },

  drawerBtn: {
    padding: 6,
  },

  logout: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginTop: 10,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SidebarCoach;
