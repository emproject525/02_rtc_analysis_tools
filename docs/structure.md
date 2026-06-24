# Project Structure

```txt
app/                 JS SDK (Vite 8 / Rolldown). RTCPeerConnection monitoring SDK.
server/              Collector API + dashboard (Next.js).
docs/                Architecture and protocol notes.
```

`app/` is the SDK. Importing it injects `PeerAnalyst` onto `window`, which observes the live state of an `RTCPeerConnection`.

```js
import "peer-analyst";

const peer = new RTCPeerConnection();
window.PeerAnalyst.observe(peer, {
  /* options */
});
```

It builds two bundles: an ESM bundle for `import`, and an IIFE bundle that injects the global for `<script>` usage.

`server/` is a Next.js project. It exposes an API route that receives the reports sent by the SDK, and renders the collected connection state / quality metrics on a dashboard page.
