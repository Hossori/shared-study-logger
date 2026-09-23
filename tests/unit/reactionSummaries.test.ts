import { describe, expect, it } from "vitest";
import type { ReactionSummary } from "../../shared/schemas";
import {
	applyAddReaction,
	applyRemoveReaction,
	sortReactionSummaries,
} from "../../src/react-app/lib/reactionSummaries";

describe("sortReactionSummaries", () => {
	it("orders by stamp definition", () => {
		const input: ReactionSummary[] = [
			{ stamp: "muscle", count: 1, reactedByMe: false },
			{ stamp: "thumbs_up", count: 2, reactedByMe: true },
			{ stamp: "smile", count: 1, reactedByMe: false },
		];
		expect(sortReactionSummaries(input).map((item) => item.stamp)).toEqual([
			"thumbs_up",
			"smile",
			"muscle",
		]);
	});
});

describe("applyAddReaction", () => {
	it("inserts a new stamp in definition order", () => {
		const current: ReactionSummary[] = [
			{ stamp: "smile", count: 1, reactedByMe: false },
		];
		expect(applyAddReaction(current, "thumbs_up")).toEqual([
			{ stamp: "thumbs_up", count: 1, reactedByMe: true },
			{ stamp: "smile", count: 1, reactedByMe: false },
		]);
	});

	it("increments count when others already used the stamp", () => {
		const current: ReactionSummary[] = [
			{ stamp: "smile", count: 2, reactedByMe: false },
		];
		expect(applyAddReaction(current, "smile")).toEqual([
			{ stamp: "smile", count: 3, reactedByMe: true },
		]);
	});

	it("is a no-op when already reacted", () => {
		const current: ReactionSummary[] = [
			{ stamp: "cry", count: 1, reactedByMe: true },
		];
		expect(applyAddReaction(current, "cry")).toBe(current);
	});
});

describe("applyRemoveReaction", () => {
	it("removes the summary when count becomes 0", () => {
		const current: ReactionSummary[] = [
			{ stamp: "thumbs_up", count: 1, reactedByMe: true },
			{ stamp: "smile", count: 1, reactedByMe: false },
		];
		expect(applyRemoveReaction(current, "thumbs_up")).toEqual([
			{ stamp: "smile", count: 1, reactedByMe: false },
		]);
	});

	it("decrements count and clears reactedByMe when others remain", () => {
		const current: ReactionSummary[] = [
			{ stamp: "laugh", count: 3, reactedByMe: true },
		];
		expect(applyRemoveReaction(current, "laugh")).toEqual([
			{ stamp: "laugh", count: 2, reactedByMe: false },
		]);
	});

	it("is a no-op when the current user has not reacted", () => {
		const current: ReactionSummary[] = [
			{ stamp: "muscle", count: 2, reactedByMe: false },
		];
		expect(applyRemoveReaction(current, "muscle")).toBe(current);
	});
});
