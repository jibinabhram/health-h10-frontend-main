import React, { useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  ScrollView,
  Modal,
} from "react-native";
import { Calendar } from "react-native-calendars";

import { getEsp32Files } from "../../api/esp32Cache";
import { extractDateFromFilename } from "../../utils/fileDate";

const PLACEHOLDER_COLOR = "#94a3b8";

export default function CreateEventScreen({
  goBack,
  goNext,
}: {
  goBack: () => void;
  goNext: (payload: any) => void;
}) {

  /* ================= EVENT DETAILS ================= */

  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<"training" | "match">("match");
  const [location, setLocation] = useState("");
  const [field, setField] = useState("");
  const [notes, setNotes] = useState("");

  /* ================= FILE STATE ================= */

  const [allFiles, setAllFiles] = useState<string[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filesForDate, setFilesForDate] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [esp32Connected, setEsp32Connected] = useState(false);
  const [checkingEsp32, setCheckingEsp32] = useState(true);
  const [importPayload, setImportPayload] = useState<any>(null);
  /* ================= LOAD FILES ON SCREEN OPEN ================= */

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;

      const loadFromEsp32 = async () => {
        setCheckingEsp32(true);
        try {
          const files = await getEsp32Files();
          if (cancelled) return;

          setEsp32Connected(true);
          setAllFiles(files);

          const marks: Record<string, any> = {};
          files.forEach((file) => {
            const date = extractDateFromFilename(file);
            if (date) {
              marks[date] = { marked: true, dotColor: "#16a34a" };
            }
          });

          setMarkedDates(marks);
        } catch {
          setEsp32Connected(false);
        } finally {
          setCheckingEsp32(false);
        }
      };

      loadFromEsp32();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  /* ================= FILTER FILES BY DATE ================= */

  useEffect(() => {
    if (!selectedDate) return;

    const filtered = allFiles.filter(
      (f) => extractDateFromFilename(f) === selectedDate
    );

    setFilesForDate(filtered);
    setSelectedFile(null);
  }, [selectedDate, allFiles]);

  /* ================= NEXT ================= */

  const onNext = () => {
    if (!eventName || !selectedDate || !selectedFile) {
      alert("Event name, date and file are required");
      return;
    }

    goNext({
      file: selectedFile,
      eventDraft: {
        eventName,
        eventType,
        eventDate: selectedDate,
        location,
        field,
        notes,
      },
    });
  };

  /* ================= UI ================= */

  return (
    <>
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
      >
      <TouchableOpacity onPress={goBack} style={{ marginBottom: 12 }}>
        <Text style={{ color: '#0284c7', fontWeight: '700' }}>← Back</Text>
      </TouchableOpacity>

        <Text style={styles.title}>Create Event</Text>

        {!checkingEsp32 && !esp32Connected && (
          <Text style={styles.warning}>
            ⚠ Connect phone to ESP32 Wi-Fi to load files
          </Text>
        )}

        <TextInput
          placeholder="Event Name"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
          value={eventName}
          onChangeText={setEventName}
        />

        {/* EVENT TYPE */}
        <Text style={styles.subTitle}>Event Type</Text>
        <View style={styles.radioGroup}>
          {["match", "training"].map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.radioItem}
              onPress={() => setEventType(type as any)}
            >
              <View style={styles.radioOuter}>
                {eventType === type && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>
                {type === "match" ? "Match" : "Training"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          placeholder="Field"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
          value={field}
          onChangeText={setField}
        />

        <TextInput
          placeholder="Location"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
          value={location}
          onChangeText={setLocation}
        />

        <TextInput
          placeholder="Notes"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={[styles.input, { height: 80 }]}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        {/* DATE PICKER */}
        <Text style={styles.subTitle}>Select Date</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setDatePickerOpen(true)}
        >
          <Text
            style={[
              styles.dropdownText,
              !selectedDate && { color: PLACEHOLDER_COLOR },
            ]}
          >
            {selectedDate || "Select date"}
          </Text>
        </TouchableOpacity>

        {/* FILE LIST */}
        {selectedDate && (
          <>
            <Text style={styles.subTitle}>Files on {selectedDate}</Text>

            {filesForDate.length === 0 ? (
              <Text style={styles.empty}>No files for this date</Text>
            ) : (
              <View style={styles.fileBox}>
                <FlatList
                  data={filesForDate}
                  keyExtractor={(i) => i}
                  nestedScrollEnabled={true}   // ✅ FIX
                  scrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  style={{ maxHeight: 220 }}  // ✅ FIX
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.fileOption,
                        selectedFile === item && styles.fileOptionSelected,
                      ]}
                      onPress={() => setSelectedFile(item)}
                    >
                      <Text
                        style={[
                          styles.fileText,
                          selectedFile === item && styles.fileTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </>
        )}

        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextText}>NEXT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* DATE PICKER MODAL */}
      <Modal visible={datePickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Calendar
              markingType="dot"
              markedDates={{
                ...markedDates,
                ...(selectedDate && {
                  [selectedDate]: {
                    ...(markedDates[selectedDate] ?? {}),
                    selected: true,
                    selectedColor: "#16a34a",
                  },
                }),
              }}
              onDayPress={(d) => {
                setSelectedDate(d.dateString);
                setDatePickerOpen(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f7fa" },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  subTitle: { marginTop: 12, fontWeight: "700" },

  warning: {
    backgroundColor: "#fef3c7",
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    color: "#92400e",
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  radioGroup: { flexDirection: "row", gap: 24, marginBottom: 12 },
  radioItem: { flexDirection: "row", alignItems: "center" },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#16a34a",
  },
  radioLabel: { fontSize: 14, fontWeight: "500" },

  dropdown: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dropdownText: { fontSize: 14 },

  fileBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 6,
    overflow: "hidden",
  },

  fileOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  fileOptionSelected: { backgroundColor: "#e0f2fe" },
  fileText: { fontSize: 14 },
  fileTextSelected: { fontWeight: "700", color: "#0284c7" },

  empty: { marginTop: 6, color: "#64748b" },

  nextBtn: {
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  nextText: { color: "#fff", fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
  },
});
