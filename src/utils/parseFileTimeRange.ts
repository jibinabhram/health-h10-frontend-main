function parseFileTimeRange(filename?: string) {
  if (!filename) {
    throw new Error("TrimSessionScreen: file is undefined");
  }

  const clean = filename.replace(".csv", "");

  if (!clean.includes("_")) {
    throw new Error("Filename does not contain start_end timestamps");
  }

  const [startStr, endStr] = clean.split("_");

  const start = new Date(startStr.replace(" ", "T")).getTime();
  const end = new Date(endStr.replace(" ", "T")).getTime();

  if (isNaN(start) || isNaN(end) || end <= start) {
    throw new Error("Invalid filename time range");
  }

  return {
    fileStartMs: start,
    fileEndMs: end,
    durationMs: end - start,
  };
}
