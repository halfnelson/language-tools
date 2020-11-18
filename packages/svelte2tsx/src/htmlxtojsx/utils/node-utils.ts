import { Node } from 'estree-walker';
import { Branch, Node as SvastNode, Directive, Property, Root, SvelteChild, SvelteScript, SvelteStyle, SvelteComponent, SvelteElement } from 'svast';

export type SvelteNode = 
	| SvelteChild 
	| Root
	| SvelteScript
	| SvelteStyle
	| Property
	| Directive
    | Branch
    
    
export function getThisType(node: SvastNode): string | undefined {
    switch (node.type) {
        case 'svelteComponent':
            return (node as SvelteComponent).tagName;
        case 'svelteElement':
            return `__sveltets_ctorOf(__sveltets_mapElementTag('${(node as SvelteElement).tagName}'))`;
        case 'svelteMeta':
            if (node.tagName === 'component' || node.tagName === 'self') 
                return '__sveltets_componentType()';
            if (node.tagName == 'body') 
                return 'HTMLBodyElement';
            if (node.tagName == 'window')
                return 'Window'
    }
}

export function beforeStart(start: number): number {
    return start - 1;
}

export function start_offset(node: SvastNode): number {
    return node.position.start.offset;
}

export function end_offset(node: SvastNode): number {
    return node.position.end.offset;
}