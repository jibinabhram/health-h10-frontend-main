// src/screens/SuperAdmin/Dashboard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Dashboard = () => {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Super Admin Dashboard</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
});

export default Dashboard;
