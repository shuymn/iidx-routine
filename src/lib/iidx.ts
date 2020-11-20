import { Page, ElementHandle } from "puppeteer";
import { DynamoDb } from "./dynamodb";
import { loginToEagate } from "./eagate";
import { goto } from "./puppeteer";

const SCORE_PAGE_URL = "https://p.eagate.573.jp/game/2dx/28/djdata/score_download.html";

export const getScore = async (dynamodb: DynamoDb, page: Page): Promise<string> => {
  const initialUrl = page.url();

  await loginToEagate(dynamodb, page);

  await goto(page, SCORE_PAGE_URL, { waitUntil: "domcontentloaded" });

  const btn = await page.waitForSelector("#dl-style > form > div > input[value=SP]");
  await btn.click();
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  const textarea: ElementHandle<HTMLTextAreaElement> = await page.waitForSelector("#score_data");
  const score = await textarea.evaluate((element) => element.value);

  if (initialUrl !== SCORE_PAGE_URL) {
    await goto(page, initialUrl, { waitUntil: "domcontentloaded" });
  }

  return score;
};
