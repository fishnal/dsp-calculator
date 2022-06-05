import { fail } from 'assert';
import { isEqual } from 'lodash';

import gameDataParser from '@/game/parser';
import { Recipe } from '@/schema/GameTsSchema';
import { gameDataFromJson, gameDataToJson } from '@/schema/serializer';

test('small game data file', async () => {
	let x = await gameDataParser.parseDSPLuaGameData('./test/resources/small-gamedata.lua');
	const items = [
		{ name: 'Copper Ore', type: 'RESOURCE' },
		{ name: 'Iron Ore', type: 'RESOURCE' },
		{ name: 'Oil', type: 'RESOURCE' },
		{ name: 'Copper Ingot', type: 'COMPONENT' },
		{ name: 'Iron Ingot', type: 'COMPONENT' },
		{ name: 'Refined Oil', type: 'COMPONENT' },
		{ name: 'Smelting Facility', type: 'PRODUCTION', productionType: 'SMELT', productionSpeed: -1 },
		{ name: 'Chemical Facility', type: 'PRODUCTION' , productionType: 'CHEMICAL', productionSpeed: -1 },
		{ name: 'Some Production Item', type: 'PRODUCTION', productionType: 'NONE' }
	] as const;
	let recipes: Recipe[] = [
		{
			inputs: [ { item: items[0], count: 1 } ],
			outputs: [ { item: items[3], count: 1 } ],
			producedIn: items[6],
			productionTimeInSeconds: 1
		},
		{
			inputs: [ { item: items[1], count: 1 } ],
			outputs: [ { item: items[4], count: 1 } ],
			producedIn: items[6],
			productionTimeInSeconds: 1
		},
		{
			inputs: [ { item: items[2], count: 3 } ],
			outputs: [ { item: items[5], count: 9 } ],
			producedIn: items[7],
			productionTimeInSeconds: 9
		}
	];
	let startingRecipes = [ recipes[0], recipes[1] ];

	expect(x).toBeDefined();
	assertArrayEquals(items, x.items);
	assertArrayEquals(recipes, x.recipes);
	assertArrayEquals(startingRecipes, x.startingRecipes);
});

function assertArrayEquals<T>(expected: readonly T[], actual: readonly T[]) {
	assertSubsetOf(expected, actual);
	assertSubsetOf(actual, expected);
}

function assertSubsetOf<T>(subset: readonly T[], set: readonly T[]) {
	subset.forEach((subsetItem) => {
		if (!set.find(setItem => isEqual(setItem, subsetItem))) {
			fail(`Did not find ${JSON.stringify(subsetItem)} in ${JSON.stringify(set)}`);
		}
	});
}

test.each([
	'./test/resources/small-gamedata.lua',
	'./src/resources/gamedata.lua'
])('serialization and deserialization of %p', async (filepath) => {
	let x = await gameDataParser.parseDSPLuaGameData(filepath);
	let y = gameDataFromJson(gameDataToJson(x));

	expect(y).toEqual(x);
});
