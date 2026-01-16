import { db } from "../db/sqlite";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export const exportTrimmedCsv = async (sessionId: string) => {
  const res = db.execute(
    `SELECT * FROM raw_data WHERE session_id = ? ORDER BY timestamp`,
    [sessionId]
  );

  const rows = res.rows?._array || [];

  if (!rows.length) {
    throw new Error("No trimmed data found");
  }

  // CSV HEADER
  let csv =
    "player_id,latitude,longitude,x,y,z,distance,speed,heartrate,timestamp\n";

  for (const r of rows) {
    csv +=
      `${r.player_id},${r.latitude},${r.longitude},` +
      `${r.x},${r.y},${r.z},` +
      `${r.distance},${r.speed},${r.heartrate},${r.timestamp}\n`;
  }

  const fileUri =
    FileSystem.documentDirectory +
    `trimmed_${sessionId}_${Date.now()}.csv`;

  await FileSystem.writeAsStringAsync(fileUri, csv);

  // 📤 SHARE / DOWNLOAD
  await Sharing.shareAsync(fileUri);

  return fileUri;
};
