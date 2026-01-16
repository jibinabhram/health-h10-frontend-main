import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import DeviceInfo from "react-native-device-info";
import { RootStackParamList } from "../navigation/AppNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();

  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />

      <View style={styles.container}>
        {/* LOGO */}
        <View style={styles.logoWrapper}>
          <Image
            source={require("../../assets/cradlesports.png")}
            style={styles.logo}
          />
        </View>

        {/* BUTTONS */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("ImportFromESP32")}
        >
          <Text style={styles.primaryText}>UPLOAD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Performance")}
        >
          <Text style={styles.secondaryText}>VIEW PERFORMANCE</Text>
        </TouchableOpacity>
      </View>

      {/* FOOTER CREDIT */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Developed by{" "}
          <Text style={styles.footerBrand}>Abhram Technologies</Text>
        </Text>
        <Text style={styles.versionText}>
          Version {appVersion}
        </Text>
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  logoWrapper: {
    position: "absolute",
    top: 160,
    width: 320,
    alignItems: "center",
  },

logo: {
  width: "100%",
  height: 120,
  resizeMode: "contain",
  marginLeft: 35,     // ⭐ moves logo to the RIGHT
},


  primaryButton: {
    width: 320,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 14,
  },

  primaryText: {
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },

  secondaryButton: {
    width: 320,
    backgroundColor: "#e0e7ff",
    paddingVertical: 12,
    borderRadius: 12,
  },

  secondaryText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#1e3a8a",
    fontSize: 14,
  },

  footer: {
    position: "absolute",
    bottom: 44, // move footer up/down here
    width: "100%",
    alignItems: "center",
  },

  footerText: {
    fontSize: 12,
    color: "#64748b",
  },

  footerBrand: {
    fontWeight: "600",
    color: "#0f172a",
  },

  versionText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
});
