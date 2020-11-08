import { Node, Root, SvelteScript } from 'svast';
import MagicString from 'magic-string';

export class Scripts {
    // All script tags, no matter at what level, are listed within the root children.
    // To get the top level scripts, filter out all those that are part of children's children.
    // Those have another type ('Element' with name 'script').
    private scriptTags = (this.htmlxAst.children).filter(
        (child) => child.type === 'svelteScript'
    );

    private topLevelScripts = this.scriptTags as SvelteScript[];

    constructor(private htmlxAst: Root) {}

    handleScriptTag = (node: Node, parent: Node) => {
        if (parent !== this.htmlxAst && node.name === 'script') {
            this.topLevelScripts = this.topLevelScripts.filter(
                (tag) => tag.start !== node.start || tag.end !== node.end
            );
        }
    };

    getTopLevelScriptTags(): { scriptTag: SvelteScript; moduleScriptTag: SvelteScript } {
        let scriptTag: SvelteScript = null;
        let moduleScriptTag: SvelteScript = null;
        // should be 2 at most, one each, so using forEach is safe
        this.topLevelScripts.forEach((tag) => {
            if (
                tag.properties &&
                tag.properties.find(
                    (a) => a.name == 'context' && a.value.length == 1 && a.value[0].type == "text" && a.value[0].value == 'module'
                )
            ) {
                moduleScriptTag = tag;
            } else {
                scriptTag = tag;
            }
        });
        return { scriptTag, moduleScriptTag };
    }

    blankOtherScriptTags(str: MagicString): void {
        /*this.scriptTags
            .filter((tag) => !this.topLevelScripts.includes(tag))
            .forEach((tag) => {
                str.remove(tag.start, tag.end);
            });*/
    }
}
