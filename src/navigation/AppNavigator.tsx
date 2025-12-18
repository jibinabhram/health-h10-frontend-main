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
import ProfileEditScreen from '../screens/SuperAdmin/ProfileEditScreen';
export type RootStackParamList = {
  AuthLoadingScreen: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;

  SuperAdminHome: undefined;
  ClubAdminHome: undefined;
  CoachHome: undefined;
  ProfileEdit: undefined;  
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
