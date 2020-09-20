import { ElementHandle, Page } from "puppeteer";
import { CPI_ID, CPI_PASSWORD } from "../consts";

const getScore = async (page: Page): Promise<string> => {
  await page.goto(
    "https://p.eagate.573.jp/game/2dx/27/djdata/score_download.html",
    { waitUntil: "domcontentloaded" }
  );

  const btn = await page.waitForSelector(
    "#dl-style > form > div > input[value=SP]"
  );

  await btn.click();
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  const textarea: ElementHandle<HTMLTextAreaElement> = await page.waitForSelector(
    "#score_data"
  );
  return await textarea.evaluate((element) => element.value);
};

const loginToCPI = async (page: Page): Promise<void> => {
  await page.goto("https://cpi.makecir.com/users/login", {
    waitUntil: "domcontentloaded",
  });

  const id = await page.waitForSelector("#username");
  await id.type(CPI_ID);

  const pw = await page.waitForSelector("#password");
  await pw.type(CPI_PASSWORD);

  await Promise.all([
    page.click("button[type='submit']"),
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
  ]);
};

const MessageType = ["success", "warning", "error"] as const;
type MessageType = typeof MessageType[keyof typeof MessageType];

const checkExistance = async (page: Page, selector: string): Promise<boolean> =>
  await page.evaluate(
    (sel: string) => document.querySelectorAll(sel).length > 0,
    selector
  );

const checkMessageType = async (page: Page): Promise<MessageType> => {
  const successSelector = "body > main > div > div.message.success";
  const warningSelector = "body > main > div > div.message.warning";
  const errorSelector = "body > main > div > div.message.error";

  if (await checkExistance(page, successSelector)) {
    return "success";
  }

  if (await checkExistance(page, warningSelector)) {
    return "warning";
  }

  if (await checkExistance(page, errorSelector)) {
    return "error";
  }

  throw new Error("cannot find any messages");
};

export const uploadScoreToCPI = async (page: Page): Promise<void> => {
  try {
    const score = await getScore(page);
    await loginToCPI(page);

    const anchor: ElementHandle<HTMLAnchorElement> = await page.waitForSelector(
      "body > main > div > div > div:nth-child(1) > div.card-header.padding-sm > a"
    );
    const href = await anchor.evaluate((element) => element.href);

    await page.goto(href, { waitUntil: "domcontentloaded" });

    await page.evaluate((text) => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        "#upload-text"
      );
      if (textarea === null) {
        return;
      }
      textarea.value = text;
    }, score);

    await page.click("#upload-playtext");
    await page.waitForNavigation({
      waitUntil: "domcontentloaded",
      // 推定に20秒ほど時間がかかるので、念の為タイムアウトまでの時間を伸ばしておく
      timeout: 60 * 1000,
    });

    const type = await checkMessageType(page);

    if (type !== "success") {
      return;
    }

    const cpi = await page.waitForSelector(
      "body > main > div > div.users.view.content > div:nth-child(1) > div.card-body.pr-3.pl-3 > div > div.row > div.col-md-5.col-lg-4 > div:nth-child(2)"
    );

    const cpiValue = await cpi.evaluate((element) => element.textContent);
    if (cpiValue !== null) {
      console.log(cpiValue.replace(/\s+/g, ""));
    }

    const rank = await page.waitForSelector(
      "body > main > div > div.users.view.content > div:nth-child(1) > div.card-body.pr-3.pl-3 > div > div.row > div.col-md-5.col-lg-4 > div:nth-child(3)"
    );

    const rankValue = await rank.evaluate((element) => element.textContent);
    if (rankValue !== null) {
      console.log(rankValue.replace(/\s+/g, ""));
    }
  } catch (err) {
    console.log(err);
  }
};
