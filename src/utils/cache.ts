import AsyncStorage from '@react-native-async-storage/async-storage';

export const cacheSet = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.log('Cache set error', e);
  }
};

export const cacheGet = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return null;
  }
};

export const cacheClear = async () => {
  await AsyncStorage.clear();
};
