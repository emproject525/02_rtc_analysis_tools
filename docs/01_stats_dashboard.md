# stats dashboard 화면

`observe()`로 감시 중인 `RTCPeerConnection`을 peer 단위로 보여준다. 각 peer는
**연결 상태 / 경로(transport)** 같은 연결 단위 정보를 헤더로 두고, 그 아래에
**recv(inbound) / send(outbound)** 트랙 목록을 나열한다.

- 상태(`connectionState` 등)는 이벤트로 들어오는 push 데이터.
- 품질 지표(bitrate·jitter·loss·RTT 등)는 `getStats()` 폴링으로 들어오는 pull 데이터.
- push 이벤트는 즉시 보내지 않고 **전이 버퍼**에 쌓였다가 다음 pull(폴링) 때 함께 비워 나간다. 폴링 간격 안에서 짧게 일어난 상태 전이·`icecandidateerror`도 유실 없이 보존된다.
- candidate / RTT / 대역폭은 트랙이 아니라 **연결(transport) 단위**라 peer 헤더에 둔다.
  (BUNDLE로 모든 트랙이 candidate-pair 하나를 공유)
- 트랙은 **ssrc 단위로 한 항목/그래프**로 집계한다. `replaceTrack`은 ssrc가 유지돼(누적값 연속) 같은 항목으로 이어가고, 그 시점의 `track.id`만 노출해 콘텐츠 전환(예: 카메라→화면공유) 지점을 표시한다. 재협상으로 ssrc가 새로 생기면 **새 항목**, ssrc가 사라지면 그 항목은 **ended**로 표시하고 목록에 남긴다.

---

## Peer1 (명칭 / 연결 지속시간)

### 연결 상태 _(이벤트 기반, 배지)_

- `connectionState` (connected / failed / disconnected …)
- `iceConnectionState`
- `signalingState`
- `iceGatheringState`

### 경로 (transport) _(연결 단위, peer당 1개)_

- 선택된 candidate-pair: local ↔ remote
  - 각 후보 타입: host / srflx / **relay** 중 1개 (relay면 TURN 경유)
  - 프로토콜 (UDP / TCP)
- connection RTT (`candidate-pair.currentRoundTripTime`)
- availableOutgoingBitrate (대역폭 추정)
- DTLS state
- ⚠️ `icecandidateerror` 발생 이력 (STUN/TURN 실패 — 실패 원인 진단)

### recv 목록 (inbound)

트랙마다:

- **track 정보**
  - kind (video / audio)
  - track id 식별자 _(그 시점의 `track.id` — replaceTrack 시 바뀜, 시리즈는 ssrc로 유지)_
  - mid
  - 코덱 (mimeType, clockRate)
- **receiver 설정**
  - direction (sendrecv / recvonly …)
  - 해상도 / FPS (설정값)
- **실시간 지표** _(그래프, 지속 업데이트)_
  - ↓ bitrate (bytesReceived 미분)
  - packetsLost / fractionLost
  - jitter
  - RTT
  - framesPerSecond, frameWidth × Height (영상 끊김·해상도 저하 감지)
  - nackCount / pliCount (재전송 요청 = 네트워크 악화 신호)
  - 재전송 수신률 (retransmittedBytesReceived 미분) · fecPacketsReceived (복구 패킷)
  - freezeCount / totalFreezesDuration (체감 프리징)
  - jitterBufferDelay
  - audioLevel (무음/발화 구분)

### send 목록 (outbound)

트랙마다:

- **track 정보**
  - kind (video / audio)
  - track id 식별자 _(그 시점의 `track.id` — replaceTrack 시 바뀜, 시리즈는 ssrc로 유지)_
  - mid
  - 코덱 (mimeType, clockRate)
- **sender 설정**
  - direction (sendrecv / sendonly …)
  - encodings (simulcast 레이어 · maxBitrate · active)
- **실시간 지표** _(그래프, 지속 업데이트)_
  - ↑ bitrate (bytesSent 미분)
  - packetsLost / fractionLost (remote-inbound-rtp 기준)
  - jitter
  - RTT
  - framesPerSecond, frameWidth × Height
  - nackCount / pliCount / firCount
  - 재전송률 (retransmittedBytesSent 미분 / 전체 송신 비중) · fecPacketsSent

