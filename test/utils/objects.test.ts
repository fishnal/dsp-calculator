import { extendObjectTo, getAllEntries } from "@/utils/objects";

describe('getAllEntries', () => {
	test('empty object', () => {
		expect(getAllEntries({})).toEqual([]);
	});

	test('object with string, number, and symbol properties', () => {
		let mySym = Symbol('mySym');
		let o = { 'a': 'hello', 1: 'world', [mySym]: 'apples' };

		expect(getAllEntries(o)).toEqual([
			[ '1', 'world' ],
			[ 'a', 'hello' ],
			[ mySym, 'apples' ]
		]);
	});
});

describe('extendObjectTo', () => {
	let obj: Record<string | symbol, unknown>;

	beforeEach(() => {
		obj = { a: 0, [Symbol(0)]: 1 };
	});

	test('empty extension does not change anything', () => {
		expect(extendObjectTo(obj, {})).toBe(obj);
	});

	test('adding a stringy property', () => {
		let y = extendObjectTo(obj, { foo: 2 });
		expect(y).toBe(obj);
		expect(y.foo).toBe(2);
	});

	test('adding a symbol property', () => {
		let newSym = Symbol('foo');
		let y = extendObjectTo(obj, { [newSym]: 2 });
		expect(y).toBe(obj);
		expect(y[newSym]).toBe(2);
	});

	test('added properties are enumerable', () => {
		let y = extendObjectTo(obj, { foo: 2 }, true);
		expect(Object.keys(y)).toContain('foo');
	});
});
