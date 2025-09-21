import path from "node:path";
import { promises as fs } from "node:fs";
import TurndownService, { type Rule } from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { parse } from "node-html-parser";
import type { ConvertResult, ScrapeConfig } from "./types";
import { rewriteHref, urlToMdPath } from "./paths";
import { ensureDir } from "./images";

function createTurndown(): TurndownService {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    fence: "```",
    emDelimiter: "*",
    strongDelimiter: "**",
    bulletListMarker: "-",
    linkStyle: "inlined",
  });
  service.use(gfm);
  // Keep small inline semantics and remove obvious noise (defense-in-depth; we already prune)
  service.keep(["kbd", "sup", "sub"]);
  service.remove(["script", "style"]);

  const fencedCodeWithLang: Rule = {
    filter: (node: unknown) => {
      const el = node as HTMLElement;
      const first = (el?.firstChild ?? null) as HTMLElement | null;
      return el?.nodeName === "PRE" && first?.nodeName === "CODE";
    },
    replacement: (_content: string, node: unknown) => {
      const el = node as HTMLElement;
      const code = (el.firstChild ?? null) as HTMLElement | null;
      const raw = code?.textContent ?? "";
      const className = (code?.getAttribute("class") ?? "").toString();
      const lang = (className.match(/language-([A-Za-z0-9_-]+)/)?.[1]) ?? "";
      const fence = "```";
      return `\n${fence}${lang ? lang : ""}\n${raw}\n${fence}\n`;
    },
  };
  service.addRule("fencedCodeWithLang", fencedCodeWithLang);

  return service;
}

function cleanupMarkdown(md: string): string {
  let out = md.replace(/\n{3,}/g, "\n\n");
  // Remove empty headings like '##\n' or '##   \n'
  out = out.replace(/^#+\s*\n/gm, "");
  return `${out.trim()}\n`;
}

export async function convertHtmlToMarkdown(
  config: ScrapeConfig,
  currentUrl: string,
  html: string,
): Promise<ConvertResult> {
  const dom = parse(html);

  // Prepare output locations
  const mdAbsPath = urlToMdPath(config.outDir, currentUrl);
  await ensureDir(path.dirname(mdAbsPath));

  // Image handling and link rewriting
  const discoveredInternal = new Set<string>();

  for (const img of dom.querySelectorAll("img")) {
    const src = img.getAttribute("src");
    if (!src) continue;
    let abs: URL;
    try {
      abs = new URL(src, currentUrl);
    } catch {
      continue;
    }
    // Point images to their absolute URL; do not download or store media locally
    img.setAttribute("src", abs.toString());
  }

  for (const a of dom.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (!href) continue;
    const { rewritten, internal, absoluteTarget } = rewriteHref(currentUrl, href, config.allowPrefix, config.outDir);
    a.setAttribute("href", rewritten);
    if (internal && absoluteTarget) discoveredInternal.add(absoluteTarget);
  }

  const turndown = createTurndown();
  const md = turndown.turndown(dom.toString());
  const markdown = cleanupMarkdown(md);

  // Frontmatter
  const fm = (title: string, source: string): string => `---\ntitle: "${title.replace(/"/g, "\\\"")}"\nsource: "${source}"\n---\n\n`;

  const title = parse(html).querySelector("h1")?.textContent?.trim() || "Untitled";
  const withFrontmatter = fm(title, currentUrl) + markdown;

  await fs.writeFile(mdAbsPath, withFrontmatter, "utf8");

  return { markdown: withFrontmatter, discoveredInternalUrls: Array.from(discoveredInternal) };
}


