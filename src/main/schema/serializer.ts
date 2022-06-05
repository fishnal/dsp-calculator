import RecipeArray from '@/main/schema/RecipeArray';
import { Item, GameData, Recipe, ItemWithFrequency } from '@/main/schema/GameTsSchema';

export function gameDataToJson(gameData: GameData): string {
	function serializeRecipe(recipe: Recipe): SerializedRecipe {
		let inputs = recipe.inputs.map(serializeItemWithFrequency);
		let outputs = recipe.outputs.map(serializeItemWithFrequency);
		let producedInItemIndex = gameData.items.indexOf(recipe.producedIn);

		if (producedInItemIndex < 0) {
			throw new Error(`Recipe ${JSON.stringify(recipe)} is made in ${JSON.stringify(recipe.producedIn)}, but cannot find a reference to the item in the items array`);
		}

		return {
			inputs,
			outputs,
			producedInItemIndex: producedInItemIndex,
			productionTimeInSeconds: recipe.productionTimeInSeconds
		}
	}

	function serializeItemWithFrequency(iwf: ItemWithFrequency): SerializedItemWithFrequency {
		let itemIndex = gameData.items.indexOf(iwf.item);
		if (itemIndex < 0) {
			throw new Error(`Unable to find reference to item ${JSON.stringify(iwf.item)}`);
		}

		return {
			itemIndex: itemIndex,
			count: iwf.count
		}
	}

	let recipes = gameData.recipes.map(serializeRecipe);
	let startingRecipeIds = gameData.startingRecipes.map(recipe => {
		let recipeIndex = gameData.recipes.indexOf(recipe);
		if (recipeIndex < 0) {
			throw new Error(`Unable to find reference to recipe ${JSON.stringify(recipe)}`);
		}

		return recipeIndex;
	})

	let serializedGameData: SerializedGameData = {
		items: gameData.items,
		recipes,
		startingRecipeIndices: startingRecipeIds
	}

	return JSON.stringify(serializedGameData);
}

export function gameDataFromJson(jsonStr: string): GameData {
	let serializedGameData = JSON.parse(jsonStr) as SerializedGameData;

	function deserializeRecipe(serializedRecipe: SerializedRecipe): Recipe {
		let inputs = serializedRecipe.inputs.map(deserializeItemWithFrequency);
		let outputs = serializedRecipe.outputs.map(deserializeItemWithFrequency);
		let producedInItem = serializedGameData.items[serializedRecipe.producedInItemIndex];

		if (producedInItem == null) {
			throw new Error(`No item at index ${serializedRecipe.producedInItemIndex}`);
		}

		if (producedInItem.type !== 'PRODUCTION' || producedInItem.productionType === 'NONE') {
			let msg = `Expected recipe to be produced in a facility production item, but is produced in something else: ${JSON.stringify(producedInItem)}`
			throw new Error(msg);
		}

		return {
			inputs,
			outputs,
			producedIn: producedInItem,
			productionTimeInSeconds: serializedRecipe.productionTimeInSeconds
		}
	}

	function deserializeItemWithFrequency(serializedIwf: SerializedItemWithFrequency): ItemWithFrequency {
		let item = serializedGameData.items[serializedIwf.itemIndex];

		if (item == null) {
			throw new Error(`No item at index ${serializedIwf.itemIndex}`);
		}

		return {
			item,
			count: serializedIwf.count
		}
	}

	let recipes = serializedGameData.recipes.map(deserializeRecipe);
	let startingRecipes = serializedGameData.startingRecipeIndices.map(recipeId => {
		let recipe = recipes[recipeId];
		if (recipe == null) {
			throw new Error(`No recipe at index ${recipeId}`);
		}
		return recipe;
	});

	return {
		items: serializedGameData.items,
		recipes: RecipeArray(recipes),
		startingRecipes: RecipeArray(startingRecipes)
	}
}

type SerializedGameData = {
	readonly items: readonly Item[];
	readonly recipes: readonly SerializedRecipe[];
	readonly startingRecipeIndices: readonly number[];
}

type SerializedRecipe = {
	readonly inputs: readonly SerializedItemWithFrequency[];
	readonly outputs: readonly SerializedItemWithFrequency[];
	readonly producedInItemIndex: number;
	readonly productionTimeInSeconds: number;
}

type SerializedItemWithFrequency = {
	readonly itemIndex: number;
	readonly count: number;
}
