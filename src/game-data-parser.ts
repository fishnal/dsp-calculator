import luaToJson from "./lib/@iarna/lua-to-json";
import fs from 'fs/promises';
import { GameData, Item, isItemType, isProductionType, ProductionType, Recipe, ItemWithFrequency, isFacilityProductionItem } from './schema/game-ts-schema';
import chunk from "lodash/chunk";
import { LuaGameData, LuaGameItemMap, LuaGameFacilitiesMap, LuaGameItem, LuaGameFacility, LuaGameRecipe } from './schema/game-lua-schema';

export async function parseDSPLuaGameData(filename: string): Promise<GameData> {
	let buf = await fs.readFile(filename);
	let luaVariables: { gameData: LuaGameData } = luaToJson(buf.toString());
	let {
		game_items: luaGameItems,
		game_facilities: luaGameFacilities,
		game_recipes: luaGameRecipes,
		starting_recipes: luaStartingRecipes
	} = luaVariables.gameData;

	let { items, itemIdMap } = parseLuaGameItemMap(luaGameItems, luaGameFacilities);
	let { recipes, recipeIdMap } = parseLuaGameRecipes(luaGameRecipes, itemIdMap);
	let startingRecipes = luaStartingRecipes.map(id => recipeIdMap.get(id))
		.filter(function f(x, index): x is Exclude<typeof x, undefined> {
			if (x == null) {
				throw new TypeError(`no recipe object for recipe id ${luaStartingRecipes[index]}`);
			}

			return true;
		});

	return {
		items,
		recipes,
		startingRecipes
	};
}

export function parseLuaGameItemMap(gameItemMap: LuaGameItemMap, gameFacilities: LuaGameFacilitiesMap): {
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
}

function getProductionTypeFromLuaGameFacilityMap(itemId: number, gameFacilities: Record<string, LuaGameFacility>): ProductionType {
	let result = Object.entries(gameFacilities).find(([_, gameFacility]) =>
		gameFacility.buildings.indexOf(itemId) >= 0);
	let productionType = result?.[0] ?? 'NONE';

	if (!isProductionType(productionType)) {
		throw new TypeError(`Invalid production type "${productionType}" for facility item ${itemId}`);
	}

	return productionType;
}

export function parseLuaGameRecipes(gameRecipes: LuaGameRecipe[], itemIdMap: Map<keyof LuaGameItemMap, Item>): {
	recipes: Recipe[];
	recipeIdMap: Map<number, Recipe>;
} {
	let recipes = gameRecipes.map(luaGameRecipe => {
		let inputs = mapLuaRecipeItemsToItemsWithFrequency(luaGameRecipe.inputs, itemIdMap);
		let outputs = mapLuaRecipeItemsToItemsWithFrequency(luaGameRecipe.outputs, itemIdMap);

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
}

export function mapLuaRecipeItemsToItemsWithFrequency(luaRecipeItems: number[], itemIdMap: Map<keyof LuaGameItemMap, Item>): ItemWithFrequency[] {
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

// parseDSPLuaGameData('./src/resources/gamedata.lua').catch(console.error);
