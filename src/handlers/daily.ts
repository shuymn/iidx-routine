import { Browser, Page } from "puppeteer";
import { DynamoDb } from "../lib/dynamodb";
import { log, LogLevel } from "../lib/log";
import { newPage, launch } from "../lib/puppeteer";
import { drawCardsOfNonoRush } from "../routines/draw-cards-of-nono-rush";
import { uploadScoreToCpi } from "../routines/upload-score-to-cpi";
import { uploadScoreToIst } from "../routines/upload-score-to-ist";

const doRoutines = async (dynamodb: DynamoDb, page: Page): Promise<void> => {
  // 毎週！いちかの超BEMANIラッシュ2020
  await drawCardsOfNonoRush(dynamodb, page);
  // IIDX Score Table
  await uploadScoreToIst(dynamodb, page);
  // Clear Power Indicator
  await uploadScoreToCpi(dynamodb, page);
};

export const handler = async (): Promise<void> => {
  log.setLevel(process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.WARN);

  let browser: Browser | null = null;

  try {
    browser = await launch();
    const page = await newPage(browser);
    const dynamodb = new DynamoDb();

    await doRoutines(dynamodb, page);

    log.info("finish");
  } catch (err) {
    log.error(err);
  } finally {
    if (browser !== null) {
      await browser.close();
      log.info("browser closed");
    }
  }
};
