import MagicString from 'magic-string';
import { SvelteElement } from 'svast';
import { end_offset } from '../utils/node-utils';

/**
 * Special treatment for self-closing / void tags to make them conform to JSX.
 */
export function handleElement(htmlx: string, str: MagicString, node: SvelteElement): void {
    //we just have to self close void tags since jsx always wants the />
    const voidTags = 'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr'.split(
        ','
    );
    if (voidTags.find((x) => x == node.tagName)) {
        if (htmlx[end_offset(node) - 2] != '/') {
            str.appendRight(end_offset(node) - 1, '/');
        }
    }

    //some tags auto close when they encounter certain elements, jsx doesn't support this
    if (htmlx[end_offset(node) - 1] != '>') {
        str.appendRight(end_offset(node), `</${node.tagName}>`);
    }
}
