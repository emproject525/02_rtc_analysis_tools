import type { Report } from "../analyzer";

/** observe(peer, options)로 넘기는 감시 옵션. */
export interface ObserveOptions {
  /** getStats 폴링 주기 (ms). 기본 2000. */
  interval?: number;
  /** 수집 서버 엔드포인트. 있으면 Report를 배치 POST. */
  serverUrl?: string;
  /** Report 콜백 — 서버 없이도 결과를 받는다. */
  onReport?: (report: Report) => void;
  /** 콘솔 출력 여부. 기본 false. */
  console?: boolean;
  /** 사람이 읽는 라벨/식별자. 없으면 crypto.randomUUID()로 자동 발급. */
  peerId?: string;
}
