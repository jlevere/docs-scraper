import { deriveStableFilename } from "../src/images.js";

test("deriveStableFilename prefers basename with extension", () => {
  expect(deriveStableFilename("https://x/y/z.png")).toBe("z.png");
});

test("deriveStableFilename hashes when no extension", () => {
  const name = deriveStableFilename("https://x/y/z");
  expect(name).toMatch(/^z-[a-f0-9]{12}\.bin$/);
});


