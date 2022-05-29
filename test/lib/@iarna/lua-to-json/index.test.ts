import { readFileSync } from "fs";
import path from "path";

import { luaToJson } from '../../../../src/lib/@iarna/lua-to-json';

test('parses simple values', () => {
	let luaStr = readFileSync(path.join(__dirname, 'simple.lua')).toString();

	let x = luaToJson(luaStr);

	expect(x).toBeDefined();
	expect(x.my_int).toBe(1);
	expect(x.my_zero).toBe(0);
	expect(x.my_negative_int).toBe(-1);
	expect(x.my_negative_zero).toBe(-0);
	expect(x.my_str).toBe('hello');
	expect(x.my_bool).toBe(true);
	expect(x.my_dict).toEqual({ alice: 1 });
	expect(x.my_arr).toEqual([ 'alice', 'bob' ]);
	expect(x.my_nil).toBeNull();
});

test('parses nested table', () => {
	let luaStr = readFileSync(path.join(__dirname, 'nested_table.lua')).toString();

	let x = luaToJson(luaStr);

	expect(x).toBeDefined();
	expect(x.my_dict).toEqual({
		a: {
			id: 217,
			name: 'alice'
		},
		b: {
			wearsGlasses: true
		},
		c: {
			key1: 'foo',
			key2: 'bar'
		},
		d: {
			0: 'AAA',
			1: 'BBB',
			2: 'CCC',
			k1: true,
			k2: false
		}
	});
});

test('parses tables as compound type', () => {
	let luaStr = readFileSync(path.join(__dirname, 'compound_table.lua')).toString();

	let x = luaToJson(luaStr);

	expect(x).toBeDefined();
	expect(x.my_table).toEqual({
		0: 'aaa',
		key1: true,
		1: 'ccc',
		key2: 207,
		2: 'eee'
	});
});

test('parses array with tables', () => {
	let luaStr = readFileSync(path.join(__dirname, 'array_with_tables.lua')).toString();

	let x = luaToJson(luaStr);

	expect(x).toBeDefined();
	expect(x.my_arr).toEqual([
		0,
		true,
		'hello',
		null,
		[ 'nested', 'array' ],
		{
			key1: 'nested',
			key2: 'map'
		}
	]);
});
