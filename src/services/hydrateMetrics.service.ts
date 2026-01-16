import { db } from "../db/sqlite";
import { fetchAllActivityMetrics } from "../api/activityMetrics";
import AsyncStorage from '@react-native-async-storage/async-storage';

/* -------------------------------
   Session reconstruction helper
-------------------------------- */

function buildSessionId(date: Date) {
  // Example: 2024-03-18_10AM
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = d.getHours();

  return `${y}-${m}-${day}_H${hour}`;
}

/* -------------------------------
   Hydration logic
-------------------------------- */

export async function hydrateSQLiteFromBackend() {
  const count = db.execute(
    `SELECT COUNT(*) as c FROM calculated_data`
  ).rows._array[0].c;

  if (count > 0) {
    console.log('ℹ️ SQLite already hydrated');
    return;
  }

  console.log('⬇️ Hydrating SQLite from backend...');

  try {
    const remoteMetrics = await fetchAllActivityMetrics();

    if (!remoteMetrics.length) {
      console.log('⚠️ No backend metrics found');
      return;
    }

    await db.execute('BEGIN');

    for (const m of remoteMetrics) {
      const sessionId = buildSessionId(new Date(m.recorded_at));

      await db.execute(
        `
        INSERT INTO calculated_data (
          session_id,
          player_id,
          total_distance,
          hsr_distance,
          sprint_distance,
          top_speed,
          sprint_count,
          accelerations,
          decelerations,
          max_acceleration,
          max_deceleration,
          player_load,
          power_score,
          hr_max,
          time_in_red_zone,
          percent_in_red_zone,
          hr_recovery_time,
          created_at,
          synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `,
        [
          sessionId,
          m.player_id,
          m.total_distance,
          m.hsr_distance,
          m.sprint_distance,
          m.top_speed,
          m.sprint_count,
          m.acceleration,
          m.deceleration,
          m.max_acceleration,
          m.max_deceleration,
          m.player_load,
          m.power_score,
          m.hr_max,
          m.time_in_red_zone,
          m.percent_in_red_zone,
          m.hr_recovery_time,
          Math.floor(new Date(m.recorded_at).getTime() / 1000),
        ]
      );
    }

    await db.execute('COMMIT');
    console.log('✅ SQLite hydration completed');
  } catch (e) {
    await db.execute('ROLLBACK');
    console.error('❌ Hydration failed', e);
  }
}


