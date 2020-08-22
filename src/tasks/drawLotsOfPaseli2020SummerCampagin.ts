import dayjs from "dayjs";
import { Page, ElementHandle } from "puppeteer";

export const drawLotsOfPaseli2020SummerCampagin = async (
  page: Page
): Promise<void> => {
  const limit = dayjs("2020-09-09T23:59:00+09:00");
  if (dayjs().isAfter(limit)) {
    return;
  }

  await page.goto(
    "https://p.eagate.573.jp/game/common/campaign/summer2020/campaign.html",
    { waitUntil: "domcontentloaded" }
  );
  const btn: ElementHandle<HTMLElement> = await page.waitForSelector(
    "#main-inner > div.cl_status > div.cl_status_ok > div > div.cl_draw_button.cl_drawable"
  );
  await btn.click();
};
