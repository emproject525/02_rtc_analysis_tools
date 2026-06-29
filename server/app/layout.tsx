import type { ReactNode } from "react";

export const metadata = {
  title: "PeerAnalyst Dashboard",
  description: "RTCPeerConnection 품질 지표 실시간 대시보드",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
