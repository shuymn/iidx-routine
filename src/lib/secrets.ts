import { SSM } from "aws-sdk";
import { log } from "./log";

const ssm = new SSM();

const getParameter = async (name: string): Promise<string> => {
  log.debug(`ssm.getParameter: name: ${name}`);

  const result = await ssm
    .getParameter({
      Name: `/iidx-routine/production/${name}`,
      WithDecryption: true,
    })
    .promise();

  if (result.Parameter == undefined || result.Parameter.Value == undefined) {
    throw new Error(`failed to get the ssm parameter. name: ${name}`);
  }

  return result.Parameter.Value;
};

// 2captcha
export const get2captchaApiKey = (): Promise<string> => getParameter("twocaptcha-api-key");

// konami
export const getKonamiId = (): Promise<string> => getParameter("konami-id");
export const getKonamiPassword = (): Promise<string> => getParameter("konami-password");

// ist
export const getIstId = (): Promise<string> => getParameter("ist-id");

export const getIstPassword = (): Promise<string> => getParameter("ist-password");

// cpi
export const getCpiId = (): Promise<string> => getParameter("cpi-id");
export const getCpiPassword = (): Promise<string> => getParameter("cpi-password");
