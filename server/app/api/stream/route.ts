import { hub } from "@/lib/hub";

export const runtime = "nodejs";
// SSE는 정적 최적화 대상이 아니다 — 매 연결 살아있는 스트림.
export const dynamic = "force-dynamic";

/** SSE 한 프레임: `event: <kind>\n data: <json>\n\n`. */
const frame = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

export const GET = (req: Request) => {
  const enc = new TextEncoder();
  let unsub: () => void = () => {};
  let ping: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    unsub();
    if (ping) clearInterval(ping);
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (s: string) => {
        try {
          controller.enqueue(enc.encode(s));
        } catch {
          // 컨트롤러가 이미 닫힘 → 정리.
          cleanup();
        }
      };
      // 연결 직후 현재 상태 1회 (없으면 다음 Report까지 빈 화면).
      send(frame("snapshot", hub.snapshot()));
      unsub = hub.subscribe((e) => {
        if (e.kind === "report") send(frame("report", e.report));
        else if (e.kind === "ended") send(frame("ended", { peerId: e.peerId }));
        else send(frame("gone", { peerId: e.peerId }));
      });
      // keep-alive 주석 핑 — 프록시 idle 타임아웃 방지.
      ping = setInterval(() => send(": ping\n\n"), 15_000);
    },
    cancel: cleanup,
  });

  // 클라이언트가 끊으면 구독/타이머 정리.
  req.signal.addEventListener("abort", cleanup);

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
};
