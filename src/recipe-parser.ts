import luaToJson from "./lib/@iarna/lua-to-json";
import fs from 'fs/promises';

async function parseRecipe(filename: string) {
	let buf = await fs.readFile(filename);
	let variables = luaToJson(buf.toString());

	console.log(variables);
}

parseRecipe('./src/resources/gamedata.lua').catch(console.error);
