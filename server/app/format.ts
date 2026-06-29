/** bps → 사람이 읽는 단위. */
export const fmtBitrate = (bps?: number) => {
  if (bps == null) return "—";
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} kbps`;
  return `${bps.toFixed(0)} bps`;
};

export const fmtPct = (n?: number) => (n == null ? "—" : `${n.toFixed(2)}%`);
/** 초 단위 값을 ms로. */
export const fmtMs = (sec?: number) =>
  sec == null ? "—" : `${(sec * 1000).toFixed(0)} ms`;
export const fmtNum = (n?: number) => (n == null ? "—" : String(n));

export const stateColor = (s: string) =>
  s === "connected" || s === "completed"
    ? "#1a7f37"
    : s === "failed" || s === "closed" || s === "disconnected"
      ? "#cf222e"
      : "#9a6700";
