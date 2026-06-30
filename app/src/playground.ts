/**
 * 실브라우저 스모크용 loopback 데모 (라이브러리 번들에는 포함되지 않음).
 * 한 페이지에서 RTCPeerConnection 2개를 직접 연결해 진짜 getStats를 만들고,
 * observe()로 collector→analyzer→reporter 파이프라인을 눈으로 확인한다.
 *
 * `pnpm dev`로 띄운 뒤 [start]를 누르면 sender/receiver 두 peer의 Report가
 * 콘솔과 화면에 실시간으로 찍힌다. 권한을 피하려고 video는 canvas 캡처,
 * audio는 WebAudio 오실레이터로 만든다.
 *
 * sender는 한 연결에 트랙 3개를 전송한다: canvas video ×2 + audio ×1.
 */
import "./index";

const $ = (id: string) => document.getElementById(id) as HTMLElement;

/** 권한 없이 영상 트랙 1개 — canvas에 매 프레임 그려 captureStream. */
const makeVideoTrack = (label: string, hueStart: number): MediaStreamTrack => {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext("2d")!;
  let hue = hueStart;
  setInterval(() => {
    hue = (hue + 4) % 360;
    ctx.fillStyle = `hsl(${hue} 70% 50%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "20px sans-serif";
    ctx.fillText(label, 10, 30);
    ctx.fillText(new Date().toISOString().slice(11, 23), 10, 130);
  }, 100);
  return canvas.captureStream(10).getVideoTracks()[0];
};

/** 권한 없이 오디오 트랙 1개 — 오실레이터를 MediaStream으로. */
const makeAudioTrack = (): MediaStreamTrack => {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const dest = ctx.createMediaStreamDestination();
  osc.frequency.value = 440;
  osc.connect(dest);
  osc.start();
  return dest.stream.getAudioTracks()[0];
};

/** 같은 페이지 안에서 두 peer를 직접 시그널링으로 연결한다. */
const connect = async (pc1: RTCPeerConnection, pc2: RTCPeerConnection) => {
  pc1.addEventListener("icecandidate", (e) => {
    if (e.candidate) void pc2.addIceCandidate(e.candidate);
  });
  pc2.addEventListener("icecandidate", (e) => {
    if (e.candidate) void pc1.addIceCandidate(e.candidate);
  });
  const offer = await pc1.createOffer();
  await pc1.setLocalDescription(offer);
  await pc2.setRemoteDescription(offer);
  const answer = await pc2.createAnswer();
  await pc2.setLocalDescription(answer);
  await pc1.setRemoteDescription(answer);
};

let sender: RTCPeerConnection | null = null;
let receiver: RTCPeerConnection | null = null;

const start = async () => {
  if (sender) return;

  // sender는 한 연결에 3개 트랙 전송: canvas video ×2 + oscillator audio ×1.
  const tracks = [
    makeVideoTrack("video-1", 0),
    makeVideoTrack("video-2", 180),
    makeAudioTrack(),
  ];
  const stream = new MediaStream(tracks);
  sender = new RTCPeerConnection();
  receiver = new RTCPeerConnection();
  for (const track of tracks) sender.addTrack(track, stream);

  await connect(sender, receiver);

  // 라이브 입력값(.value)을 읽는다. getAttribute("value")는 초기 속성만 읽혀 타이핑 반영 안 됨.
  const serverUrl =
    (document.getElementById("serverUrl") as HTMLInputElement | null)?.value ||
    undefined;

  // 두 peer를 각각 observe — console + 화면 렌더 콜백.
  window.PeerAnalyst.observe(sender, {
    serverUrl: serverUrl ?? undefined,
    peerId: "sender",
    console: true,
    interval: 1000,
    onReport: (r) => ($("sender-out").textContent = JSON.stringify(r, null, 2)),
  });
  window.PeerAnalyst.observe(receiver, {
    serverUrl: serverUrl ?? undefined,
    peerId: "receiver",
    console: true,
    interval: 1000,
    onReport: (r) =>
      ($("receiver-out").textContent = JSON.stringify(r, null, 2)),
  });
  $("status").textContent = `connected — version ${window.PeerAnalyst.version}`;
};

const stop = () => {
  window.PeerAnalyst.close();
  sender?.close();
  receiver?.close();
  sender = null;
  receiver = null;
  $("status").textContent = "stopped";
};

$("start").addEventListener("click", () => void start());
$("stop").addEventListener("click", stop);
