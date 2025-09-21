export const PRUNE_STRIP_SELECTORS: readonly string[] = [
  "nav",
  "header",
  "footer",
  "aside",
  ".feedback",
  ".rating",
  ".toc",
  ".metadata",
  "[data-bi-name=breadcrumb]",
] as const;

export const MAIN_CONTAINER_SELECTORS: readonly string[] = [
  "main article",
  "main",
  "article",
] as const;

export const HIDDEN_PRINT_CLASS = "hidden-print" as const;


