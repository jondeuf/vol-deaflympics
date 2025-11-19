import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // IMPORTANT pour GitHub Pages : ton repo s’appelle "vol-deaflympics"
  base: "/vol-deaflympics/",
  plugins: [react()],
});

