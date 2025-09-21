import { runCrawler } from "./crawler";
import type { ScrapeConfig } from "./types";
import { Command } from "commander";
import { z } from "zod";

const configSchema = z.object({
  seedUrl: z.string().url(),
  allowPrefix: z.string().url(),
  outDir: z.string().min(1),
  concurrency: z.coerce.number().int().positive().default(6),
  userAgent: z.string().min(1).default("ms-learn-scraper/1.0"),
  respectRobots: z.coerce.boolean().default(false),
});

function parseCli(argv: string[]): ScrapeConfig {
  const program = new Command();
  program
    .name("ms-learn-scraper")
    .description("Scrape Microsoft Learn pages (print view) to Markdown")
    .option("--seed <url>", "Seed URL to start from", process.env.SEED)
    .option("--allow <url>", "URL prefix to allow", process.env.ALLOW)
    .option("--out <dir>", "Output directory", process.env.OUT ?? "docs")
    .option("--conc <n>", "Concurrency", process.env.CONCURRENCY ?? "6")
    .option("--user-agent <ua>", "User-Agent string", process.env.USER_AGENT ?? "ms-learn-scraper/1.0")
    .option("--robots", "Respect robots.txt (not yet implemented)", process.env.ROBOTS === "1")
    .allowExcessArguments(false);

  program.parse(argv);
  const opts = program.opts();
  const parsed = configSchema.safeParse({
    seedUrl: opts.seed,
    allowPrefix: opts.allow,
    outDir: opts.out,
    concurrency: opts.conc,
    userAgent: opts.userAgent,
    respectRobots: Boolean(opts.robots),
  });
  if (!parsed.success) {
    console.error(parsed.error.format());
    process.exit(2);
  }
  return parsed.data;
}

async function main(): Promise<void> {
  const config = parseCli(process.argv);
  try {
    await runCrawler(config);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("/cli.js")) {
  // eslint-disable-next-line unicorn/prefer-top-level-await
  main();
}

export { main };

