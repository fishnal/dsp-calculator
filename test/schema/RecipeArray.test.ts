import RecipeArray from '../../src/schema/RecipeArray';
import { Recipe, FacilityProductionItem } from '../../src/schema/GameTsSchema';

describe('factory fuction', () => {
	test('with no args', () => {
		expect(RecipeArray()).toHaveLength(0);
	});

	test('with empty array', () => {
		expect(RecipeArray([])).toHaveLength(0);
	});

	test('with non-empty array', () => {
		let fakeRecipe = {} as Recipe;
		let x = RecipeArray([fakeRecipe]);
		expect(x).toHaveLength(1);
		expect(x).toEqual([fakeRecipe]);
	});

	test('returns the same array reference', () => {
		let arr = [] as Recipe[];
		expect(RecipeArray(arr)).toBe(arr);
	});
});

describe('byOutput', () => {
	test('no items in array returns empty list', () => {
		let x = RecipeArray([]);
		expect(x).toHaveLength(0);
		expect(x.byOutput('foobar')).toHaveLength(0);
	});

	test('items in array returns empty list when there are no matches', () => {
		let x = RecipeArray();
		let fakeFacility: FacilityProductionItem = {
			name: 'smelter', productionSpeed: -1, productionType: 'SMELT', type: 'PRODUCTION'
		}
		x.push({
			inputs: [],
			outputs: [ { count: 1, item: { name: 'foo', type: 'RESOURCE' } } ],
			producedIn: fakeFacility,
			productionTimeInSeconds: -1
		});

		expect(x.byOutput('bar')).toHaveLength(0);
	});

	test('items in array returns list with matches', () => {
		let x = RecipeArray();
		let fakeFacility: FacilityProductionItem = {
			name: 'smelter', productionSpeed: -1, productionType: 'SMELT', type: 'PRODUCTION'
		}
		let recipe: Recipe = {
			inputs: [],
			outputs: [ { count: 1, item: { name: 'foo', type: 'RESOURCE' } } ],
			producedIn: fakeFacility,
			productionTimeInSeconds: -1
		};
		x.push(recipe);

		expect(x.byOutput('foo')).toEqual([ recipe ]);
	});
});
