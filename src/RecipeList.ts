import { isEqual } from 'lodash';
import { Recipe, Item, ItemWithRate } from './lib/@iarna/lua-to-json/schema/game-ts-schema';

export default class RecipeList {
	private readonly _recipes: Recipe[] = [];

	add(recipe: Recipe): void {
		this._recipes.push(recipe);
	}

	getByOutputItem(item: Item): Recipe[] {
		return this._recipes.filter(r =>
			r.outputs.find(outputItem =>
				isEqual(outputItem, item)));
	}

	getInputRequirements(outputItem: Item, amountPerMinute: number): ItemWithRate[] {
		let recipes = this.getByOutputItem(outputItem);
		if (recipes.length === 0) {
			return [];
		}

		// TODO Only picking first recipe for now, but should be selectable
		let mainRecipe = recipes[0];

		let outputCount = mainRecipe.outputs.find(x => isEqual(x, outputItem))?.count;
		if (outputCount == null) return [];

		let stdOutputRPM = outputCount / mainRecipe.productionTimeInSeconds * 60;
		let stackMultiplier = amountPerMinute / stdOutputRPM;

		return this.getInputRequirementsWithMultiplier(outputItem, stackMultiplier);
	}

	private getInputRequirementsWithMultiplier(outputItem: Item, stackMultiplier: number): ItemWithRate[] {
		let recipes = this.getByOutputItem(outputItem);
		if (recipes.length === 0) {
			return [];
		}

		// TODO Only picking first recipe for now, but should be selectable
		let mainRecipe = recipes[0];

		let directInputRequirements: ItemWithRate[] = mainRecipe.inputs.reduce((acc, input) => {
			let inputCount = mainRecipe.inputs.find(x => isEqual(x, input))?.count;
			if (inputCount != null) {
				// this is the input rate necessary in order to satisfy "normal" output rate
				let stdInputRatePerMin = inputCount / mainRecipe.productionTimeInSeconds * 60;
				let targetInputRPM = stdInputRatePerMin * stackMultiplier;

				acc.push({
					item: input.item,
					perMinute: targetInputRPM
				});
			}

			return acc;
		}, [] as ItemWithRate[]);

		let deepInputRequirements = mainRecipe.inputs.flatMap(input => {
			return this.getInputRequirementsWithMultiplier(input.item, stackMultiplier);
		});

		return directInputRequirements.concat(deepInputRequirements);
	}

	recipes(): readonly Recipe[] {
		return this._recipes;
	}
}
