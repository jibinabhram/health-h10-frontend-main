// src/screens/Auth/AuthLoadingScreen.tsx
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api/axios";
import { STORAGE_KEYS } from "../../utils/constants";


const AuthLoadingScreen = ({ navigation }: any) => {
  useEffect(() => {
    const init = async () => {
      try {
        // 1️⃣ RESTORE SESSION
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const role = await AsyncStorage.getItem(STORAGE_KEYS.ROLE);

        if (token && role) {
          // ✅ Already logged in → go home
          navigation.reset({
            index: 0,
            routes: [
              {
                name:
                  role === "SUPER_ADMIN"
                    ? "SuperAdminHome"
                    : role === "CLUB_ADMIN"
                    ? "ClubAdminHome"
                    : "CoachHome",
              },
            ],
          });
          return;
        }
        // 2️⃣ NO SESSION → CHECK DB
        const res = await api.get("/auth/has-super-admin");
        const exists = res.data?.data?.exists;

        if (exists) {
          navigation.replace("Login");
        } else {
          navigation.replace("Register");
        }
      } catch (err) {
        console.log("Startup error", err);
        navigation.replace("Login");
      }
    };

    init();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default AuthLoadingScreen;
