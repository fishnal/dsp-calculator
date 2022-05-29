import { luaToJson } from "./lib/@iarna/lua-to-json";
import fs from 'fs/promises';
import { GameData, Item, isItemType, isProductionType, ProductionType, Recipe, ItemWithFrequency, isFacilityProductionItem } from './schema/game-ts-schema';
import chunk from "lodash/chunk";
import { LuaGameItemMap, LuaGameFacilitiesMap, LuaGameFacility, LuaGameRecipe } from './schema/game-lua-schema';

function getProductionTypeFromLuaGameFacilityMap(itemId: number, gameFacilities: Record<string, LuaGameFacility>): ProductionType {
	let result = Object.entries(gameFacilities).find(([_, gameFacility]) =>
		gameFacility.buildings.indexOf(itemId) >= 0);
	let productionType = result?.[0] ?? 'NONE';

	if (!isProductionType(productionType)) {
		throw new TypeError(`Invalid production type "${productionType}" for facility item ${itemId}`);
	}

	return productionType;
}

const def = {
	async parseDSPLuaGameData(filename: string): Promise<GameData> {
		let buf = await fs.readFile(filename);
		let luaVariables = luaToJson(buf.toString());
		if (luaVariables.gameData == null) {
			throw new Error('did not find variable "gameData"');
		} else if (typeof luaVariables.gameData !== 'object') {
			throw new TypeError(`expected "gameData" to be dictionary, but instead is ${typeof luaVariables.gameData}`);
		} else if (luaVariables.gameData instanceof Array) {
			throw new TypeError(`expected "gameData" to be dictionary, but instead is array`);
		}

		let {
			game_items: luaGameItems,
			game_facilities: luaGameFacilities,
			game_recipes: luaGameRecipes,
			starting_recipes: luaStartingRecipes
		} = luaVariables.gameData as any;

		let { items, itemIdMap } = this.parseLuaGameItemMap(luaGameItems, luaGameFacilities);
		let { recipes, recipeIdMap } = this.parseLuaGameRecipes(luaGameRecipes, itemIdMap);
		let startingRecipes = this.parseStartingRecipes(luaStartingRecipes, recipeIdMap);

		return {
			items,
			recipes,
			startingRecipes
		};
	},
	parseLuaGameItemMap(gameItemMap: LuaGameItemMap, gameFacilities: LuaGameFacilitiesMap): {
		items: Item[];
		itemIdMap: Map<string, Item>
	} {
		let items = Object.entries(gameItemMap)
			.map<Item>(([itemId, luaGameItem]) => {
				if (!isItemType(luaGameItem.type)) {
					throw new TypeError(`Invalid item type: ${luaGameItem.type}`);
				}

				if (luaGameItem.type === 'PRODUCTION') {
					let productionType = getProductionTypeFromLuaGameFacilityMap(Number(itemId), gameFacilities);

					if (productionType === 'NONE') {
						return {
							name: luaGameItem.name,
							type: luaGameItem.type,
							productionType
						}
					}

					return {
						name: luaGameItem.name,
						type: luaGameItem.type,
						productionType,
						productionSpeed: -1 // TODO how to get production speed? might need a manual table for this...
					}
				} else {
					return {
						name: luaGameItem.name,
						type: luaGameItem.type
					}
				}
			});

		let itemIdMap: Map<string, Item> = new Map();
		Object.keys(gameItemMap)
			.forEach((itemId, idx) => itemIdMap.set(itemId, items[idx]));

		return {
			items,
			itemIdMap
		};
	},
	parseLuaGameRecipes(gameRecipes: LuaGameRecipe[], itemIdMap: Map<keyof LuaGameItemMap, Item>): {
		recipes: Recipe[];
		recipeIdMap: Map<number, Recipe>;
	} {
		let recipes = gameRecipes.map(luaGameRecipe => {
			let inputs = this.mapLuaRecipeItemsToItemsWithFrequency(luaGameRecipe.inputs, itemIdMap);
			let outputs = this.mapLuaRecipeItemsToItemsWithFrequency(luaGameRecipe.outputs, itemIdMap);

			if (!isProductionType(luaGameRecipe.type)) {
				throw new TypeError(`Invalid production type "${luaGameRecipe.type}" for recipe id ${luaGameRecipe.id}`);
			} else if (luaGameRecipe.type === 'NONE') {
				throw new Error(`Unexpected recipe production type "${luaGameRecipe.type}"`);
			}

			let producedIn = Array.from(itemIdMap.values())
				.filter(isFacilityProductionItem)
				.find(item => item.productionType === luaGameRecipe.type);

			if (producedIn == null) {
				throw new Error(`Could not find a facility that recipe id ${luaGameRecipe.id} is produced in`);
			}

			return {
				inputs,
				outputs,
				producedIn,
				productionTimeInSeconds: luaGameRecipe.seconds
			};
		});

		let recipeIdMap: Map<number, Recipe> = new Map();
		gameRecipes.forEach((luaGameRecipe, idx) => recipeIdMap.set(luaGameRecipe.id, recipes[idx]));

		return {
			recipes,
			recipeIdMap
		};
	},
	parseStartingRecipes(luaStartingRecipes: number[], recipeIdMap: Map<number, Recipe>): Recipe[] {
		return luaStartingRecipes
			.map(id => recipeIdMap.get(id))
			.filter(function f(recipe, index): recipe is Exclude<typeof recipe, undefined> {
				if (recipe == null) {
					throw new TypeError(`no recipe object for recipe id ${luaStartingRecipes[index]}`);
				}

				return true;
			});
	},
	mapLuaRecipeItemsToItemsWithFrequency(luaRecipeItems: number[], itemIdMap: Map<keyof LuaGameItemMap, Item>): ItemWithFrequency[] {
		if (luaRecipeItems.length % 2 !== 0) {
			throw new Error(`Expected even number of elements in lua recipe items, but got ${luaRecipeItems.length}: ${luaRecipeItems}`);
		}

		return chunk(luaRecipeItems, 2).map(([itemId, count]) => {
			let item = itemIdMap.get(itemId+'');
			if (item == null) {
				throw new Error(`Could not find Item object for id: ${itemId}`);
			}

			return {
				item,
				count
			};
		});
	}
};

export default def;
