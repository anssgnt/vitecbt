import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    copyPublicDir: true,
    assetsDir: "assets",
    rollupOptions: {
      input: {
        index: "index.html",
        exam: "exam.html",
        admin: "admin.html",
        result: "result.html",
        "soal-editor": "soal-editor.html",
      },
    },
  },
});
