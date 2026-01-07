import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../utils/constants';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPassword from '../screens/Auth/ForgotPassword';
import ResetPassword from '../screens/Auth/ResetPassword';

import SuperAdminHome from '../screens/SuperAdmin/SuperAdminHome';
import ClubAdminHome from '../screens/ClubAdmin/ClubAdminHome';
import CoachHome from '../screens/Coach/CoachHome';
import AuthLoadingScreen from '../screens/Auth/AuthLoadingScreen';
import ChangePasswordScreen from '../screens/Auth/ChangePasswordScreen';

/* ===== SUPER ADMIN ===== */
import SuperAdminHome from '../screens/SuperAdmin/SuperAdminHome';
import ProfileEditScreen from '../screens/SuperAdmin/ProfileEditScreen';
import CreateClub from '../screens/SuperAdmin/CreateClub';
import EditClub from '../screens/SuperAdmin/EditClub';
import HomeScreen from "../screens/ClubAdmin/HomeScreen";
import ImportFromESP32 from "../screens/ClubAdmin/ImportFromESP32";
import PerformanceScreen from "../screens/ClubAdmin/PerformanceScreen";
import CompareScreen from "../screens/ClubAdmin/CompareScreen";
import SettingsScreen from '../screens/SuperAdmin/SettingsScreen';

export type RootStackParamList = {
  AuthLoadingScreen: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  ChangePassword: undefined; // ✅ ADDED

  SuperAdminHome: undefined;
  ClubAdminHome: undefined;
  CoachHome: undefined;
  ProfileEdit: undefined;
  CreateClub: undefined;
  EditClub: { clubId: string };
  Home: undefined;
  ImportFromESP32: undefined;
  Performance: undefined;
  Compare: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="AuthLoadingScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="AuthLoadingScreen" component={AuthLoadingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
        <Stack.Screen name="SuperAdminHome" component={SuperAdminHome} />
        <Stack.Screen name="ClubAdminHome" component={ClubAdminHome} />
        <Stack.Screen name="CoachHome" component={CoachHome} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
        <Stack.Screen name="CreateClub" component={CreateClub} />
        <Stack.Screen name="EditClub" component={EditClub} />
        <Stack.Screen name="HomeScreen" component={HomeScreen}  options={{ headerShown: false }} />
        <Stack.Screen name="ImportFromESP32" component={ImportFromESP32} options={{ title: "UPLOAD" }} />
        <Stack.Screen name="Performance" component={PerformanceScreen} />
        <Stack.Screen name="Compare" component={CompareScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
