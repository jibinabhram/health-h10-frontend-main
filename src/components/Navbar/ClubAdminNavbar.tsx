// src/components/ClubAdminNavbar.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

type Props = {
  title: string;
  toggleSidebar: () => void;
  sidebarOpen: boolean;
};

const ClubAdminNavbar: React.FC<Props> = ({
  title,
  toggleSidebar,
  sidebarOpen,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View
      style={[
        styles.navbar,
        {
          backgroundColor: isDark ? '#020617' : '#FFFFFF',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
        },
      ]}
    >
      {!sidebarOpen && (
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}>
          <Ionicons
            name="menu"
            size={26}
            color={isDark ? '#E5E7EB' : '#020617'}
          />
        </TouchableOpacity>
      )}

      <Text style={[styles.title, { color: isDark ? '#E5E7EB' : '#020617' }]}>
        {title}
      </Text>

      <TouchableOpacity>
        <Ionicons
          name="people-outline"
          size={22}
          color={isDark ? '#E5E7EB' : '#020617'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    minHeight: 56,
  },
  menuBtn: {
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
});

export default ClubAdminNavbar;
