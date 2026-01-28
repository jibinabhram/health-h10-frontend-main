import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from "react-native";
import { db } from "../../db/sqlite";
import { parseFileTimeRange } from "../../utils/parseFileTimeRange";

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

/* =====================================================
   SCREEN
===================================================== */

export default function TrimSessionScreen({
  file,
  sessionId,
  eventDraft,
  goBack,
  goNext,
}: {
  file: string;
  sessionId: string;
  eventDraft: any;
  goBack: () => void;
  goNext: (params: any) => void;
}) {
  console.log("📄 Trim file:", file);
  const parsed = parseFileTimeRange(file);
  console.log("🧠 Parsed:", parsed);
  if (!parsed) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "red", fontWeight: "700" }}>
          Invalid or missing session file
        </Text>

        <TouchableOpacity onPress={goBack} style={{ marginTop: 12 }}>
          <Text style={{ color: "#2563EB" }}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { fileStartMs, fileEndMs, durationMs } = parsed;

  const trackWidth = Dimensions.get("window").width - 32;

  const [startRatio, setStartRatio] = useState(0);
  const [endRatio, setEndRatio] = useState(1);

  const startRatioRef = useRef(0);
  const endRatioRef = useRef(1);

  /* ================= START HANDLE ================= */

  const startPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const dxRatio = g.dx / trackWidth;
        let next = startRatioRef.current + dxRatio;

        next = Math.max(0, Math.min(next, endRatioRef.current - 0.02));

        setStartRatio(next);
      },
      onPanResponderRelease: () => {
        startRatioRef.current = startRatio;
      },
    })
  ).current;

  /* ================= END HANDLE ================= */

  const endPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const dxRatio = g.dx / trackWidth;
        let next = endRatioRef.current + dxRatio;

        next = Math.min(1, Math.max(next, startRatioRef.current + 0.02));

        setEndRatio(next);
      },
      onPanResponderRelease: () => {
        endRatioRef.current = endRatio;
      },
    })
  ).current;

  /* ================= DERIVED TIMES ================= */

  const trimStartTs = fileStartMs + durationMs * startRatio;
  const trimEndTs = fileStartMs + durationMs * endRatio;

  /* ================= SAVE & NEXT ================= */

  const onNextPress = async () => {
    await db.execute(
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

    goNext({
      file,
      sessionId,
      eventDraft,
    });
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Trim Session</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* FILE INFO */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          File Start: {formatTime(fileStartMs)}
        </Text>
        <Text style={styles.infoText}>
          File End: {formatTime(fileEndMs)}
        </Text>
      </View>

      {/* TIMELINE */}
      <View style={styles.timeline}>
        <View style={styles.track} />

        <View
          style={[
            styles.selection,
            {
              left: `${startRatio * 100}%`,
              width: `${(endRatio - startRatio) * 100}%`,
            },
          ]}
        />

        <View
          {...startPan.panHandlers}
          style={[
            styles.handle,
            { left: `${startRatio * 100}%` },
          ]}
        />

        <View
          {...endPan.panHandlers}
          style={[
            styles.handle,
            { left: `${endRatio * 100}%` },
          ]}
        />
      </View>

      {/* TIME DISPLAY */}
      <View style={styles.timeBox}>
        <Text style={styles.timeText}>
          Start: {formatTime(trimStartTs)}
        </Text>
        <Text style={styles.timeText}>
          End: {formatTime(trimEndTs)}
        </Text>
        <Text style={styles.duration}>
          Duration:{" "}
          {Math.round((trimEndTs - trimStartTs) / 60000)} min
        </Text>
      </View>

      {/* NEXT */}
      <TouchableOpacity style={styles.nextBtn} onPress={onNextPress}>
        <Text style={styles.nextText}>NEXT</Text>
      </TouchableOpacity>
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
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

  infoBox: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
  },

  infoText: {
    fontSize: 14,
    color: "#334155",
  },

  timeline: {
    height: 60,
    justifyContent: "center",
    marginBottom: 24,
  },

  track: {
    height: 4,
    backgroundColor: "#CBD5E1",
    borderRadius: 2,
  },

  selection: {
    position: "absolute",
    height: 4,
    backgroundColor: "#2563EB",
    borderRadius: 2,
  },

  handle: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2563EB",
    top: 21,
    marginLeft: -9,
  },

  timeBox: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
  },

  timeText: {
    fontSize: 14,
    color: "#111827",
    marginBottom: 4,
  },

  duration: {
    marginTop: 6,
    fontWeight: "700",
    color: "#16A34A",
  },

  nextBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: "auto",
  },

  nextText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
