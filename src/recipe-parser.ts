import luaToJson from "./lib/@iarna/lua-to-json";
import fs from 'fs/promises';
import { GameData, Item, isItemType, isProductionType, ProductionType, Recipe, ItemWithFrequency, isFacilityProductionItem } from './schema/game-ts-schema';
import chunk from "lodash/chunk";
import { LuaGameData, LuaGameItemMap, LuaGameFacilitiesMap, LuaGameItem, LuaGameFacility, LuaGameRecipe } from './schema/game-lua-schema';

async function parseDSPLuaGameData(filename: string): Promise<GameData> {
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
	let startingRecipes = luaStartingRecipes.map(recipeIdMap.get.bind(recipeIdMap))
		.filter(assertDefined);

	return {
		items,
		recipes,
		startingRecipes
	};
}

function parseLuaGameItemMap(gameItems: LuaGameItemMap, gameFacilities: LuaGameFacilitiesMap) {
	let items = Object.entries(gameItems)
		.map(([itemId, item]) => parseLuaGameItem(item, itemId, gameFacilities));
	let itemIdMap: Map<keyof typeof gameItems, Item> = new Map();
	Object.keys(gameItems)
		.forEach((itemId, idx) => itemIdMap.set(itemId, items[idx]));

	return {
		items,
		itemIdMap
	};
}

function parseLuaGameItem(luaGameItem: LuaGameItem, itemId: keyof LuaGameItemMap, gameFacilities: LuaGameFacilitiesMap): Item {
	if (!isItemType(luaGameItem.type)) {
		throw new TypeError(`Invalid item type: ${luaGameItem.type}`);
	}

	if (luaGameItem.type === 'PRODUCTION') {
		let productionType = getProductionTypeFromLuaGameFacilityMap(Number(itemId), gameFacilities);
		return {
			name: luaGameItem.name,
			type: luaGameItem.type,
			productionSpeed: -1, // TODO how to get production speed? might need a manual table for this...
			productionType
		}
	} else {
		return {
			name: luaGameItem.name,
			type: luaGameItem.type
		}
	}
}

function getProductionTypeFromLuaGameFacilityMap(itemId: number, gameFacilities: Record<string, LuaGameFacility>): ProductionType {
	let productionType = Object.entries(gameFacilities).find(([_, gameFacility]) =>
		gameFacility.buildings.indexOf(itemId) >= 0)?.[0] ?? 'NONE';

	if (!isProductionType(productionType)) {
		throw new TypeError(`Invalid production type "${productionType}" for item ${itemId}`);
	}

	return productionType;
}

function parseLuaGameRecipes(gameRecipes: LuaGameRecipe[], itemIdMap: Map<keyof LuaGameItemMap, Item>) {
	let recipes = gameRecipes.map(luaGameRecipe => {
		let inputs = mapLuaRecipeItemsToItemsWithFrequency(luaGameRecipe.inputs, itemIdMap);
		let outputs = mapLuaRecipeItemsToItemsWithFrequency(luaGameRecipe.outputs, itemIdMap);

		if (!isProductionType(luaGameRecipe.type)) {
			throw new TypeError(`Invalid production type "${luaGameRecipe.type}" for recipe id: ${luaGameRecipe.id}`);
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

function mapLuaRecipeItemsToItemsWithFrequency(luaRecipeItems: number[], itemIdMap: Map<keyof LuaGameItemMap, Item>): ItemWithFrequency[] {
	return chunk(luaRecipeItems, 2)
		.reduce((arr, [itemId, count]) => {
			let item = itemIdMap.get(itemId);
			if (item == null) {
				throw new Error(`Could not find Item object for id: ${itemId}`);
			}

			arr.push({
				item,
				count
			});

			return arr;
		}, [] as ItemWithFrequency[]);
}

parseDSPLuaGameData('./src/resources/gamedata.lua').catch(console.error);

function assertDefined<T = any>(x: T, idx: number): x is Exclude<T, undefined> {
	if (x == null) {
		throw new TypeError(`null/undefined value at index ${idx}`);
	}

	return true;
}
