import { PeerMonitor, type ObserveOptions } from "./lib";

export type { ObserveOptions };

const PeerAnalyst = {
  monitors: new Map<RTCPeerConnection, PeerMonitor>(),

  /**
   * peer 감시 시작. 같은 인스턴스가 이미 감시 중이면 기존 monitor를 반환(멱등).
   * peerId 미지정 시 자동 발급.
   */
  observe(peer: RTCPeerConnection, options: ObserveOptions = {}) {
    const existing = this.monitors.get(peer);
    if (existing) return existing;

    const id = options.peerId ?? crypto.randomUUID();
    const monitor = new PeerMonitor(peer, id, options);
    this.monitors.set(peer, monitor);
    return monitor;
  },

  /** 특정 peer 감시 종료 + 정리. */
  unobserve(peer: RTCPeerConnection): void {
    const monitor = this.monitors.get(peer);
    if (!monitor) return;

    monitor.dispose();
    this.monitors.delete(peer);
  },

  /** 모든 peer 감시 종료. */
  close(): void {
    this.monitors.forEach((monitor) => monitor.dispose());
    this.monitors.clear();
  },
};

export type PeerAnalystApi = typeof PeerAnalyst;

declare global {
  interface Window {
    PeerAnalyst: PeerAnalystApi;
  }
}

// Side effect: importing the SDK injects the global onto `window`.
if (typeof window !== "undefined") {
  window.PeerAnalyst = PeerAnalyst;
}

export default PeerAnalyst;
