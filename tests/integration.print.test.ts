// Runs only when INTEGRATION=1
const integration = process.env.INTEGRATION === "1";

const itMaybe = integration ? it : it.skip;

import { renderPage } from "../src/renderer.js";
import { convertHtmlToMarkdown } from "../src/convert.js";
import type { ScrapeConfig } from "../src/types.js";

itMaybe("renders a known Learn page in print and converts to MD", async () => {
  const cfg: ScrapeConfig = {
    seedUrl: "https://learn.microsoft.com/en-us/windows-hardware/customize/desktop/unattend/",
    allowPrefix: "https://learn.microsoft.com/en-us/windows-hardware/customize/desktop/unattend/",
    outDir: ".int-docs",
    concurrency: 1,
    userAgent: "ms-learn-scraper/integ-test",
  };

  const url = cfg.seedUrl;
  const rendered = await renderPage(cfg, url);
  expect(rendered.html).toBeTruthy();
  expect(rendered.title.length).toBeGreaterThan(0);

  const result = await convertHtmlToMarkdown(cfg, rendered.canonicalUrl, rendered.html);
  expect(result.markdown).toContain("---\n");
});


