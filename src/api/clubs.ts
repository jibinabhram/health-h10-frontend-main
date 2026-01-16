import api from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

/* =====================================================
   AUTH CONFIG
   ===================================================== */
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

/* =====================================================
   CREATE CLUB
   ===================================================== */
export const createClub = async (payload: any) => {
  const config = await authConfig();
  const res = await api.post('/clubs', payload, config);
  return res.data?.data ?? res.data;
};

/* =====================================================
   GET ALL CLUBS
   ===================================================== */
export const getAllClubs = async () => {
  const config = await authConfig();
  const res = await api.get('/clubs', config);
  return res.data?.data ?? res.data;
};

/* =====================================================
   GET UNASSIGNED POD HOLDERS  ✅ FIX ADDED
   ===================================================== */
// ✅ CORRECT ENDPOINT
export const getUnassignedPodHolders = async () => {
  const config = await authConfig();
  const res = await api.get('/pod-holders/unassigned', config);

  // backend returns array directly
  if (Array.isArray(res.data)) {
    return res.data;
  }

  console.warn(
    '⚠️ getUnassignedPodHolders: unexpected payload',
    res.data,
  );
  return [];
};


/* =====================================================
   UPDATE CLUB
   ===================================================== */
export const updateClub = async (clubId: string, payload: any) => {
  const config = await authConfig();
  const res = await api.patch(`/clubs/${clubId}`, payload, config);
  return res.data?.data ?? res.data;
};

/* =====================================================
   DELETE CLUB
   ===================================================== */
export const deleteClub = async (clubId: string) => {
  const config = await authConfig();
  const res = await api.delete(`/clubs/${clubId}`, config);
  return res.data?.data ?? res.data;
};
