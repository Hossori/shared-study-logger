/**
 * E2E 共通: seed 固定アカウント前提。
 * `pnpm seed` 後の admin@example.com / ChangeMe123! を使う。
 */
import { expect, type Page } from "@playwright/test";
import {
	CLIENT_API_VERSION,
	CLIENT_API_VERSION_HEADER,
} from "../shared/client-api-version";

export const SEED_ADMIN = {
	email: "admin@example.com",
	password: "ChangeMe123!",
} as const;

export const SEED_USER = {
	email: "test@example.com",
	password: "ChangeMe123!",
} as const;

export function currentClientApiVersionHeaders(): Record<string, string> {
	return { [CLIENT_API_VERSION_HEADER]: CLIENT_API_VERSION };
}

export async function loginAsAdmin(page: Page): Promise<void> {
	await loginWith(page, SEED_ADMIN.email, SEED_ADMIN.password);
}

export async function loginAsUser(page: Page): Promise<void> {
	await loginWith(page, SEED_USER.email, SEED_USER.password);
}

async function loginWith(
	page: Page,
	email: string,
	password: string,
): Promise<void> {
	await page.goto("/login");
	await page.locator("#email").fill(email);
	await page.locator("#password").fill(password);
	await page.getByRole("button", { name: "ログイン" }).click();
	await expect(page.getByRole("heading", { name: "📚 学習記録シェア" })).toBeVisible();
}

export async function openPostModal(page: Page): Promise<void> {
	await page.getByRole("button", { name: "記録を追加" }).click();
	await expect(page.getByRole("heading", { name: "学習記録を投稿" })).toBeVisible();
}

export async function fillStudyDatetime(
	page: Page,
	idPrefix: string,
	date: string,
	hour: number,
	minute: number,
): Promise<void> {
	await page.locator(`#${idPrefix}-studyDate`).fill(date);
	const timeTrigger = page.locator(`#${idPrefix}-studyTime`);
	if ((await timeTrigger.getAttribute("aria-expanded")) !== "true") {
		await timeTrigger.click();
	}
	const clockDialog = page.getByRole("dialog", { name: "時刻" });
	await expect(clockDialog).toBeVisible();
	const hourLabel = hour === 0 ? 24 : hour;
	await clockDialog.locator(`#${idPrefix}-hour-${hourLabel}`).click();
	await clockDialog.locator(`#${idPrefix}-minute-${minute}`).click();
	await clockDialog.getByRole("button", { name: "完了" }).click();
	await expect(clockDialog).toBeHidden();
}
