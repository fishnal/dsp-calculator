import { extendObjectTo, getAllEntries, lazyGetter } from "@/main/utils/objects";

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
	let obj: { a: 0, [x: symbol]: 1 };

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

describe('lazyGetter', () => {
	test('lazily invokes a supplier exactly once and re-uses the result', () => {
		const sym = Symbol();
		const spySupplier = jest.fn<symbol, []>();
		spySupplier.mockReturnValue(sym);

		const o = {
			getValue: lazyGetter(spySupplier)
		}

		let x = o.getValue();
		let y = o.getValue();
		let z = o.getValue();

		expect(x).toBe(sym);
		expect(x).toBe(y);
		expect(y).toBe(z);

		expect(spySupplier).toBeCalledTimes(1);
	});
});
