import { Comment } from 'svast';
import dedent from 'dedent-js';

/**
 * Add this tag to a HTML comment in a Svelte component and its contents will
 * be added as a docstring in the resulting JSX for the component class.
 */
const COMPONENT_DOCUMENTATION_HTML_COMMENT_TAG = '@component';

export class ComponentDocumentation {
    private componentDocumentation = '';

    handleComment = (node: Comment) => {
        if ((node.value as string).includes(COMPONENT_DOCUMENTATION_HTML_COMMENT_TAG)) {
            this.componentDocumentation = (node.value as string)
                .replace(COMPONENT_DOCUMENTATION_HTML_COMMENT_TAG, '')
                .trim();
        }
    };

    getFormatted() {
        if (!this.componentDocumentation) {
            return '';
        }
        if (!this.componentDocumentation.includes('\n')) {
            return `/** ${this.componentDocumentation} */\n`;
        }

        const lines = dedent(this.componentDocumentation)
            .split('\n')
            .map((line) => ` *${line ? ` ${line}` : ''}`)
            .join('\n');

        return `/**\n${lines}\n */\n`;
    }
}