---

## Peer2 (명칭 / 연결 지속시간)

_(Peer1과 동일한 구조 — 연결 상태 / 경로 / recv 목록 / send 목록)_

---

## 데이터 출처

peer에서 뽑는 데이터는 **(A) 이벤트 (peer 객체 프로퍼티 / 이벤트 리스너)**,
**(B) `getStats()`가 돌려주는 `RTCStatsReport`의 type별 레코드**, **(C) transceiver
스냅샷**, **(D) 위 값으로 계산하는 파생 지표** 네 갈래다. 아래는 필드 단위 매핑.

> `getStats()`는 `Map<id, stats>`를 준다. 레코드끼리 `*Id` 필드(`codecId`,
> `localCandidateId`, `remoteCandidateId`, `selectedCandidatePairId` …)로 서로를
> 참조하므로, 폴링 1회마다 id로 join해서 트리를 만든다.

### A. 이벤트 (push) — peer 객체에서 직접

| 항목                 | 출처                                                 | 비고                                               |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| `connectionState`    | `pc.connectionState` (`connectionstatechange`)       | 전체 연결 생사                                     |
| `iceConnectionState` | `pc.iceConnectionState` (`iceconnectionstatechange`) | ICE 레벨 끊김                                      |
| `iceGatheringState`  | `pc.iceGatheringState` (`icegatheringstatechange`)   | 후보 수집 진행                                     |
| `signalingState`     | `pc.signalingState` (`signalingstatechange`)         | 협상 단계                                          |
| ICE 후보 수집 실패   | `icecandidateerror` 이벤트                           | `errorCode`, `errorText`, `url`, `address`, `port` |

> 위 push 이벤트는 발생 즉시 전송하지 않고 collector가 **전이 버퍼**에 누적한다 — 상태 전이는 `RawSample.transitions`, `icecandidateerror`는 `RawSample.iceCandidateErrors`로. 다음 `getStats()` 폴링 때 한 묶음으로 비워(drain) 보내므로, 폴링 간격 안에서 짧게 일어난 전이도 잡힌다. 감시 종료(`unobserve`/`dispose`) 시에도 마지막 폴링 1회로 잔여 버퍼를 flush 한다.

### B. `getStats()` — type별 매핑

**`transport` (RTCTransportStats)** — 연결당 1개, peer 헤더용

| 필드                          | 의미                            |
| ----------------------------- | ------------------------------- |
| `dtlsState`                   | DTLS 핸드셰이크 상태            |
| `iceState`                    | ICE transport 상태              |
| `selectedCandidatePairId`     | 현재 선택된 candidate-pair 참조 |
| `bytesSent` / `bytesReceived` | transport 누적 바이트           |

**`candidate-pair` (RTCIceCandidatePairStats)** — `transport.selectedCandidatePairId`로 선택된 1개

| 필드                       | 의미                              |
| -------------------------- | --------------------------------- |
| `state`                    | `succeeded` 여부 (연결된 쌍 판별) |
| `nominated`                | 후보쌍 지명 여부                  |
| `currentRoundTripTime`     | **connection RTT (초)**           |
| `availableOutgoingBitrate` | 송신 대역폭 추정                  |
| `availableIncomingBitrate` | 수신 대역폭 추정                  |
| `localCandidateId`         | → `local-candidate` join          |
| `remoteCandidateId`        | → `remote-candidate` join         |

**`local-candidate` / `remote-candidate` (RTCIceCandidateStats)**

| 필드               | 의미                                                     |
| ------------------ | -------------------------------------------------------- |
| `candidateType`    | `host` / `srflx` / `prflx` / `relay` (relay면 TURN 경유) |
| `protocol`         | `udp` / `tcp`                                            |
| `address` / `port` | 후보 주소                                                |
| `relayProtocol`    | relay일 때 TURN 전송 프로토콜                            |

**`inbound-rtp` (RTCInboundRtpStreamStats)** — recv 트랙마다 (`kind`로 audio/video 구분)

