import { expect, test } from "@playwright/test";
import {
	currentClientApiVersionHeaders,
	loginAsAdmin,
	loginAsUser,
	openPostModal,
	fillStudyDatetime,
	SEED_ADMIN,
} from "./helpers";

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
	await page.reload();
	await expect(switcher.or(single).first()).toBeVisible();

	await page.route("**/api/auth/me", async (route) => {
		await route.fulfill({
			status: 426,
			contentType: "application/json",
			body: JSON.stringify({
				error: "client_update_required",
				minimumClientApiVersion: "2.0.0",
			}),
		});
	});
	await page.reload();
	await expect(
		page.getByRole("heading", { name: "アプリの更新が必要です" }),
	).toBeVisible();
	await expect(page).toHaveURL(/\/$/);
});

test("学習記録を投稿できる", async ({ page }) => {
	await loginAsAdmin(page);
	await expect(page.getByLabel("グループ切替")).toBeVisible();

	await openPostModal(page);
	await page.getByRole("button", { name: "キャンセル" }).click();
	await expect(page.getByRole("heading", { name: "学習記録を投稿" })).toBeHidden();

	await openPostModal(page);
	const cancelButton = page.getByRole("button", { name: "キャンセル" });
	const cancelBox = await cancelButton.boundingBox();
	expect(cancelBox).not.toBeNull();
	if (!cancelBox) throw new Error("キャンセルボタンの座標を取得できません。");
	await page.locator("#post-title").pressSequentially("下書き");
	await page.mouse.click(
		cancelBox.x + cancelBox.width / 2,
		cancelBox.y + cancelBox.height / 2,
	);
	const discardDialog = page.getByRole("alertdialog");
	expect(await discardDialog.isVisible()).toBe(true);
	await expect(discardDialog).toBeInViewport();
	await page.mouse.click(10, 10);
	await expect(discardDialog).toBeVisible();
	await expect(discardDialog).toBeInViewport();
	await discardDialog.getByRole("button", { name: "編集に戻る" }).click();
	await expect(page.getByRole("heading", { name: "学習記録を投稿" })).toBeVisible();
	await expect(page.locator("#post-title")).toHaveValue("下書き");

	await page.getByRole("button", { name: "キャンセル" }).click();
	await page.getByRole("alertdialog").getByRole("button", { name: "破棄する" }).click();
	await expect(page.getByRole("heading", { name: "学習記録を投稿" })).toBeHidden();

	const title = `e2e-record-${Date.now()}`;
	await openPostModal(page);
	await fillStudyDatetime(page, "post", "2026-08-10", 12, 0);
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
	await fillStudyDatetime(page, "post", "2026-08-10", 12, 0);
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

	await card.getByRole("button", { name: "削除" }).click();
	await page.getByRole("alertdialog").getByRole("button", { name: "削除" }).click();
	await expect(card).toHaveCount(0);
});

test("ログアウト後は /login に戻る", async ({ page }) => {
	await loginAsAdmin(page);
	await page.getByLabel("プロフィールメニュー").click();
	await page.getByRole("menuitem", { name: "ログアウト" }).click();
	await page.getByRole("alertdialog").getByRole("button", { name: "ログアウト" }).click();
	await expect(page).toHaveURL(/\/login/);
});

test("ADMIN は通知管理でき、USER は 403", async ({ page }) => {
	await loginAsAdmin(page);
	await page.getByLabel("プロフィールメニュー").click();
	await expect(page.getByRole("menuitem", { name: "グループユーザー管理" })).toBeVisible();
	await page.getByRole("menuitem", { name: "通知管理" }).click();
	await expect(page.getByRole("heading", { name: "通知管理" })).toBeVisible();

	const title = `e2e-notice-${Date.now()}`;
	await page.locator("#admin-notification-title").fill(title);
	await page.locator("#admin-notification-body").fill("e2e 本文");

	const createPromise = page.waitForResponse(
		(response) =>
			response.url().includes("/api/admin/notifications") &&
			response.request().method() === "POST",
	);
	await page.getByRole("button", { name: "追加" }).click();
	expect(
		(await createPromise).ok(),
		"POST /api/admin/notifications failed",
	).toBeTruthy();
	await expect(page.getByText(title)).toBeVisible();

	await page.getByLabel("プロフィールメニュー").click();
	await page.getByRole("menuitem", { name: "ログアウト" }).click();
	await page.getByRole("alertdialog").getByRole("button", { name: "ログアウト" }).click();
	await expect(page).toHaveURL(/\/login/);

	await loginAsUser(page);
	await page.getByLabel("プロフィールメニュー").click();
	await expect(page.getByRole("menuitem", { name: "マイページ" })).toBeVisible();
	await expect(page.getByRole("menuitem", { name: "通知管理" })).toHaveCount(0);
	await expect(page.getByRole("menuitem", { name: "グループユーザー管理" })).toHaveCount(0);

	await page.goto("/admin/notifications");
	await expect(
		page.getByRole("heading", { name: "アクセスできません" }),
	).toBeVisible();

	const forbidden = await page.request.get("/api/admin/notifications", {
		headers: currentClientApiVersionHeaders(),
	});
	expect(forbidden.status()).toBe(403);
	expect(await forbidden.json()).toEqual({ error: "forbidden" });

	await page.goto("/admin/groups");
	await expect(
		page.getByRole("heading", { name: "アクセスできません" }),
	).toBeVisible();

	const forbiddenGroups = await page.request.get("/api/admin/groups", {
		headers: currentClientApiVersionHeaders(),
	});
	expect(forbiddenGroups.status()).toBe(403);
	expect(await forbiddenGroups.json()).toEqual({ error: "forbidden" });
});
