import RNFS from "react-native-fs";
import { db } from "../db/sqlite";

export async function exportTrimmedCsv(sessionId: string) {
  // 1️⃣ READ TRIMMED RAW DATA (MATCH DB SCHEMA)
  const res = db.execute(
    `
    SELECT
      player_id,
      timestamp_ms,
      acc_x, acc_y, acc_z,
      quat_w, quat_x, quat_y, quat_z,
      lat, lon,
      heartrate
    FROM raw_data
    WHERE session_id = ?
    ORDER BY timestamp_ms
    `,
    [sessionId]
  );

  const rows = res.rows?._array ?? [];

  if (!rows.length) {
    throw new Error("No trimmed data found");
  }

  // 2️⃣ BUILD CSV
  const header = [
    "player_id",
    "timestamp_ms",
    "acc_x",
    "acc_y",
    "acc_z",
    "quat_w",
    "quat_x",
    "quat_y",
    "quat_z",
    "lat",
    "lon",
    "heartrate",
  ].join(",");

  const body = rows
    .map(r =>
      [
        r.player_id,
        r.timestamp_ms,
        r.acc_x,
        r.acc_y,
        r.acc_z,
        r.quat_w,
        r.quat_x,
        r.quat_y,
        r.quat_z,
        r.lat,
        r.lon,
        r.heartrate,
      ].join(",")
    )
    .join("\n");

  const csv = header + "\n" + body;

  // 3️⃣ SAVE TO DOWNLOADS (ANDROID)
  const path =
    `${RNFS.DownloadDirectoryPath}/${sessionId}_trimmed.csv`;

  await RNFS.writeFile(path, csv, "utf8");

  console.log("✅ TRIMMED CSV SAVED:", path);

  return path;
}
