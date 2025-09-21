import { rewriteHref, urlToMdPath, relativePath } from "../src/paths.js";

const OUT = "docs";
const ALLOW = "https://learn.microsoft.com/en-us/windows-hardware/customize/desktop/unattend/";

test("urlToMdPath mirrors path and adds .md", () => {
  expect(urlToMdPath(OUT, `${ALLOW}`)).toMatch(/unattend\.md$/);
  expect(urlToMdPath(OUT, `${ALLOW}foo/bar/`)).toMatch(/foo\/bar\.md$/);
});

test("rewriteHref rewrites internal links to relative .md with fragments and queries", () => {
  const from = `${ALLOW}foo/bar/`;
  const href = "../baz/qux?view=windows-11#frag";
  const { rewritten, internal } = rewriteHref(from, href, ALLOW, OUT);
  expect(internal).toBe(true);
  expect(rewritten).toBe("../baz/qux.md?view=windows-11#frag");
});

test("external links untouched", () => {
  const from = `${ALLOW}foo/bar/`;
  const href = "https://example.com/x";
  const { rewritten, internal } = rewriteHref(from, href, ALLOW, OUT);
  expect(internal).toBe(false);
  expect(rewritten).toBe("https://example.com/x");
});

test("relativePath normalizes separators", () => {
  expect(relativePath("/a/b/c.md", "/a/x/y.md")).toBe("../x/y.md");
});


