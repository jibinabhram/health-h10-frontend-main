import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SidebarSuperAdmin from '../../components/Sidebar/SidebarSuperAdmin';
import SuperAdminNavbar from '../../components/Navbar/SuperAdminNavbar';
import { useTheme } from '../../components/context/ThemeContext';

import Dashboard from './Dashboard';
import CreateClub from './CreateClub';
import CreateCoach from './CreateCoach';
import ClubsList from './ClubsList';
import ClubAdminsList from './ClubAdminsList';
import { ScreenType } from '../../components/Sidebar/SidebarSuperAdmin';


const DRAWER_WIDTH = 260;

const SuperAdminHome = () => {
  const { theme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeScreen, setActiveScreen] =
    useState<ScreenType>('Dashboard');

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Dashboard':
        return <Dashboard />;
      case 'CreateClub':
        return <CreateClub />;
      case 'CreateCoach':
        return <CreateCoach />;
      case 'Clubs':
        return <ClubsList />;
      case 'ClubAdmins':
        return <ClubAdminsList />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: theme === 'dark' ? '#020617' : '#F1F5F9' },
      ]}
    >
      {/* ✅ STATUS BAR */}
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme === 'dark' ? '#020617' : '#F1F5F9'}
      />

      <View style={styles.container}>
        {/* ✅ SIDEBAR */}
        <SidebarSuperAdmin
          active={activeScreen}
          setActive={setActiveScreen}
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
        />

        {/* ✅ OVERLAY */}
        {sidebarOpen && (
          <Pressable style={styles.overlay} onPress={toggleSidebar} />
        )}

        {/* ✅ CONTENT SHIFT */}
        <View
          style={[
            styles.content,
            { marginLeft: sidebarOpen ? DRAWER_WIDTH : 0 },
          ]}
        >
          <SuperAdminNavbar
            title={activeScreen}
            toggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />

          {renderScreen()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    flexDirection: 'row',
  },

  content: {
    flex: 1,
  },

  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 998,
  },
});

export default SuperAdminHome;
