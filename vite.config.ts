import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    // Split large, rarely-changing deps into their own chunks so they stay in
    // the browser cache across deploys (we redeploy app code far more often).
    rollupOptions: {
      output: {
        // Function form (object form is not supported by Vite 8's rolldown
        // bundler). Maps each vendor module to a stable, rarely-changing chunk.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom|react-router|@remix-run[\\/]router)[\\/]/.test(id))
            return "react-vendor";
          if (/[\\/]node_modules[\\/]@radix-ui[\\/]/.test(id)) return "radix-vendor";
          if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) return "supabase-vendor";
          if (/[\\/]node_modules[\\/]recharts[\\/]/.test(id)) return "charts-vendor";
          if (/[\\/]node_modules[\\/]date-fns[\\/]/.test(id)) return "date-vendor";
        },
      },
    },
  },
}));
