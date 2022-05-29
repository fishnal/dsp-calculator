import { readFile } from 'fs/promises';
import luaToJson from '../src/lib/@iarna/lua-to-json';
import gameDataParser from '../src/game-data-parser';
import { LuaGameItemMap, LuaGameFacilitiesMap, LuaGameRecipe } from '../src/schema/game-lua-schema';
import { isItemType, isProductionType, isFacilityProductionItem, Item, FacilityProductionItem, ProductionItem, Recipe } from '../src/schema/game-ts-schema';

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

const spies = {
	gameDataParser: {
		parseLuaGameItemMap: jest.spyOn(gameDataParser, 'parseLuaGameItemMap'),
		parseLuaGameRecipes: jest.spyOn(gameDataParser, 'parseLuaGameRecipes'),
		parseStartingRecipes: jest.spyOn(gameDataParser, 'parseStartingRecipes')
	}
}

describe('mapLuaRecipeItemsToItemsWithFrequency', () => {
	test('empty array produces empty array', () => {
		expect(gameDataParser.mapLuaRecipeItemsToItemsWithFrequency([], new Map())).toHaveLength(0);
	});

	test.each([
		[[0]],
		[[0, 1, 2]],
		[[0, 1, 2, 3, 4]]
	])('odd length array fails (array=%p)', arr => {
		expect(() => gameDataParser.mapLuaRecipeItemsToItemsWithFrequency(arr, new Map()))
			.toThrowError(/^expected even number of elements in lua recipe items, but got \d+/i);
	});

	test('item id mapping does not exist', () => {
		let arr = [1001, 3];
		expect(() => gameDataParser.mapLuaRecipeItemsToItemsWithFrequency(arr, new Map()))
			.toThrowError(/could not find item object for id: 100/i);
	});

	test('happy path', () => {
		let arr = [ 1001, 3 ];
		let map = new Map<string, Item>();
		let myItem: Item = { name: 'foo', type: 'RESOURCE' };
		map.set('1001', myItem);

		let itemsWithFrequency = gameDataParser.mapLuaRecipeItemsToItemsWithFrequency(arr, map);
		expect(itemsWithFrequency).toHaveLength(1);
		expect(itemsWithFrequency[0]).toEqual({ item: myItem, count: 3 });
	});
});

describe('parseLuaGameItemMap', () => {
	test('empty map produces empty items and empty id mapping', () => {
		let { items, itemIdMap } = gameDataParser.parseLuaGameItemMap({}, {});

		expect(items).toHaveLength(0);
		expect(itemIdMap.size).toBe(0);
	});

	test('invalid item type', () => {
		let gameItemMap: LuaGameItemMap = { 0: { name: '', type: 'fake' } };
		mocks.isItemType.mockReturnValue(false);

		expect(() => gameDataParser.parseLuaGameItemMap(gameItemMap, {}))
			.toThrowError(/invalid item type: fake/i);
	});

	test('success for non-production item', () => {
		let gameItemMap: LuaGameItemMap = { '0': { name: '', type: 'RESOURCE'} };
		let expectedItem = { name: '', type: 'RESOURCE' }
		mocks.isItemType.mockReturnValue(true);

		let { items, itemIdMap } = gameDataParser.parseLuaGameItemMap(gameItemMap, {});

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

		let { items, itemIdMap } = gameDataParser.parseLuaGameItemMap(gameItemMap, facilitiesMap);

		expect(items).toHaveLength(1);
		expect(items[0]).toEqual(expectedItem);
		expect(itemIdMap.get('0')).toEqual(expectedItem);
	});

	test('failure for production item with facility mapping but invalid production type', () => {
		let gameItemMap: LuaGameItemMap = { '0': { name: 'foo', type: 'PRODUCTION' } };
		let facilitiesMap: LuaGameFacilitiesMap = { 'FAKE': { buildings: [ 0 ] } };

		mocks.isItemType.mockReturnValue(true);
		mocks.isProductionType.mockReturnValue(false);

		expect(() => gameDataParser.parseLuaGameItemMap(gameItemMap, facilitiesMap))
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

		let { items, itemIdMap } = gameDataParser.parseLuaGameItemMap(gameItemMap, facilitiesMap);

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

		let { items, itemIdMap } = gameDataParser.parseLuaGameItemMap(gameItemMap, facilitiesMap);

		expect(items).toHaveLength(2);
		expect(items[0]).toEqual(expectedItem1);
		expect(items[1]).toEqual(expectedItem2);
		expect(itemIdMap.get('0')).toEqual(expectedItem1);
		expect(itemIdMap.get('1')).toEqual(expectedItem2);
	});
});

