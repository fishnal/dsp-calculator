import { isItemType, isProductionType, Item, FacilityProductionItem, ProductionItem, isFacilityProductionItem } from '@/main/schema/GameTsSchema';

describe('isItemType', () => {
	test.each([
		0,
		{},
		true,
		Symbol(),
		null,
		undefined,
		BigInt(0),
		'fake fake fake'
	])('false for %p', x => {
		expect(isItemType(x)).toBeFalsy();
	});

	test.each([
		'RESOURCE',
		'MATERIAL',
		'COMPONENT',
		'PRODUCT',
		'LOGISTICS',
		'PRODUCTION',
		'MATRIX'
	])('true for %p', x => {
		expect(isItemType(x)).toBeTruthy();
	});
});

describe('isProductionType', () => {
	test.each([
		0,
		{},
		true,
		Symbol(),
		null,
		undefined,
		BigInt(0),
		'fake fake fake'
	])('false for %p', x => {
		expect(isProductionType(x)).toBeFalsy();
	});

	test.each([
		'NONE',
		'SMELT',
		'CHEMICAL',
		'REFINE',
		'ASSEMBLE',
		'PARTICLE',
		'EXCHANGE',
		'PHOTON_STORE',
		'FRACTIONATE',
		'RESEARCH'
	])('true for %p', x => {
		expect(isProductionType(x)).toBeTruthy();
	});
});

describe('isFacilityProuctionItem', () => {
	test.each<JsPrimitive>([
		0,
		{},
		true,
		Symbol(),
		null,
		undefined,
		BigInt(0)
	])('false for %p', x => {
		expect(isFacilityProductionItem(x)).toBeFalsy();
	});

	test.each<Item>([
		{ name: 'n/a', type: 'COMPONENT' },
		{ name: 'n/a', type: 'LOGISTICS' },
		{ name: 'n/a', type: 'MATERIAL' },
		{ name: 'n/a', type: 'MATRIX' },
		{ name: 'n/a', type: 'PRODUCT' },
		{ name: 'n/a', type: 'RESOURCE' }
	])('false for %p', x => {
		expect(isFacilityProductionItem(x)).toBeFalsy();
	});

	test.each<ProductionItem>([
		{ name: 'n/a', type: 'PRODUCTION', productionType: 'NONE' }
	])('false for %p', x => {
		expect(isFacilityProductionItem(x)).toBeFalsy();
	});

	test.each<FacilityProductionItem>([
		{ name: 'n/a', type: 'PRODUCTION', productionSpeed: 1, productionType: "ASSEMBLE" },
		{ name: 'n/a', type: 'PRODUCTION', productionSpeed: 1, productionType: "CHEMICAL" },
		{ name: 'n/a', type: 'PRODUCTION', productionSpeed: 1, productionType: "EXCHANGE" },
		{ name: 'n/a', type: 'PRODUCTION', productionSpeed: 1, productionType: "FRACTIONATE" },
		{ name: 'n/a', type: 'PRODUCTION', productionSpeed: 1, productionType: "PARTICLE" },
		{ name: 'n/a', type: 'PRODUCTION', productionSpeed: 1, productionType: "PHOTON_STORE" },
		{ name: 'n/a', type: 'PRODUCTION', productionSpeed: 1, productionType: "REFINE" },
		{ name: 'n/a', type: 'PRODUCTION', productionSpeed: 1, productionType: "RESEARCH" },
		{ name: 'n/a', type: 'PRODUCTION', productionSpeed: 1, productionType: "SMELT" }
	])('false for %p', x => {
		expect(isFacilityProductionItem(x)).toBeTruthy();
	});
});

type JsPrimitive = undefined | null | number | bigint | string | symbol | boolean | object;
