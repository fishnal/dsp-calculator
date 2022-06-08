import RecipeCalculator from "@/main/game/RecipeCalculator";
import { Item } from "@/main/schema/GameTsSchema";
import RecipeArray from "@/main/schema/RecipeArray";

describe('getRecipeDetails', () => {
	test.each([
		{
			comparison: 'equal to',
			ironPerMinute: 12,
			waterPerMinute: 36
		},
		{
			comparison: 'lower than',
			ironPerMinute: 4,
			waterPerMinute: 12
		},
		{
			comparison: 'higher than',
			ironPerMinute: 24,
			waterPerMinute: 72
		}
	])('simple recipe with target rpm flow $comparison standard rpm flow', ({
		ironPerMinute,
		waterPerMinute
	}) => {
		let items: Item[] = [
			{ name: 'water', type: 'RESOURCE' },
			{ name: 'iron', type: 'COMPONENT' }
		];
		let recipes = RecipeArray([
			{
				inputs: [ { count: 3, item: items[0] } ],
				outputs: [ { count: 1, item: items[1] }],
				producedIn: {} as any,
				productionTimeInSeconds: 5
			}
		]);
		let calc = new RecipeCalculator(items, recipes);

		let details = calc.getRecipeDetails('iron', ironPerMinute);

		expect(details.itemName).toBe('iron');
		expect(details.amountPerMinute).toBe(ironPerMinute);
		let inputRequirements = details.requirements();
		expect(inputRequirements).toHaveLength(1);
		expect(inputRequirements[0].itemName).toEqual('water');
		expect(inputRequirements[0].amountPerMinute).toEqual(waterPerMinute);
		expect(inputRequirements[0].requirements()).toHaveLength(0);
	});

	test('fails when the item does not exist', () => {
		let calc = new RecipeCalculator([], RecipeArray());

		expect(() => calc.getRecipeDetails('iron', 1))
			.toThrowError('iron is not a registered item');
	});

	test('fails when recipe could not be found', () => {
		let items: Item[] = [ { name: 'foo', type: 'COMPONENT' } ];
		let calc = new RecipeCalculator(items, RecipeArray());

		expect(() => calc.getRecipeDetails('foo', 1))
			.toThrowError('no recipe for foo');
	});
});
