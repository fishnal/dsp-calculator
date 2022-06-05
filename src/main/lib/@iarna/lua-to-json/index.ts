// https://github.com/iarna/lua-to-json

import { readFile } from "fs/promises";
import luaParser from 'luaparse';
import path from 'path';

export function luaToJson(contents: string): unknown {
	return parseAst(luaParser.parse(contents), '<memory>');
}

export async function luaFileToJson(filepath: string): Promise<unknown> {
	filepath = path.resolve(filepath);
	let contents = (await readFile(filepath)).toString();
	return parseAst(luaParser.parse(contents), filepath);
}

function getFilepathWithCursorPos(filepath: string, ast: LuaAst) {
	let s = filepath;
	if (ast.loc != null) {
		s += `:${ast.loc.start.line}:${ast.loc.start.column}`
	}
	return s;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAstPrimitiveLiteral(x: any): x is LuaAstLiteralPrimitiveExpression {
	return x != null && typeof x['type'] === 'string' && x['type'].indexOf('Literal') >= 0;
}

function parseRawLuaString(x: string): string {
	if (x.startsWith("'") || x.startsWith("\"")) {
		x = x.substring(1);
	}

	if (x.endsWith("'") || x.endsWith("\"")) {
		x = x.substring(0, x.length - 1);
	}

	return x;
}

function parseAst(ast: LuaAst, filepath: string) {
	if (ast.type === 'Chunk') {
		return parseChunk(ast, filepath);
	}

	let msg = `Expected a chunk, but got ${ast.type} instead`;
	msg += ` at ${getFilepathWithCursorPos(filepath, ast)}`
	throw new SyntaxError(msg);
}

function parseChunk(ast: luaParser.Chunk, filepath: string) {
	let table = {};
	ast.body.forEach(stmt => parseStatement(stmt, table, filepath));
	return table;
}

function parseStatement(
	ast: luaParser.Statement,
	scope: Record<string | number, number | string | boolean | object | unknown[] | null | undefined>,
	filepath: string
): void {
	if (ast.type !== 'AssignmentStatement') {
		console.debug(`Ignoring ${ast.type} at ${getFilepathWithCursorPos(filepath, ast)}`);
		return;
	}

	ast.variables.forEach((variable, i) => {
		if (variable.type !== 'Identifier') {
			console.debug(`Ignoring ${variable.type} at ${getFilepathWithCursorPos(filepath, ast)}`);
			return;
		}

		let assignedExpression = ast.init[i];
		scope[variable.name] = parseExpression(assignedExpression, filepath);
	});
}

function parseExpression(ast: luaParser.Expression, filepath: string): object | number | string | boolean | null {
	if (ast.type === 'UnaryExpression') {
		if (ast.operator === '#') {
			let value = parseExpression(ast.argument, filepath);
			if (typeof value !== 'string') {
				let msg = `Invalid size argument at ${getFilepathWithCursorPos(filepath, ast)}`;
				msg += `\nExpected a string, but got ${typeof value} instead`;
				throw new SyntaxError(msg);
			}

			return value.length;
		} else if (ast.operator === '-') {
			let value = parseExpression(ast.argument, filepath);
			if (typeof value !== 'number') {
				let msg = `Expected number but got ${typeof value}`;
				msg += ` at ${getFilepathWithCursorPos(filepath, ast)}`;
				throw new SyntaxError(msg);
			}

			return -1 * value;
		}
	} else if (isAstPrimitiveLiteral(ast)) {
		if (ast.type === 'StringLiteral') {
			return parseRawLuaString(ast.raw);
		} else {
			return ast.value;
		}
	} else if (ast.type === 'TableConstructorExpression') {
		return parseTable(ast, filepath);
	}

	let msg = `Unexpected ${ast.type} at ${getFilepathWithCursorPos(filepath, ast)}`;
		throw new SyntaxError(msg);
}

function parseTable(ast: luaParser.TableConstructorExpression, filepath: string): object {
	let table: Record<string | number, string | number | boolean | object | null> = {};
	let tableIsArrayLike = true;
	let index = 0;
	ast.fields.forEach(field => {
		if (field.type === 'TableValue') {
			table[index++] = parseExpression(field.value, filepath);
		} else if (field.type === 'TableKeyString') {
			tableIsArrayLike = false;
			table[field.key.name] = parseExpression(field.value, filepath);
		} else {
			tableIsArrayLike = false;
			let keyName = parseExpression(field.key, filepath);
			if (typeof keyName !== 'number' && typeof keyName !== 'string') {
				let msg = `Invalid key type "${typeof keyName}"`;
				msg += ` at ${getFilepathWithCursorPos(filepath, ast)}`;
				throw new SyntaxError(msg);
			}
			let value = parseExpression(field.value, filepath);
			table[keyName] = value;
		}
	});

	if (tableIsArrayLike) {
		let arr = [];
		for (let k in table) {
			arr[Number.parseInt(k)] = table[k];
		}
		return arr;
	}

	return table;
}

type LuaAst = luaParser.Chunk
	| luaParser.Statement
	| luaParser.Expression
	| luaParser.TableKey
	| luaParser.TableKeyString
	| luaParser.TableValue;

type LuaAstLiteralPrimitiveExpression = luaParser.StringLiteral
	| luaParser.NumericLiteral
	| luaParser.BooleanLiteral
	| luaParser.NilLiteral;
