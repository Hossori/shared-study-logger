/**
 * E2E 共通: seed 固定アカウント前提。
 * `pnpm seed` 後の admin@example.com / ChangeMe123! を使う。
 */
import { expect, type Page } from "@playwright/test";

export const SEED_ADMIN = {
	email: "admin@example.com",
	password: "ChangeMe123!",
} as const;

export async function loginAsAdmin(page: Page): Promise<void> {
	await page.goto("/login");
	await page.locator("#email").fill(SEED_ADMIN.email);
	await page.locator("#password").fill(SEED_ADMIN.password);
	await page.getByRole("button", { name: "ログイン" }).click();
	await expect(page.getByRole("heading", { name: "学習記録" })).toBeVisible();
}

export async function openPostModal(page: Page): Promise<void> {
	await page.getByRole("button", { name: "記録を追加" }).click();
	await expect(page.getByRole("heading", { name: "学習記録を投稿" })).toBeVisible();
}
