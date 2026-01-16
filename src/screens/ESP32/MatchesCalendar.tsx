import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import {
  useNavigation,
  NavigationProp,
} from "@react-navigation/native";

import { fetchCsvFiles } from "../../api/esp32";
import { extractDateFromFilename } from "../../utils/fileDate";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { useFocusEffect } from '@react-navigation/native';

export default function MatchesCalendar() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList>>();

  const [markedDates, setMarkedDates] = useState<
    Record<string, { marked: boolean; dotColor: string }>
  >({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      loadDates();
    }, [])
  );
  const loadDates = async (attempt = 1) => {
    console.log(`📅 Calendar load attempt ${attempt}`);

    try {
      const files = await fetchCsvFiles();
    if (!files.length) {
      return; // ⛔ do NOT reset calendar
    }
      const marks: Record<string, any> = {};

      files.forEach((file) => {
        const date = extractDateFromFilename(file);
        console.log("📄", file, "→", date);

        if (date) {
          marks[date] = { marked: true, dotColor: "#16a34a" };
        }
      });

      setMarkedDates(marks);
      setLoading(false); // ✅ ONLY when success
    } catch {
      if (attempt < 10) {
        setTimeout(() => loadDates(attempt + 1), 1000);
      } else {
        console.log("❌ ESP32 unreachable after retries");
        setLoading(false);
      }
    }
  };
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Match Date</Text>

      <Calendar
        markedDates={markedDates}
        onDayPress={(day: DateData) => {
          navigation.navigate("FilesByDate", {
            date: day.dateString,
          });
        }}
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f7fa",
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
