export type LuaGameData = {
	game_items: LuaGameItemMap;
	game_recipes: LuaGameRecipe[];
	game_facilities: LuaGameFacilitiesMap;
	starting_recipes: number[];
}

export type LuaGameItem = {
	name: string;
	type: string;
}

export type LuaGameRecipe = {
	id: number;
	type: string;
	/** Pattern is `[id1, amount for id1, id2, amount for id2, ...]`. Assume even number of elements (including 0) */
	inputs: number[];
	/** Pattern is `[id1, amount for id1, id2, amount for id2, ...]`. Assume even number of elements (including 0) */
	outputs: number[];
	seconds: number;
}

export type LuaGameFacility = {
	buildings: number[];
}

export type LuaGameItemMap = Record<string, LuaGameItem>;
export type LuaGameFacilitiesMap = Record<string, LuaGameFacility>;
