/**
 * docs `01_stats_dashboard.md` D 섹션 — getStats 누적값을 직전 폴링과 미분해
 * "현재" 값으로 바꾸는 순수 계산. 모두 ssrc 단위로 prev와 짝지어 호출한다.
 *
 * - `미분` 순간적인 변화율을 구하는 것
 *
 * 공통 가드(우리가 정한 ssrc 규칙):
 * - prev가 없거나(새 스트림) Δt가 0 이하 → undefined (미분 불가, 그래프 공백)
 * - cur < prev (재협상/replaceTrack로 카운터 리셋) → undefined (쓰레기값 방지)
 */

/** 누적 카운터의 초당 증가율. 리셋/결측 시 undefined. */
export const ratePerSecond = (
  cur: number | undefined,
  prev: number | undefined,
  dtSec: number,
): number | undefined => {
  if (cur == null || prev == null || dtSec <= 0) return undefined;
  const delta = cur - prev;
  if (delta < 0) return undefined;
  return delta / dtSec;
};

/** bitrate (bps) = Δbytes * 8 / Δt. */
export const bitrate = (
  curBytes: number | undefined,
  prevBytes: number | undefined,
  dtSec: number,
): number | undefined => {
  const rate = ratePerSecond(curBytes, prevBytes, dtSec);
  return rate == null ? undefined : rate * 8;
};

/** 손실률(%) = ΔpacketsLost / (ΔpacketsLost + Δpackets) * 100. */
export const packetLossRate = (
  curLost: number | undefined,
  prevLost: number | undefined,
  curPackets: number | undefined,
  prevPackets: number | undefined,
): number | undefined => {
  if (curLost == null || prevLost == null) return undefined;
  if (curPackets == null || prevPackets == null) return undefined;
  const dLost = curLost - prevLost;
  const dPackets = curPackets - prevPackets;
  if (dLost < 0 || dPackets < 0) return undefined; // 카운터 리셋
  const denom = dLost + dPackets;
  return denom === 0 ? 0 : (dLost / denom) * 100;
};

/**
 * 재전송률(%) = Δretransmittedbytes / Δbytes * 100.
 * 전체 송신/수신 바이트 중 재전송이 차지하는 비중. 오르면 네트워크 악화 신호.
 * retransmittedBytes는 bytes에 이미 포함된 부분집합이라 분모는 전체 bytes.
 */
export const retransmissionRate = (
  curRetransmittedBytes: number | undefined,
  prevRetransmittedBytes: number | undefined,
  curBytes: number | undefined,
  prevBytes: number | undefined,
): number | undefined => {
  if (curRetransmittedBytes == null || prevRetransmittedBytes == null)
    return undefined;
  if (curBytes == null || prevBytes == null) return undefined;
  const dRetrans = curRetransmittedBytes - prevRetransmittedBytes;
  const dBytes = curBytes - prevBytes;
  if (dRetrans < 0 || dBytes < 0) return undefined; // 카운터 리셋
  return dBytes === 0 ? 0 : (dRetrans / dBytes) * 100;
};

/**
 * 평균 jitter buffer 지연(초) = ΔjitterBufferDelay / ΔjitterBufferEmittedCount.
 * - `jitterBufferDelay` 지금까지 누적된 총 지연
 */
export const avgJitterBufferDelay = (
  curDelay: number | undefined,
  prevDelay: number | undefined,
  curEmitted: number | undefined,
  prevEmitted: number | undefined,
): number | undefined => {
  if (curDelay == null || prevDelay == null) return undefined;
  if (curEmitted == null || prevEmitted == null) return undefined;
  const dDelay = curDelay - prevDelay;
  const dEmitted = curEmitted - prevEmitted;
  if (dDelay < 0 || dEmitted <= 0) return undefined;
  return dDelay / dEmitted;
};
