import { Page, ElementHandle } from "puppeteer";
import { KONAMI_PASSWORD, KONAMI_ID } from "./consts";

export const login = async (page: Page): Promise<void> => {
  await page.goto("https://p.eagate.573.jp/", {
    waitUntil: "domcontentloaded",
  });
  await page.evaluate("ea_common_template.login.show_loginform();");

  const id = await page.waitForSelector("input[type='text']");
  await id.type(KONAMI_ID);

  const pw = await page.waitForSelector("input[type='password']");
  await pw.type(KONAMI_PASSWORD);

  const button: ElementHandle<HTMLElement> = await page.waitForSelector(
    ".cl_captchakindchg_btn"
  );
  await button.click();

  await page.solveRecaptchas();

  await Promise.all([
    page.click("button[type='submit']"),
    page.waitForNavigation(),
  ]);
};
