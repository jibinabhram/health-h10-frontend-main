import NetInfo from '@react-native-community/netinfo';
import { getMyClubPlayers } from '../api/players';
import {
  upsertPlayersToSQLite,
  getPlayersFromSQLite,
} from './playerCache.service';

export const loadPlayersUnified = async () => {
  const net = await NetInfo.fetch();

  // 🟢 ONLINE
  if (net.isConnected) {
    try {
      const players = await getMyClubPlayers();
      upsertPlayersToSQLite(players);
      return players;
    } catch (e) {
      console.log('⚠️ Online but API failed, using SQLite cache');

      const cached = getPlayersFromSQLite(); // 👈 HERE
      console.log('📦 SQLite players count:', cached.length); // 👈 HERE

      return cached;
    }
  }

  // 🔴 OFFLINE
  console.log('📴 Offline → loading players from SQLite');

  const cached = getPlayersFromSQLite(); // 👈 HERE
  console.log('📦 SQLite players count:', cached.length); // 👈 HERE

  return cached;
};
