import type { Report } from "../analyzer";

/** observe(peer, options)로 넘기는 감시 옵션. */
export interface ObserveOptions {
  /** getStats 폴링 주기 (ms). 기본 2000. */
  interval?: number;
  /** 수집 서버 엔드포인트. 있으면 Report를 배치 POST. */
  serverUrl?: string;
  /**
   * 서버 전송 fetch에 얹을 헤더를 만드는 함수 (Authorization 등 인증 헤더 주입용).
   * 토큰 갱신에 대응하려고 전송마다 평가하며, async도 허용한다.
   */
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  /** Report 콜백 — 서버 없이도 결과를 받는다. */
  onReport?: (report: Report) => void;
  /** 콘솔 출력 여부. 기본 false. */
  console?: boolean;
  /** 사람이 읽는 라벨/식별자. 없으면 crypto.randomUUID()로 자동 발급. */
  peerId?: string;
}
