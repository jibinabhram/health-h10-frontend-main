import { db } from "../db/sqlite";

export async function insertTestData() {
  await db.execute(`
    INSERT INTO calculated_data (
      player_id,
      session_id,

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

      created_at
    )
    VALUES
    -- PLAYER 1 (older match)
    (
      1, NULL,
      25.4, 12.2, 6.4,
      7.2, 3,
      8, 6, 3.5, -4.1,
      210.5, 35.6,
      98, 120, 24.5, 10,
      datetime('now','-2 day')
    ),

    -- PLAYER 1 (latest match)
    (
      1, NULL,
      32.1, 18.6, 9.8,
      8.1, 5,
      12, 9, 4.2, -5.3,
      290.8, 42.9,
      102, 180, 35.2, 14,
      datetime('now','-1 day')
    ),

    -- PLAYER 2 (older match)
    (
      2, NULL,
      21.8, 9.5, 4.1,
      6.6, 2,
      6, 5, 2.9, -3.6,
      180.3, 30.1,
      95, 90, 18.2, 8,
      datetime('now','-2 day')
    ),

    -- PLAYER 2 (latest match)
    (
      2, NULL,
      28.9, 15.1, 7.3,
      7.5, 4,
      10, 7, 3.8, -4.7,
      245.6, 38.4,
      99, 140, 28.4, 12,
      datetime('now')
    );
  `);
}
