import { describe, expect, it } from "vitest";
import {
  avgJitterBufferDelay,
  bitrate,
  packetLossRate,
  ratePerSecond,
} from "../analyzer.derive";

describe("ratePerSecond", () => {
  it("누적 증가분을 초당으로 환산", () => {
    expect(ratePerSecond(100, 0, 2)).toBe(50);
  });
  it("prev 없으면 undefined (새 스트림)", () => {
    expect(ratePerSecond(100, undefined, 2)).toBeUndefined();
  });
  it("Δt가 0 이하면 undefined", () => {
    expect(ratePerSecond(100, 0, 0)).toBeUndefined();
  });
  it("cur < prev면 undefined (카운터 리셋)", () => {
    expect(ratePerSecond(50, 100, 2)).toBeUndefined();
  });
});

describe("bitrate", () => {
  it("Δbytes * 8 / Δt", () => {
    expect(bitrate(1000, 0, 2)).toBe(4000);
  });
  it("리셋이면 undefined", () => {
    expect(bitrate(0, 1000, 2)).toBeUndefined();
  });
});

describe("packetLossRate", () => {
  it("ΔLost / (ΔLost + ΔPackets) * 100", () => {
    expect(packetLossRate(7, 5, 200, 100)).toBeCloseTo(1.9607, 3);
  });
  it("손실·수신 둘 다 0 증가면 0%", () => {
    expect(packetLossRate(5, 5, 100, 100)).toBe(0);
  });
  it("카운터 리셋이면 undefined", () => {
    expect(packetLossRate(1, 5, 200, 100)).toBeUndefined();
  });
  it("결측이면 undefined", () => {
    expect(packetLossRate(7, 5, undefined, 100)).toBeUndefined();
  });
});

describe("avgJitterBufferDelay", () => {
  it("Δdelay / Δemitted", () => {
    expect(avgJitterBufferDelay(1.2, 1.0, 200, 100)).toBeCloseTo(0.002, 6);
  });
  it("emitted 증가 없으면 undefined", () => {
    expect(avgJitterBufferDelay(1.2, 1.0, 100, 100)).toBeUndefined();
  });
});
