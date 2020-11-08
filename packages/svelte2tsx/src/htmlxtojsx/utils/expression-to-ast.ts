import ts, { ElementAccessExpression, ExpressionStatement, Identifier, SourceFile } from 'typescript';
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


function expression_as_statements(expr: SvelteExpression): ts.NodeArray<ts.Statement> {
    // Try to ensure our position etc line up with the source
    const tsAst = ts.createSourceFile(
        `expression-${expr.position.start.line}_{${expr.position.start.column}}.ts`,
        generate_source_file_for_expression(expr),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
    );
    return tsAst.statements;
}


export function expression_to_ast(expr: SvelteExpression): ts.Expression {
    const tsStatements = expression_as_statements(expr);
    const expressionStatement = tsStatements.find(v => ts.isExpressionStatement(v)) as ts.ExpressionStatement
    if (!expressionStatement || !ts.isParenthesizedExpression(expressionStatement.expression)) {
        console.warn(`Couldn't extract typescript expression from svelte expression at ${expr.position.start.line}:${expr.position.start.column}`)
        return null;
    }
    return expressionStatement.expression.expression;
}

export function parse_await_expression(expr: SvelteExpression): { promiseExpr: ts.Expression, hasThen: boolean, thenExpr?: ts.Expression } {
    //try and parse it
    let statements = expression_as_statements(expr);
    
    //if there is only one statement then we don't have a then block
    if (statements.length == 1) {
        const expressionStatement = statements.find(v => ts.isExpressionStatement(v)) as ts.ExpressionStatement
        if (!expressionStatement || !ts.isParenthesizedExpression(expressionStatement.expression)) {
            console.warn(`Couldn't extract typescript expression from svelte await expression at ${expr.position.start.line}:${expr.position.start.column}`)
            return null;
        }
        return {
            promiseExpr: expressionStatement.expression.expression,
            hasThen: false
        }
    }

    //find our then block
    let thenKeyword: ts.Identifier;
    let stmt = statements.find(s => ts.isExpressionStatement(s) &&  ts.isIdentifier(s.expression) && s.expression.escapedText == "then");
    if (stmt) {
        thenKeyword = ((stmt as ExpressionStatement).expression as Identifier);
    } else {
        //sometimes it is parsed as an element access expression ( blah then [a, b]) it sees the then part as 'then [a, b]' array access
        stmt = statements.find(s => ts.isExpressionStatement(s) &&  ts.isElementAccessExpression(s.expression) && ts.isIdentifier(s.expression.expression) && s.expression.expression.escapedText == "then");
        thenKeyword = (((stmt as ExpressionStatement).expression as ElementAccessExpression).expression as Identifier);
    }

    if (!thenKeyword) {
        console.warn(`Couldn't parse multiple expressions from await expression at ${expr.position.start.line}:${expr.position.start.column}`)
        return {
            promiseExpr: null,
            hasThen: false,
        }
    }
    
    //now we can parse again safely
    const promiseExprText =  expr.value.substring(0, thenKeyword.pos - expr.position.start.offset);
    const promiseSvelteExpression = {
        type: expr.type,
        value: promiseExprText,
        position: expr.position //we can reuse the position here since we only consider start for generating the ast
    }

    const thenExprOffset = thenKeyword.pos + "then".length
    const thenExprText = expr.value.substring(promiseExprText.length + "then".length + 1);

    const promiseExpressionLines = promiseExprText.split("\n");

    const thenSvelteexpression: SvelteExpression = {
        type: expr.type,
        value: thenExprText,
        position: {
            start: {
                offset: expr.position.start.offset + promiseExprText.length + "then".length,
                line: expr.position.start.line + promiseExpressionLines.length - 1,
                column: promiseExpressionLines.length == 1 ? expr.position.start.column + promiseExprText.length + "then".length : promiseExpressionLines[promiseExpressionLines.length-1].length
            },
            end: expr.position.end //we can reuse the position here since we only consider start for generating the ast
        }
    }

    return {
        promiseExpr: expression_to_ast(promiseSvelteExpression),
        hasThen: true,
        thenExpr: expression_to_ast(thenSvelteexpression)
    }
}