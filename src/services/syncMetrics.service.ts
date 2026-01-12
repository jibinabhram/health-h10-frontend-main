import { db } from "../db/sqlite";
import { syncActivityMetric } from "../api/sync";

let isSyncing = false;
export async function syncPendingMetrics() {
  if (isSyncing) {
    console.log("⏸️ Sync already running");
    return;
  }

  isSyncing = true;
  try {
    const res = db.execute(
      `SELECT * FROM calculated_data WHERE synced = 0`
    );

    const rows = res.rows?._array || [];

    if (!rows.length) {
      console.log("✅ No pending metrics to sync");
      return;
    }

    console.log(`⏫ Syncing ${rows.length} metrics`);

    for (const row of rows) {
      await syncActivityMetric({
        session_id: row.session_id,
        player_id: row.player_id,
        metrics: row,
      });

      // ✅ Mark as synced ONLY after success
      await db.execute(
        `UPDATE calculated_data SET synced = 1 WHERE id = ?`,
        [row.id]
      );
    }

    console.log("✅ Metrics synced successfully");
  } catch (err) {
    console.log("❌ Sync failed, will retry later", err);
  }
}
