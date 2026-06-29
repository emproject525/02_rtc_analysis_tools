import { afterEach, describe, expect, it, vi } from "vitest";
import type { Report } from "../analyzer/analyzer.types";
import type { ReportEnvelope } from "./reporter.types";
import { Reporter } from "./reporter.module";

const report = (peerId = "peer-1", timestamp = 1): Report => ({
  peerId,
  startedAt: 0,
  timestamp,
  connection: {
    connectionState: "connected",
    iceConnectionState: "connected",
    iceGatheringState: "complete",
    signalingState: "stable",
  },
  transport: {},
  recv: [],
  send: [],
});

/** flush는 비동기 — push 후 마이크로태스크가 풀리도록 큐를 비운다. */
const flushMicrotasks = () => new Promise((r) => setTimeout(r, 0));

const okFetch = () =>
  vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Reporter", () => {
  it("serverUrl 없으면 콜백/콘솔만, fetch 안 함", async () => {
    const onReport = vi.fn();
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const reporter = new Reporter({ onReport });
    reporter.send(report());
    await flushMicrotasks();

    expect(onReport).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serverUrl 있으면 봉투(envelope)로 POST 한다", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const reporter = new Reporter({ serverUrl: "https://collect.test/r" });
    reporter.send(report("peer-1", 42));
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://collect.test/r");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body) as ReportEnvelope;
    expect(body.sdkVersion).toBeTypeOf("string");
    expect(body.reports).toHaveLength(1);
    expect(body.reports[0].timestamp).toBe(42);
  });

  it("getHeaders 결과를 fetch 헤더에 merge 한다(토큰 등)", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const reporter = new Reporter({
      serverUrl: "https://collect.test/r",
      getHeaders: async () => ({ authorization: "Bearer tok" }),
    });
    reporter.send(report());
    await flushMicrotasks();

    const init = fetchMock.mock.calls[0][1];
    expect(init.headers["content-type"]).toBe("application/json");
    expect(init.headers.authorization).toBe("Bearer tok");
  });

  it("전송 실패 시 큐를 유지해 다음 flush에서 재시도한다", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("down")) // 1차 실패
      .mockResolvedValue({ ok: true, status: 200 } as Response); // 2차 성공
    vi.stubGlobal("fetch", fetchMock);

    const reporter = new Reporter({ serverUrl: "https://collect.test/r" });
    reporter.send(report("peer-1", 1));
    await flushMicrotasks();

    // 재시도 — 실패분이 다음 배치에 함께 실린다.
    reporter.send(report("peer-1", 2));
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const body = JSON.parse(fetchMock.mock.calls[1][1].body) as ReportEnvelope;
    expect(body.reports.map((r) => r.timestamp)).toEqual([1, 2]);
  });

  it("pagehide용 flush(true)는 keepalive로 보낸다", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const reporter = new Reporter({ serverUrl: "https://collect.test/r" });
    // 1차 send는 keepalive:false로 비워지므로, 실패 상태에서 남은 큐를 만든다.
    const failing = vi.fn().mockRejectedValue(new Error("down"));
    vi.stubGlobal("fetch", failing);
    reporter.send(report());
    await flushMicrotasks();

    vi.stubGlobal("fetch", fetchMock);
    await reporter.flush(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].keepalive).toBe(true);
  });
});
