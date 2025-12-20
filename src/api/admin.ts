// src/api/admin.ts
import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

const authConfig = async () => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};
export const updateAdminByClub = async (clubId: string, payload: any) => {
  const config = await authConfig();
  return api.patch(`/club-admin/by-club/${clubId}`, payload, config);
};
export const getAllClubAdmins = async () => {
  const res = await api.get('/club-admin');
  return res.data?.data || res.data;
};
