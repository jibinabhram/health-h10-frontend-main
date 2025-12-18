// src/api/clubs.ts
import api from './axios';

export const createClub = async (payload: any) => {
  const res = await api.post('/clubs', payload);
  return res.data?.data || res.data;
};

export const getAllClubs = async () => {
  const res = await api.get('/clubs');
  return res.data?.data || res.data;
};
