import RecipeCalculator, { PreferredRecipeFunction } from "@/main/game/RecipeCalculator";
import { FacilityProductionItem, Item } from "@/main/schema/GameTsSchema";
import RecipeArray from "@/main/schema/RecipeArray";
import { groupBy, ValueIteratee } from "lodash";

const getFirstRecipe: PreferredRecipeFunction = (_, list) => list[0];

describe('getRecipeDetails', () => {
	test.each([
		{
			comparison: 'equal to',
			cookedBeefPerMinute: 12,
			rawBeefPerMinute: 36
		},
		{
			comparison: 'lower than',
			cookedBeefPerMinute: 4,
			rawBeefPerMinute: 12
		},
		{
			comparison: 'higher than',
			cookedBeefPerMinute: 24,
			rawBeefPerMinute: 72
		}
	])('simple recipe with target rpm flow $comparison standard rpm flow', ({
		cookedBeefPerMinute: ironPerMinute,
		rawBeefPerMinute: waterPerMinute
	}) => {
		let items = {
			raw_beef: { name: 'raw beef', type: 'RESOURCE' },
			cooked_beef: { name: 'cooked beef', type: 'COMPONENT' }
		} as const;
		let recipes = RecipeArray([
			{
				inputs: [ { count: 3, item: items.raw_beef } ],
				outputs: [ { count: 1, item: items.cooked_beef }],
				producedIn: FAKE_FACILITY,
				productionTimeInSeconds: 5
			}
		]);
		let calc = new RecipeCalculator(Object.values(items), recipes, getFirstRecipe);

		let details = calc.getRecipeDetails(items.cooked_beef.name, ironPerMinute);

		expect(details.itemName).toBe(items.cooked_beef.name);
		expect(details.amountPerMinute).toBe(ironPerMinute);
		let inputRequirements = details.requirements();
		expect(inputRequirements).toHaveLength(1);
		expect(inputRequirements[0].itemName).toEqual(items.raw_beef.name);
		expect(inputRequirements[0].amountPerMinute).toEqual(waterPerMinute);
		expect(inputRequirements[0].requirements()).toHaveLength(0);
	});

	test('nested recipes', () => {
		let items = {
			raw_beef: { name: 'raw beef', type: 'RESOURCE' },
			mushrooms: { name: 'mushrooms', type: 'RESOURCE' },
			peppers: { name: 'peppers', type: 'RESOURCE' },
			milk: { name: 'milk', type: 'RESOURCE' },
			cheese: { name: 'cheese', type: 'COMPONENT' },
			cooked_beef: { name: 'cooked beef', type: 'COMPONENT' },
			beef_pasta: { name: 'beef pasta', type: 'COMPONENT' }
		} as const;
		let recipes = RecipeArray([
			{
				inputs: [ { count: 3, item: items.raw_beef } ],
				outputs: [ { count: 1, item: items.cooked_beef }],
				producedIn: FAKE_FACILITY,
				productionTimeInSeconds: 5
			},
			{
				inputs: [ { count: 2, item: items.milk } ],
				outputs: [ { count: 1, item: items.cheese } ],
				producedIn: FAKE_FACILITY,
				productionTimeInSeconds: 24
			},
			{
				inputs: [
					{ count: 1, item: items.cooked_beef },
					{ count: 5, item: items.mushrooms },
					{ count: 4, item: items.cheese }
				],
				outputs: [ { count: 1, item: items.beef_pasta } ],
				producedIn: FAKE_FACILITY,
				productionTimeInSeconds: 10
			},

		]);
		let calc = new RecipeCalculator(Object.values(items), recipes, getFirstRecipe);

		let beefPastaPerMinute = 18;

		let beefPastaRecipeDetails = calc.getRecipeDetails(items.beef_pasta.name, beefPastaPerMinute);

		expect(beefPastaRecipeDetails).toEqual({
			itemName: items.beef_pasta.name,
			amountPerMinute: 18,
			requirements: expect.toBeFunction()
		});
		expect(beefPastaRecipeDetails.requirements()).toIncludeAllMembers([
			{
				itemName: items.cooked_beef.name,
				amountPerMinute: 18,
				requirements: expect.toBeFunction()
			},
			{
				itemName: items.mushrooms.name,
				amountPerMinute: 90,
				requirements: expect.toBeFunction()
			},
			{
				itemName: items.cheese.name,
				amountPerMinute: 72,
				requirements: expect.toBeFunction()
			}
		]);

		let beefPastaRequirements = groupByInjectively(beefPastaRecipeDetails.requirements(), 'itemName');
		let {
			"cooked beef": cookedBeefRecipeDetails,
			"cheese": cheeseRecipeDetails,
			"mushrooms": mushroomRecipeDetails
		} = beefPastaRequirements;
		expect(cookedBeefRecipeDetails).toEqual({
			itemName: 'cooked beef',
			amountPerMinute: 18,
			requirements: expect.toBeFunction()
		});
		expect(cheeseRecipeDetails).toEqual({
			itemName: 'cheese',
			amountPerMinute: 72,
			requirements: expect.toBeFunction()
		});
		expect(mushroomRecipeDetails).toEqual({
			itemName: 'mushrooms',
			amountPerMinute: 90,
			requirements: expect.toBeFunction()
		});

		expect(cookedBeefRecipeDetails.requirements()).toEqual([
			{
				itemName: 'raw beef',
				amountPerMinute: 54,
				requirements: expect.toBeFunction()
			}
		]);
		let rawBeefRecipeDetails = cookedBeefRecipeDetails.requirements()[0];
		expect(rawBeefRecipeDetails.requirements()).toEqual([]);

		expect(cheeseRecipeDetails.requirements()).toEqual([
			{
				itemName: 'milk',
				amountPerMinute: 144,
				requirements: expect.toBeFunction()
			}
		]);
		let milkRecipeDetails = cheeseRecipeDetails.requirements()[0];
		expect(milkRecipeDetails.requirements()).toEqual([]);

		expect(mushroomRecipeDetails.requirements()).toEqual([]);
	});

	test('fails when the item does not exist', () => {
		let calc = new RecipeCalculator([], RecipeArray(), getFirstRecipe);

		expect(() => calc.getRecipeDetails('iron', 1))
			.toThrowError('iron is not a registered item');
	});

	test('fails when recipe could not be found', () => {
		let items: Item[] = [ { name: 'foo', type: 'COMPONENT' } ];
		let calc = new RecipeCalculator(items, RecipeArray(), getFirstRecipe);

		expect(() => calc.getRecipeDetails('foo', 1))
			.toThrowError('no recipe for foo');
	});

	test('uses a preferred recipe when there are multiple matching recipes for an output', () => {
		let items = {
			a: { name: 'a', type: 'RESOURCE' },
			b: { name: 'b', type: 'COMPONENT' },
		} as const;
		let recipes = RecipeArray([
			{
				inputs: [], outputs: [{item: items.b, count: 1}],
				producedIn: FAKE_FACILITY, productionTimeInSeconds: 1
			},
			{
				inputs: [{item: items.a, count:1}], outputs: [{item: items.b, count: 3}],
				producedIn: FAKE_FACILITY, productionTimeInSeconds: 1
			}
		]);

		let mockPreferredRecipe = jest.fn<
			ReturnType<PreferredRecipeFunction>,
			Parameters<PreferredRecipeFunction>
		>();
		mockPreferredRecipe.mockReturnValue(recipes[1]);

		let calc = new RecipeCalculator(Object.values(items), recipes, mockPreferredRecipe);
		let details = calc.getRecipeDetails(items.b.name, 60);

		expect(mockPreferredRecipe.mock.calls.length).toBe(1);
		expect(details.itemName).toBe(items.b.name);
		expect(details.amountPerMinute).toBe(60);
		expect(details.requirements()).toEqual([
			{ itemName: items.a.name, amountPerMinute: 20, requirements: expect.toBeFunction() }
		]);
	});
});

const FAKE_FACILITY: FacilityProductionItem = {
	name: 'fake facility',
	type: 'PRODUCTION',
	productionType: 'SMELT',
	productionSpeed: -1
} as const;

function groupByInjectively<T>(array: T[], iteratee: ValueIteratee<T>): Record<string, T> {
	let dict = groupBy(array, iteratee);
	let injectiveDict = {} as Record<string, T>;
	for (let k in dict) {
		if (dict[k].length > 1) {
			throw new Error(`Multiple elements map to the same key ${k}\n`
				+ `Elements: ${dict[k].toString()}`);
		}
		injectiveDict[k] = dict[k][0];
	}

	return injectiveDict;
}
