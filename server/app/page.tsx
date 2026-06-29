"use client";

import type { Report, TrackReport } from "@rtc/peer-analyst";
import { type ReactNode, useEffect, useMemo, useState } from "react";

/** bps → 사람이 읽는 단위. */
const fmtBitrate = (bps?: number) => {
  if (bps == null) return "—";
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} kbps`;
  return `${bps.toFixed(0)} bps`;
};
const fmtPct = (n?: number) => (n == null ? "—" : `${n.toFixed(2)}%`);
const fmtMs = (sec?: number) => (sec == null ? "—" : `${(sec * 1000).toFixed(0)} ms`);
const fmtNum = (n?: number) => (n == null ? "—" : String(n));

const stateColor = (s: string) =>
  s === "connected" || s === "completed"
    ? "#1a7f37"
    : s === "failed" || s === "closed" || s === "disconnected"
      ? "#cf222e"
      : "#9a6700";

export default function Dashboard() {
  const [peers, setPeers] = useState<Record<string, Report>>({});
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    const onSnapshot = (e: MessageEvent) => {
      const list = JSON.parse(e.data) as Report[];
      setPeers(Object.fromEntries(list.map((r) => [r.peerId, r])));
    };
    const onReport = (e: MessageEvent) => {
      const r = JSON.parse(e.data) as Report;
      setPeers((prev) => ({ ...prev, [r.peerId]: r }));
    };
    const onGone = (e: MessageEvent) => {
      const { peerId } = JSON.parse(e.data) as { peerId: string };
      setPeers((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    };
    es.addEventListener("snapshot", onSnapshot);
    es.addEventListener("report", onReport);
    es.addEventListener("gone", onGone);
    return () => es.close();
  }, []);

  const list = useMemo(() => Object.values(peers), [peers]);
  const current = selected ? peers[selected] : (list[0] ?? null);

  return (
    <main style={{ display: "flex", height: "100vh" }}>
      <aside style={{ width: 260, borderRight: "1px solid #d0d7de", overflow: "auto" }}>
        <h2 style={{ padding: "12px 16px", margin: 0, fontSize: 16 }}>
          연결 ({list.length})
        </h2>
        {list.length === 0 && (
          <p style={{ padding: "0 16px", color: "#57606a" }}>
            수신 대기 중… SDK가 <code>/api/collect</code>로 POST 하면 표시됩니다.
          </p>
        )}
        {list.map((r) => (
          <button
            key={r.peerId}
            onClick={() => setSelected(r.peerId)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 16px",
              border: "none",
              borderBottom: "1px solid #eaeef2",
              background: current?.peerId === r.peerId ? "#ddf4ff" : "#fff",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.peerId}</div>
            <div style={{ fontSize: 12, color: stateColor(r.connection.connectionState) }}>
              ● {r.connection.connectionState}
            </div>
            <div style={{ fontSize: 11, color: "#57606a" }}>
              send {r.send.length} · recv {r.recv.length}
            </div>
          </button>
        ))}
      </aside>

      <section style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {!current ? (
          <p style={{ color: "#57606a" }}>왼쪽에서 연결을 선택하세요.</p>
        ) : (
          <PeerDetail report={current} />
        )}
      </section>
    </main>
  );
}

function PeerDetail({ report }: { report: Report }) {
  const t = report.transport;
  const durationSec = Math.max(0, (report.timestamp - report.startedAt) / 1000);
  return (
    <>
      <h1 style={{ fontSize: 18, marginTop: 0 }}>{report.peerId}</h1>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <Badge label="connection" value={report.connection.connectionState} />
        <Badge label="ice" value={report.connection.iceConnectionState} />
        <Badge label="signaling" value={report.connection.signalingState} />
        <Badge label="지속" value={`${durationSec.toFixed(0)}s`} />
      </div>

      <h3 style={{ fontSize: 14 }}>경로 (transport)</h3>
      <p style={{ fontSize: 13, color: "#24292f" }}>
        {t.localCandidateType ?? "—"} → {t.remoteCandidateType ?? "—"} ·{" "}
        {t.protocol ?? "—"}
        {t.relayProtocol ? ` (relay ${t.relayProtocol})` : ""} · RTT{" "}
        {fmtMs(t.currentRoundTripTime)} · dtls {t.dtlsState ?? "—"}
      </p>

      <TrackTable title="send (outbound)" tracks={report.send} />
      <TrackTable title="recv (inbound)" tracks={report.recv} />
    </>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ fontSize: 12 }}>
      <span style={{ color: "#57606a" }}>{label}:</span>{" "}
      <strong style={{ color: stateColor(value) }}>{value}</strong>
    </span>
  );
}

const TH = ({ children }: { children: ReactNode }) => (
  <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "2px solid #d0d7de", whiteSpace: "nowrap" }}>
    {children}
  </th>
);
const TD = ({ children }: { children: ReactNode }) => (
  <td style={{ padding: "4px 8px", borderBottom: "1px solid #eaeef2", whiteSpace: "nowrap" }}>
    {children}
  </td>
);

function TrackTable({ title, tracks }: { title: string; tracks: TrackReport[] }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: 14 }}>
        {title} ({tracks.length})
      </h3>
      {tracks.length === 0 ? (
        <p style={{ fontSize: 13, color: "#57606a" }}>없음</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
            <thead>
              <tr>
                <TH>kind</TH>
                <TH>ssrc</TH>
                <TH>rid</TH>
                <TH>codec</TH>
                <TH>bitrate</TH>
                <TH>fps</TH>
                <TH>loss</TH>
                <TH>retx</TH>
                <TH>rtt</TH>
                <TH>jitter</TH>
                <TH>해상도</TH>
              </tr>
            </thead>
            <tbody>
              {tracks.map((tr) => (
                <tr
                  key={`${tr.ssrc}-${tr.rid ?? ""}`}
                  style={{ color: tr.ended ? "#8c959f" : "#24292f" }}
                >
                  <TD>
                    {tr.kind}
                    {tr.ended ? " (ended)" : ""}
                  </TD>
                  <TD>{fmtNum(tr.ssrc)}</TD>
                  <TD>{tr.rid ?? "—"}</TD>
                  <TD>{tr.codec ?? "—"}</TD>
                  <TD>{fmtBitrate(tr.bitrate)}</TD>
                  <TD>{fmtNum(tr.framesPerSecond)}</TD>
                  <TD>{fmtPct(tr.packetLossRate)}</TD>
                  <TD>{fmtPct(tr.retransmissionRate)}</TD>
                  <TD>{fmtMs(tr.roundTripTime)}</TD>
                  <TD>{fmtMs(tr.jitter)}</TD>
                  <TD>
                    {tr.frameWidth && tr.frameHeight
                      ? `${tr.frameWidth}×${tr.frameHeight}`
                      : "—"}
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
