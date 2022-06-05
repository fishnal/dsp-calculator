import { randomBytes } from "crypto";

import { Item, ItemType, Recipe } from "@/main/schema/GameTsSchema";

test('foo', () => {
	expect(1).toBe(1);
})

// TODO Move these tests
/*
describe('getting list of recipes', () => {
	test('is not a reference to the same array passed in constructor', () => {
		let arr: Recipe[] = [];
		let x = new RecipeCalculator(RecipeArray(arr));
		expect(x).not.toBe(arr);
	});

	test('is empty when initialized with empty array', () => {
		let x = new RecipeCalculator(RecipeArray());
		expect(x.recipes).toHaveLength(0);
	});

	test('is correct when initialized with some recipes', () => {
		let recipes = [ null, null, null ] as unknown[] as Recipe[];
		let x = new RecipeCalculator(RecipeArray(recipes));
		expect(x.recipes).toEqual([null, null, null]);
	});
});

describe('getByOutputItem', () => {
	test('gives empty list when there are no recipes', () => {
		let recipeList = new RecipeCalculator(RecipeArray());

		expect(recipeList.getByOutputItem('')).toHaveLength(0);
	});

	test('gives empty list when there are no matching recipes', () => {
		let ironOre = { name: 'iron ore', type: 'RESOURCE' };
		let ironIngot = { name: 'iron ingot', type: 'COMPONENT' } as Item;
		let recipe = {
			"inputs": [ { "item": ironOre, "count": 1 } ],
			"outputs": [ { "item": ironIngot, "count": 1 } ],
			"producedIn": { name: 'smelter', productionType: 'SMELT', productionSpeed: -1, type: 'PRODUCTION' },
			"productionTimeInSeconds": 1
		} as Recipe;
		let recipeList = new RecipeCalculator([recipe]);

		expect(recipeList.getByOutputItem({ name: 'n/a', type: 'MATRIX' }))
			.toHaveLength(0);
	});

	test('gives 1 match', () => {
		let ironOre = { name: 'iron ore', type: 'RESOURCE' };
		let ironIngot = { name: 'iron ingot', type: 'COMPONENT' } as Item;
		let ironIngotRecipe = {
			"inputs": [ { "item": ironOre, "count": 1 } ],
			"outputs": [ { "item": ironIngot, "count": 1 } ],
			"producedIn": { name: 'smelter', productionType: 'SMELT', productionSpeed: -1, type: 'PRODUCTION' },
			"productionTimeInSeconds": 1
		} as Recipe;
		let recipeList = new RecipeCalculator([ironIngotRecipe, randomRecipe()]);

		expect(recipeList.getByOutputItem(ironIngot)).toEqual([ironIngotRecipe]);
	});

	test('gives multiple matches', () => {
		let water = { name: 'water', type: 'RESOURCE' } as Item;
		let ironOre = { name: 'iron ore', type: 'RESOURCE' } as Item;
		let ironIngot = { name: 'iron ingot', type: 'COMPONENT' } as Item;
		let ironIngotRecipe = {
			"inputs": [ { "item": ironOre, "count": 1 } ],
			"outputs": [ { "item": ironIngot, "count": 1 } ],
			"producedIn": { name: 'smelter', productionType: 'SMELT', productionSpeed: -1, type: 'PRODUCTION' },
			"productionTimeInSeconds": 1
		} as Recipe;
		let ironIngotRecipe2 = {
			"inputs": [ { "item": water, "count": 1 } ],
			"outputs": [ { "item": ironIngot, "count": 1 } ],
			"producedIn": { name: 'smelter', productionType: 'SMELT', productionSpeed: -1, type: 'PRODUCTION' },
			"productionTimeInSeconds": 1
		} as Recipe;
		let recipeList = new RecipeCalculator([ironIngotRecipe, ironIngotRecipe2, randomRecipe(), randomRecipe()]);

		expect(recipeList.getByOutputItem(ironIngot)).toEqual([ironIngotRecipe, ironIngotRecipe2]);
	});
});
*/

function randomItem(itemType?: ItemType): Item {
	return {
		name: randomBytes(8).toString('hex'),
		type: itemType ?? 'RANDOM_DEFAULT'
	} as unknown as Item;
}

function randomRecipe(itemType?: ItemType) {
	return {
		"inputs": [ { "item": randomItem(itemType), "count": 1 } ],
		"outputs": [ { "item": randomItem(itemType), "count": 1 } ],
		"producedIn": { name: 'smelter', productionType: 'SMELT', productionSpeed: -1, type: 'PRODUCTION' },
		"productionTimeInSeconds": 1
	} as Recipe;
}
