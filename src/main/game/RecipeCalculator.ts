import { Item, ItemWithFrequency, ReadonlyRecipeArray, Recipe } from '@/main/schema/GameTsSchema';
import { lazyGetter } from '@/main/utils/objects';

export type PreferredRecipeFunction = (outputItem: string, listOfRecipes: ReadonlyRecipeArray) => Recipe;

export default class RecipeCalculator {
	constructor(
		public readonly items: readonly Item[],
		public readonly recipes: ReadonlyRecipeArray,
		public readonly getPreferredRecipe: PreferredRecipeFunction
	) {}

	getRecipeDetails(itemName: string, targetOutputPerMinute: number): RecipeDetails {
		let item = this.items.find(x => x.name === itemName);
		if (item == null) {
			throw new Error(`${itemName} is not a registered item`);
		} else if (item.type === 'RESOURCE') {
			return {
				itemName,
				amountPerMinute: targetOutputPerMinute,
				requirements: () => []
			}
		}

		let matchedRecipes = this.recipes.byOutput(itemName);
		if (matchedRecipes.length === 0) {
			throw new Error(`no recipe for ${itemName}`);
		}

		let recipe: Recipe;
		if (matchedRecipes.length === 1) {
			recipe = matchedRecipes[0];
		} else {
			recipe = this.getPreferredRecipe(itemName, matchedRecipes);
			console.info(`Multiple recipes found for ${itemName}, using ${recipe}`);
		}

		let output = recipe.outputs.find(recipeOutput => recipeOutput.item.name === itemName);
		if (output == null) {
			throw new Error(`Did not find item ${itemName} in the outputs for recipe ${JSON.stringify(recipe)}`);
		}

		let standardOutputPerMinute = getStandardFlowPerMinute(recipe, output);
		let amountPerMinuteScale = targetOutputPerMinute / standardOutputPerMinute;

		return {
			itemName: itemName,
			amountPerMinute: targetOutputPerMinute,
			requirements: lazyGetter(() => {
				return recipe.inputs.map(input => {
					let standardInputPerMinute = getStandardFlowPerMinute(recipe, input);
					let targetInputPerMinute = standardInputPerMinute * amountPerMinuteScale;

					return this.getRecipeDetails(input.item.name, targetInputPerMinute);
				});
			})
		}
	}
}

function getStandardFlowPerMinute(recipe: Recipe, item: ItemWithFrequency): number {
	return item.count / recipe.productionTimeInSeconds * 60;
}

type RecipeDetails = {
	itemName: string;
	amountPerMinute: number;
	requirements(): RecipeDetails[];
}
