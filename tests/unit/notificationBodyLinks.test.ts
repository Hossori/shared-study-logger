import { describe, expect, it } from "vitest";
import {
	insertMarkdownLinkSnippet,
	parseNotificationBody,
} from "../../src/react-app/features/notifications/notificationBodyLinks";

describe("insertMarkdownLinkSnippet", () => {
	it("inserts at the given cursor and places caret inside []", () => {
		expect(insertMarkdownLinkSnippet("ab", 1, 1)).toEqual({
			value: "a[]()b",
			cursor: 2,
		});
	});

	it("inserts at the end when start is the length", () => {
		expect(insertMarkdownLinkSnippet("ab", 2, 2)).toEqual({
			value: "ab[]()",
			cursor: 3,
		});
	});

	it("wraps a selection as the link label and places caret inside ()", () => {
		expect(insertMarkdownLinkSnippet("hello", 1, 4)).toEqual({
			value: "h[ell]()o",
			cursor: 7,
		});
	});

	it("wraps a full selection", () => {
		expect(insertMarkdownLinkSnippet("ab", 0, 2)).toEqual({
			value: "[ab]()",
			cursor: 5,
		});
	});

	it("does not escape special characters in the selection", () => {
		expect(insertMarkdownLinkSnippet("a]b\nc", 1, 4)).toEqual({
			value: "a[]b\n]()c",
			cursor: 7,
		});
	});

	it("inserts an empty snippet when start and end are reversed", () => {
		expect(insertMarkdownLinkSnippet("hello", 4, 1)).toEqual({
			value: "hell[]()o",
			cursor: 5,
		});
	});
});

describe("parseNotificationBody", () => {
	it("keeps plain text", () => {
		expect(parseNotificationBody("お知らせです")).toEqual([
			{ type: "text", text: "お知らせです" },
		]);
	});

	it("parses a labeled markdown link", () => {
		expect(parseNotificationBody("詳細は[こちら](https://example.com)へ")).toEqual([
			{ type: "text", text: "詳細は" },
			{
				type: "link",
				href: "https://example.com/",
				label: "こちら",
			},
			{ type: "text", text: "へ" },
		]);
	});

	it("uses the raw URL as label when [] is empty", () => {
		expect(parseNotificationBody("[](https://example.com/path)")).toEqual([
			{
				type: "link",
				href: "https://example.com/path",
				label: "https://example.com/path",
			},
		]);
	});

	it("leaves unsafe or empty URLs as plain text", () => {
		expect(parseNotificationBody("[]()")).toEqual([
			{ type: "text", text: "[]()" },
		]);
		expect(parseNotificationBody("[x](javascript:alert(1))")).toEqual([
			{ type: "text", text: "[x](javascript:alert(1))" },
		]);
	});
});
