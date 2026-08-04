import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		cloudflare(),
		tailwindcss(),
		VitePWA({
			// push/notificationclick/pushsubscriptionchangeの独自ハンドリングが必要なため、
			// 自動生成(generateSW)ではなくカスタムService Worker(public/sw.ts)をビルドする。
			strategies: "injectManifest",
			srcDir: "public",
			filename: "sw.ts",
			injectRegister: false,
			// manifest.webmanifestは public/manifest.webmanifest として手動管理し、
			// index.htmlから<link rel="manifest">で参照するため自動生成しない。
			manifest: false,
			injectManifest: {
				globPatterns: ["**/*.{js,css,html,webmanifest}", "icons/*.png"],
			},
			devOptions: {
				enabled: true,
				type: "module",
			},
		}),
	],
});
