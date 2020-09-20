import { LaunchOptions, ResourceType } from "puppeteer";
import puppeteer from "puppeteer-extra";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import { TWOCAPTCHA_API_KEY, NODE_ENV } from "./consts";
import { login } from "./login";
import { drawCardsOfNonoRush } from "./tasks/drawCardsOfNonoRush";
import { uploadScoreToCPI } from "./tasks/uploadScoreToCPI";
import { uploadScoreToIST } from "./tasks/uploadScoreToIST";

(async () => {
  puppeteer.use(
    RecaptchaPlugin({ provider: { id: "2captcha", token: TWOCAPTCHA_API_KEY } })
  );

  const options: LaunchOptions = {
    headless: NODE_ENV === "development" ? false : true,
  };

  const browser = await puppeteer.launch(options);

  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const regex = /^https:\/\/p\.eagate\.573\.jp\/game\/2dx\/27\/common\/img_qpro\.html\?img=.*/g;
      const types: ResourceType[] = ["image", "font"];
      if (
        req.url().match(regex) === null &&
        types.includes(req.resourceType())
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await login(page);

    // event
    await drawCardsOfNonoRush(page);

    // score
    await uploadScoreToCPI(page);
    await uploadScoreToIST(page);
  } catch (err) {
    console.log(err);
  } finally {
    await browser.close();
  }
})();
