import MagicString from 'magic-string';
import { SvelteMeta } from 'svast';
import { end_offset, start_offset } from '../utils/node-utils';

/**
 * `<svelte:window>...</svelte:window>`   ---->    `<sveltewindow>...</sveltewindow>`
 * (same for :head, :body, :options)
 */
export function handleSvelteTag(htmlx: string, str: MagicString, node: SvelteMeta): void {
    const colon = htmlx.indexOf(':', start_offset(node));
    str.remove(colon, colon + 1);

    if (node.selfClosing) return;

    const closeTag = htmlx.lastIndexOf('/svelte:' + node.tagName , end_offset(node));
    if (closeTag > node.start) {
        const colon = htmlx.indexOf(':', closeTag);
        str.remove(colon, colon + 1);
    }
}
