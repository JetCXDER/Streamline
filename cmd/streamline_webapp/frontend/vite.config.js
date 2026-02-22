import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/listZip": "http://localhost:8080",
      "/extractZip": "http://localhost:8080",
      "/cancel": "http://localhost:8080",
    },
  },
});
