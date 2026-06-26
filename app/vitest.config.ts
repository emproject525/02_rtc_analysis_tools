import { defineConfig } from "vitest/config";

// 라이브러리 빌드(vite.config.ts)와 분리한 테스트 전용 설정.
// stats는 Map으로 목킹하므로 DOM 환경 불필요(node).
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
