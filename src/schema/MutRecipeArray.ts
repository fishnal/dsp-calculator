import { ReadonlyRecipeArray, Recipe } from './GameTsSchema';

export default class MutRecipeArray extends Array<Recipe> implements ReadonlyRecipeArray {
	byOutput(itemName: string): MutRecipeArray {
		return new MutRecipeArray(...this.filter(recipe => recipe.outputs
			.some(x => x.item.name === itemName)));
	}
}
