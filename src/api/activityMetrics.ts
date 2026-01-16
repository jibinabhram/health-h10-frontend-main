import api from './axios';

export const fetchAllActivityMetrics = async () => {
  const res = await api.get('/activity-metrics');
  console.log("BACKEND RESPONSE:", res.data);
  return res.data.data;
};

