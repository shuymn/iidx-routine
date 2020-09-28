import { ElementHandle, Page } from "puppeteer";
import { loginToCpi, LOGIN_PAGE_URL } from "../lib/cpi";
import { DynamoDb } from "../lib/dynamodb";
import { getScore } from "../lib/iidx";
import { log } from "../lib/log";
import { checkElementExistance, goto } from "../lib/puppeteer";

const MessageType = ["success", "warning", "error"] as const;
type MessageType = typeof MessageType[keyof typeof MessageType];

const checkMessageType = async (page: Page): Promise<MessageType> => {
  const successSelector = "body > main > div > div.message.success";
  const warningSelector = "body > main > div > div.message.warning";
  const errorSelector = "body > main > div > div.message.error";

  if (await checkElementExistance(page, successSelector)) {
    return "success";
  }

  if (await checkElementExistance(page, warningSelector)) {
    return "warning";
  }

  if (await checkElementExistance(page, errorSelector)) {
    return "error";
  }

  throw new Error("cannot find any messages");
};

export const uploadScoreToCpi = async (dynamodb: DynamoDb, page: Page): Promise<void> => {
  try {
    // ログインする
    await loginToCpi(dynamodb, page);

    // ログイン状態でログインページに行くとマイページにリダイレクトするのでそれを利用してマイページに行く
    // (マイページのURLにはユーザの内部IDが必要)
    await goto(page, LOGIN_PAGE_URL, { waitUntil: "domcontentloaded" });

    // スコアを更新するページに行く
    const anchor: ElementHandle<HTMLAnchorElement> = await page.waitForSelector(
      "body > main > div > div > div:nth-child(1) > div.card-header.padding-sm > a"
    );
    const href = await anchor.evaluate((element) => element.href);
    await goto(page, href, { waitUntil: "domcontentloaded" });

    // iidxのページからスコアをとってくる
    const score = await getScore(dynamodb, page);
    // スコアをテキストエリアに貼り付ける
    await page.evaluate((text) => {
      const textarea = document.querySelector<HTMLTextAreaElement>("#upload-text");
      if (textarea !== null) {
        textarea.value = text;
      }
    }, score);

    // CPIを更新する
    await page.click("#upload-playtext");
    await page.waitForNavigation({
      waitUntil: "domcontentloaded",
      // 推定に20秒ほど時間がかかるので、念の為タイムアウトまでの時間を伸ばしておく
      timeout: 60 * 1000,
    });

    // 更新結果を取得するために更新タイプを取得する
    // success: 更新した
    // warning: 更新がなかった
    // error: なにかあった
    const type = await checkMessageType(page);
    if (type !== "success") {
      return;
    }

    // 更新後のCPIを取得する
    const cpi = await page.waitForSelector(
      "body > main > div > div.users.view.content > div:nth-child(1) > div.card-body.pr-3.pl-3 > div > div.row > div.col-md-5.col-lg-4 > div:nth-child(2)"
    );
    const cpiValue = await cpi.evaluate((element) => element.textContent);
    if (cpiValue !== null) {
      // TODO: そのうちSlackとかに通知する
      log.info(cpiValue.replace(/\s+/g, ""));
    }

    // 更新後の順位を取得する
    const rank = await page.waitForSelector(
      "body > main > div > div.users.view.content > div:nth-child(1) > div.card-body.pr-3.pl-3 > div > div.row > div.col-md-5.col-lg-4 > div:nth-child(3)"
    );
    const rankValue = await rank.evaluate((element) => element.textContent);
    if (rankValue !== null) {
      // TODO: そのうちSlackとかに通知する
      log.info(rankValue.replace(/\s+/g, ""));
    }
  } catch (err) {
    log.warn(err);
  }
};
