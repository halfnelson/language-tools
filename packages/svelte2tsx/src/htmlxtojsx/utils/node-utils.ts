import { Node } from 'estree-walker';
import { Node as SvastNode } from 'svast';
import { nodeModuleNameResolver } from 'typescript';


export function getTypeForComponent(node: Node): string {
    if (node.name === 'svelte:component' || node.name === 'svelte:self') {
        return '__sveltets_componentType()';
    } else {
        return node.name;
    }
}

export function getThisType(node: Node): string | undefined {
    switch (node.type) {
        case 'InlineComponent':
            return getTypeForComponent(node);
        case 'Element':
            return `__sveltets_ctorOf(__sveltets_mapElementTag('${node.name}'))`;
        case 'Body':
            return 'HTMLBodyElement';
    }
}

export function beforeStart(start: number): number {
    return start - 1;
}

export function isShortHandAttribute(attr: Node): boolean {
    return attr.expression.end === attr.end;
}

export function start_offset(node: SvastNode): number {
    return node.position.start.offset;
}

export function end_offset(node: SvastNode): number {
    return node.position.end.offset;
}