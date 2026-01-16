const ESP32_IP = "192.168.4.1";

export const fetchCsvFiles = async (): Promise<string[]> => {
  const res = await fetch(`http://${ESP32_IP}/files`);
  if (!res.ok) throw new Error("ESP32 not reachable");
  return JSON.parse(await res.text());
};

export const downloadCsv = async (filename: string): Promise<string> => {
  const res = await fetch(
    `http://${ESP32_IP}/download?file=${encodeURIComponent(filename)}`
  );
  const text = await res.text();

  if (!res.ok || !text) {
    throw new Error("CSV download failed");
  }

  return text;
};
