import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// Vite 8 uses Rolldown as the default bundler.
// Library mode: build an ESM bundle for `import`, and an IIFE bundle that
// exposes the global `PeerAnalyst` for `<script>` usage.
export default defineConfig({
  plugins: [dts({ include: ["src"], bundleTypes: true })],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      name: "PeerAnalyst",
      formats: ["es", "iife"],
      fileName: (format) => `peer-analyst.${format}.js`,
    },
  },
});
