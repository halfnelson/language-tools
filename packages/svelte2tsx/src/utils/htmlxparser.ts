import { parse } from 'htmlx-parser-svast';
import { Root } from 'svast';

export function parseHtmlx(htmlx: string): Root {
    const svelteHtmlxAst = parse(htmlx)
    return svelteHtmlxAst.ast;
}
