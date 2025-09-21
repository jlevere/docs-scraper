import { chromium, type Browser, type Page } from "playwright";
import type { RenderResult, ScrapeConfig } from "./types";
import { MAIN_CONTAINER_SELECTORS, PRUNE_STRIP_SELECTORS } from "./dom";

async function createBrowser(): Promise<Browser> {
  const browser = await chromium.launch({ headless: true });
  return browser;
}

async function preparePage(browser: Browser, config: ScrapeConfig): Promise<Page> {
  const context = await browser.newContext({ userAgent: config.userAgent });
  const page = await context.newPage();
  // Block non-essential resources (media, images, fonts, stylesheets)
  await page.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (type === "image" || type === "media" || type === "font" || type === "stylesheet") {
      return route.abort();
    }
    return route.continue();
  });
  await page.emulateMedia({ media: "print" });
  return page;
}

export async function renderPage(config: ScrapeConfig, url: string): Promise<RenderResult> {
  const browser = await createBrowser();
  try {
    const page = await preparePage(browser, config);
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
    if (!response) throw new Error(`Navigation failed: ${url}`);

    // Ensure content is present
    await page.waitForSelector("main, article, body", { timeout: 60_000 });

    const result = await page.evaluate((
      { selectors, mainSelectors }: { selectors: readonly string[]; mainSelectors: readonly string[] }
    ) => {
      function removeHidden(node: Element): void {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") {
          node.remove();
          return;
        }
        for (const child of Array.from(node.children)) removeHidden(child);
      }

      function stripChrome(root: Document | Element, stripSelectors: readonly string[]): void {
        for (const sel of stripSelectors) for (const el of Array.from(root.querySelectorAll(sel))) el.remove();
      }

      function pickMain(root: Document, candidates: readonly string[]): Element {
        for (const sel of candidates) {
          const found = root.querySelector(sel);
          if (found) return found;
        }
        return root.body;
      }

      const main = pickMain(document, mainSelectors);
      stripChrome(document, selectors);
      removeHidden(main);

      const html = main.innerHTML;
      const title = document.querySelector("h1")?.textContent?.trim() || document.title || "Untitled";
      const canonicalUrl = location.href;
      return { html, title, canonicalUrl };
    }, { selectors: PRUNE_STRIP_SELECTORS, mainSelectors: MAIN_CONTAINER_SELECTORS });

    return result as RenderResult;
  } finally {
    await browser.close();
  }
}