| 필드                                            | 의미                                      |
| ----------------------------------------------- | ----------------------------------------- |
| `ssrc`, `mid`, `trackIdentifier`                | 트랙 식별 / transceiver join 키           |
| `kind`                                          | audio / video                             |
| `bytesReceived`, `packetsReceived`              | 누적 (→ bitrate 파생)                     |
| `packetsLost`                                   | 누적 손실 (→ 손실률 파생)                 |
| `jitter`                                        | 지터 (초)                                 |
| `framesPerSecond`, `frameWidth`, `frameHeight`  | 영상 FPS / 해상도                         |
| `framesDecoded`, `framesDropped`                | 디코딩 / 드롭 프레임                      |
| `freezeCount`, `totalFreezesDuration`           | 프리징 횟수 / 누적 시간                   |
| `nackCount`, `pliCount`, `firCount`             | 재전송·키프레임 요청 (네트워크 악화 신호) |
| `retransmittedPacketsReceived`, `retransmittedBytesReceived` | 재전송으로 받은 누적 (→ 재전송 수신률 파생) |
| `fecPacketsReceived`, `fecPacketsDiscarded`     | FEC 복구 패킷 수신 / 폐기                  |
| `jitterBufferDelay`, `jitterBufferEmittedCount` | 수신 버퍼 지연 (→ 평균 지연 파생)         |
| `audioLevel`, `totalAudioEnergy`                | 오디오 레벨 (무음/발화)                   |
| `codecId`                                       | → `codec` join                            |

**`outbound-rtp` (RTCOutboundRtpStreamStats)** — send 트랙마다

| 필드                                                            | 의미                                   |
| --------------------------------------------------------------- | -------------------------------------- |
| `ssrc`, `mid`, `rid`                                            | 트랙 식별 / `rid`=simulcast 레이어     |
| `kind`                                                          | audio / video                          |
| `bytesSent`, `packetsSent`                                      | 누적 (→ bitrate 파생)                  |
| `framesPerSecond`, `frameWidth`, `frameHeight`, `framesEncoded` | 인코딩 FPS / 해상도                    |
| `nackCount`, `pliCount`, `firCount`                             | 수신측이 보낸 재전송·키프레임 요청     |
| `retransmittedPacketsSent`, `retransmittedBytesSent`            | 재전송한 누적 (→ 재전송률 파생)        |
| `fecPacketsSent`                                                | FEC 패킷 송신 (브라우저별 지원 편차)   |
| `targetBitrate`                                                 | 인코더 목표 비트레이트                 |
| `qualityLimitationReason`                                       | 화질 제한 원인 (`cpu` / `bandwidth` …) |
| `qualityLimitationDurations`                                    | 원인별 누적 시간                       |
| `codecId`, `mediaSourceId`                                      | → `codec` / `media-source` join        |

> 재전송/FEC는 TCP가 아니라 RTP NACK/RTX(RFC 4588)·FEC로 **미디어 레벨에서 자체 처리**한다(UDP 위의 선택적 재전송 — 늦으면 버리고 필요한 것만 다시 보냄). 재전송률이 오르면 nack/pli와 함께 네트워크 악화 신호이고, "대역폭 중 재전송으로 낭비되는 비중"을 드러내므로 별도 지표로 노출한다. 모두 누적 카운터라 직전 폴링과 미분해 "현재 재전송률"로 가공한다.

**`remote-inbound-rtp` (RTCRemoteInboundRtpStreamStats)** — 우리 send를 상대가 받은 리포트

| 필드            | 의미                |
| --------------- | ------------------- |
| `roundTripTime` | **send 트랙별 RTT** |
| `fractionLost`  | 최근 구간 손실률    |
| `packetsLost`   | 누적 손실           |
| `jitter`        | 상대측 지터         |

**`remote-outbound-rtp` (RTCRemoteOutboundRtpStreamStats)** — 우리 recv에 대한 상대 송신 리포트

| 필드              | 의미                       |
| ----------------- | -------------------------- |
| `remoteTimestamp` | 상대 송신 시각 (시계 동기) |
| `roundTripTime`   | recv 경로 RTT 추정         |

**`codec` (RTCCodecStats)**

| 필드          | 의미                        |
| ------------- | --------------------------- |
| `mimeType`    | `video/VP8`, `audio/opus` … |
| `clockRate`   | 클럭                        |
| `payloadType` | PT 번호                     |
| `channels`    | 오디오 채널 수              |
| `sdpFmtpLine` | fmtp 파라미터               |

