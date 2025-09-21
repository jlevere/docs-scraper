export interface ScrapeConfig {
  seedUrl: string;
  allowPrefix: string;
  outDir: string;
  concurrency: number;
  userAgent: string;
  respectRobots: boolean;
}

export interface RenderResult {
  html: string;
  title: string;
  canonicalUrl: string;
}

export interface ConvertResult {
  markdown: string;
  discoveredInternalUrls: string[];
}

export interface ImageDownloadPlanEntry {
  absoluteUrl: string;
  localRelativePathFromMd: string;
  localAbsolutePath: string;
}


