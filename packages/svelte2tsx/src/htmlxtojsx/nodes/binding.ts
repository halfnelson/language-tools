import MagicString from 'magic-string';

import { getThisType, start_offset, end_offset } from '../utils/node-utils';
import { Directive, SvelteComponent, SvelteElement, SvelteExpression, SvelteMeta } from 'svast';

const oneWayBindingAttributes: Map<string, string> = new Map(
    ['clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight']
        .map((e) => [e, 'HTMLDivElement'] as [string, string])
        .concat(
            ['duration', 'buffered', 'seekable', 'seeking', 'played', 'ended'].map((e) => [
                e,
                'HTMLMediaElement'
            ])
        )
);


/**
 * Transform bind:xxx into something that conforms to JSX
 */
export function handleBinding(htmlx: string, str: MagicString, attr: Directive, el: SvelteElement | SvelteComponent | SvelteMeta): void {
    const hasValue = attr.value && attr.value.length > 0
    const expr = hasValue ? attr.value[0] as SvelteExpression : null;
    
    //bind group on input
    if (attr.specifier == 'group' && el.tagName == 'input') {
        if (expr) {
            str.overwrite(start_offset(attr), start_offset(expr)+1, '{...__sveltets_empty(')
            str.overwrite(end_offset(expr)-1, end_offset(attr), ')}');
        } else {
            str.overwrite(start_offset(attr), end_offset(attr), `{...__sveltets_empty(group)}`);
        }
        return;
    }

    const supportsBindThis = ['svelteComponent', 'svelteElement', 'svelteMeta'];

    //bind this
    if (attr.specifier === 'this' && supportsBindThis.includes(el.type)) {
        const thisType = getThisType(el);

        if (thisType) {
            if (expr) {
                str.overwrite(start_offset(attr), start_offset(expr)+1, `{...__sveltets_ensureType(${thisType}, `)
                str.overwrite(end_offset(expr)-1, end_offset(attr), `)}`);
            } else {
                str.overwrite(start_offset(attr), end_offset(attr), `{...__sveltets_ensureType(${thisType},this)}`);
            }
            return;
        } else {
            throw new Error("Couldn't determing this type");
        }
    }

    //one way binding
    if (oneWayBindingAttributes.has(attr.specifier) && el.type === 'svelteElement') {
        if (expr) {
            str.overwrite(start_offset(attr), start_offset(expr)+1, `{...__sveltets_empty(`)
            str.overwrite(end_offset(expr)-1, end_offset(attr), `=__sveltets_instanceOf(${oneWayBindingAttributes.get(attr.specifier)}).${attr.specifier})}`);
        } else {
            str.overwrite(start_offset(attr), end_offset(attr), `{...__sveltets_empty(${attr.specifier}=__sveltets_instanceOf(${oneWayBindingAttributes.get(attr.specifier)}).${attr.specifier})}`);
        }
        return;
    }

    if (expr) {
        str.overwrite(start_offset(attr), start_offset(expr)+1, `${attr.specifier}={`)
        str.overwrite(end_offset(expr)-1, end_offset(attr), `}`);
    } else {
        str.overwrite(start_offset(attr), end_offset(attr), `${attr.specifier}={${attr.specifier}}`)
    }
}
