import { open } from "react-native-quick-sqlite";

export const db = open({
  name: "sports.db",
  location: "default",
});