describe('parseLuaGameRecipes', () => {
	test('empty parameters returns empty recipe list and empty id mapping', () => {
		let { recipes, recipeIdMap } = gameDataParser.parseLuaGameRecipes([], new Map());

		expect(recipes).toHaveLength(0);
		expect(Object.keys(recipeIdMap)).toHaveLength(0);
	});

	test('fails on invalid production type', () => {
		let gameRecipes: LuaGameRecipe[] = [
			{ id: 0, type: 'FAKE', inputs: [], outputs: [], seconds: -1 }
		];

		mocks.isProductionType.mockReturnValue(false);

		expect(() => gameDataParser.parseLuaGameRecipes(gameRecipes, new Map()))
			.toThrowError(/invalid production type "FAKE" for recipe id 0/i)
	});

	test.each(['NONE'])
	('fails on invalid production type \"%p\"', (productionType) => {
		let gameRecipes: LuaGameRecipe[] = [
			{ id: 0, type: productionType, inputs: [], outputs: [], seconds: -1 }
		];

		mocks.isProductionType.mockReturnValue(true);

		expect(() => gameDataParser.parseLuaGameRecipes(gameRecipes, new Map()))
			.toThrowError(/unexpected recipe production type "NONE"/i);
	});

	test('fails when it cannot find a facility that produces an item because there\'s no facility production items in the map', () => {
		let gameRecipes: LuaGameRecipe[] = [
			{ id: 0, type: 'FOOBAR', inputs: [], outputs: [], seconds: -1 }
		];

		mocks.isProductionType.mockReturnValue(true);
		mocks.isFacilityProductionItem.mockReturnValue(false);

		expect(() => gameDataParser.parseLuaGameRecipes(gameRecipes, new Map()))
			.toThrowError(/could not find a facility that recipe id 0 is produced in/i);
	});

	test('fails when it cannot find a facility that produces an item because there are no matching facilities', () => {
		let gameRecipes: LuaGameRecipe[] = [
			{ id: 0, type: 'SMELT', inputs: [], outputs: [], seconds: -1 }
		];
		let itemIdMap: Map<string, ProductionItem> = new Map();
		itemIdMap.set('0', { name: 'foo', type: 'PRODUCTION', productionType: 'ASSEMBLE', productionSpeed: -1 });

		mocks.isProductionType.mockReturnValue(true);
		mocks.isFacilityProductionItem.mockReturnValue(true);

		expect(() => gameDataParser.parseLuaGameRecipes(gameRecipes, itemIdMap))
			.toThrowError(/could not find a facility that recipe id 0 is produced in/i);
	});

	test('success path', () => {
		let gameRecipes: LuaGameRecipe[] = [
			{ id: 0, type: 'SMELT', inputs: [], outputs: [], seconds: -1 }
		];
		let itemIdMap: Map<string, Item> = new Map();
		let myFacilityItem: ProductionItem = { name: 'foo', type: 'PRODUCTION', productionType: 'SMELT', productionSpeed: -1 };
		itemIdMap.set('0', myFacilityItem);

		let expectedRecipe: Recipe = {
			producedIn: myFacilityItem,
			inputs: [],
			outputs: [],
			productionTimeInSeconds: -1
		}

		mocks.isProductionType.mockReturnValue(true);
		mocks.isFacilityProductionItem.mockReturnValue(true);

		let { recipes, recipeIdMap } = gameDataParser.parseLuaGameRecipes(gameRecipes, itemIdMap);

		expect(recipes).toHaveLength(1);
		expect(recipes[0]).toEqual(expectedRecipe);
		expect(recipeIdMap.get(0)).toEqual(expectedRecipe);
	});
});

describe('parseStartingRecipes', () => {
	test('empty list returns empty list', () => {
		expect(gameDataParser.parseStartingRecipes([], new Map())).toHaveLength(0);
	});

	test('fail when starting recipe id does not have an associated recipe object', () => {
		expect(() => gameDataParser.parseStartingRecipes([0], new Map()))
			.toThrowError(/no recipe object for recipe id 0/);
	});

	test('success path', () => {
		let startingRecipeIds = [ 0, 1, 2 ];
		let recipeIdMap: Map<number, Recipe> = new Map();
		startingRecipeIds.forEach(id => recipeIdMap.set(id, { id } as any));

		let startingRecipes = gameDataParser.parseStartingRecipes(startingRecipeIds, recipeIdMap);
		expect(startingRecipes).toHaveLength(3);
		expect(startingRecipes).toEqual([
			{ id: 0 },
			{ id: 1 },
			{ id: 2 }
		]);
	});
});

describe('parseDSPLuaGameData', () => {
	test('success path', async () => {
		mocks.readFile.mockResolvedValue(Buffer.from([]));
		mocks.luaToJson.mockReturnValue({ gameData: {} });

		spies.gameDataParser.parseLuaGameItemMap.mockReturnValue({
			items: [],
			itemIdMap: new Map()
		});
		spies.gameDataParser.parseLuaGameRecipes.mockReturnValue({
			recipes: [],
			recipeIdMap: new Map()
		});
		spies.gameDataParser.parseStartingRecipes.mockReturnValue([]);

		let { items, recipes, startingRecipes } = await gameDataParser.parseDSPLuaGameData('');
		expect(items).toHaveLength(0);
		expect(recipes).toHaveLength(0);
		expect(startingRecipes).toHaveLength(0);
	});
});