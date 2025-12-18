import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

import { useTheme } from '../context/ThemeContext';

const DRAWER_WIDTH = 260;
const HEADER_HEIGHT = 56; // ✅ EXACT MATCH WITH NAVBAR

const MENU_ITEMS = [
  'Dashboard',
  'CreateClub',
  'CreateCoach',
  'Clubs',
  'ClubAdmins',
];

export type ScreenType = typeof MENU_ITEMS[number];
interface Props {
  active: ScreenType;
  setActive: React.Dispatch<React.SetStateAction<ScreenType>>;
  isOpen: boolean;
  closeSidebar: () => void;
}

const SidebarSuperAdmin: React.FC<Props> = ({
  active,
  setActive,
  isOpen,
  closeSidebar,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const isDark = theme === 'dark';

  const translateX = useSharedValue(isOpen ? 0 : -DRAWER_WIDTH);

  useEffect(() => {
    translateX.value = withTiming(isOpen ? 0 : -DRAWER_WIDTH, {
      duration: 250,
    });
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <PanGestureHandler
      onGestureEvent={e => {
        if (e.nativeEvent.translationX < -80) closeSidebar();
      }}
    >
      <Animated.View
        style={[
          styles.sidebar,
          animatedStyle,
          { backgroundColor: isDark ? '#050816' : '#F1F5F9' },
        ]}
      >
        {/* ✅ HEADER PERFECTLY MATCHES NAVBAR */}
        <View style={styles.topRow}>
          <Text
            style={[
              styles.title,
              { color: isDark ? '#E5E7EB' : '#020617' },
            ]}
          >
            Super Admin
          </Text>

          <TouchableOpacity onPress={closeSidebar} style={styles.iconBtn}>
            <Ionicons
              name="menu"
              size={26}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
        </View>

        {/* ✅ MENU */}
        {MENU_ITEMS.map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.item,
              active === item && {
                backgroundColor: isDark ? '#1F2937' : '#E2E8F0',
              },
            ]}
            onPress={() => {
              setActive(item);
              closeSidebar();
            }}
          >
            <Text
              style={[
                styles.itemText,
                {
                  color:
                    active === item
                      ? isDark
                        ? '#FFFFFF'
                        : '#000000'
                      : isDark
                      ? '#E5E7EB'
                      : '#020617',
                  fontWeight: active === item ? '700' : '500',
                },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: DRAWER_WIDTH,
    height: '100%',
    paddingHorizontal: 16,
    zIndex: 999,
    elevation: 10,
  },

  topRow: {
    height: HEADER_HEIGHT, // ✅ EXACT SAME AS NAVBAR
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
  },

  iconBtn: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  item: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },

  itemText: {
    fontSize: 16,
  },
});

export default SidebarSuperAdmin;
