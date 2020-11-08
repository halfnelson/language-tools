import ts from 'typescript';
import { Point, SvelteExpression } from 'svast'

// generates a string where the next character would resolve to "point"
// tries to shove all extra spaces in the first line
export function prefix_string_from_point(point: Point): string {
    // lets build the string starting from the end
    // we know there are column spaces before a new line
    let line = ' '.repeat(point.column - 1);
    // and we know the line it was on
    line = '\n'.repeat(point.line - 1) + line;
    // now we can pad with spaces to reach the desired offset
    line = ' '.repeat(point.offset - line.length) + line;
    return line;
}

export function generate_source_file_for_expression(expr: SvelteExpression): string {
    // we want the offset, line and col for our parsed expression to match, so generate a prefix
    let prefix = prefix_string_from_point(expr.position.start);
    // SourceFile needs statements, so we need to wrap our expression with () to ensure we get an ExpressionStatement.
    
    const expression_content = expr.value;

    // for simple moustache expressions the expression positions include the {} characters
    const is_simple_moustache = (expr.position.end.offset - expr.position.start.offset) != expression_content.length;

    if (is_simple_moustache)
    { 
        //account for the { that the position range includes and as a bonus find a spot to inject the (
        prefix = prefix + "("
    } else {
        // inject a `(` somewhere in the prefix that won't change the offset, col or line.
        // we do this by replacing one of our spaces
        prefix = prefix.replace(' ', '(');
    }

    return prefix + expression_content + ")"
}

export function expression_to_ast(expr: SvelteExpression): ts.Expression {
    // Try to ensure our position etc line up with the source
    const tsAst = ts.createSourceFile(
        `expression-${expr.position.start.line}_{${expr.position.start.column}}.ts`,
        generate_source_file_for_expression(expr),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
    );

    const expressionStatement = tsAst.statements.find(v => ts.isExpressionStatement(v)) as ts.ExpressionStatement
    if (!expressionStatement || !ts.isParenthesizedExpression(expressionStatement.expression)) {
        console.warn(`Couldn't extract typescript expression from svelte expression at ${expr.position.start.line}:${expr.position.start.column}`)
        return null;
    }
    return expressionStatement.expression.expression;
}