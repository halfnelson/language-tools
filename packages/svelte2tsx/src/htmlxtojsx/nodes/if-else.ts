import MagicString from 'magic-string';
import { BranchingBlock } from 'svast';

/**
 * {#if ...}...{/if}   --->   {() => {if(...){<>...</>}}}
 */
export function handleIf(htmlx: string, str: MagicString, ifBlock: BranchingBlock): void {

    for (const block of ifBlock.branches) {
        // {#if expr} ---> {() => { if (expr){ <>
        if (block.name == "if") {
            str.overwrite(block.position.start.offset, block.expression.position.start.offset, '{() => {if (');
            str.overwrite(block.expression.position.end.offset, block.expression.position.end.offset + 1, '){<>');
            continue;
        }
        // {:else if ....}  --->   </>} else if (....) {<>
        if (block.name == "else if") {
            str.overwrite(block.position.start.offset, block.expression.position.start.offset, '</>} else if (');
            str.overwrite(block.expression.position.end.offset, block.expression.position.end.offset + 1, '){<>');
        }

        // {:else}   --->   </>} else {<>
        if (block.name == "else") {
            str.overwrite(block.position.start.offset, block.expression.position.start.offset, '</>} else');
            str.overwrite(block.expression.position.end.offset, block.expression.position.end.offset + 1, '{<>');
        }
    }

    // {/if} --->  </>}}}
    let lastBlock = ifBlock.branches[ifBlock.branches.length - 1];
    str.overwrite(lastBlock.position.end.offset, ifBlock.position.end.offset, '</>}}}');
}
    