**`media-source` (RTCMediaSourceStats)** — outbound 원본 소스 (선택)

| 필드                                 | 의미                         |
| ------------------------------------ | ---------------------------- |
| `audioLevel`, `totalAudioEnergy`     | (audio) 마이크 입력 레벨     |
| `width`, `height`, `framesPerSecond` | (video) 캡처 소스 해상도/FPS |

### C. transceiver 스냅샷 — getStats 해석용 메타

`pc.getTransceivers()`로 1회(또는 협상 후) 스냅샷. 라이브 폴링 대상은 아님.

| 항목                               | 의미                                            |
| ---------------------------------- | ----------------------------------------------- |
| `mid`                              | `inbound/outbound-rtp.mid`와 join → 트랙 라벨링 |
| `direction` / `currentDirection`   | sendrecv / sendonly / recvonly / inactive       |
| `sender.track` / `receiver.track`  | track id ↔ ssrc 매핑                            |
| `sender.getParameters().encodings` | simulcast 레이어 · `maxBitrate` · `active`      |

> transceiver 스냅샷은 **항목 단위로 격리**한다. `pc.close()`와 폴링 타이머가 겹치면 특정 transceiver의 `getParameters()`/`mid`/`track` 접근이 throw할 수 있는데(주로 연결 종료 시점의 경합), transceiver 1개를 스냅하는 과정 전체를 try/catch로 감싸 **문제 항목만 조용히 스킵**한다. 한 항목의 예외로 그 폴링의 전체 transceiver 매핑(trackId·encodings)이 통째로 날아가는 것을 막기 위함이다. 스킵된 항목은 다음 폴링에 정상화되면 다시 들어온다.

### D. 파생 지표 (계산) — 직접 안 나오는 값

`getStats()`는 대부분 **누적값**이라, 직전 폴링과 비교해 미분해야 "현재" 값이 된다.

| 지표              | 계산식                                                  |
| ----------------- | ------------------------------------------------------- |
| bitrate ↓/↑       | `(bytes[t] − bytes[t−1]) * 8 / Δt`                      |
| packet loss율     | `ΔpacketsLost / (ΔpacketsLost + Δpackets) * 100`        |
| 재전송률          | `Δretransmittedbytes / Δbytes * 100` (송신/수신 중 재전송 비중) |
| 평균 jitter delay | `jitterBufferDelay / jitterBufferEmittedCount`          |
| FPS (없을 때)     | `Δframes / Δt` (`framesPerSecond` 미제공 브라우저 대비) |
| 연결 지속시간     | `now − observe 시작 시각`                               |

### E. 트랙 생명주기 (analyzer 상태) — ended 추적

`getStats()`는 매 폴링마다 **그 시점에 살아있는 ssrc만** 돌려준다. analyzer가 이번 폴링 결과만 보면 사라진 트랙은 목록에서 그냥 빠져, 끊긴 트랙을 화면에서 추적할 수 없다. 그래서 analyzer가 **지금까지 본 모든 ssrc의 레지스트리**(`Map<ssrc, 마지막 트랙 상태>`)를 들고 ended를 판정한다.

- 이번 폴링에 있는 ssrc → 정상 갱신 (`ended: false`).
- 레지스트리엔 있는데 이번 stats엔 없는 ssrc → `ended: true`로 표시하고 **목록에 그대로 남긴다**.
- `replaceTrack`은 ssrc가 유지되므로 같은 항목으로 이어가고(그 시점 `track.id`만 갱신), 재협상으로 새 ssrc가 생기면 새 항목이 된다.

> 미분용 직전 샘플과는 **별개 상태**다. 직전 샘플은 "직전 1개"만 보관해 누적값을 미분하는 용도고, 생명주기 레지스트리는 "본 적 있는 ssrc 전체"를 보관해 ended를 추적하는 용도다. 두 상태를 분리해 미분 로직과 생명주기 로직이 서로 간섭하지 않게 한다.

## 우선순위

- **MVP 필수**: peer 상태 배지, candidate-pair 경로, bitrate 그래프, packetLoss · jitter · RTT, 해상도 / FPS
- **다음 단계**: nack / pli, freeze, jitterBufferDelay, simulcast 레이어, audioLevel
