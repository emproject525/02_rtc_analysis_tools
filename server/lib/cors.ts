// SDK는 보통 다른 오리진의 서비스 페이지에서 POST 한다. getHeaders로 Authorization이
// 붙으면 브라우저가 preflight OPTIONS를 먼저 보내므로, 양쪽 다 이 헤더로 응답한다.
// 쿠키를 안 쓰므로 기본 origin은 `*` 허용 (필요 시 env로 화이트리스트).
const ALLOW_ORIGIN = process.env.DASHBOARD_ALLOW_ORIGIN ?? "*";

export const corsHeaders: Record<string, string> = {
  "access-control-allow-origin": ALLOW_ORIGIN,
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
};
