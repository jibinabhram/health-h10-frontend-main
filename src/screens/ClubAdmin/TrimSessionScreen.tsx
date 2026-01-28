import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { db } from "../../db/sqlite";
import { parseFileTimeRange } from "../../utils/parseFileTimeRange";
import { getAssignedPlayersForSession } from "../../services/sessionPlayer.service";

/* =====================================================
   HELPERS
===================================================== */

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const HANDLE_GAP = 0.02;

/* =====================================================
   WAVEFORM
===================================================== */

function SignalWaveform({
  width,
  height,
  points = 240,
}: {
  width: number;
  height: number;
  points?: number;
}) {
  const polyline = useMemo(() => {
    const carrierFreq = 18;
    const envelopeFreq = 0.9;

    return Array.from({ length: points }, (_, i) => {
      const t = i / (points - 1);

      const envelope =
        0.25 + 0.75 * Math.sin(Math.PI * envelopeFreq * t);

      const carrier =
        Math.sin(2 * Math.PI * carrierFreq * t);

      const y = carrier * envelope;

      const px = t * width;
      const py = height / 2 - y * (height * 0.4);

      return `${px},${py}`;
    }).join(" ");
  }, [points, width, height]);

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={polyline}
        stroke="#1F2937"
        strokeWidth={1}
        fill="none"
      />
    </Svg>
  );
}

/* =====================================================
   SCREEN
===================================================== */

export default function TrimSessionScreen({
  file,
  sessionId,
  eventDraft,
  goBack,
  goNext,
}: any) {
  const parsed = parseFileTimeRange(file);

  if (!parsed) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Invalid or missing session file</Text>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { fileStartMs, fileEndMs, durationMs } = parsed;
  const graphWidth = Dimensions.get("window").width * 0.6;

  /* ================= PLAYERS ================= */

  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    const list = getAssignedPlayersForSession(sessionId).filter(
      p => p.assigned
    );
    setPlayers(list);
  }, [sessionId]);

  /* ================= TRIM STATE ================= */

  const [startRatio, setStartRatio] = useState(0);
  const [endRatio, setEndRatio] = useState(1);

  const startRef = useRef(0);
  const endRef = useRef(1);
  const ROW_HEIGHT = 52;
  const HEADER_HEIGHT = 24;

  const graphHeight =
    HEADER_HEIGHT + players.length * ROW_HEIGHT;

  /* ================= PAN HANDLERS ================= */

  const startPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        let next = startRef.current + g.dx / graphWidth;
        next = Math.max(0, Math.min(next, endRef.current - HANDLE_GAP));
        setStartRatio(next);
      },
      onPanResponderRelease: () => {
        startRef.current = startRatio;
      },
    })
  ).current;

  const endPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        let next = endRef.current + g.dx / graphWidth;
        next = Math.min(1, Math.max(next, startRef.current + HANDLE_GAP));
        setEndRatio(next);
      },
      onPanResponderRelease: () => {
        endRef.current = endRatio;
      },
    })
  ).current;

  /* ================= TIMES ================= */

  const trimStartTs = fileStartMs + durationMs * startRatio;
  const trimEndTs = fileStartMs + durationMs * endRatio;

  /* ================= SAVE ================= */

  const onNext = async () => {
    console.log("✂️ TRIM SAVE (intent)", {
      sessionId,
      fileStartMs,
      fileEndMs,
      trimStartTs: Math.round(trimStartTs),
      trimEndTs: Math.round(trimEndTs),
    });

    // ✅ UPDATE ONLY
    const result = await db.execute(
      `
      UPDATE sessions
      SET
        file_start_ts = ?,
        file_end_ts = ?,
        trim_start_ts = ?,
        trim_end_ts = ?
      WHERE session_id = ?
      `,
      [
        fileStartMs,
        fileEndMs,
        Math.round(trimStartTs),
        Math.round(trimEndTs),
        sessionId,
      ]
    );

    // 🔍 Verify update actually hit a row
    if (result.rowsAffected === 0) {
      console.error("❌ TRIM SAVE FAILED — session does not exist", sessionId);
      return;
    }

    // 🔎 Read back
    const res = await db.execute(
      `SELECT * FROM sessions WHERE session_id = ?`,
      [sessionId]
    );

    console.log(
      "✅ TRIM SAVE (sqlite confirmed)",
      res.rows._array[0]
    );

    goNext({ file, sessionId, eventDraft });
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trim Session</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.hint}>
        Drag the triangles to select the event time range
      </Text>

      <View style={styles.graphWrapper}>

        {/* ===== TIMELINE HEADER (handles live here) ===== */}
        <View style={styles.timelineRow}>
          <View style={styles.playerSpacer} />

          <View style={styles.timelineGraph}>
            {/* START HANDLE */}
            <View
              {...startPan.panHandlers}
              style={[
                styles.trimHandle,
                { left: `${startRatio * 100}%` },
              ]}
            >
              <View style={styles.handleTriangle} />
              <View
                style={[
                  styles.handleLine,
                  {
                    height: graphHeight,
                    backgroundColor: "rgba(17,24,39,0.7)",
                    width: 0.75,
                  },
                ]}
              />
            </View>

            {/* END HANDLE */}
            <View
              {...endPan.panHandlers}
              style={[
                styles.trimHandle,
                { left: `${endRatio * 100}%` },
              ]}
            >
              <View style={styles.handleTriangle} />
              <View
                style={[
                  styles.handleLine,
                  {
                    height: graphHeight,
                    backgroundColor: "rgba(17,24,39,0.7)",
                    width: 0.75,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* ===== PLAYER ROWS ===== */}
        {players.map(p => (
          <View key={p.player_id} style={styles.row}>
            <View style={styles.playerCell}>
              <Text style={styles.playerName}>{p.player_name}</Text>
            </View>

            <View style={styles.graphCell}>
              <View style={styles.waveBg} />

              <View
                style={[
                  styles.activeRange,
                  {
                    left: `${startRatio * 100}%`,
                    width: `${(endRatio - startRatio) * 100}%`,
                  },
                ]}
              />

              <SignalWaveform width={graphWidth} height={52} />
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.rangeText}>
        Event time range: {formatTime(trimStartTs)} – {formatTime(trimEndTs)}
      </Text>

      <View style={styles.footer}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.back}>BACK</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextText}>NEXT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
  },
  error: {
    color: "#DC2626",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  back: {
    color: "#2563EB",
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  hint: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 8,
  },
  graphWrapper: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  handle: {
    position: "absolute",
    top: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#111827",
    zIndex: 10,
  },
  row: {
    flexDirection: "row",
    height: 52,
    alignItems: "center",
  },
  playerCell: {
    width: "40%",
    paddingLeft: 8,
  },
  playerName: {
    fontSize: 13,
    color: "#111827",
  },
  graphCell: {
    width: "60%",
    height: "100%",
    justifyContent: "center",
  },
  waveBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E6FAF0",
  },
  activeRange: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(34,197,94,0.35)",
  },
  rangeText: {
    marginTop: 8,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
    color: "#334155",
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  nextText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  timelineRow: {
    flexDirection: "row",
    height: 24,
  },

  playerSpacer: {
    width: "40%",
  },

  timelineGraph: {
    width: "60%",
    position: "relative",
  },

  trimHandle: {
    position: "absolute",
    top: 0,
    alignItems: "center",
    zIndex: 20,
    pointerEvents: "box-none",
  },

  handleTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,          // 🔽 inverted triangle
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#111827",
  },

  handleLine: {
    width: 1,
    height: "100%",
    backgroundColor: "#111827",
    marginTop: 2,
  },
});
