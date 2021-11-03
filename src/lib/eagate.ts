import dayjs from "dayjs";
import { Page } from "puppeteer-core";
import { getCookie } from "./cookie";
import { DynamoDb } from "./dynamodb";
import { ApplicationError, CookieExpiredError, CookieNotFoundError } from "./errors";
import { checkLoginStatus, goto } from "./puppeteer";
import { getKonamiId, getKonamiPassword } from "./secrets";

const LOGIN_PAGE_URL = "https://p.eagate.573.jp/";
const COOKIE_KEY_ID = "M573SSID#p.eagate.573.jp";

/** セッションクッキーをDynamoDBから取得し、ブラウザにセットする */
const getLoginCookie = async (dynamodb: DynamoDb, page: Page): Promise<void> => {
  try {
    // dynamodbからsession cookieを取得
    const result = await dynamodb.get({ Key: { id: COOKIE_KEY_ID } });
    if (result === null || result.Item === undefined) {
      // dynamodbになかったら
      throw new CookieNotFoundError();
    }

    // あったらexpireしてるか確認する
    const now = dayjs();
    const expires = dayjs.unix(result.Item.expires);
    if (now.isAfter(expires)) {
      // expireしていたら
      // dynamodbのrecordは削除しない(どうせputで上書きするので)
      throw new CookieExpiredError();
    }

    // cookieをセット
    await page.setCookie({
      name: result.Item.name,
      value: result.Item.value,
      domain: result.Item.domain,
    });

    // とりあえずリロード
    await page.reload({ waitUntil: "domcontentloaded" });

    return;
  } catch (e) {
    if (e instanceof ApplicationError) {
      return;
    }
    throw e;
  }
};

/** セッションクッキーをDynamoDBにアップする */
const putLoginCookie = async (dynamodb: DynamoDb, page: Page): Promise<void> => {
  const [name, domain] = COOKIE_KEY_ID.split("#");
  const ssid = getCookie(await page.cookies(), name, domain);

  await dynamodb.put({
    Item: {
      id: [ssid.name, ssid.domain].join("#"),
      name: ssid.name,
      value: ssid.value,
      domain: ssid.domain,
      expires: Math.floor(ssid.expires),
    },
  });
};

/** ログイン状態を確認する */
const checkLoginStatusOfEagate = (page: Page): Promise<boolean> =>
  checkLoginStatus(
    page,
    LOGIN_PAGE_URL,
    "#id_nav_menu_3 > div > p > span.cl_ea_variable_document > a"
  );

const isMaintainance = async (page: Page): Promise<boolean> => {
  await goto(page, LOGIN_PAGE_URL, { waitUntil: "domcontentloaded" });
  const div = await page.$("#id_ea_common_content > div > div > div");
  if (div === null) {
    return false;
  }

  return await div.evaluate(
    (element: Element) =>
      Array.from(element.childNodes).find(
        (node) =>
          node.nodeName === "SPAN" &&
          node.textContent !== null &&
          node.textContent.match(/メンテナンス/) !== null
      ) !== undefined
  );
};

/** e-amusement gate にログインする */
export const loginToEagate = async (dynamodb: DynamoDb, page: Page): Promise<void> => {
  if (await isMaintainance(page)) {
    throw new Error(`under maintainance. url: ${LOGIN_PAGE_URL}`);
  }

  // ログイン状態を取得する
  let isLogined: boolean = await checkLoginStatusOfEagate(page);

  // すでにログインしてたら終了
  if (isLogined) {
    return;
  }

  // セッションクッキーをとってくる
  await getLoginCookie(dynamodb, page);
  isLogined = await checkLoginStatusOfEagate(page);

  // ログインできたら終わり
  if (isLogined) {
    return;
  }

  // ログインする
  await goto(page, LOGIN_PAGE_URL, { waitUntil: "domcontentloaded" });
  await Promise.all([
    page.evaluate("ea_common_template.login.show_loginform();"),
    page.waitForNavigation(),
  ]);

  const id = await page.waitForSelector("input[type='text']");
  if (id == null) {
    throw new Error("could not find the input form of konami id");
  }
  await id.type(await getKonamiId());

  const pw = await page.waitForSelector("input[type='password']");
  if (pw == null) {
    throw new Error("could not find the input form of konami password");
  }
  await pw.type(await getKonamiPassword());

  await Promise.all([page.click("#login-form > div.btn-area > p > a"), page.waitForNavigation()]);

  await putLoginCookie(dynamodb, page);
};
