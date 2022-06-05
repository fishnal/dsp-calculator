import { randomBytes } from "crypto";
import RecipeList from "../src/game/RecipeList";
import { Recipe, Item, ItemType } from './schema/GameTsSchema';

describe('getting list of recipes', () => {
	test('is not a reference to the same array passed in constructor', () => {
		let arr: Recipe[] = [];
		let x = new RecipeList(arr);
		expect(x).not.toBe(arr);

	});

	test('is empty when initialized with empty array', () => {
		let x = new RecipeList([]);
		expect(x.recipes()).toHaveLength(0);
	});

	test('is correct when initialized with some recipes', () => {
		let recipes = [ null, null, null ] as unknown[] as Recipe[];
		let x = new RecipeList(recipes);
		expect(x.recipes()).toEqual([null, null, null]);
	});
});

describe('getByOutputItem', () => {
	test('gives empty list when there are no recipes', () => {
		let recipeList = new RecipeList([]);
		let item: Item = { name: '', type: 'RESOURCE' };

		expect(recipeList.getByOutputItem(item)).toHaveLength(0);
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
		let recipeList = new RecipeList([recipe]);

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
		let recipeList = new RecipeList([ironIngotRecipe, randomRecipe()]);

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
		let recipeList = new RecipeList([ironIngotRecipe, ironIngotRecipe2, randomRecipe(), randomRecipe()]);

		expect(recipeList.getByOutputItem(ironIngot)).toEqual([ironIngotRecipe, ironIngotRecipe2]);
	});
});

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
