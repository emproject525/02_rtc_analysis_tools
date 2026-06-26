import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// Vite 8 uses Rolldown as the default bundler.
// Library mode: build an ESM bundle for `import`, and an IIFE bundle that
// exposes the global `PeerAnalyst` for `<script>` usage.
export default defineConfig({
  plugins: [
    dts({
      include: ["src"],
      exclude: ["src/**/*.test.ts"],
      bundleTypes: true, // true이면 @microsoft/api-extractor를 사용함 (optional peer)
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "PeerAnalyst",
      // 즉시 실행 함수 (function (){})() 형태로 생성
      formats: ["iife"],
      fileName: (format) => `peer-analyst.${format}.js`,
    },
  },
});
