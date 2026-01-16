import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SidebarSuperAdmin, {
  ScreenType,
} from '../../components/Sidebar/SidebarSuperAdmin';
import SuperAdminNavbar from '../../components/Navbar/SuperAdminNavbar';

/* ===== SCREENS ===== */
import CreateClub from './CreateClub';
import ClubManagementScreen from './ClubManagementScreen';
import PodManagementScreen from './PodManagementScreen';
import PodholderManagementScreen from './PodholderManagementScreen';
import SettingsScreen from './SettingsScreen';
import ProfileEditScreen from './ProfileEditScreen';
import DashboardScreen from './DashboardScreen';
import PaymentScreen from './PaymentScreen';
import SupportTicketsScreen from './SupportTicketsScreen';

const SuperAdminHome = () => {
  const [activeScreen, setActiveScreen] =
    useState<ScreenType>('Dashboard');

  const [collapsed, setCollapsed] = useState(false);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  const renderScreen = () => {
    switch (activeScreen) {
      case 'Dashboard':
        return <DashboardScreen onNavigate={setActiveScreen} />;

      case 'ClubManagement':
        return (
          <ClubManagementScreen
            openCreateClub={() => setActiveScreen('CreateClub')}
          />
        );

      case 'CreateClub':
        return (
          <CreateClub
            goBack={() => setActiveScreen('ClubManagement')}
          />
        );

      case 'PodholderManagement':
        return <PodholderManagementScreen />;

      case 'PodManagement':
        return <PodManagementScreen />;

      case 'Payment':
        return <PaymentScreen />;

      case 'SupportTickets':
        return <SupportTicketsScreen />;

      case 'Settings':
        return (
          <SettingsScreen
            goBack={() => setActiveScreen('Dashboard')}
          />
        );

      case 'ProfileEdit':
        return (
          <ProfileEditScreen
            goBack={() => setActiveScreen('Dashboard')}
            onProfileUpdated={() =>
              setProfileRefreshKey(v => v + 1)
            }
          />
        );

      default:
        return <DashboardScreen onNavigate={setActiveScreen} />;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        {/* ===== NAVBAR ===== */}
        <View style={styles.navbarWrapper}>
          <SuperAdminNavbar
            key={profileRefreshKey}
            toggleSidebar={() => setCollapsed(v => !v)}
            onNavigate={setActiveScreen}
            profileRefreshKey={profileRefreshKey}
          />
        </View>

        {/* ===== BODY ===== */}
        <View style={styles.body}>
          {/* ===== SIDEBAR ===== */}
          <SidebarSuperAdmin
            active={activeScreen}
            setActive={setActiveScreen}
            collapsed={collapsed}
            toggleSidebar={() => setCollapsed(v => !v)}
          />

          {/* ===== CONTENT ===== */}
          <View style={styles.content}>
            {renderScreen()}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SuperAdminHome;

/* ===== STYLES ===== */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#2F343B',
  },
  root: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  navbarWrapper: {
    height: 56,
    zIndex: 10,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
