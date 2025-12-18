// src/screens/Auth/ResetPassword.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import CustomButton from "../../components/CustomButton";
import { resetPassword } from "../../api/auth";

const ResetPassword = ({ navigation }: any) => {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleReset = async () => {
    if (!token || !password || !confirmPassword) {
      return Alert.alert("Error", "All fields are required");
    }

    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    try {
      await resetPassword({
        token: token.trim().toUpperCase(),
        password,
      });

      Alert.alert("Success", "Password updated successfully", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
    } catch (err: any) {
      const msg =
        typeof err?.response?.data?.message === "string"
          ? err.response.data.message
          : "Invalid or expired token";

      Alert.alert("Error", msg);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/loginbackground.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.heading}>Reset Password</Text>

          <TextInput
            placeholder="Verification Code"
            value={token}
            onChangeText={setToken}
            style={styles.input}
            placeholderTextColor="#ddd"
            autoCapitalize="characters"
          />

          <TextInput
            placeholder="New Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            placeholderTextColor="#ddd"
          />

          <TextInput
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            secureTextEntry
            placeholderTextColor="#ddd"
          />

          <CustomButton title="Reset Password" onPress={handleReset} />

          <TouchableOpacity
            onPress={() => navigation.replace("Login")}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  card: {
    width: "100%",
    maxWidth: 420, // same as Login & Register
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 26,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  heading: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    marginTop: 14,
  },

  backBtn: {
    marginTop: 16,
    alignSelf: "center",
  },

  backText: {
    color: "#fff",
    fontSize: 15,
    
  },
});

export default ResetPassword;
