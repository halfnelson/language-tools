import MagicString from 'magic-string';
import { SvelteScript } from 'svast';

export function processModuleScriptTag(str: MagicString, script: SvelteScript) {
    const scriptStartTagEnd = script.children[0].position.start.offset - 1;
    const scriptEndTagStart = script.children[script.children.length - 1].position.end.offset + 1;

    str.overwrite(script.position.start.offset, scriptStartTagEnd, '</>;');
    str.overwrite(scriptEndTagStart, script.position.end.offset, ';<>');
}
