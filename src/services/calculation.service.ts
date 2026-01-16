import { db } from "../db/sqlite";

export const saveCalculatedData = async (d: any) => {
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
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      d.session_id,        // 🔥 REQUIRED
      d.player_id,
      d.total_distance,
      d.hsr_distance,
      d.sprint_distance,
      d.top_speed,
      d.sprint_count,
      d.accelerations,
      d.decelerations,
      d.max_acceleration,
      d.max_deceleration,
      d.player_load,
      d.power_score,
      d.hr_max,
      d.time_in_red_zone,
      d.percent_in_red_zone,
      d.hr_recovery_time,
      Date.now(),
    ]
  );
};
