// src/api/admin.ts
import api from './axios';

export const getAllClubAdmins = async () => {
  const res = await api.get('/club-admin');
  return res.data?.data || res.data;
};
