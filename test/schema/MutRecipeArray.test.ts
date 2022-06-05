import MutRecipeArray from '../../src/schema/MutRecipeArray';
import { FacilityProductionItem, Recipe } from '../../src/schema/GameTsSchema';
describe('byOutput', () => {
	test('no items in array returns empty list', () => {
		let x = new MutRecipeArray();
		expect(x).toHaveLength(0);
		expect(x.byOutput('foobar')).toHaveLength(0);
	});

	test('items in array returns empty list when there are no matches', () => {
		let x = new MutRecipeArray();
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
		let x = new MutRecipeArray();
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
