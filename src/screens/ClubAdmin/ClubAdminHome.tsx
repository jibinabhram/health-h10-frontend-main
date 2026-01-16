import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SidebarClubAdmin, {
  ScreenType,
} from '../../components/Sidebar/SidebarClubAdmin';
import ClubAdminNavbar from '../../components/Navbar/ClubAdminNavbar';
import ProfileEditScreen from '../SuperAdmin/ProfileEditScreen';

const Screen = ({ title }: { title: string }) => (
  <View style={styles.center}>
    <Text style={{ fontSize: 20, fontWeight: '700' }}>{title}</Text>
  </View>
);

const ClubAdminHome = () => {
  const [activeScreen, setActiveScreen] =
    useState<ScreenType | 'ProfileEdit'>('Dashboard');

  const [collapsed, setCollapsed] = useState(false);

  const renderScreen = () => {
    if (activeScreen === 'ProfileEdit') {
      return <ProfileEditScreen goBack={() => setActiveScreen('Dashboard')} />;
    }

    return <Screen title={activeScreen} />;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>
        <View style={styles.navbarWrapper}>
          <ClubAdminNavbar
            title={activeScreen}
            onNavigate={setActiveScreen}
          />
        </View>

        <View style={styles.body}>
          <SidebarClubAdmin
            active={activeScreen as ScreenType}
            setActive={setActiveScreen}
            collapsed={collapsed}
            toggleSidebar={() => setCollapsed(v => !v)}
          />

          <View style={styles.content}>{renderScreen()}</View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ClubAdminHome;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020617' },
  root: { flex: 1, backgroundColor: '#F1F5F9' },
  navbarWrapper: { height: 56, zIndex: 10 },
  body: { flex: 1, flexDirection: 'row' },
  content: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
