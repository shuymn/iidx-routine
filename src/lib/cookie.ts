import { Cookie } from "puppeteer";

export const getCookie = (cookies: Cookie[], name: string, domain: string): Cookie => {
  const ssid = cookies.find((cookie) => cookie.name === name && cookie.domain === domain);
  if (ssid === undefined) {
    throw new Error(`cookie name: ${name} is not found after login succeeded`);
  }
  return ssid;
};
