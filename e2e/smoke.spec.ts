import { expect, test } from "@playwright/test";
import { loginAsAdmin, openPostModal, SEED_ADMIN } from "./helpers";

test.describe.configure({ mode: "serial" });

test("未認証で / は /login へリダイレクト", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveURL(/\/login/);
	await expect(page.getByRole("heading", { name: "学習記録シェア" })).toBeVisible();
});

test("ログイン失敗でエラー表示", async ({ page }) => {
	await page.goto("/login");
	await page.locator("#email").fill(SEED_ADMIN.email);
	await page.locator("#password").fill("wrong-password");
	await page.getByRole("button", { name: "ログイン" }).click();
	await expect(
		page.getByText("メールアドレスまたはパスワードが正しくありません。"),
	).toBeVisible();
	await expect(page).toHaveURL(/\/login/);
});

test("ログイン成功でグループ切替が表示される", async ({ page }) => {
	await loginAsAdmin(page);
	const switcher = page.getByLabel("グループ切替");
	const single = page.getByText("サンプル学習グループ");
	await expect(switcher.or(single).first()).toBeVisible();
});

test("学習記録を投稿できる", async ({ page }) => {
	await loginAsAdmin(page);
	await expect(page.getByLabel("グループ切替")).toBeVisible();

	const title = `e2e-record-${Date.now()}`;
	await openPostModal(page);
	await page.locator("#post-studyDatetime").fill("2026-08-10T12:00");
	await page.locator("#post-title").fill(title);

	const responsePromise = page.waitForResponse(
		(response) =>
			response.url().includes("/records") &&
			response.request().method() === "POST",
	);
	await page.getByRole("button", { name: "投稿する" }).click();
	const response = await responsePromise;
	expect(
		response.ok(),
		`POST /records failed: ${response.status()} ${await response.text()}`,
	).toBeTruthy();
	await expect(page.getByRole("heading", { name: title })).toBeVisible();
});

test("自分の学習記録を削除できる", async ({ page }) => {
	await loginAsAdmin(page);
	await expect(page.getByLabel("グループ切替")).toBeVisible();

	const title = `e2e-delete-${Date.now()}`;
	await openPostModal(page);
	await page.locator("#post-studyDatetime").fill("2026-08-10T12:00");
	await page.locator("#post-title").fill(title);

	const responsePromise = page.waitForResponse(
		(response) =>
			response.url().includes("/records") &&
			response.request().method() === "POST",
	);
	await page.getByRole("button", { name: "投稿する" }).click();
	expect((await responsePromise).ok()).toBeTruthy();

	const card = page.locator("li").filter({ hasText: title });
	await expect(card).toBeVisible();

	page.once("dialog", (dialog) => dialog.accept());
	await card.getByRole("button", { name: "削除" }).click();
	await expect(card).toHaveCount(0);
});

test("ログアウト後は /login に戻る", async ({ page }) => {
	await loginAsAdmin(page);
	await page.getByLabel("プロフィールメニュー").click();
	page.once("dialog", (dialog) => dialog.accept());
	await page.getByRole("menuitem", { name: "ログアウト" }).click();
	await expect(page).toHaveURL(/\/login/);
});
