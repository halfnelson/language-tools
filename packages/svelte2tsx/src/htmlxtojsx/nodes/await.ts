import MagicString from 'magic-string';
import { Node } from 'estree-walker';
import { Branch, BranchingBlock } from 'svast';
import { end_offset, start_offset } from '../utils/node-utils';
import { parse_await_expression } from '../utils/expression-to-ast';

/**
 * Transform {#await ...} into something JSX understands
 */
export function handleAwait(htmlx: string, str: MagicString, awaitBlock: BranchingBlock): void {
    // {#await -->
    // {() => {let _$$p = (
    str.overwrite(start_offset(awaitBlock), start_offset(awaitBlock) + "{#await".length + 1, '{() => {let _$$p = (');

    let handledThen = false;

    for (const branch of awaitBlock.branches) {

        if (branch.name == "await") {
            var await_exprs = parse_await_expression(branch.expression);
            if (await_exprs.hasThen) {
                // somePromise then name}  --> 
                // somePromise);  __sveltets_awaitThen(_$$p, (name) => {<>
                str.overwrite(await_exprs.promiseExpr.end-1, await_exprs.thenExpr.pos+1, '); __sveltets_awaitThen(_$$p, (')
                str.overwrite(await_exprs.thenExpr.end, await_exprs.thenExpr.end+1, ') => <>')
                handledThen = true;
            } else {
                // somePromise} -->
                // somePromise);<>
                str.overwrite(await_exprs.promiseExpr.end, branch.expression.position.end.offset + 1, '); <>')
            }
            continue;
        }

        if (branch.name == "then") {
            handledThen = true;
            if (!branch.expression.position) {
                //{:then} --> 
                //</>;__sveltets_awaitThen(_$$p, () => <>
                str.overwrite(start_offset(branch), start_offset(branch) + '{:then}'.length, '</>; __sveltets_awaitThen(_$$p, () => <>')
            } else {
                //{:then name} -->
                //</>;__sveltets_awaitThen(_$$p, (name) => <>
                str.overwrite(start_offset(branch), start_offset(branch) + '{:then'.length + 1, '</>; __sveltets_awaitThen(_$$p, (')
                str.overwrite(end_offset(branch.expression), end_offset(branch.expression)+1, ') => <>')
            }
        }

        if (branch.name == "catch") {
            if (!branch.expression.position) {
                //{:catch} --> 
                //</>}, () => {<>
                str.overwrite(start_offset(branch), start_offset(branch) + '{:catch}'.length, `${handledThen ? '' : '</>; __sveltets_awaitThen(_$$p, () => <>'}</>, () => <>`)
            } else {
                //{:catch name} -->
                //</>}, (name) => {<>
                str.overwrite(start_offset(branch), start_offset(branch) + '{:catch'.length+1, `${handledThen ? '' : '</>; __sveltets_awaitThen(_$$p, () => <>'}</>, (`)
                str.overwrite(end_offset(branch.expression), end_offset(branch.expression)+1, ') => <>')
            }
            handledThen = true;
        }
    }

    //{/await} --> 
    //</>})}
    str.overwrite(end_offset(awaitBlock)-('{/await}'.length),end_offset(awaitBlock), `${handledThen ? '' : '</>; __sveltets_awaitThen(_$$p, () => <>'}</>)}}`)

    /*
    // then value } | {:then value} | {await ..} .. {/await} ->
    // __sveltets_awaitThen(_$$p, (value) => {<>
    let thenStart: number;
    let thenEnd: number;
    if (!awaitBlock.then.skip) {
        // then value } | {:then value}
        if (!awaitBlock.pending.skip) {
            // {await ...} ... {:then ...}
            // thenBlock includes the {:then}
            thenStart = awaitBlock.then.start;
            if (awaitBlock.value) {
                thenEnd = htmlx.indexOf('}', awaitBlock.value.end) + 1;
            } else {
                thenEnd = htmlx.indexOf('}', awaitBlock.then.start) + 1;
            }
            str.prependLeft(thenStart, '</>; ');
            // add the start tag too
            const awaitEnd = htmlx.indexOf('}', awaitBlock.expression.end);

            // somePromise} -> somePromise);
            str.overwrite(awaitBlock.expression.end, awaitEnd + 1, ');');
            str.appendRight(awaitEnd + 1, ' <>');
        } else {
            // {await ... then ...}
            thenStart = htmlx.indexOf('then', awaitBlock.expression.end);
            thenEnd = htmlx.lastIndexOf('}', awaitBlock.then.start) + 1;
            // somePromise then -> somePromise); then
            str.overwrite(awaitBlock.expression.end, thenStart, '); ');
        }
    } else {
        // {await ..} ... ({:catch ..}) {/await} -> no then block, no value, but always a pending block
        thenEnd = awaitBlock.catch.skip
            ? htmlx.lastIndexOf('{', awaitBlock.end)
            : awaitBlock.catch.start;
        thenStart = Math.min(awaitBlock.pending.end + 1, thenEnd);

        const awaitEnd = htmlx.indexOf('}', awaitBlock.expression.end);
        str.overwrite(awaitBlock.expression.end, awaitEnd + 1, ');');
        str.appendRight(awaitEnd + 1, ' <>');
        str.appendLeft(thenEnd, '</>; ');
    }

    if (awaitBlock.value) {
        str.overwrite(thenStart, awaitBlock.value.start, '__sveltets_awaitThen(_$$p, (');
        str.overwrite(awaitBlock.value.end, thenEnd, ') => {<>');
    } else {
        const awaitThenFn = '__sveltets_awaitThen(_$$p, () => {<>';
        if (thenStart === thenEnd) {
            str.appendLeft(thenStart, awaitThenFn);
        } else {
            str.overwrite(thenStart, thenEnd, awaitThenFn);
        }
    }

    //{:catch error} ->
    //</>}, (error) => {<>
    if (!awaitBlock.catch.skip) {
        //catch block includes the {:catch}
        const catchStart = awaitBlock.catch.start;
        const catchSymbolEnd = htmlx.indexOf(':catch', catchStart) + ':catch'.length;

        const errorStart = awaitBlock.error ? awaitBlock.error.start : catchSymbolEnd;
        const errorEnd = awaitBlock.error ? awaitBlock.error.end : errorStart;
        const catchEnd = htmlx.indexOf('}', errorEnd) + 1;
        str.overwrite(catchStart, errorStart, '</>}, (');
        str.overwrite(errorEnd, catchEnd, ') => {<>');
    }
    // {/await} ->
    // <>})}
    const awaitEndStart = htmlx.lastIndexOf('{', awaitBlock.end - 1);
    str.overwrite(awaitEndStart, awaitBlock.end, '</>})}}');
    */
}
