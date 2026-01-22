import { db } from '../db/sqlite';

/* ================= WRITE ================= */
export const upsertPlayersToSQLite = (players: any[]) => {
  try {
    players.forEach(p => {
      const pod = p.player_pods?.[0]?.pod;

      db.execute(
        `
        INSERT OR REPLACE INTO players (
          player_id,
          club_id,
          player_name,
          jersey_number,
          age,
          position,
          pod_id,
          pod_serial,
          pod_holder_serial,
          club_name,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          p.player_id,
          p.club_id,
          p.player_name,
          p.jersey_number,
          p.age,
          p.position,
          pod?.pod_id ?? null,
          pod?.serial_number ?? null,
          pod?.pod_holder?.serial_number ?? null,
          p.club?.club_name ?? null,
          Date.now(),
        ]
      );
    });

    console.log('✅ Players cached to SQLite');
  } catch (err) {
    console.error('❌ Failed to cache players', err);
  }
};

/* ================= READ ================= */
/* ================= READ ================= */
export const getPlayersFromSQLite = () => {
  try {
    const result = db.execute(
      `
      SELECT *
      FROM players
      ORDER BY updated_at DESC
      `
    );

    // ✅ quick-sqlite returns rows directly
    const rows = result?.rows?._array ?? [];

    console.log('📦 SQLite players count:', rows.length);
    console.log('📦 SQLite players:', rows);

    return rows;
  } catch (err) {
    console.error('❌ Failed to read players from SQLite', err);
    return [];
  }
};

/* ================= CLEAR (optional) ================= */
export const clearPlayersSQLite = () => {
  db.execute(`DELETE FROM players`);
};
