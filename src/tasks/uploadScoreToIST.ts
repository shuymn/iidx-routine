import { Page } from "puppeteer";
import { IIDX_TOP_URL, IST_ID, IST_PASSWORD } from "../consts";

export const uploadScoreToIST = async (page: Page): Promise<void> => {
  try {
    await page.goto(IIDX_TOP_URL, { waitUntil: "domcontentloaded" });

    await page.evaluate(() => {
      const element = document.createElement("script");
      element.id = "iidx-score-table";
      element.type = "text/javascript";
      element.src = "https://ist-loader.web.app/loader.js";
      document.head.appendChild(element);
    });

    const id = await page.waitForSelector("input[type='email']");
    await id.type(IST_ID);

    const pw = await page.waitForSelector("input[type='password']");
    await pw.type(IST_PASSWORD);

    await page.click("button.button.is-large.is-info");

    const btn = await page.waitForSelector(
      "#iidxScoreTable > section > div > div:nth-child(5) > button:nth-child(1)"
    );

    await btn.evaluate((element) => {
      const observer = new MutationObserver((records) =>
        records.forEach((record) => {
          const target = record.target as HTMLButtonElement;
          if (target.classList.contains("is-loading")) {
            return;
          }
          target.click();
        })
      );

      observer.observe(element, {
        attributes: true,
        attributeFilter: ["class"],
      });
    });
  } catch (err) {
    console.log(err);
  }
};
