import Papa from "papaparse";
import { db } from "../db/sqlite";
import { computeMetrics } from "./calculation.service";

export const importRawData = async (
  csvText: string,
  sessionId: string
) => {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  /* ================= SAVE RAW DATA ================= */

  for (const row of parsed.data as any[]) {
    await db.execute(
      `
      INSERT INTO raw_data (
        session_id,
        player_id,
        latitude,
        longitude,
        x, y, z,
        speed,
        distance,
        heartrate,
        timestamp
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        sessionId,
        Number(row.player_id),
        Number(row.latitude),
        Number(row.longitude),
        Number(row.x),
        Number(row.y),
        Number(row.z),
        Number(row.speed),
        Number(row.distance),
        Number(row.heartrate),
        Number(row.timestamp), // ✅ epoch seconds ONLY
      ]
    );
  }

  /* ================= CALCULATE METRICS ================= */
  // 🔥 THIS IS THE KEY
  await computeMetrics(sessionId);
};
