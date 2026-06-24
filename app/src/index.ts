export type ObserveOptions = {
  /** Collector endpoint the SDK POSTs reports to. */
  serverUrl?: string;
};

const PeerAnalyst = {
  observe(_peer: RTCPeerConnection, _options: ObserveOptions = {}): void {
    // TODO: subscribe to state changes + poll getStats()
  },
  unobserve(_peer: RTCPeerConnection): void {
    // TODO: tear down subscriptions + polling
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
