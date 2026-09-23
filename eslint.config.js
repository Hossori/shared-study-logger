import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: [
			"dist",
			"playwright-report",
			"test-results",
			"coverage",
			"blob-report",
			// wrangler types 生成物（内部の eslint-disable が unused 警告になる）
			"worker-configuration.d.ts",
		],
	},
	{
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		plugins: {
			"react-hooks": reactHooks,
			"react-refresh": reactRefresh,
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			"react-refresh/only-export-components": [
				"warn",
				{ allowConstantExport: true },
			],
		},
	},
	{
		files: ["src/react-app/features/**/*.{ts,tsx}"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							regex: "^@/(features|app|pages)(/|$)",
							message:
								"feature は他 feature・app・pages を import しない。合成は pages と app で行う。",
						},
						{
							regex:
								"^(\\.\\./)+((auth|groups|records|notifications|push|pwa)(/|$)|features/|app(/|$)|pages(/|$))",
							message:
								"feature は他 feature・app・pages を import しない。合成は pages と app で行う。",
						},
					],
				},
			],
		},
	},
	{
		files: [
			"src/react-app/app/**/*.{ts,tsx}",
			"src/react-app/pages/**/*.{ts,tsx}",
			"src/react-app/main.tsx",
		],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							regex: "^@/features/[^/]+/.+",
							message:
								"feature の外からは各 feature の index だけを import する。",
						},
					],
				},
			],
		},
	},
);
