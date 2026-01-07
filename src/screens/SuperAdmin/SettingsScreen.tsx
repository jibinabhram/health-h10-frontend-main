import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import SuperAdminNavbar from '../../components/Navbar/SuperAdminNavbar';
import SidebarSuperAdmin, {
  ScreenType,
} from '../../components/Sidebar/SidebarSuperAdmin';

import { useTheme } from '../../components/context/ThemeContext';
import { logout } from '../../utils/logout';

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  /* ===== SIDEBAR ===== */
  const [activeScreen, setActiveScreen] =
    useState<ScreenType>('Settings');
  const [collapsed, setCollapsed] = useState(false);

  /* ===== STATES ===== */
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [alertSound, setAlertSound] = useState(false);
  const [twoFA, setTwoFA] = useState(false);

  const bg = isDark ? '#020617' : '#F1F5F9';
  const cardBg = isDark ? '#0F172A' : '#FFFFFF';
  const text = isDark ? '#E5E7EB' : '#020617';
  const subText = '#64748b';
  const iconColor = isDark ? '#E5E7EB' : '#000000';



  return (
    <View style={styles.root}>
      <SuperAdminNavbar />

      <View style={styles.body}>
        <SidebarSuperAdmin
          active={activeScreen}
          setActive={setActiveScreen}
          collapsed={collapsed}
          toggleSidebar={() => setCollapsed(v => !v)}
        />

        <ScrollView contentContainerStyle={[styles.content, { backgroundColor: bg }]}>
          {/* PAGE HEADER */}
          <Text style={[styles.pageTitle, { color: text }]}>Settings</Text>
          <Text style={styles.pageSub}>
            Manage your app preferences and account settings
          </Text>

          {/* ================= APPEARANCE ================= */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="moon-outline" size={20}  color={iconColor} />
              <View>
                <Text style={[styles.sectionTitle, { color: text }]}>
                  Appearance
                </Text>
                <Text style={styles.sectionDesc}>
                  Customize how the app looks
                </Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.label, { color: text }]}>Dark Mode</Text>
                <Text style={styles.desc}>
                  Toggle between light and dark themes
                </Text>
              </View>
              <Switch value={isDark} onValueChange={toggleTheme} />
            </View>
          </View>

          {/* ================= NOTIFICATIONS ================= */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={iconColor}
              />
              <View>
                <Text style={[styles.sectionTitle, { color: text }]}>
                  Notification
                </Text>
                <Text style={styles.sectionDesc}>
                  Manage notification preferences
                </Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.label, { color: text }]}>
                  Email Notification
                </Text>
                <Text style={styles.desc}>
                  Receive updates via email
                </Text>
              </View>
              <Switch value={emailNotif} onValueChange={setEmailNotif} />
            </View>

            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.label, { color: text }]}>
                  Push Notification
                </Text>
                <Text style={styles.desc}>
                  Receive notifications on your device
                </Text>
              </View>
              <Switch value={pushNotif} onValueChange={setPushNotif} />
            </View>

            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.label, { color: text }]}>
                  Alert Sounds
                </Text>
                <Text style={styles.desc}>
                  Play sounds for important alerts
                </Text>
              </View>
              <Switch value={alertSound} onValueChange={setAlertSound} />
            </View>
          </View>

          {/* ================= SECURITY ================= */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={iconColor}
              />
              <View>
                <Text style={[styles.sectionTitle, { color: text }]}>
                  Security
                </Text>
                <Text style={styles.sectionDesc}>
                  Manage account security settings
                </Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.label, { color: text }]}>
                  Two-Factor Authentication
                </Text>
                <Text style={styles.desc}>
                  Add an extra layer of security
                </Text>
              </View>
              <Switch value={twoFA} onValueChange={setTwoFA} />
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <Ionicons name="key-outline" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Change Password</Text>
            </TouchableOpacity>
          </View>

          {/* ================= SIGN OUT ================= */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="log-out-outline" size={20} color={iconColor} />
              <View>
                <Text style={[styles.sectionTitle, { color: text }]}>
                  Sign Out
                </Text>
                <Text style={styles.sectionDesc}>
                  Sign out of your account
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => logout(navigation)}
            >
              <Ionicons name="log-out-outline" size={16} color="#fff" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default SettingsScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  root: { flex: 1 },

  body: {
    flex: 1,
    flexDirection: 'row',
  },

  content: {
    flexGrow: 1,
    padding: 24,
  },

  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
  },

  pageSub: {
    color: '#64748b',
    marginBottom: 24,
  },

  card: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  sectionDesc: {
    fontSize: 12,
    color: '#64748b',
  },



  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
  },

  desc: {
    fontSize: 12,
    color: '#64748b',
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    gap: 8,
    marginTop: 6,
  },

  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
