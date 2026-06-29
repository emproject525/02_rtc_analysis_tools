import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// Vite 8 uses Rolldown as the default bundler.
// Library mode: build an ESM bundle (`peer-analyst.es.js`, package.json이 가리킴)
// for `import`, and an IIFE bundle that exposes the global `PeerAnalyst` for
// `<script>` usage.
export default defineConfig({
  plugins: [
    dts({
      include: ["src"],
      exclude: ["src/**/*.test.ts", "src/playground.ts"],
      bundleTypes: true, // true이면 @microsoft/api-extractor를 사용함 (optional peer)
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "PeerAnalyst",
      // es: import용 ESM, iife: <script>용 즉시 실행 함수 (function (){})()
      formats: ["es", "iife"],
      fileName: (format) => `peer-analyst.${format}.js`,
    },
  },
});
