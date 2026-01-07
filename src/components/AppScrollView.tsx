import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

const AppScrollView = ({ children }: { children: React.ReactNode }) => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}
    >
      {children}
    </ScrollView>
  );
};

export default AppScrollView;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
});
