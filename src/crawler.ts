import { promises as fs } from "node:fs";
import path from "node:path";
import { PlaywrightCrawler, log } from "crawlee";
import type { ScrapeConfig } from "./types";
import { canonicalizeUrl } from "./paths";
import { convertHtmlToMarkdown } from "./convert";
import { MAIN_CONTAINER_SELECTORS, PRUNE_STRIP_SELECTORS } from "./dom";

export async function runCrawler(config: ScrapeConfig): Promise<void> {
  const allowPrefix = canonicalizeUrl(config.allowPrefix).toString();
  const seed = canonicalizeUrl(config.seedUrl).toString();
  await fs.mkdir(config.outDir, { recursive: true });

  const toc = new Set<string>();

  const crawler = new PlaywrightCrawler({
    maxConcurrency: Math.max(1, config.concurrency),
    requestHandlerTimeoutSecs: 180,
    requestHandler: async ({ page, request, enqueueLinks, requestQueue }) => {
      await page.emulateMedia({ media: "print" });
      await page.setExtraHTTPHeaders({ "user-agent": config.userAgent });
      await page.goto(request.url, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await page.waitForSelector("main, article, body", { timeout: 60_000 });

      const { html, title, canonicalUrl } = await page.evaluate((
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

        const inner = main.innerHTML;
        const ttl = document.querySelector("h1")?.textContent?.trim() || document.title || "Untitled";
        const canon = location.href;
        return { html: inner, title: ttl, canonicalUrl: canon };
      }, { selectors: PRUNE_STRIP_SELECTORS, mainSelectors: MAIN_CONTAINER_SELECTORS });

      const converted = await convertHtmlToMarkdown(config, canonicalUrl, html);
      toc.add(canonicalUrl);

      // Enqueue only internal URLs under allowPrefix
      const toAdd = converted.discoveredInternalUrls
        .map((u) => canonicalizeUrl(u).toString())
        .filter((u) => u.startsWith(allowPrefix));

      if (toAdd.length > 0) await enqueueLinks({ urls: toAdd });
    },
    failedRequestHandler: async ({ request, error }) => {
      const msg = error instanceof Error ? error.message : String(error);
      log.error(`Failed ${request.url}: ${msg}`);
    },
    // Exponential backoff and retries handled by Crawlee default (3). We can tweak if needed.
  });

  await crawler.addRequests([{ url: seed, uniqueKey: seed }]);
  await crawler.run();

  const tocPath = path.join(config.outDir, "toc.json");
  const sorted = Array.from(toc).sort((a, b) => a.localeCompare(b));
  await fs.writeFile(tocPath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}


