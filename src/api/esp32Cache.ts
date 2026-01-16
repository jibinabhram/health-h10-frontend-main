let cachedFiles: string[] | null = null;
let inFlight: Promise<string[]> | null = null;

import { fetchCsvFiles as rawFetch } from "./esp32";

export async function getEsp32Files(): Promise<string[]> {
  if (cachedFiles) return cachedFiles;

  if (!inFlight) {
    inFlight = rawFetch().then(files => {
      cachedFiles = files;
      inFlight = null;
      return files;
    }).catch(err => {
      inFlight = null;
      throw err;
    });
  }

  return inFlight;
}

export function clearEsp32Cache() {
  cachedFiles = null;
}
