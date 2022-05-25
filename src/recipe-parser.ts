import luaToJson from "./lib/@iarna/lua-to-json";
import fs from 'fs/promises';

async function parseRecipe(filename: string) {
	let buf = await fs.readFile(filename);
	let luaVariables: { gameData: DSPLuaGameData } = luaToJson(buf.toString());
	let { gameData } = luaVariables;
}

parseRecipe('./src/resources/gamedata.lua').catch(console.error);

type DSPLuaGameData = {
	game_items: Record<any, LuaGameItem>;
	game_recipes: LuaGameRecipe[];
	game_facilities: LuaGameFacility[];
	starting_recipes: number[];
}

type LuaGameItem = {
	name: string;
	type: string;
	grid_index: number;
	stack_size: number;
	is_fluid: boolean;
	unlock_key: number;
	mining_from: string;
	description: string;
}

type LuaGameRecipe = {
	id: number;
	name: string;
	type: string;
	outputs: number[];
	inputs: number[];
	grid_index: number;
	handcraft: boolean;
	seconds: number;
}

type LuaGameFacility = {
	name: string;
	power: number;
	buildings: number[];
}
