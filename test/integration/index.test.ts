import { Recipe, gameDataToJson, gameDataFromJson } from '../../src/schema/game-ts-schema';
import path from 'path';
import gameDataParser from '../../src/game-data/parser';
import { fail } from 'assert';
import { isEqual } from 'lodash';
import { writeFile } from 'fs/promises';

test('small game data file', async () => {
	let x = await gameDataParser.parseDSPLuaGameData(path.join(__dirname, 'small-gamedata.lua'));
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

function assertArrayEquals(expected: readonly any[], actual: readonly any[]) {
	assertSubsetOf(expected, actual);
	assertSubsetOf(actual, expected);
}

function assertSubsetOf(subset: readonly any[], set: readonly any[]) {
	subset.forEach((subsetItem) => {
		if (!set.find(setItem => isEqual(setItem, subsetItem))) {
			fail(`Did not find ${JSON.stringify(subsetItem)} in ${JSON.stringify(set)}`);
		}
	});
}

describe('serialization and deserialization', () => {
	test.each([
		path.join(__dirname, 'small-gamedata.lua'),
		'./src/resources/gamedata.lua'
	])
	('small game data', async (filepath) => {
		let x = await gameDataParser.parseDSPLuaGameData(filepath);
		let y = gameDataFromJson(gameDataToJson(x));

		expect(y).toEqual(y);

		await writeFile(path.basename(filepath)+'.json', gameDataToJson(x));
	});
});
