import { isEqual } from 'lodash';
import { ItemWithRate, ReadonlyRecipeArray } from '../schema/GameTsSchema';

export default class RecipeCalculator {
	constructor(public readonly recipes: ReadonlyRecipeArray) {}

	getInputRequirements(itemName: string, amountPerMinute: number): ItemWithRate[] {
		let recipes = this.recipes.byOutput(itemName);
		if (recipes.length === 0) {
			return [];
		}

		// TODO Only picking first recipe for now, but should be selectable
		let mainRecipe = recipes[0];

		let outputCount = mainRecipe.outputs.find(x => isEqual(x, itemName))?.count;
		if (outputCount == null) return [];

		let stdOutputRPM = outputCount / mainRecipe.productionTimeInSeconds * 60;
		let stackMultiplier = amountPerMinute / stdOutputRPM;

		return this.getInputRequirementsWithMultiplier(itemName, stackMultiplier);
	}

	private getInputRequirementsWithMultiplier(itemName: string, stackMultiplier: number): ItemWithRate[] {
		let recipes = this.recipes.byOutput(itemName);
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
}
