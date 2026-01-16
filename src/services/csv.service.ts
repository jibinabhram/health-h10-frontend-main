import Papa from "papaparse";
import { db } from "../db/sqlite";

/* ================= HELPERS ================= */

// ms → HH:MM:SS (for logs only)
function msToTime(ms: number): string {
  const d = new Date(ms);
  return d.toISOString().substr(11, 8);
}

export async function importCsvToSQLite(
  csvText: string,
  sessionId: string,
  trimStartMs: number,
  trimEndMs: number
) {
  /* ================= NORMALIZE CSV ================= */

  const normalized = csvText
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .replace(/(\d)\n(?=\d+,)/g, "$1\n");

  const parsed = Papa.parse(normalized.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length) {
    console.warn("❌ CSV PARSE ERRORS:", parsed.errors);
  }

  const rows = parsed.data as any[];

  if (!rows.length) {
    console.warn("❌ NO ROWS AFTER PARSE");
    return;
  }

  /* ================= SESSION START ================= */

  const sessionStartMs = Number(rows[0].timestamp_ms);
  if (isNaN(sessionStartMs)) {
    throw new Error("Invalid timestamp_ms in CSV");
  }

  const absStart = sessionStartMs + trimStartMs;
  const absEnd = sessionStartMs + trimEndMs;

  console.log("🟢 TRIM WINDOW");
  console.log("Start:", msToTime(absStart));
  console.log("End:  ", msToTime(absEnd));

  /* ================= CLEAR OLD DATA ================= */

  await db.execute(
    `DELETE FROM raw_data WHERE session_id = ?`,
    [sessionId]
  );

  /* ================= INSERT DATA ================= */

  let inserted = 0;
  let txStarted = false;

  try {
    await db.execute("BEGIN");
    txStarted = true;

    for (const row of rows) {
      if (!row.player_id || !row.timestamp_ms) continue;

      const timestamp = Number(row.timestamp_ms);
      if (isNaN(timestamp)) continue;

      // ⏱️ TRIM WINDOW
      if (timestamp < absStart || timestamp > absEnd) continue;

      await db.execute(
        `
        INSERT INTO raw_data (
          session_id,
          player_id,
          timestamp_ms,

          acc_x, acc_y, acc_z,
          quat_w, quat_x, quat_y, quat_z,
          lat, lon,
          heartrate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          sessionId,
          Number(row.player_id),
          timestamp,

          Number(row.acc_x),
          Number(row.acc_y),
          Number(row.acc_z),

          Number(row.quat_w),
          Number(row.quat_x),
          Number(row.quat_y),
          Number(row.quat_z),

          Number(row.lat),
          Number(row.lon),

          Number(row.heartrate),
        ]
      );

      inserted++;
    }

    await db.execute("COMMIT");

    console.log(`✅ RAW DATA INSERTED: ${inserted}`);

    /* ================= DEBUG STATS ================= */

    const stats = db.execute(
      `
      SELECT
        COUNT(*) as count,
        MIN(timestamp_ms) as start,
        MAX(timestamp_ms) as end
      FROM raw_data
      WHERE session_id = ?
      `,
      [sessionId]
    ).rows._array[0];

    console.log("🟡 DB STATS");
    console.log("Start:", msToTime(stats.start));
    console.log("End:  ", msToTime(stats.end));
    console.log("Rows:", stats.count);

  } catch (err) {
    if (txStarted) {
      await db.execute("ROLLBACK");
    }
    console.error("❌ CSV IMPORT FAILED", err);
    throw err;
  }
}
