import { Node, BranchingBlock, EachBlock, VoidBlock, SvelteMeta, SvelteComponent, SvelteElement, Comment, Branch, Directive, Property } from 'svast';
import { walk } from './utils/svelteAstWalker';
import MagicString from 'magic-string';

import { parseHtmlx } from '../utils/htmlxparser';
import { handleActionDirective } from './nodes/action-directive';
import { handleAnimateDirective } from './nodes/animation-directive';
import { handleAttribute } from './nodes/attribute';
import { handleAwait } from './nodes/await';
import { handleKey } from './nodes/key';
import { handleBinding } from './nodes/binding';
import { handleClassDirective } from './nodes/class-directive';
import { handleComment } from './nodes/comment';
import { handleComponent } from './nodes/component';
import { handleDebug } from './nodes/debug';
import { handleEach } from './nodes/each';
import { handleElement } from './nodes/element';
import { handleEventHandler } from './nodes/event-handler';
import { handleIf } from './nodes/if-else';
import { handleRawHtml } from './nodes/raw-html';
import { handleSvelteTag } from './nodes/svelte-tag';
import { handleTransitionDirective } from './nodes/transition-directive';


type Walker = (node: Node, parent: Node, prop: string, index: number) => void;

function stripDoctype(str: MagicString): void {
    const regex = /<!doctype(.+?)>(\n)?/i;
    const result = regex.exec(str.original);
    if (result) {
        str.remove(result.index, result.index + result[0].length);
    }
}

/**
 * Walks the HTMLx part of the Svelte component
 * and converts it to JSX
 */
export function convertHtmlxToJsx(
    str: MagicString,
    ast: Node,
    onEnter: (node: Node, parent: Node, prop: string, index: number) => boolean | void = null,
    onLeave: (node: Node, parent: Node, prop: string, index: number) => void = null
): void {
    const htmlx = str.original;
    stripDoctype(str);
    str.prepend('<>');
    str.append('</>');

    walk(ast, {
        onEnter: (node: Node, parent: Node, prop: string, index: number) => {

            try {
                switch (node.type) {
                    case 'svelteBranchingBlock':
                        const bb = node as BranchingBlock;

                        switch (bb.name as string) {
                            case 'if':
                                handleIf(htmlx, str, bb);
                                break;
                            /*
                            case 'await':
                                handleAwait(htmlx, str, bb);
                                break;
    
                            case 'key':
                                handleKey(htmlx, str, bb);
                                break;
                            */
                        }

                    /*
                    case 'svelteEachBlock':
                        handleEach(htmlx, str, node as EachBlock);
                        break;
    
                    case 'svelteVoidBlock':
                        const vb = node as VoidBlock;
    
                        switch (vb.name) {
                            case 'html': 
                                handleRawHtml(htmlx, str, node);
                                break;
                            case 'debug':
                                handleDebug(htmlx, str, node);
                                break;
                        }
                        break;
                
                    case 'svelteTag': 
                        //svelte:(options,window,head,body)
                        handleSvelteTag(htmlx, str, node as SvelteMeta);
                        break;
    
                    case 'svelteComponent':
                        handleComponent(htmlx, str, node as SvelteComponent);
                        break;
    
                    case 'svelteElement':
                        handleElement(htmlx, str, node as SvelteElement);
                        break;
    
                    case 'comment':
                        handleComment(str, node as Comment);
                        break;
    
                    case 'svelteProperty':
                        handleAttribute(htmlx, str, node as Property, parent)
                    
                    case 'svelteDirective':
                        const dir = node as Directive;
                        switch (dir.name) {
                            case 'bind':
                                handleBinding(htmlx, str, node, parent);
                                break;
                            case 'class':
                                handleClassDirective(htmlx, str, node)
                                break;
                            case 'use':
                                handleActionDirective(htmlx, str, node, parent)
                                break;
                            case 'in':
                            case 'out':
                            case 'transition':
                                handleTransitionDirective(htmlx, str, node);
                                break;
                            case 'animate':
                                handleAnimateDirective(htmlx, str, node);
                                break;
                            case 'on':
                                handleEventHandler(htmlx, str, node, parent);
                                break;
                        }
                        break; */
                }
                onEnter?.(node, parent, prop, index);

            } catch (e) {
                console.error('Error walking node ', node);
                throw e;
            }
        },

        onLeave: (node: Node, parent: Node, prop: string, index: number) => {
            onLeave?.(node, parent, prop, index);
        }
    });
}

/**
 * @internal For testing only
 */
export function htmlx2jsx(htmlx: string) {
    const ast = parseHtmlx(htmlx);
    const str = new MagicString(htmlx);

    convertHtmlxToJsx(str, ast);

    return {
        map: str.generateMap({ hires: true }),
        code: str.toString()
    };
}
