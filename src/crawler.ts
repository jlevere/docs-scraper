import { promises as fs } from "node:fs";
import path from "node:path";
import { PlaywrightCrawler, log, Configuration, RequestQueue } from "crawlee";
import type { ScrapeConfig } from "./types";
import { canonicalizeUrl } from "./paths";
import { convertHtmlToMarkdown } from "./convert";
import { MAIN_CONTAINER_SELECTORS, PRUNE_STRIP_SELECTORS } from "./dom";

function normalizeForCrawl(input: string): string {
  const u = canonicalizeUrl(input);
  // Drop fragments
  u.hash = "";
  // Remove noisy tracking params that cause dupes on MS Learn
  const paramsToDrop = ["source", "WT.mc_id", "wt.mc_id"];
  for (const key of paramsToDrop) u.searchParams.delete(key);
  // Sort params for stable key
  const entries = Array.from(u.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
  u.search = entries.length ? `?${entries.map(([k, v]) => `${k}=${v}`).join("&")}` : "";
  return u.toString();
}

export async function runCrawler(config: ScrapeConfig): Promise<void> {
  const allowPrefix = canonicalizeUrl(config.allowPrefix).toString();
  const seed = canonicalizeUrl(config.seedUrl).toString();
  await fs.mkdir(config.outDir, { recursive: true });

  const toc = new Set<string>();

  // Ensure storage subdirs exist for request queue locks (disk-backed, memory-light)
  const storageBase = path.join(process.cwd(), "storage");
  await fs.mkdir(path.join(storageBase, "request_queues", "default"), { recursive: true });
  // Avoid purging storage during run to prevent races with lock creation
  const configuration = new Configuration({ purgeOnStart: false });
  const rq = await RequestQueue.open();
  const crawler = new PlaywrightCrawler({
    maxConcurrency: Math.max(1, config.concurrency),
    requestHandlerTimeoutSecs: 180,
    requestQueue: rq,
    requestHandler: async ({ page, request, enqueueLinks }) => {
      // Block non-essential resources (media, images, fonts) to speed up and avoid downloads
      await page.route("**/*", (route) => {
        const type = route.request().resourceType();
        if (type === "image" || type === "media" || type === "font" || type === "stylesheet") {
          return route.abort();
        }
        return route.continue();
      });
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

      // Enqueue only internal URLs under allowPrefix, normalized to avoid dupes
      const toAdd = converted.discoveredInternalUrls
        .map((u) => normalizeForCrawl(u))
        .filter((u) => u.startsWith(allowPrefix));

      if (toAdd.length > 0) await enqueueLinks({ urls: toAdd });
    },
    failedRequestHandler: async ({ request, error }) => {
      const msg = error instanceof Error ? error.message : String(error);
      log.error(`Failed ${request.url}: ${msg}`);
    },
    // Exponential backoff and retries handled by Crawlee default (3). We can tweak if needed.
  }, configuration);

  await crawler.addRequests([{ url: normalizeForCrawl(seed), uniqueKey: normalizeForCrawl(seed) }]);
  await crawler.run();

  const tocPath = path.join(config.outDir, "toc.json");
  const sorted = Array.from(toc).sort((a, b) => a.localeCompare(b));
  await fs.writeFile(tocPath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}


