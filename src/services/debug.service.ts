import { db } from "../db/sqlite";

export const debugDatabase = (sessionId: string) => {
  const raw = db.execute(
    "SELECT COUNT(*) as c FROM raw_data WHERE session_id = ?",
    [sessionId]
  );

  const calc = db.execute(
    "SELECT COUNT(*) as c FROM calculated_data WHERE session_id = ?",
    [sessionId]
  );

  console.log("🟡 RAW ROWS:", raw.rows?._array?.[0]?.c ?? 0);
  console.log("🟢 CALC ROWS:", calc.rows?._array?.[0]?.c ?? 0);
};
