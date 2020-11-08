import { Node, SvelteExpression } from 'svast';
import ts from 'typescript';
import { expression_to_ast } from './expression-to-ast';

export type WalkTsOptions = {
    onEnterExpression?: (node: ts.Node, parent: ts.Node, context: HtmlxContext) => void; 
    onLeaveExpression?: (node: ts.Node, parent: ts.Node, context: HtmlxContext) => void; 
}

export type WalkOptions = WalkTsOptions & {
    onEnter?: (node: Node, parent: Node, prop: string, index?: number) => boolean | void;
    onLeave?: (node: Node, parent: Node, prop: string, index?: number) => void;
}

export type HtmlxContext = {
    node: Node,
    parent: Node,
    prop: string
}

function walkTs(node: ts.Node, opts: WalkTsOptions, parent: ts.Node, context: HtmlxContext) {
    opts.onEnterExpression?.(node, parent, context);
    ts.forEachChild(node, (n) => walkTs(n, opts, node, context));
    opts.onLeaveExpression?.(node, parent, context);
}


function walkExpression(exprNode: SvelteExpression, opts: WalkTsOptions, parent: Node, prop: string) {
    const ast = expression_to_ast(exprNode);
    walkTs(ast, opts, null, {
        node: exprNode,
        parent: parent,
        prop: prop
    });
}


export function walk(node: Node, opts: WalkOptions, parent?: Node, prop?: string, index?: number): Node {
	const x = opts.onEnter?.(node, parent, prop, index);

	if (x === false) return node;

    if (node.type ==  'svelteExpression') {
        walkExpression(node as SvelteExpression, opts, parent, prop);
    }

	if (node.expression)
		walk(
			(node as { type: string; expression: SvelteExpression }).expression,
			opts,
            node,
            'expression'
        );
        
	if (node.children) {
		for (let index = 0; index < (node.children as []).length; index++) {
			walk((node.children as [])[index], opts, node, 'children', index);
		}
    }
    
	if (node.value && Array.isArray(node.value)) {
		for (let index = 0; index < (node.value as []).length; index++) {
			walk((node.value as [])[index], opts, node, 'value', index);
		}
	} else if (node.value) {
		walk(node.value as Node, opts, node, 'value');
    }
    
	if (node.properties) {
		for (let index = 0; index < (node.properties as []).length; index++) {
			walk((node.properties as [])[index], opts, node, 'properties', index);
		}
    }
    
	if (node.modifiers) {
		for (let index = 0; index < (node.modifiers as []).length; index++) {
			walk((node.modifiers as [])[index], opts, node, 'modifiers', index);
		}
    }
    
	if (node.branches) {
		for (let index = 0; index < (node.branches as []).length; index++) {
            walk((node.branches as [])[index], opts, node, 'branches', index);		
        }
    }
    
    opts.onLeave?.(node, parent, prop, index);
	return node;
}
