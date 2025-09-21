declare module "turndown" {
  export type HeadingStyle = "setext" | "atx";
  export type CodeBlockStyle = "indented" | "fenced";
  export type EmDelimiter = "_" | "*";
  export type StrongDelimiter = "**" | "__";
  export type LinkStyle = "inlined" | "referenced";
  export type LinkReferenceStyle = "full" | "collapsed" | "shortcut";

  export interface Options {
    headingStyle: HeadingStyle;
    hr: string;
    bulletListMarker: "-" | "+" | "*";
    codeBlockStyle: CodeBlockStyle;
    fence: "```" | "~~~";
    emDelimiter: EmDelimiter;
    strongDelimiter: StrongDelimiter;
    linkStyle: LinkStyle;
    linkReferenceStyle: LinkReferenceStyle;
    br: string;
    preformattedCode: boolean;
  }

  export interface Rule {
    filter: string | string[] | ((node: unknown, options: Options) => boolean);
    replacement: (content: string, node: unknown, options: Options) => string;
  }

  export default class TurndownService {
    constructor(options?: Partial<Options>);
    use(plugin: ((td: TurndownService) => void) | Array<(td: TurndownService) => void>): this;
    addRule(key: string, rule: Rule): this;
    keep(filter: string | string[] | ((node: unknown) => boolean)): this;
    remove(filter: string | string[] | ((node: unknown) => boolean)): this;
    turndown(input: string | unknown): string;
    escape(input: string): string;
  }
}

declare module "turndown-plugin-gfm" {
  import type TurndownService from "turndown";
  export const gfm: (td: TurndownService) => void;
  export const tables: (td: TurndownService) => void;
  export const strikethrough: (td: TurndownService) => void;
}


