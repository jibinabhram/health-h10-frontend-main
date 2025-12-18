import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./constants";

export const logout = async (navigation: any) => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.TOKEN,
    STORAGE_KEYS.ROLE,
    STORAGE_KEYS.USER_NAME,
  ]);

  navigation.reset({
    index: 0,
    routes: [{ name: "Login" }],
  });
};
