import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { db } from "../../db/sqlite";

export default function CompareScreen() {
  const [players, setPlayers] = useState<number[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number>(0);
  const [a, setA] = useState<any>(null);
  const [b, setB] = useState<any>(null);

  /* ================= LOAD PLAYER IDS ================= */

  useEffect(() => {
    const res = db.execute(
      "SELECT DISTINCT player_id FROM calculated_data ORDER BY player_id"
    );

    const ids =
      res.rows?._array?.map((r: any) => Number(r.player_id)) || [];

    if (ids.length > 0) {
      setPlayers(ids);
      setSelectedPlayer(ids[0]);
    }
  }, []);

  /* ================= LOAD LAST 2 MATCHES ================= */

  useEffect(() => {
    if (!selectedPlayer) return;

    const res = db.execute(
      `SELECT * FROM calculated_data
       WHERE player_id = ?
       ORDER BY created_at`,
      [selectedPlayer]
    );

    const rows = res.rows?._array || [];

    if (rows.length >= 2) {
      setA(rows[rows.length - 2]);
      setB(rows[rows.length - 1]);
    } else {
      setA(null);
      setB(null);
    }
  }, [selectedPlayer]);

  if (players.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No players available</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Match Comparison</Text>

        {/* PLAYER SELECT */}
        <View style={styles.selector}>
          <Text style={styles.label}>Select Player</Text>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedPlayer}
              onValueChange={(v) => setSelectedPlayer(Number(v))}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              dropdownIconColor="#1e3a8a"
            >
              {players.map((id) => (
                <Picker.Item
                  key={id}
                  label={`Player ${id}`}
                  value={id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {!a || !b ? (
          <Text style={styles.empty}>
            Not enough matches for this player
          </Text>
        ) : (
          <>
            <Metric label="Total Distance (m)" a={a.total_distance} b={b.total_distance} />
            <Metric label="HSR Distance (m)" a={a.hsr_distance} b={b.hsr_distance} />
            <Metric label="Sprint Distance (m)" a={a.sprint_distance} b={b.sprint_distance} />

            <Metric label="Top Speed (m/s)" a={a.top_speed} b={b.top_speed} />
            <Metric label="Sprint Count" a={a.sprint_count} b={b.sprint_count} />

            <Metric label="Accelerations" a={a.accelerations} b={b.accelerations} />
            <Metric label="Decelerations" a={a.decelerations} b={b.decelerations} />
            <Metric label="Max Acceleration" a={a.max_acceleration} b={b.max_acceleration} />
            <Metric label="Max Deceleration" a={a.max_deceleration} b={b.max_deceleration} />

            <Metric label="Player Load" a={a.player_load} b={b.player_load} />
            <Metric label="Power Score" a={a.power_score} b={b.power_score} />

            <Metric label="HR Max" a={a.hr_max} b={b.hr_max} />
            <Metric label="Time in Red Zone" a={a.time_in_red_zone} b={b.time_in_red_zone} />
            <Metric label="% Time in Red Zone" a={a.percent_in_red_zone} b={b.percent_in_red_zone} />
            <Metric label="HR Recovery Time" a={a.hr_recovery_time} b={b.hr_recovery_time} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= METRIC ================= */

const Metric = ({ label, a, b }: any) => {
  const valA = Number(a ?? 0);
  const valB = Number(b ?? 0);

  if (valA === 0 && valB === 0) return null;

  const diff = (valB - valA).toFixed(2);
  const color =
    Number(diff) > 0 ? "#16a34a" :
    Number(diff) < 0 ? "#dc2626" :
    "#475569";

  return (
    <View style={styles.card}>
      <Text style={styles.metric}>{label}</Text>
      <Text>Match A: {valA}</Text>
      <Text>Match B: {valB}</Text>
      <Text style={[styles.diff, { color }]}>
        Difference: {diff > 0 ? "+" : ""}{diff}
      </Text>
    </View>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f7fa",
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: "#0f172a",
  },
  selector: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
  },
  label: {
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 14,
    color: "#1e3a8a",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    minHeight: 56,
    justifyContent: "center",
  },
  picker: {
    height: Platform.OS === "android" ? 56 : 48,
    color: "#0f172a",
  },
  pickerItem: {
    height: 56,
    fontSize: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  metric: {
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 15,
    color: "#0f172a",
  },
  diff: {
    marginTop: 6,
    fontWeight: "700",
    fontSize: 14,
  },
  empty: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
