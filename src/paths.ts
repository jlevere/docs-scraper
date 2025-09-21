import path from "node:path";

export function ensureTrailingSlash(u: URL): URL {
  const copy = new URL(u.toString());
  if (!copy.pathname.endsWith("/")) copy.pathname += "/";
  return copy;
}

export function canonicalizeUrl(input: string): URL {
  const u = new URL(input);
  // Normalize host casing and remove default ports
  u.host = u.host.toLowerCase();
  return u;
}

export function urlToMdPath(outDir: string, url: string): string {
  const u = canonicalizeUrl(url);
  const pathname = u.pathname.replace(/\/$/, "");
  const parts = pathname.split("/").filter(Boolean);
  const filePath = `${path.join(outDir, ...parts)}.md`;
  return filePath;
}

export function relativePath(fromFile: string, toFile: string): string {
  const rel = path.relative(path.dirname(fromFile), toFile);
  return rel.replace(/\\/g, "/");
}

export function rewriteHref(
  fromUrl: string,
  href: string,
  allowPrefix: string,
  outDir: string,
): { rewritten: string; internal: boolean; absoluteTarget?: string } {
  if (href.trim() === "") return { rewritten: href, internal: false };

  const from = canonicalizeUrl(fromUrl);
  let target: URL;
  try {
    if (href.startsWith("#")) {
      target = new URL(from.toString());
      target.hash = href;
    } else {
      target = new URL(href, from);
    }
  } catch {
    return { rewritten: href, internal: false };
  }

  const allow = canonicalizeUrl(allowPrefix);
  const isInternal = target.toString().startsWith(allow.toString());
  if (!isInternal) return { rewritten: target.toString(), internal: false };

  const targetMd = urlToMdPath(outDir, target.toString());
  const fromMd = urlToMdPath(outDir, from.toString());
  const rel = relativePath(fromMd, targetMd);
  const queryAndHash = `${target.search ?? ""}${target.hash ?? ""}`;
  const rewritten = queryAndHash ? `${rel}${queryAndHash}` : rel;
  return { rewritten, internal: true, absoluteTarget: target.toString() };
}

export function mediaRelativePath(fromMdFile: string, mediaAbsPath: string): string {
  return relativePath(fromMdFile, mediaAbsPath);
}


