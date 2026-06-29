"use client";

import type { Report } from "@rtc/peer-analyst";
import { useEffect, useState } from "react";
import { fmtMs, stateColor } from "./format";
import { type GraphPoint, TrackGraph } from "./track-graph";
import type { SnapshotEntry } from "@/lib/hub";

/** 클라이언트 히스토리 상한 (그래프 길이). 서버 series와 동일. */
const HISTORY_MAX = 300;

export default function Dashboard() {
  const [histories, setHistories] = useState<Record<string, Report[]>>({});
  const [ended, setEnded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);

    const on = <T,>(type: string, fn: (data: T) => void) =>
      es.addEventListener(type, (e) => {
        try {
          fn(JSON.parse((e as MessageEvent).data) as T);
        } catch {
          // 깨진 이벤트 1건 무시.
        }
      });

    on<SnapshotEntry[]>("snapshot", (list) => {
      setHistories(Object.fromEntries(list.map((e) => [e.report.peerId, [e.report]])));
      setEnded(Object.fromEntries(list.map((e) => [e.report.peerId, e.ended])));
    });
    on<Report>("report", (r) => {
      setHistories((prev) => {
        const h = prev[r.peerId] ? [...prev[r.peerId], r] : [r];
        if (h.length > HISTORY_MAX) h.shift();
        return { ...prev, [r.peerId]: h };
      });
      setEnded((prev) => ({ ...prev, [r.peerId]: false })); // 재수신 = 부활
    });
    on<{ peerId: string }>("ended", ({ peerId }) => {
      setEnded((prev) => ({ ...prev, [peerId]: true })); // 유지하되 ended 표시
    });
    on<{ peerId: string }>("gone", ({ peerId }) => {
      // 용량 초과로 실제 제거된 경우만 목록에서 뺀다.
      setHistories((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
      setEnded((prev) => {
        const next = { ...prev };
        delete next[peerId];
        return next;
      });
    });

    return () => es.close();
  }, []);

  const ids = Object.keys(histories);
  const currentId = selected && histories[selected] ? selected : (ids[0] ?? null);
  const history = currentId ? histories[currentId] : [];
  const latest = history[history.length - 1] ?? null;

  return (
    <main style={{ display: "flex", height: "100vh" }}>
      <aside style={{ width: 260, borderRight: "1px solid #d0d7de", overflow: "auto" }}>
        <h2 style={{ padding: "12px 16px 4px", margin: 0, fontSize: 16 }}>
          연결 ({ids.length})
        </h2>
        <div style={{ padding: "0 16px 8px", fontSize: 11, color: live ? "#1a7f37" : "#cf222e" }}>
          ● 스트림 {live ? "live" : "끊김"}
        </div>
        {ids.length === 0 && (
          <p style={{ padding: "0 16px", color: "#57606a", fontSize: 13 }}>
            수신 대기 중… SDK가 <code>/api/collect</code>로 POST 하면 표시됩니다.
          </p>
        )}
        {ids.map((id) => {
          const r = histories[id][histories[id].length - 1];
          const isEnded = ended[id];
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                border: "none",
                borderBottom: "1px solid #eaeef2",
                background: currentId === id ? "#ddf4ff" : "#fff",
                cursor: "pointer",
                opacity: isEnded ? 0.55 : 1,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {id}
                {isEnded ? " (ended)" : ""}
              </div>
              <div style={{ fontSize: 12, color: stateColor(r.connection.connectionState) }}>
                ● {r.connection.connectionState}
              </div>
              <div style={{ fontSize: 11, color: "#57606a" }}>
                send {r.send.length} · recv {r.recv.length}
              </div>
            </button>
          );
        })}
      </aside>

      <section style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {!latest || !currentId ? (
          <p style={{ color: "#57606a" }}>왼쪽에서 연결을 선택하세요.</p>
        ) : (
          <PeerDetail report={latest} history={history} ended={!!ended[currentId]} />
        )}
      </section>
    </main>
  );
}

/** 한 report의 트랙을 ssrc로 히스토리에서 뽑아 시계열로. */
const seriesFor = (
  history: Report[],
  dir: "send" | "recv",
  ssrc: number | undefined,
): GraphPoint[] =>
  history
    .map((r) => {
      const track = (dir === "send" ? r.send : r.recv).find((t) => t.ssrc === ssrc);
      return track ? { t: r.timestamp, track } : null;
    })
    .filter((p): p is GraphPoint => p !== null);

function PeerDetail({
  report,
  history,
  ended,
}: {
  report: Report;
  history: Report[];
  ended: boolean;
}) {
  const t = report.transport;
  const durationSec = Math.max(0, (report.timestamp - report.startedAt) / 1000);
  const trackKey = (dir: string, tr: { ssrc?: number; rid?: string }) =>
    `${dir}-${tr.ssrc}-${tr.rid ?? ""}`;
  const trackTitle = (dir: string, tr: Report["send"][number]) =>
    `${dir} · ${tr.kind} · ssrc ${tr.ssrc}${tr.rid ? ` · ${tr.rid}` : ""}`;

  return (
    <>
      <h1 style={{ fontSize: 18, marginTop: 0, opacity: ended ? 0.6 : 1 }}>
        {report.peerId}
        {ended ? " (ended)" : ""}
      </h1>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
        <Badge label="connection" value={report.connection.connectionState} />
        <Badge label="ice" value={report.connection.iceConnectionState} />
        <Badge label="signaling" value={report.connection.signalingState} />
        <Badge label="지속" value={`${durationSec.toFixed(0)}s`} />
      </div>

      <h3 style={{ fontSize: 14 }}>경로 (transport)</h3>
      <p style={{ fontSize: 13, color: "#24292f", margin: "4px 0 0" }}>
        {t.localCandidateType ?? "—"} → {t.remoteCandidateType ?? "—"} ·{" "}
        {t.protocol ?? "—"}
        {t.relayProtocol ? ` (relay ${t.relayProtocol})` : ""} · RTT{" "}
        {fmtMs(t.currentRoundTripTime)} · dtls {t.dtlsState ?? "—"} ·{" "}
        {t.candidatePairState ?? "—"}
      </p>

      {[...report.send.map((tr) => ["send", tr] as const),
        ...report.recv.map((tr) => ["recv", tr] as const)].map(([dir, tr]) => (
        <TrackGraph
          key={trackKey(dir, tr)}
          title={trackTitle(dir, tr)}
          points={seriesFor(history, dir, tr.ssrc)}
        />
      ))}
      {report.send.length === 0 && report.recv.length === 0 && (
        <p style={{ fontSize: 13, color: "#57606a" }}>트랙 없음</p>
      )}
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
