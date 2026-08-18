import { describe, expect, it } from "vitest";
import {
	THEME_COLOR_HEX,
	THEME_STORAGE_KEY,
	applyThemeClass,
	applyThemeColor,
	nextTheme,
	parseStoredTheme,
	persistTheme,
	readPreferredTheme,
	readResolvedTheme,
	readStoredTheme,
	resolveTheme,
} from "../../src/react-app/lib/theme";

function createMemoryStorage(initial: Record<string, string> = {}) {
	const data = { ...initial };
	return {
		getItem(key: string) {
			return data[key] ?? null;
		},
		setItem(key: string, value: string) {
			data[key] = value;
		},
		data,
	};
}

function createRoot(initialDark = false) {
	const classes = new Set(initialDark ? ["dark"] : []);
	return {
		classList: {
			toggle(token: string, force?: boolean) {
				if (force === true) classes.add(token);
				else if (force === false) classes.delete(token);
				else if (classes.has(token)) classes.delete(token);
				else classes.add(token);
				return classes.has(token);
			},
		},
		hasDark: () => classes.has("dark"),
	};
}

describe("theme", () => {
	it("parseStoredTheme accepts only light or dark", () => {
		expect(parseStoredTheme("dark")).toBe("dark");
		expect(parseStoredTheme("light")).toBe("light");
		expect(parseStoredTheme(null)).toBeNull();
		expect(parseStoredTheme("system")).toBeNull();
	});

	it("readStoredTheme returns null when unset", () => {
		expect(readStoredTheme(createMemoryStorage())).toBeNull();
		expect(
			readStoredTheme(createMemoryStorage({ [THEME_STORAGE_KEY]: "dark" })),
		).toBe("dark");
	});

	it("resolveTheme prefers stored value over system", () => {
		expect(resolveTheme(null, "dark")).toBe("dark");
		expect(resolveTheme(null, "light")).toBe("light");
		expect(resolveTheme("light", "dark")).toBe("light");
		expect(resolveTheme("dark", "light")).toBe("dark");
	});

	it("readPreferredTheme follows the injected preference", () => {
		expect(readPreferredTheme(() => true)).toBe("dark");
		expect(readPreferredTheme(() => false)).toBe("light");
	});

	it("readResolvedTheme uses system only when storage is empty", () => {
		expect(readResolvedTheme(createMemoryStorage(), () => true)).toBe("dark");
		expect(
			readResolvedTheme(
				createMemoryStorage({ [THEME_STORAGE_KEY]: "light" }),
				() => true,
			),
		).toBe("light");
		expect(
			readResolvedTheme(
				createMemoryStorage({ [THEME_STORAGE_KEY]: "system" }),
				() => true,
			),
		).toBe("dark");
	});

	it("persistTheme writes the storage key", () => {
		const storage = createMemoryStorage();
		persistTheme("dark", storage);
		expect(storage.data[THEME_STORAGE_KEY]).toBe("dark");
		persistTheme("light", storage);
		expect(storage.data[THEME_STORAGE_KEY]).toBe("light");
	});

	it("nextTheme toggles light and dark", () => {
		expect(nextTheme("light")).toBe("dark");
		expect(nextTheme("dark")).toBe("light");
	});

	it("applyThemeClass toggles the dark class", () => {
		const root = createRoot();
		applyThemeClass("dark", root);
		expect(root.hasDark()).toBe(true);
		applyThemeClass("light", root);
		expect(root.hasDark()).toBe(false);
	});

	it("applyThemeColor writes theme-color meta content", () => {
		const attributes: Record<string, string> = {};
		const meta = {
			setAttribute(name: string, value: string) {
				attributes[name] = value;
			},
		};
		applyThemeColor("dark", meta);
		expect(attributes.content).toBe(THEME_COLOR_HEX.dark);
		applyThemeColor("light", meta);
		expect(attributes.content).toBe(THEME_COLOR_HEX.light);
	});
});
