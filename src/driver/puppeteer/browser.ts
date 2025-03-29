import puppeteer from "rebrowser-puppeteer-core";
import { Browser } from "rebrowser-puppeteer-core";
import { pageController, PageWithCursor } from "./pageController";
import { ChromeFactory } from "../chrome/chromeFactory";

let Xvfb;
try {
  Xvfb = require("xvfb");
} catch {
  // ignore
}

type ConnectResult = {
  browser: Browser;
  page: PageWithCursor;
};

interface Options {
  args?: string[];
  headless?: boolean;
  customConfig?: import("chrome-launcher").Options;
  proxy?: ProxyOptions;
  turnstile?: boolean;
  connectOption?: import("rebrowser-puppeteer-core").ConnectOptions;
  disableXvfb?: boolean;
  ignoreAllFlags?: boolean;
  remoteChrome?: boolean;
}

export interface ProxyOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export async function connect({
  args = [],
  headless = false,
  customConfig = {},
  proxy = undefined,
  turnstile = false,
  connectOption = {},
  disableXvfb = false,
  ignoreAllFlags = false,
  remoteChrome = false,
}: Options = {}): Promise<ConnectResult> {
  const dynamicImport = new Function('specifier', 'return import(specifier)');
  const { Launcher } = await dynamicImport('chrome-launcher');

  let xvfbsession;

  if (process.platform === "linux" && disableXvfb === false) {
    try {
      xvfbsession = new Xvfb({
        silent: true,
        xvfb_args: ["-screen", "0", "1920x1080x24", "-ac"],
      });
      xvfbsession.startSync();
    } catch (err) {
      console.warn(
        "You are running on a Linux platform but do not have xvfb installed. The browser can be captured. Please install it with the following command `sudo apt-get install xvfb`" +
          err
      );
    }
  }

  let chromeFlags;
  if (ignoreAllFlags === true) {
    chromeFlags = [
      ...args,
      ...(headless !== false ? [`--headless=${headless}`] : []),
      ...(proxy && proxy.host && proxy.port
        ? [`--proxy-server=${proxy.host}:${proxy.port}`]
        : []),
    ];
  } else {
    // Default flags: https://github.com/GoogleChrome/chrome-launcher/blob/main/src/flags.ts
    const flags = Launcher.defaultFlags();
    // Add AutomationControlled to "disable-features" flag
    const indexDisableFeatures = flags.findIndex((flag) => flag.startsWith('--disable-features'));
    flags[indexDisableFeatures] = `${flags[indexDisableFeatures]},AutomationControlled`;
    // Remove "disable-component-update" flag
    const indexComponentUpdateFlag = flags.findIndex((flag) => flag.startsWith('--disable-component-update'));
    flags.splice(indexComponentUpdateFlag, 1);
    chromeFlags = [
      ...flags,
      ...args,
      ...(headless !== false ? [`--headless=${headless}`] : []),
      ...(proxy && proxy.host && proxy.port
        ? [`--proxy-server=${proxy.host}:${proxy.port}`]
        : []),
      "--no-sandbox",
      "--disable-dev-shm-usage",
    ];
  }

  const chrome = await ChromeFactory.launch(remoteChrome, {
    ignoreDefaultFlags: true,
    chromeFlags,
    ...customConfig,
  });

  const browser = await puppeteer.connect({
    browserURL: chrome.url,
    ...connectOption,
  });

  let [page] = await browser.pages();

  let pageControllerConfig = {
    browser,
    page,
    proxy,
    turnstile,
    xvfbsession
  };

  let pageWithCursor = await pageController({
    ...pageControllerConfig,
    killProcess: true,
    chrome,
  });

  browser.on("targetcreated", async (target) => {
    if (target.type() === "page") {
      let newPage = await target.page();
      if(newPage !== null) {
        pageControllerConfig.page = newPage;
        newPage = await pageController({
          ...pageControllerConfig,
          killProcess: false
        });
      }
    }
  });

  return {
    browser,
    page: pageWithCursor,
  };
}
