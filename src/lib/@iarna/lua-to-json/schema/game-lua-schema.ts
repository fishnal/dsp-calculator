export type LuaGameData = {
	game_items: LuaGameItemMap;
	game_recipes: LuaGameRecipe[];
	game_facilities: LuaGameFacilitiesMap;
	starting_recipes: number[];
}

export type LuaGameItem = {
	name: string;
	type: string;
	grid_index: number;
	stack_size: number;
	is_fluid: boolean;
	unlock_key: number;
	mining_from: string;
	description: string;
}

export type LuaGameRecipe = {
	id: number;
	name: string;
	type: string;
	/** Pattern is `[id1, amount for id1, id2, amount for id2, ...]`. Assume even number of elements (including 0) */
	inputs: number[];
	/** Pattern is `[id1, amount for id1, id2, amount for id2, ...]`. Assume even number of elements (including 0) */
	outputs: number[];
	grid_index: number;
	handcraft: boolean;
	seconds: number;
}

export type LuaGameFacility = {
	name: string;
	power: number;
	buildings: number[];
}

export type LuaGameItemMap = Record<number | string, LuaGameItem>;
export type LuaGameFacilitiesMap = Record<string, LuaGameFacility>;
