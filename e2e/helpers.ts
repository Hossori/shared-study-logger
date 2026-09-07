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
  await expect(
    page.getByRole("heading", { name: "📚 学習記録シェア" }),
  ).toBeVisible();
}

export async function openPostModal(page: Page): Promise<void> {
  await page.getByRole("button", { name: "記録を追加" }).click();
  await expect(
    page.getByRole("heading", { name: "学習記録を投稿" }),
  ).toBeVisible();
}

function studyTimeDialog(page: Page) {
  return page.getByRole("dialog", { name: "学習日時を設定" });
}

export async function fillStudyDatetime(
  page: Page,
  idPrefix: string,
  date: string,
  hour: number,
  minute: number,
): Promise<void> {
  const dialog = studyTimeDialog(page);
  if (!(await dialog.isVisible())) {
    await page.getByRole("button", { name: "学習日時を設定" }).click();
    await expect(dialog).toBeVisible();
  }

  const dateTrigger = dialog.locator(`#${idPrefix}-studyDate`);
  if ((await dateTrigger.getAttribute("aria-expanded")) !== "true") {
    await dateTrigger.click();
  }
  const datePicker = page.locator(`#${idPrefix}-date-picker`);
  await expect(datePicker).toBeVisible();

  const dateButton = datePicker.locator(`#${idPrefix}-date-${date}`);
  for (
    let attempt = 0;
    attempt < 14 && !(await dateButton.isVisible());
    attempt += 1
  ) {
    const [year, month] = date.split("-").map(Number);
    const caption = datePicker.locator(".rdp-month_caption");
    await expect(caption).toBeVisible();
    const captionText = (await caption.textContent()) ?? "";
    const currentYear = Number(/\d{4}/.exec(captionText)?.[0]);
    const currentMonthMatch = /(\d{1,2})月/.exec(captionText);
    const currentMonth = currentMonthMatch ? Number(currentMonthMatch[1]) : NaN;
    if (currentYear === year && currentMonth === month) {
      break;
    }
    const goBack =
      currentYear > year || (currentYear === year && currentMonth > month);
    const navButton = datePicker.getByRole("button", {
      name: goBack ? "前の月へ" : "次の月へ",
    });
    await navButton.click();
  }
  await dateButton.click();
  await expect(datePicker).toBeHidden();

  const startTrigger = dialog.locator(`#${idPrefix}-startTime`);
  if ((await startTrigger.getAttribute("aria-expanded")) !== "true") {
    await startTrigger.click();
  }
  const startPicker = page.locator(`#${idPrefix}-start-time-picker`);
  await expect(startPicker).toBeVisible();
  await startPicker.locator(`#${idPrefix}-start-hour-${hour}`).click();
  await startPicker.locator(`#${idPrefix}-start-minute-${minute}`).click();
  await expect(startPicker).toBeHidden();
}

export async function setStudyDurationFromPicker(
  page: Page,
  idPrefix: string,
  options: { buttonName: string; expectedLabel: string },
): Promise<void> {
  const dialog = studyTimeDialog(page);
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: options.buttonName }).click();
  await expect(dialog.getByText(options.expectedLabel, { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "OK" }).click();
  await expect(dialog).toBeHidden();
}
