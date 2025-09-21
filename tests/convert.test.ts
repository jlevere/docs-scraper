import { convertHtmlToMarkdown } from "../src/convert.js";
import type { ScrapeConfig } from "../src/types.js";

const config: ScrapeConfig = {
  seedUrl: "https://example.com/",
  allowPrefix: "https://example.com/",
  outDir: ".test-docs",
  concurrency: 1,
};

afterAll(async () => {
  // noop cleanup; tests avoid network by not having images
});

test("convert collapses blank lines and keeps tables", async () => {
  const html = `
    <h1>Title</h1>
    <p>a</p>
    <p></p>
    <p></p>
    <table><tr><th>X</th></tr><tr><td>1</td></tr></table>
  `;
  const r = await convertHtmlToMarkdown(config, "https://example.com/a/", html);
  expect(r.markdown).toContain("---\n");
  expect(r.markdown).toContain("| X |");
});


