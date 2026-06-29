"use client";

import type { TrackReport } from "@rtc/peer-analyst";
import { type MouseEvent, useState } from "react";
import { fmtBitrate, fmtMs, fmtPct } from "./format";

export interface GraphPoint {
  /** report 생성 시각 (epoch ms). */
  t: number;
  track: TrackReport;
}

const VW = 600;
const VH = 130;
const PAD = 8;

/** 호버 지점 트랙의 모든 지표를 [라벨, 값] 목록으로 (정의된 것만, 누적 포함). */
const detailRows = (t: TrackReport): Array<[string, string]> => {
  const out: Array<[string, string]> = [];
  const push = (label: string, v: number | string | boolean | undefined) => {
    if (v != null) out.push([label, String(v)]);
  };
  push("bitrate", fmtBitrate(t.bitrate));
  push("codec", t.codec);
  push("fps", t.framesPerSecond);
  if (t.frameWidth && t.frameHeight)
    push("해상도", `${t.frameWidth}×${t.frameHeight}`);
  if (t.packetLossRate != null) push("loss", fmtPct(t.packetLossRate));
  if (t.retransmissionRate != null) push("retx", fmtPct(t.retransmissionRate));
  push("fractionLost", t.fractionLost);
  if (t.roundTripTime != null) push("rtt", fmtMs(t.roundTripTime));
  if (t.jitter != null) push("jitter", fmtMs(t.jitter));
  if (t.jitterBufferDelay != null)
    push("jitterBufferDelay", fmtMs(t.jitterBufferDelay));
  // 누적 카운터.
  push("packetsSent", t.packetsSent);
  push("packetsReceived", t.packetsReceived);
  push("framesEncoded", t.framesEncoded);
  push("framesDecoded", t.framesDecoded);
  push("framesDropped", t.framesDropped);
  push("nack", t.nackCount);
  push("pli", t.pliCount);
  push("fir", t.firCount);
  push("freezeCount", t.freezeCount);
  push("fecRecv", t.fecPacketsReceived);
  // sender 설정 / 제한.
  if (t.targetBitrate != null) push("targetBitrate", fmtBitrate(t.targetBitrate));
  if (t.maxBitrate != null) push("maxBitrate", fmtBitrate(t.maxBitrate));
  push("active", t.active);
  push("qualityLimitation", t.qualityLimitationReason);
  push("audioLevel", t.audioLevel);
  if (t.ended) out.push(["ended", "true"]);
  return out;
};

/**
 * 트랙 1개의 bitrate 시계열 라인 그래프 (chrome://webrtc-internals 스타일이되
 * 누적이 아니라 순간 bitrate). 호버하면 그 시점의 모든 지표를 툴팁으로.
 */
export function TrackGraph({
  title,
  points,
}: {
  title: string;
  points: GraphPoint[];
}) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(
    null,
  );

  const n = points.length;
  const max = Math.max(
    1,
    ...points.map((p) => p.track.bitrate).filter((v): v is number => v != null),
  );
  const last = points[n - 1];
  const ended = last?.track.ended;

  const xAt = (i: number) =>
    n <= 1 ? PAD : PAD + (i / (n - 1)) * (VW - 2 * PAD);
  const yAt = (v: number) => VH - PAD - (v / max) * (VH - 2 * PAD);

  // 정의된 bitrate 구간만 선으로(undefined는 끊김 = 새 M).
  let d = "";
  let pen = false;
  points.forEach((p, i) => {
    const v = p.track.bitrate;
    if (v == null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)} `;
    pen = true;
  });

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const i = Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1))));
    setHover({ i, x: e.clientX, y: e.clientY });
  };

  const hp = hover ? points[hover.i] : null;

  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 6,
        padding: 8,
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginBottom: 4,
        }}
      >
        <strong style={{ color: ended ? "#8c959f" : "#24292f" }}>
          {title}
          {ended ? " (ended)" : ""}
        </strong>
        <span style={{ color: "#57606a" }}>
          now {fmtBitrate(last?.track.bitrate)} · max {fmtBitrate(max)}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 130, display: "block", background: "#f6f8fa" }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <path
          d={d}
          fill="none"
          stroke={ended ? "#8c959f" : "#0969da"}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        {hover && (
          <line
            x1={xAt(hover.i)}
            y1={0}
            x2={xAt(hover.i)}
            y2={VH}
            stroke="#cf222e"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {hp?.track.bitrate != null && (
          <circle cx={xAt(hover!.i)} cy={yAt(hp.track.bitrate)} r={3} fill="#cf222e" />
        )}
      </svg>
      {hover && hp && (
        <div
          style={{
            position: "fixed",
            left: hover.x + 14,
            top: hover.y + 14,
            zIndex: 10,
            background: "#fff",
            border: "1px solid #d0d7de",
            borderRadius: 6,
            boxShadow: "0 2px 8px rgba(0,0,0,.15)",
            padding: 8,
            fontSize: 11,
            pointerEvents: "none",
          }}
        >
          <div style={{ color: "#57606a", marginBottom: 4 }}>
            +{((hp.t - points[0].t) / 1000).toFixed(0)}s
          </div>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              {detailRows(hp.track).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ color: "#57606a", paddingRight: 10, whiteSpace: "nowrap" }}>
                    {k}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
