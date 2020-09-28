import * as dayjs from "dayjs";
import { Page, ElementHandle } from "puppeteer";
import { DynamoDb } from "../lib/dynamodb";
import { loginToEagate } from "../lib/eagate";
import { log } from "../lib/log";
import { goto } from "../lib/puppeteer";

const EVENT_END_DATE = "2020-10-29T23:59:00+09:00";

// カードの枚数が3枚なので*3する
const choiceCardNumber = (): number => Math.floor(Math.random() * 3);

const isAfterEventEnd = (): boolean => {
  const now = dayjs();
  const limit = dayjs(EVENT_END_DATE);
  return now.isAfter(limit);
};

export const drawCardsOfNonoRush = async (dynamodb: DynamoDb, page: Page): Promise<void> => {
  // イベントが終わっていたら終了する
  if (isAfterEventEnd()) {
    log.warn(`nono rush has already ended. date: ${EVENT_END_DATE}`);
    return;
  }

  try {
    await loginToEagate(dynamodb, page);

    // イベントページに行く
    await goto(page, "https://p.eagate.573.jp/game/bemani/wbr2020/01/card.html", {
      waitUntil: "domcontentloaded",
    });

    // すでに今日の分をやっていたらスキップ
    if ((await page.$(".done")) !== null) {
      return;
    }

    // 引くカードを適当に選ぶ
    const sel = "#card" + choiceCardNumber();
    const card: ElementHandle<HTMLElement> = await page.waitForSelector(sel);

    // カードを引く
    // TODO: 結果を出力したい
    await Promise.all([card.evaluate((element) => element.click()), page.waitForNavigation()]);
  } catch (err) {
    log.warn(err);
  }
};
