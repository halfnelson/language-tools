const assert = require('assert')
const { prefix_string_from_point, expression_to_ast } = require('../build/htmlxtojsx')
const ts = require('typescript')


function p({l,c,o}) {
    return { line: l, column: c, offset: o}
}

function svelteExpression(value, pos_includes_brace = true) {
    const value_lines = value.split('\n');
    return {
        type: "svelteExpression",
        value: value,
        position: {
            start: {
                line: 1,
                col: 5,
                offset: 4
            },
            end: {
                line: 1 + value_lines.length - 1,
                col: value_lines.length > 1 ? value_lines[value_lines.length - 1].length + (pos_includes_brace ? 1 : 0) : 5 + value.length + (pos_includes_brace ? 2 : 0),
                offset: 4 + value.length + (pos_includes_brace ? 2 : 0)
            }
        }
    }

}

describe('expression-to-ast', () => {
    describe('prefix_string_from_point', () => {
        it('generates an empty string for line 1 col 1', () => {
            const res = prefix_string_from_point(p({l: 1, c: 1, o: 0}))
            assert.strictEqual(res.length, 0);
        })

        it('generates an single offset length line when line 1 ', () => {
            const res = prefix_string_from_point(p({l: 1, c: 5, o: 4}))
            assert.strictEqual(res.length, 4);
        })

        it('generates multiple lines and column spaces when needed ', () => {
            const res = prefix_string_from_point(p({l: 3, c: 10, o: 20}))
            assert.strictEqual(res.split('\n').length, 3);
            assert.strictEqual(res.split('\n')[2].length, 9);
        })
        

        it('allocates spaces needed for offset but not needed for column to the first line', () => {
            const res = prefix_string_from_point(p({l: 3, c: 10, o: 30}))
            // we need 9 spaces for our column, 2 newlines for our line, leaving 19 spaces to inject into the first line
            assert.strictEqual(res.split('\n')[0], ' '.repeat(19));
        })
    })

    describe('expression_to_ast', () => {
        it('can parse a simple identifier', () => {
            const expr = expression_to_ast(svelteExpression(`title`));
            assert(ts.isIdentifier(expr), `expected Identifier but got ${ts.SyntaxKind[expr.kind]}`)
        })
    })
})