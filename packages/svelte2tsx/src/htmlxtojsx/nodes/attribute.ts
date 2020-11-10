import MagicString from 'magic-string';
import { Property, Node, SvelteExpression } from 'svast'
import svgAttributes from '../svgattributes';
import { end_offset, start_offset } from '../utils/node-utils';

/**
 * Handle various kinds of attributes and make them conform to JSX.
 * - {x}   --->    x={x}
 * - x="{..}"   --->    x={..}
 * - lowercase DOM attributes
 * - multi-value handling
 */
export function handleAttribute(htmlx: string, str: MagicString, attr: Property, parent: Node): void {
    let transformedFromDirectiveOrNamespace = false;

    //if we are on an "element" we are case insensitive, lowercase to match our JSX
    if (parent.type == 'svelteElement') {
        if (attr.shorthand == "none") {
            let name = attr.name;
            if (!svgAttributes.find((x) => x == name)) {
                name = name.toLowerCase();
            }

            //strip ":" from out attribute name and uppercase the next letter to convert to jsx attribute
            const colonIndex = name.indexOf(':');
            if (colonIndex >= 0) {
                name = name.replace(':', '');
                // TODO The jsx is lower case? how is this even working!
                //const parts = name.split(':');
                //name = parts[0] + parts[1][0].toUpperCase() + parts[1].substring(1);
            }

            str.overwrite(start_offset(attr), start_offset(attr) + attr.name.length, name);
            transformedFromDirectiveOrNamespace = true;
        }
    }

    //we are a bare attribute
    if (attr.shorthand == "boolean") {
        if (parent.type === 'svelteElement' &&
            !transformedFromDirectiveOrNamespace &&
            parent.name !== '!DOCTYPE'
        ) {
            str.overwrite(start_offset(attr), end_offset(attr), attr.name.toLowerCase());
        }
        return;
    }

    if (attr.value.length == 0) return; //wut?
    
    //handle single value
    if (attr.value.length == 1) {
        const attrVal = attr.value[0];

        if (attr.name == 'slot') {
            str.remove(start_offset(attr), end_offset(attr));
            return;
        }

        if (attr.shorthand == "expression") {
            let attrName = (attrVal as SvelteExpression).value;
            if (parent.type == 'svelteElement') {
                // eslint-disable-next-line max-len
                attrName = svgAttributes.find((a) => a == attrName)
                    ? attrName
                    : attrName.toLowerCase();
            }

            str.appendRight(start_offset(attr), `${attrName}=`);
            return;
        }

        const startsWithQuote =
            htmlx[start_offset(attrVal)-1] === '"' || htmlx[start_offset(attrVal)-1] === "'"
            
        if (attrVal.type == "text" && !startsWithQuote) {
            str.prependRight(start_offset(attrVal), '"');
            str.appendLeft(end_offset(attrVal), '"');
        }

        if (attrVal.type == "svelteExpression" && startsWithQuote) {
            str.remove(start_offset(attrVal)-1, start_offset(attrVal));
            str.remove(end_offset(attrVal), end_offset(attrVal)+1);
        }

        return;
    }

    // we have multiple attribute values, so we build a string out of them.
    // technically the user can do something funky like attr="text "{value} or even attr=text{value}
    // so instead of trying to maintain a nice sourcemap with prepends etc, we just overwrite the whole thing
    const equals = htmlx.lastIndexOf('=', start_offset(attr.value[0]))
    str.overwrite(equals, start_offset(attr.value[0]), '={`');

    for (const n of attr.value) {
        if (n.type == 'svelteExpression') {
            str.appendRight(start_offset(n), '$');
        }
    }

    if (htmlx[end_offset(attr) - 1] == '"') {
        str.overwrite(end_offset(attr) - 1, end_offset(attr), '`}');
    } else {
        str.appendLeft(end_offset(attr), '`}');
    }
}
