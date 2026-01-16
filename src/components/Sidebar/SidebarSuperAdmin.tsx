import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 64;

/* ================= MENU CONFIG ================= */

const MENU_ITEMS = [
  {
    key: 'Dashboard',
    label: 'Dashboard',
    icon: 'grid-outline',
  },
  {
    key: 'ClubManagement',
    label: 'Club Management',
    icon: 'business-outline',
  },
  {
    key: 'PodholderManagement',
    label: 'Podholder Management',
    icon: 'people-outline',
  },
  {
    key: 'PodManagement',
    label: 'Pod Management',
    icon: 'hardware-chip-outline',
  },
  {
      key: 'Payment',
      label: 'Payment',
      icon: 'card-outline',
    },
    {
      key: 'SupportTickets',
      label: 'Support Tickets',
      icon: 'help-circle-outline',
    },
  {
      key: 'Settings',
      label: 'Settings',
      icon: 'settings-outline',
  },
] as const;


/* ================= TYPES ================= */

export type ScreenType = typeof MENU_ITEMS[number]['key'];

interface Props {
  active: ScreenType;
  setActive: (v: ScreenType) => void;
  collapsed: boolean;
  toggleSidebar: () => void;
}

/* ================= COMPONENT ================= */

const SidebarSuperAdmin: React.FC<Props> = ({
  active,
  setActive,
  collapsed,
  toggleSidebar,
}) => {
  return (
    <View
      style={[
        styles.sidebar,
        { width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH },
      ]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          collapsed ? styles.headerCollapsed : styles.headerExpanded,
        ]}
      >
        <TouchableOpacity onPress={toggleSidebar}>
          <Ionicons
            name={collapsed ? 'menu' : 'close'}
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* MENU ITEMS */}
      {MENU_ITEMS.map(item => {
        const isActive = active === item.key;

        return (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.item,
              collapsed && styles.itemCollapsed,
              isActive && styles.activeItem,
            ]}
            onPress={() => setActive(item.key)}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={isActive ? '#FFFFFF' : '#9CA3AF'}
            />

            {!collapsed && (
              <Text style={[styles.text, isActive && styles.activeText]}>
                {item.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default SidebarSuperAdmin;

/* ================= STYLES ================= */

const styles = StyleSheet.create({

  sidebar: {
    backgroundColor: '#000',
    height: '100%',
    paddingTop: 6,
  },

  header: {
    height: 44,
    marginBottom: 10,
  },

  headerExpanded: {
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },

  headerCollapsed: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  item: {
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 6,
  },

  itemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },

  activeItem: {
    backgroundColor: '#1F2937',
  },

  text: {
    marginLeft: 14,
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },

  activeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
