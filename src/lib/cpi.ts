import { Page } from "puppeteer";
import { getCookie } from "./cookie";
import { DynamoDb } from "./dynamodb";
import { ApplicationError, CookieNotFoundError } from "./errors";
import { checkLoginStatus, goto } from "./puppeteer";
import { getCpiId, getCpiPassword } from "./secrets";

export const LOGIN_PAGE_URL = "https://cpi.makecir.com/users/login";
const COOKIE_KEY_ID = "PHPSESSID#cpi.makecir.com";

const getLoginCookie = async (dynamodb: DynamoDb, page: Page): Promise<void> => {
  try {
    const result = await dynamodb.get({ Key: { id: COOKIE_KEY_ID } });
    if (result === null || result.Item === undefined) {
      throw new CookieNotFoundError();
    }
    await page.setCookie({
      name: result.Item.name,
      value: result.Item.value,
      domain: result.Item.domain,
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    return;
  } catch (e) {
    if (e instanceof ApplicationError) {
      return;
    }
    throw e;
  }
};

const putLoginCookie = async (dynamodb: DynamoDb, page: Page): Promise<void> => {
  const [name, domain] = COOKIE_KEY_ID.split("#");
  const ssid = getCookie(await page.cookies(), name, domain);

  await dynamodb.put({
    Item: {
      id: [ssid.name, ssid.domain].join("#"),
      name: ssid.name,
      value: ssid.value,
      domain: ssid.domain,
    },
  });
};

const checkLoginStatusOfCpi = (page: Page): Promise<boolean> =>
  checkLoginStatus(page, LOGIN_PAGE_URL, "#bd-cur-user");

/** Clear Power Indicator にログインする */
export const loginToCpi = async (dynamodb: DynamoDb, page: Page): Promise<void> => {
  // ログインしてるか確認する
  let isLogined: boolean = await checkLoginStatusOfCpi(page);

  if (isLogined) {
    return;
  }

  // セッションクッキーをとってくる
  await getLoginCookie(dynamodb, page);
  isLogined = await checkLoginStatusOfCpi(page);

  if (isLogined) {
    return;
  }

  // ログインする
  await goto(page, LOGIN_PAGE_URL, { waitUntil: "domcontentloaded" });
  const id = await page.waitForSelector("#username");
  await id.type(await getCpiId());

  const pw = await page.waitForSelector("#password");
  await pw.type(await getCpiPassword());

  await Promise.all([
    page.click("button[type='submit']"),
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
  ]);

  await putLoginCookie(dynamodb, page);
};
