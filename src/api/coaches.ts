// src/api/coaches.ts
import api from './axios';

export const fetchMyClubCoaches = async () => {
  const res = await api.get('/coaches/my-club'); // You already added this backend
  return res.data?.data || res.data;
};

export const createCoachForMyClub = async (payload: {
  coach_name: string;
  email: string;
  password: string;
  phone?: string | null;
}) => {
  const res = await api.post('/coaches', payload);
  return res.data?.data || res.data;
};
