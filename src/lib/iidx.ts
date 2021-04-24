import { ElementHandle, Page } from "puppeteer-core";
import { DynamoDb } from "./dynamodb";
import { loginToEagate } from "./eagate";
import { goto } from "./puppeteer";

const SCORE_PAGE_URL = "https://p.eagate.573.jp/game/2dx/28/djdata/score_download.html";

export const getScore = async (dynamodb: DynamoDb, page: Page): Promise<string> => {
  const initialUrl = page.url();

  await loginToEagate(dynamodb, page);

  await goto(page, SCORE_PAGE_URL, { waitUntil: "domcontentloaded" });

  const btn = await page.waitForSelector("#dl-style > form > div > input[value=SP]");
  if (btn == null) {
    throw new Error("cound not find the button to get the score data");
  }
  await btn.click();
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  const textarea: ElementHandle<HTMLTextAreaElement> | null = await page.waitForSelector(
    "#score_data"
  );
  if (textarea == null) {
    throw new Error("could not find the textarea of score data");
  }

  const score = await textarea.evaluate((element) => element.value);

  if (initialUrl !== SCORE_PAGE_URL) {
    await goto(page, initialUrl, { waitUntil: "domcontentloaded" });
  }

  return score;
};
