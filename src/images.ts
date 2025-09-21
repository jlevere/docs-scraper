import crypto from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export function deriveStableFilename(urlStr: string): string {
  const u = new URL(urlStr);
  const base = path.basename(u.pathname);
  if (base?.includes(".")) return base;
  const ext = path.extname(base) || ".bin";
  const hash = crypto.createHash("sha1").update(urlStr).digest("hex").slice(0, 12);
  return `${base || "asset"}-${hash}${ext}`;
}

export async function downloadBinary(urlStr: string, destAbsPath: string, userAgent?: string): Promise<void> {
  const init: RequestInit = userAgent ? { headers: { "user-agent": userAgent } } : {};
  const res = await fetch(urlStr, init);
  if (!res.ok || !res.body) throw new Error(`Failed to download ${urlStr}: ${res.status}`);
  const arrayBuf = await res.arrayBuffer();
  await fs.writeFile(destAbsPath, Buffer.from(arrayBuf));
}


