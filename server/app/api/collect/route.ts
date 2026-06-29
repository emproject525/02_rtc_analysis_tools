import type { Report, ReportEnvelope } from "@rtc/peer-analyst";
import { corsHeaders } from "@/lib/cors";
import { hub } from "@/lib/hub";

// hub는 메모리 싱글톤이라 Node 런타임 고정 (Edge는 프로세스 공유 안 됨).
export const runtime = "nodejs";

/** preflight — 토큰 헤더가 붙으면 브라우저가 먼저 던진다. */
export const OPTIONS = () =>
  new Response(null, { status: 204, headers: corsHeaders });

export const POST = async (req: Request) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json", { status: 400, headers: corsHeaders });
  }
  if (!isEnvelope(body)) {
    return new Response("invalid envelope", {
      status: 400,
      headers: corsHeaders,
    });
  }
  for (const report of body.reports) {
    // peerId 없는 레코드는 키잉 불가라 건너뛴다.
    if (typeof report?.peerId === "string") hub.push(report);
  }
  // reporter는 응답 본문을 안 쓴다.
  return new Response(null, { status: 204, headers: corsHeaders });
};

const isEnvelope = (v: unknown): v is ReportEnvelope & { reports: Report[] } =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as { reports?: unknown }).reports);
