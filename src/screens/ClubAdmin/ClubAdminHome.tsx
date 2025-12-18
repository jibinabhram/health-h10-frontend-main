import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';

import SidebarClubAdmin from '../../components/Sidebar/SidebarClubAdmin';
import ClubAdminNavbar from '../../components/Navbar/ClubAdminNavbar';

import { useTheme } from '../../components/context/ThemeContext';

import CreateCoach from './CreateCoach';
import MyClubCoaches from './MyClubCoaches';

type ScreenType = 'Home' | 'CreateCoach' | 'MyClubCoaches';

const ClubAdminHome = () => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [active, setActive] = useState<ScreenType>('Home');

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const renderScreen = () => {
    switch (active) {
      case 'CreateCoach':
        return <CreateCoach />;
      case 'MyClubCoaches':
        return <MyClubCoaches />;
      default:
        return (
          <View style={styles.center}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme === 'dark' ? '#E5E7EB' : '#020617' }}>
              Welcome Club Admin
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#020617' : '#F1F5F9' }]}>
      {sidebarOpen && <SidebarClubAdmin active={active} setActive={setActive} closeSidebar={toggleSidebar} />}

      <View style={styles.content}>
        <ClubAdminNavbar title={active} toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        {renderScreen()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  content: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default ClubAdminHome;
