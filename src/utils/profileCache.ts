import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_CACHE_KEY = 'CACHED_PROFILE';

export async function saveProfileToCache(profile: any) {
  try {
    await AsyncStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify(profile),
    );
  } catch (e) {
    console.log('❌ Failed to save profile cache', e);
  }
}

export async function loadProfileFromCache() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.log('❌ Failed to load profile cache', e);
    return null;
  }
}

export async function clearProfileCache() {
  await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
}
