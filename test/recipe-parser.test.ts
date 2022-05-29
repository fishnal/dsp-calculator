import { readFile } from 'fs/promises';
import luaToJson from '../src/lib/@iarna/lua-to-json';
import { parseDSPLuaGameData, mapLuaRecipeItemsToItemsWithFrequency, parseLuaGameItemMap } from '../src/recipe-parser';
import { LuaGameData, LuaGameItemMap, LuaGameFacilitiesMap } from '../src/schema/game-lua-schema';
import { isItemType, isProductionType, isFacilityProductionItem, Item, FacilityProductionItem, ProductionItem } from '../src/schema/game-ts-schema';

jest.mock('fs/promises');
jest.mock('../src/lib/@iarna/lua-to-json');
jest.mock('../src/schema/game-ts-schema');

const mocks = {
	readFile: readFile as jest.MockedFn<typeof readFile>,
	luaToJson: luaToJson as jest.MockedFn<typeof luaToJson>,
	isItemType: isItemType as unknown as jest.MockedFn<typeof isItemType>,
	isProductionType: isProductionType as unknown as jest.MockedFn<typeof isProductionType>,
	isFacilityProductionItem: isFacilityProductionItem as unknown as jest.MockedFn<typeof isFacilityProductionItem>
};

describe('mapLuaRecipeItemsToItemsWithFrequency', () => {
	test('empty array produces empty array', () => {
		expect(mapLuaRecipeItemsToItemsWithFrequency([], new Map())).toHaveLength(0);
	});

	test.each([
		[[0]],
		[[0, 1, 2]],
		[[0, 1, 2, 3, 4]]
	])('odd length array fails (array=%p)', arr => {
		expect(() => mapLuaRecipeItemsToItemsWithFrequency(arr, new Map()))
			.toThrowError(/^expected even number of elements in lua recipe items, but got \d+/i);
	});

	test('item id mapping does not exist', () => {
		let arr = [1001, 3];
		expect(() => mapLuaRecipeItemsToItemsWithFrequency(arr, new Map()))
			.toThrowError(/could not find item object for id: 100/i);
	});

	test('happy path', () => {
		let arr = [ 1001, 3 ];
		let map = new Map<string, Item>();
		let myItem: Item = { name: 'foo', type: 'RESOURCE' };
		map.set('1001', myItem);

		let itemsWithFrequency = mapLuaRecipeItemsToItemsWithFrequency(arr, map);
		expect(itemsWithFrequency).toHaveLength(1);
		expect(itemsWithFrequency[0]).toEqual({ item: myItem, count: 3 });
	});
});

describe('parseLuaGameItemMap', () => {
	test('empty map produces empty items and empty id mapping', () => {
		let { items, itemIdMap } = parseLuaGameItemMap({}, {});

		expect(items).toHaveLength(0);
		expect(itemIdMap.size).toBe(0);
	});

	test('invalid item type', () => {
		let gameItemMap: LuaGameItemMap = { 0: { name: '', type: 'fake' } };
		mocks.isItemType.mockReturnValue(false);

		expect(() => parseLuaGameItemMap(gameItemMap, {}))
			.toThrowError(/invalid item type: fake/i);
	});

	test('success for non-production item', () => {
		let gameItemMap: LuaGameItemMap = { '0': { name: '', type: 'RESOURCE'} };
		let expectedItem = { name: '', type: 'RESOURCE' }
		mocks.isItemType.mockReturnValue(true);

		let { items, itemIdMap } = parseLuaGameItemMap(gameItemMap, {});

		expect(items).toHaveLength(1);
		expect(items[0]).toEqual(expectedItem);
		expect(itemIdMap.get('0')).toEqual(expectedItem);
	});

	test('success for production item with facility mapping', () => {
		let gameItemMap: LuaGameItemMap = { '0': { name: 'foo', type: 'PRODUCTION' } };
		let facilitiesMap: LuaGameFacilitiesMap = { SMELT: { buildings: [ 0 ] } };
		let expectedItem: FacilityProductionItem = {
			name: 'foo',
			type: 'PRODUCTION',
			productionSpeed: -1,
			productionType: 'SMELT'
		};

		mocks.isItemType.mockReturnValue(true);
		mocks.isProductionType.mockReturnValue(true);

		let { items, itemIdMap } = parseLuaGameItemMap(gameItemMap, facilitiesMap);

		expect(items).toHaveLength(1);
		expect(items[0]).toEqual(expectedItem);
		expect(itemIdMap.get('0')).toEqual(expectedItem);
	});

	test('failure for production item with facility mapping but invalid production type', () => {
		let gameItemMap: LuaGameItemMap = { '0': { name: 'foo', type: 'PRODUCTION' } };
		let facilitiesMap: LuaGameFacilitiesMap = { 'FAKE': { buildings: [ 0 ] } };

		mocks.isItemType.mockReturnValue(true);
		mocks.isProductionType.mockReturnValue(false);

		expect(() => parseLuaGameItemMap(gameItemMap, facilitiesMap))
			.toThrowError(/invalid production type "FAKE" for facility item 0/i);
	});

	test('success for production item without facility mapping', () => {
		let gameItemMap: LuaGameItemMap = { 0: { name: 'foo', type: 'PRODUCTION' } };
		let facilitiesMap: LuaGameFacilitiesMap = { SMELT: { buildings: [ 1 ] } };
		let expectedItem: ProductionItem = {
			name: 'foo',
			type: 'PRODUCTION',
			productionType: 'NONE'
		};

		mocks.isItemType.mockReturnValue(true);
		mocks.isProductionType.mockReturnValue(true);

		let { items, itemIdMap } = parseLuaGameItemMap(gameItemMap, facilitiesMap);

		expect(items).toHaveLength(1);
		expect(items[0]).toEqual(expectedItem);
		expect(itemIdMap.get('0')).toEqual(expectedItem);
	});

	test('success for both non-production and production items', () => {
		let gameItemMap: LuaGameItemMap = {
			0: { name: 'foo', type: 'PRODUCTION' },
			1: { name: 'bar', type: 'RESOURCE' }
		};
		let facilitiesMap: LuaGameFacilitiesMap = { SMELT: { buildings: [ 0 ] } };
		let expectedItem1: FacilityProductionItem = {
			name: 'foo',
			type: 'PRODUCTION',
			productionSpeed: -1,
			productionType: 'SMELT'
		};
		let expectedItem2: Item = {
			name: 'bar',
			type: 'RESOURCE'
		};

		mocks.isItemType.mockReturnValue(true);
		mocks.isProductionType
			.mockReturnValueOnce(true)
			.mockReturnValueOnce(false);

		let { items, itemIdMap } = parseLuaGameItemMap(gameItemMap, facilitiesMap);

		expect(items).toHaveLength(2);
		expect(items[0]).toEqual(expectedItem1);
		expect(items[1]).toEqual(expectedItem2);
		expect(itemIdMap.get('0')).toEqual(expectedItem1);
		expect(itemIdMap.get('1')).toEqual(expectedItem2);
	});
});

describe('parseLuaGameRecipes', () => {
	test.todo('not written');
});

describe('parse lua game data', () => {
	test.todo('not written');
});
