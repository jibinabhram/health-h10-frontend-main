import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";

import { fetchCsvFiles, downloadCsv } from "../../api/esp32";
import { importCsvToSQLite } from "../../services/csv.service";
import { calculateMetricsFromRaw } from "../../services/calculateMetrics.service";
import { exportTrimmedCsv } from "../../services/exportCsv.service";
import { debugDatabase } from "../../services/debug.service";
import { safeAlert } from "../../services/safeAlert.service";
// import { useRoute } from "@react-navigation/native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/AppNavigator";

/* ================= TIME HELPERS ================= */

// HH:MM:SS → milliseconds OFFSET (RELATIVE)
function timeToMs(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  if (parts.length !== 3) throw new Error("Invalid time");

  const [h, m, s] = parts;

  if (
    isNaN(h) || isNaN(m) || isNaN(s) ||
    h < 0 || m < 0 || s < 0 ||
    m > 59 || s > 59
  ) {
    throw new Error("Invalid time");
  }

  return ((h * 3600) + (m * 60) + s) * 1000;
}

export default function ImportFromESP32() {
  const mountedRef = useRef(true);

  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [importedSession, setImportedSession] = useState<string | null>(null);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const route =
    useRoute<RouteProp<RootStackParamList, "ImportFromESP32">>();
  const eventDraft = route.params?.eventDraft ?? null;
  const comingFromEvent = !!route.params?.file;

  useEffect(() => {
    if (route.params?.file) {
      setSelected(route.params.file);
      setDropdownOpen(false); // 👈 IMPORTANT
    }
  }, [route.params?.file]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!route.params?.file) {
      loadFiles(); // only load list if NOT coming from calendar
    }
  }, [route.params?.file]);

  const loadFiles = async () => {
    try {
      setLoadingFiles(true);
      const list = await fetchCsvFiles();

      if (mountedRef.current) {
        setFiles(list);
        setDropdownOpen(true); // 👈 auto show list
      }
    } catch {
      Alert.alert("ESP32 Not Reachable", "Connect phone to ESP32 Wi-Fi");
    } finally {
      if (mountedRef.current) setLoadingFiles(false);
    }
  };

  /* ================= IMPORT ================= */

  const importFile = async () => {
    if (!selected) {
      Alert.alert("Select CSV file");
      return;
    }

    try {
      const hasStart = startTime.trim().length > 0;
      const hasEnd = endTime.trim().length > 0;

      if (!hasStart || !hasEnd) {
        Alert.alert("Time Required", "Please fill BOTH start and end time");
        return;
      }

      const trimStartMs = timeToMs(startTime);
      const trimEndMs = timeToMs(endTime);

      if (trimStartMs >= trimEndMs) {
        Alert.alert("Invalid Range", "Start time must be before End time");
        return;
      }

      setLoading(true);
      setImportedSession(null);

      const sessionId = selected.replace(".csv", "");
      const csvText = await downloadCsv(selected);

      // ✅ PASS RELATIVE OFFSETS
      await importCsvToSQLite(
        csvText,
        sessionId,
        trimStartMs,
        trimEndMs,
        eventDraft || undefined
      );
      await calculateMetricsFromRaw(sessionId);
      debugDatabase(sessionId);

      setImportedSession(sessionId);
      Alert.alert("Success", "CSV imported & calculated successfully");

    } catch (err) {
      console.error("❌ IMPORT ERROR:", err);
      Alert.alert(
        "Invalid Time Format",
        "Please use HH:MM:SS (example: 00:10:30)"
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  /* ================= EXPORT ================= */

  const downloadTrimmed = async () => {
    if (!importedSession) return;

    try {
      const path = await exportTrimmedCsv(importedSession);
      safeAlert("CSV Downloaded", `Saved to Downloads:\n${path}`);
    } catch {
      safeAlert("Download Failed", "No trimmed data found");
    }
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <View style={styles.box}>
      {eventDraft && (
        <View style={styles.eventBox}>
          <Text style={styles.eventTitle}>Event Details</Text>

          <Text style={styles.eventField}>
            Event Name: {eventDraft.eventName || "—"}
          </Text>

          <Text style={styles.eventField}>
            Event Date: {eventDraft.eventDate || "—"}
          </Text>

          <Text style={styles.eventField}>
            Event Type: {eventDraft.eventType || "—"}
          </Text>

          <Text style={styles.eventField}>
            Location: {eventDraft.location || "—"}
          </Text>

          <Text style={styles.eventField}>
            Field: {eventDraft.field || "—"}
          </Text>

          <Text style={styles.eventField}>
            Notes: {eventDraft.notes || "—"}
          </Text>
        </View>
      )}

        <Text style={styles.label}>Select Match</Text>

        {dropdownOpen && !comingFromEvent && (
          <View style={styles.dropdownList}>
            {loadingFiles ? (
              <ActivityIndicator />
            ) : (
              <FlatList
                data={files}
                keyExtractor={i => i}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selected === item && { backgroundColor: "#e0f2fe" },
                    ]}
                    onPress={() => setSelected(item)}
                  >
                    <Text>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {selected && (
          <>
            <Text style={styles.trimTitle}>
              Trim by Time (HH:MM:SS)
            </Text>

            <View style={styles.trimRow}>
              <TextInput
                style={styles.trimInput}
                placeholder="Start (HH:MM:SS)"
                value={startTime}
                onChangeText={setStartTime}
              />
              <TextInput
                style={styles.trimInput}
                placeholder="End (HH:MM:SS)"
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>

            <TouchableOpacity
              style={[styles.importBtn, loading && { opacity: 0.6 }]}
              onPress={importFile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.importText}>
                  IMPORT & CALCULATE
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {importedSession && (
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={downloadTrimmed}
        >
          <Text style={styles.downloadText}>
            DOWNLOAD TRIMMED CSV
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f7fa" },
  box: { backgroundColor: "#fff", borderRadius: 12, padding: 14 },
  label: { fontWeight: "700", marginBottom: 6 },

  dropdown: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 14,
  },

  dropdownText: { fontSize: 14 },

  dropdownList: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    marginTop: 6,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  trimTitle: { marginTop: 16, fontWeight: "700" },
  trimRow: { flexDirection: "row", gap: 8, marginTop: 8 },

  trimInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },

  importBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 14,
  },

  importText: { color: "#fff", fontWeight: "700" },

  downloadBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },

  downloadText: { color: "#fff", fontWeight: "700" },
  eventBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  eventTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },

  eventField: {
    fontSize: 14,
    marginBottom: 4,
    color: "#334155",
  },
});
