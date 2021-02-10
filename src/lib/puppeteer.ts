import * as chromium from "chrome-aws-lambda";
import { DirectNavigationOptions, Page, Response, Browser, ResourceType, Request } from "puppeteer";
import { log } from "./log";

const IMG_QPRO_PATTERN = /^https:\/\/p\.eagate\.573\.jp\/game\/2dx\/28\/common\/img_qpro\.html\?img=.+/g;
const ABORT_RESOURCE_TYPES: ResourceType[] = ["image", "font"];

const requestHandler = (request: Request): void => {
  if (
    ABORT_RESOURCE_TYPES.includes(request.resourceType()) &&
    request.url().match(IMG_QPRO_PATTERN) === null
  ) {
    // returnつかうとなんかおかしくなったような気がするのでこのままにしておく
    request.abort();
  } else {
    request.continue();
  }
};

export const launch = async (): Promise<Browser> => {
  return await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
};

export const newPage = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", requestHandler);
  return page;
};

export const checkElementExistance = async (page: Page, selector: string): Promise<boolean> => {
  const elements = await page.$$(selector);
  return elements.length !== 0;
};

/** puppeteerのpage.gotoのラッパー */
export const goto = async (
  page: Page,
  url: string,
  options?: DirectNavigationOptions | undefined
): Promise<Response | null> => {
  log.debug(`page.goto url: ${url} with options: ${JSON.stringify(options)}`);
  return await page.goto(url, options);
};

/** ログインページのURLとセレクタからログイン状態を確認する */
export const checkLoginStatus = async (
  page: Page,
  loginPageUrl: string,
  selector: string
): Promise<boolean> => {
  // チェックするためにページ遷移するので遷移前のURLをとっておく
  const initialUrl = page.url();
  log.debug(`initial url: ${initialUrl}`);

  // 遷移先のURLと違うのであれば移動する
  if (initialUrl !== loginPageUrl) {
    await goto(page, loginPageUrl, { waitUntil: "domcontentloaded" });
  }

  try {
    await page.waitForSelector(selector, { timeout: 5 * 1000 });
  } catch (e) {
    return false;
  }

  // 遷移前と違うURLであれば元のURLに移動する
  if (initialUrl !== page.url()) {
    // newPage() 直後だとおそらく page.url() が about:blank になるので、そこでバグるかも？
    // playgroundで検証したところ例外が起きるわけではなかったので放置
    await goto(page, initialUrl, { waitUntil: "domcontentloaded" });
  }

  return true;
};
