import { db } from "../db/sqlite";

export const getCalculatedData = () => {
  const result = db.execute(
    "SELECT * FROM calculated_data ORDER BY player_id"
  );

  return result.rows?._array || [];
};
