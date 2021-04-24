import { Protocol } from "puppeteer-core";

export const getCookie = (
  cookies: Protocol.Network.Cookie[],
  name: string,
  domain: string
): Protocol.Network.Cookie => {
  const ssid = cookies.find((cookie) => cookie.name === name && cookie.domain === domain);
  if (ssid === undefined) {
    throw new Error(`cookie name: ${name} is not found after login succeeded`);
  }
  return ssid;
};
