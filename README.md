### Microsoft Docs Scraper
Print-view Markdown scraper for Microsoft Learn.

### Install
```bash
pnpm i && pnpm build
```

### Usage
```bash
pnpm scrape -- --seed <url> --allow <prefix> --out <dir> [--conc N] [--user-agent UA] [--robots]
```

### Example
```bash
pnpm scrape -- --seed https://learn.microsoft.com/en-us/windows-hardware/customize/desktop/unattend/ --allow https://learn.microsoft.com/en-us/windows-hardware/customize/desktop/unattend/ --out docs
```

### Output
- Markdown files with frontmatter in `docs/`
- `docs/toc.json` (canonical URL list)


