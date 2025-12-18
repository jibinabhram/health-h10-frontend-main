// src/screens/Coach/CoachHome.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '../../components/context/ThemeContext';
import SidebarCoach from '../../components/Sidebar/SidebarCoach';
import Navbar from '../../components/Navbar';

const CoachHome = () => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === 'dark' ? '#020617' : '#F1F5F9' },
      ]}
    >
      {sidebarOpen && (
        <SidebarCoach closeSidebar={toggleSidebar} />
      )}

      <View style={styles.content}>
        <Navbar
          title="Coach"
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />

        <View style={styles.center}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: theme === 'dark' ? '#E5E7EB' : '#020617',
            }}
          >
            Welcome Coach
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  content: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default CoachHome;
