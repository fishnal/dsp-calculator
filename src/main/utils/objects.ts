export function extendObjectTo<T, U>(obj: T, newProperties: U, enumerable?: boolean): T & U {
	getAllEntries(newProperties).forEach(([ key, value ]) => {
		Object.defineProperty(obj, key, { value: value, enumerable, writable: true, configurable: true });
	});
	return obj as unknown as (T & U);
}

export function getAllEntries<T>(obj: T): [ keyof T, T[keyof T] ][] {
	let stringBasedEntries = Object.keys(obj)
		.map(stringProp => {
			let castedStringProp = stringProp as Exclude<keyof T, symbol>;
			return [ castedStringProp, obj[castedStringProp] ] as [ Exclude<keyof T, symbol>, T[Exclude<keyof T, symbol>] ];
		});
	let symbolBasedEntries = Object.getOwnPropertySymbols(obj)
		.map(symProp => {
			let castedSymProp = symProp as Extract<keyof T, symbol>;
			return [ castedSymProp, obj[castedSymProp] ] as [ Extract<keyof T, symbol>, T[Extract<keyof T, symbol>] ];
		});

	let allEntries: [ keyof T, T[keyof T] ][] = stringBasedEntries;
	return allEntries
		.concat(symbolBasedEntries);
}

export function lazyGetter<T>(supplier: () => T): () => T {
	let value: T | undefined;

	return () => {
		if (value == null) {
			value = supplier();
		}

		return value;
	};
}
