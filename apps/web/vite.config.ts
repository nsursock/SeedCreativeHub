import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/graphql": "http://localhost:3001",
      "/health": "http://localhost:3001",
    },
  },
  build: {
    target: "es2022",
  },
});
