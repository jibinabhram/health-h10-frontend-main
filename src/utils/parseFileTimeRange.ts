export function parseFileTimeRange(filename?: string) {
  if (!filename) return null;

  // remove extension if present
  const clean = filename.replace(".csv", "");

  // Supported format:
  // 2025-11-18T00-18-50_2025-11-18T00-19-50
  const parts = clean.split("_");
  if (parts.length !== 2) return null;

  const parsePart = (p: string) => {
    // p = 2025-11-18T00-18-50
    const [date, time] = p.split("T");
    if (!date || !time) return NaN;

    // 00-18-50 → 00:18:50
    const iso = `${date}T${time.replace(/-/g, ":")}`;
    return new Date(iso).getTime();
  };

  const start = parsePart(parts[0]);
  const end = parsePart(parts[1]);

  if (isNaN(start) || isNaN(end) || end <= start) return null;

  return {
    fileStartMs: start,
    fileEndMs: end,
    durationMs: end - start,
  };
}
