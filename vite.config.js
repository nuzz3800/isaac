import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: true }, // 같은 와이파이의 폰으로 개발 서버 접속 테스트 가능
});
