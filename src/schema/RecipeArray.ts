import { Recipe } from './GameTsSchema';
import { extendObjectTo } from '../utils/objects';

interface IRecipeArray extends Array<Recipe> {
	byOutput(itemName: string): IRecipeArray;
}

export default function RecipeArray(arr?: Recipe[]): IRecipeArray {
	return extendObjectTo(arr ?? [], {
		byOutput
	});
}

function byOutput(this: Recipe[], itemName: string): IRecipeArray {
	return RecipeArray(this.filter(recipe => recipe.outputs
		.some(x => x.item.name === itemName)));
}
