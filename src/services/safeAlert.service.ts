// src/utils/safeAlert.ts
import { Alert, AppState } from "react-native";

export function safeAlert(title: string, message?: string) {
  if (AppState.currentState !== "active") {
    console.log("⚠️ Alert skipped (app not active)");
    return;
  }

  setTimeout(() => {
    try {
      Alert.alert(title, message);
    } catch {
      console.log("⚠️ Alert failed safely");
    }
  }, 0);
}



