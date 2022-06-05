import { ReadonlyRecipeArray } from '@/main/schema/GameTsSchema';

export default class RecipeCalculator {
	constructor(public readonly recipes: ReadonlyRecipeArray) {}

	async getInputRequirements(outputItemName: string, targetAmountPerMinute: number): Promise<RecipeRequirement> {
		let matchedRecipes = this.recipes.byOutput(outputItemName);
		if (matchedRecipes.length === 0) {
			throw new Error(`no recipe for ${outputItemName}`);
		}

		// TODO Need a way to select a single recipe when there are multiple
		// recipes for an item. For now, selecting the first one.
		if (matchedRecipes.length > 1) {
			console.info(`Multiple recipes found for ${outputItemName}`);
		}

		let recipe = matchedRecipes[0];
		let outputCount = recipe.outputs
			.find(recipeOutput => recipeOutput.item.name === outputItemName)
			?.count;
		if (outputCount == null) {
			throw new Error(`Did not find item ${outputItemName} in the outputs for recipe ${JSON.stringify(recipe)}`);
		}

		let standardOutputPerMinute = outputCount / recipe.productionTimeInSeconds * 60;
		let amountPerMinuteScale = targetAmountPerMinute / standardOutputPerMinute;

		return {
			itemName: outputItemName,
			amountPerMinute: targetAmountPerMinute,
			requires: await Promise.all(recipe.inputs.map(async (_recipeInput) => {
				throw new Error('not implemented yet');
				// this.getInputRequirements(recipeInput.item.name, )
			}))
		}
	}
}

type RecipeRequirement = {
	itemName: string;
	amountPerMinute: number;
	requires: RecipeRequirement[];
}
