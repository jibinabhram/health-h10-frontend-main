import api from './axios';

export const syncActivityMetric = async (payload: {
  session_id: string;
  player_id: string;
  metrics: any;
}) => {
  const res = await api.post('/activity-metrics/sync', payload);
  return res.data;
};
