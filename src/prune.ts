import { parse } from "node-html-parser";
import { HIDDEN_PRINT_CLASS, MAIN_CONTAINER_SELECTORS, PRUNE_STRIP_SELECTORS } from "./dom";

export function prunePrintDom(html: string): string {
  const root = parse(html);
  for (const el of root.querySelectorAll(`.${HIDDEN_PRINT_CLASS}`)) el.remove();
  for (const sel of PRUNE_STRIP_SELECTORS) for (const el of root.querySelectorAll(sel)) el.remove();

  let container: { innerHTML: string } = root;
  for (const sel of MAIN_CONTAINER_SELECTORS) {
    const candidate = root.querySelector(sel);
    if (candidate) {
      container = candidate;
      break;
    }
  }
  return container.innerHTML;
}


