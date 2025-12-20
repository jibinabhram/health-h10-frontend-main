// src/api/clubs.ts
import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

// helper to attach token
const authConfig = async () => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

  if (!token) {
    console.warn('⚠️ No auth token found');
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const createClub = async (payload: any) => {
  const res = await api.post('/clubs', payload);
  return res.data?.data || res.data;
};

export const getAllClubs = async () => {
  const res = await api.get('/clubs');
  return res.data?.data || res.data;
};

// UPDATE
export const updateClub = async (clubId: string, payload: any) => {
  const config = await authConfig();
  const res = await api.patch(`/clubs/${clubId}`, payload, config);
  return res.data?.data || res.data;
};

// DELETE
export const deleteClub = async (clubId: string) => {
  const config = await authConfig();
  const res = await api.delete(`/clubs/${clubId}`, config);
  return res.data?.data || res.data;
};