import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import basicSsl from "@vitejs/plugin-basic-ssl";

// HTTPS is opt-in via VITE_HTTPS=1 (set by host.ps1). It is required for phone
// motion sensors (deviceorientation only fires in a secure context). Local
// preview tooling stays on plain HTTP.
const useHttps = process.env.VITE_HTTPS === "1";

// Base public path. Defaults to "/" (custom domain / local). For GitHub Pages
// project sites the deploy script sets VITE_BASE="/template-styling/".
const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  plugins: [glsl(), ...(useHttps ? [basicSsl()] : [])],
  server: {
    host: true,
    port: 5173,
    https: useHttps ? {} : undefined,
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: { api: "modern-compiler" },
    },
  },
  build: {
    target: "es2020",
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: { three: ["three"], gsap: ["gsap"] },
      },
    },
  },
});
