import dayjs from "dayjs";
import { Page, ElementHandle } from "puppeteer";

const choiceCardNumber = (): number => {
  return Math.floor(Math.random() * 3);
};

export const drawCardsOfNonoRush = async (page: Page): Promise<void> => {
  const limit = dayjs("2020-10-29T23:59:00+09:00");
  if (dayjs().isAfter(limit)) {
    return;
  }

  await page.goto("https://p.eagate.573.jp/game/bemani/wbr2020/01/card.html", {
    waitUntil: "domcontentloaded",
  });

  const sel = "#card" + choiceCardNumber();
  const card: ElementHandle<HTMLElement> = await page.waitForSelector(sel);
  await Promise.all([
    card.evaluate((element) => element.click()),
    page.waitForNavigation(),
  ]);
};
