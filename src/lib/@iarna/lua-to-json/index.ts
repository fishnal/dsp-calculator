// https://github.com/iarna/lua-to-json

import assert from "assert";
import luaParser from 'luaparse';

export default function<T = any>(lua: string): T {
	return luaEval(luaParser.parse(lua));
}

function luaEval(ast: LuaAst, parentTable?: any | undefined): any {
	if (ast.type === 'Chunk') {
		let table = {};
		ast.body.forEach(function (statement) {
			luaEval(statement, table);
		});
		return table;
	} else if (ast.type === 'AssignmentStatement') {
		assert(parentTable, "Can't have an assignment statement without a place to put it");
		for (let i = 0; i < ast.variables.length; ++i) {
			let varInfo = ast.variables[i];
			if (varInfo.type !== 'Identifier') {
				throw new SyntaxError('Unknown variable type: ' + JSON.stringify(ast));
			}
			parentTable[varInfo.name] = luaEval(ast.init[i]);
		}
		return parentTable;
	} else if (ast.type === 'TableConstructorExpression') {
		let table: any = {};
		let tableIsArrayLike = true;
		let index = 0;
		ast.fields.forEach(function (field) {
			if (field.type === 'TableValue') {
				table[index++] = luaEval(field, table);
			} else {
				tableIsArrayLike = false;
				luaEval(field, table);
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
	} else if (ast.type === 'TableKey') {
		assert(parentTable, "Can't have a table key without a table to put it in");
		parentTable[luaEval(ast.key)] = luaEval(ast.value);
		return parentTable;
	} else if (ast.type === 'TableKeyString') {
		assert(parentTable, "Can't have a table key without a table to put it in");
		parentTable[ast.key.name] = luaEval(ast.value);
		return parentTable;
	} else if (ast.type === 'TableValue') {
		return luaEval(ast.value);
	} else if (astIsLiteralPrimitiveExpression(ast)) {
		if (ast.type === 'StringLiteral') {
			return (ast as WeirdStringLiteral).value ?? parseRawLuaString(ast.raw);
		}
		return ast.value;
	} else if (ast.type === 'UnaryExpression') {
		if (ast.operator !== '-') {
			throw new SyntaxError('Unsupported unary operator: ' + JSON.stringify(ast));
		}

		return -1 * luaEval(ast.argument);
	}

	console.log('Ignored ' + JSON.stringify(ast));
}

function astIsLiteralPrimitiveExpression(x: any): x is LuaAstLiteralPrimitiveExpression {
	return x != null && typeof x['type'] === 'string' && x['type'].indexOf('Literal') >= 0;
}

function parseRawLuaString(x: string) {
	if (x.startsWith("\'") || x.startsWith("\"")) {
		x = x.substring(1);
	}

	if (x.endsWith("\'") || x.endsWith("\"")) {
		x = x.substring(0, x.length - 1);
	}

	return x;
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

type WeirdStringLiteral = luaParser.StringLiteral & {
	value?: string;
}
