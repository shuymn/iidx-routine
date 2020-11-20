import { ElementHandle, Page } from "puppeteer";
import { DynamoDb } from "../lib/dynamodb";
import { loginToEagate } from "../lib/eagate";
import { log } from "../lib/log";
import { goto } from "../lib/puppeteer";
import { getIstId, getIstPassword } from "../lib/secrets";

export const uploadScoreToIst = async (dynamodb: DynamoDb, page: Page): Promise<void> => {
  try {
    await loginToEagate(dynamodb, page);

    // iidxの公式ページならどこでもいいので、とりあえずトップページに行く
    await goto(page, "https://p.eagate.573.jp/game/2dx/28/top/index.html", {
      waitUntil: "domcontentloaded",
    });

    await page.evaluate(() => {
      // スコアを送信するスクリプトを読み込む
      const element = document.createElement("script");
      element.id = "iidx-score-table";
      element.type = "text/javascript";
      element.src = "https://ist-loader.web.app/loader.js";
      document.head.appendChild(element);
    });

    // スクリプトを実行すると表示されるログインフォームに必要事項を入力する
    const id = await page.waitForSelector("input[type='email']");
    await id.type(await getIstId());

    const pw = await page.waitForSelector("input[type='password']");
    await pw.type(await getIstPassword());

    // ログインボタンを押す
    await page.click("button.button.is-large.is-info");

    // スコアを取得するボタンを待つ
    const btn: ElementHandle<HTMLButtonElement> = await page.waitForSelector(
      "#iidxScoreTable > section > div > div:nth-child(5) > button:nth-child(1)"
    );

    // ボタンが出現したとしても、 .is-loading があると押しても送信されないので、
    // mutatioh observerを使って要素の変更を検知し、 .is-loadingが外れるまで待つ
    await btn.evaluate((element) => {
      // ネットワークスピードによっては取得した瞬間には.is-loadingが外れてることもある
      if (!element.classList.contains("is-loading")) {
        return element.click();
      }
      const observer = new MutationObserver((records) =>
        records.forEach((record) => {
          const target = record.target as HTMLButtonElement;
          if (!target.classList.contains("is-loading")) {
            target.click();
          }
        })
      );

      // 子の監視はしない & 要素はクラス要素だけ監視する
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["class"],
      });
    });

    // 送信完了するまで待つ
    await page.waitForSelector("#iidxScoreTable > section > div > table > tbody > tr:nth-child(3)");
  } catch (err) {
    log.warn(err);
  }
};
