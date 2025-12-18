import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

type Props = {
  title: string;
};

const CoachNavbar: React.FC<Props> = ({ title }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View
      style={[
        styles.navbar,
        {
          backgroundColor: isDark ? '#020617' : '#FFFFFF',
          paddingTop:
            Platform.OS === 'android' ? StatusBar.currentHeight : 44,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: isDark ? '#E5E7EB' : '#020617' },
        ]}
      >
        {title}
      </Text>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default CoachNavbar;
