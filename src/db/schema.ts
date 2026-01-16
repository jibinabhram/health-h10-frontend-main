import { db } from "./sqlite";

export function initDB() {
  try {
    db.execute(`
      CREATE TABLE IF NOT EXISTS raw_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        player_id INTEGER,

        lat REAL,
        lon REAL,

        acc_x REAL,
        acc_y REAL,
        acc_z REAL,

        quat_w REAL,
        quat_x REAL,
        quat_y REAL,
        quat_z REAL,

        heartrate INTEGER,
        timestamp_ms INTEGER
      );
    `);

    db.execute(`
      CREATE TABLE IF NOT EXISTS calculated_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        player_id INTEGER,

        total_distance REAL,
        hsr_distance REAL,
        sprint_distance REAL,
        top_speed REAL,
        sprint_count INTEGER,

        accelerations INTEGER,
        decelerations INTEGER,
        max_acceleration REAL,
        max_deceleration REAL,

        player_load REAL,
        power_score REAL,

        hr_max INTEGER,
        time_in_red_zone REAL,
        percent_in_red_zone REAL,
        hr_recovery_time REAL,

        created_at INTEGER
      );
    `);

    // ✅ SAFE MIGRATION (runs once)
    try {
      db.execute(`
        ALTER TABLE calculated_data
        ADD COLUMN synced INTEGER DEFAULT 0
      `);
      console.log("🆕 'synced' column added");
    } catch {
      // column already exists → ignore
    }

    console.log("✅ SQLite tables ready");
  } catch (err) {
    console.error("❌ DB INIT FAILED:", err);
  }
}
