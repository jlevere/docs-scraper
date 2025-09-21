import { prunePrintDom } from "../src/prune.js";

test("prune removes chrome and hidden-print", () => {
  const html = `
    <header>hdr</header>
    <nav>nav</nav>
    <main>
      <article>
        <h1>Title</h1>
        <div class="hidden-print">hide</div>
        <p>keep</p>
      </article>
    </main>
    <footer>ftr</footer>
  `;
  const out = prunePrintDom(html);
  expect(out).toContain("Title");
  expect(out).toContain("keep");
  expect(out).not.toContain("hdr");
  expect(out).not.toContain("nav");
});


