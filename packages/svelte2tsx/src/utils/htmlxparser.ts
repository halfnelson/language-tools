import { parse } from 'svelte-parse';
import { Root } from 'svast';

export function parseHtmlx(htmlx: string): Root {
    const svelteHtmlxAst = parse({ value: htmlx, generatePositions: true });
    return svelteHtmlxAst;
}
