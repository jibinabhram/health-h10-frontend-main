import { API_BASE_URL } from '../utils/constants';

/* ================= GET ALL PODS ================= */
export async function fetchPods(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/pods`);

    if (!res.ok) {
      console.error('❌ fetchPods HTTP error:', res.status);
      return [];
    }

    const json = await res.json();

    /**
     * ✅ NORMALIZE ALL POSSIBLE SHAPES
     * 1️⃣ { data: Pod[] }
     * 2️⃣ { data: { data: Pod[] } }
     * 3️⃣ anything else → []
     */

    // Case 1
    if (Array.isArray(json?.data)) {
      return json.data;
    }

    // Case 2 (THIS IS YOUR CURRENT BACKEND)
    if (Array.isArray(json?.data?.data)) {
      return json.data.data;
    }

    console.warn('⚠ fetchPods: unexpected payload shape', json);
    return [];
  } catch (err) {
    console.error('❌ fetchPods failed:', err);
    return [];
  }
}


/* ================= CREATE PODS BATCH ================= */
export async function createPodsBatch(
  count: number,
  model?: string,
): Promise<{ batch_id: string; created: number } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/pods/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, model }),
    });

    const json = await res.json();

    if (!json || !json.data) {
      console.error('❌ createPodsBatch: missing data', json);
      return null;
    }

    // ✅ This payload is correct — no warning needed
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
