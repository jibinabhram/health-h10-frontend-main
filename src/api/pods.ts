import { API_BASE_URL } from '../utils/constants';

/* ================= GET ALL PODS ================= */
export async function fetchPods(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/pods`);

  if (!res.ok) {
    console.error('❌ fetchPods HTTP error:', res.status);
    throw new Error('Failed to fetch pods');
  }

  const json = await res.json();

  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.data)) return json.data.data;

  console.warn('⚠ fetchPods: unexpected payload shape', json);
  return [];
}

/* ================= CREATE PODS BATCH ================= */
export async function createPodsBatch(
  count: number,
  model?: string,
): Promise<{ batch_id: string; created: number } | null> {

  // ✅ HARD GUARD (before fetch)
  if (!count || count <= 0) {
    console.warn('⚠️ createPodsBatch skipped: invalid count', count);
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/pods/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, model }),
    });

    if (!res.ok) {
      console.error('❌ createPodsBatch HTTP error:', res.status);
      throw new Error('Failed to create pod batch');
    }

    const json = await res.json();

    if (!json?.data) {
      console.error('❌ createPodsBatch: missing data', json);
      return null;
    }

    return json.data;
  } catch (err) {
    console.error('❌ createPodsBatch failed:', err);
    return null;
  }
}


export async function updatePodStatus(
  podId: string,
  status: 'ACTIVE' | 'MAINTENANCE' | 'DAMAGED' | 'LOST',
) {
  const res = await fetch(
    `${API_BASE_URL}/pods/${podId}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  );

  if (!res.ok) {
    throw new Error('Failed to update status');
  }

  return res.json();
}
