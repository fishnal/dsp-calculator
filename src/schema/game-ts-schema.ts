export type ItemType = 'RESOURCE' | 'MATERIAL' | 'COMPONENT' | 'PRODUCT'
	| 'LOGISTICS' | 'PRODUCTION' | 'MATRIX';

export type ProductionType = 'NONE' | 'SMELT' | 'CHEMICAL' | 'REFINE' | 'ASSEMBLE'
	| 'PARTICLE' | 'EXCHANGE' | 'PHOTON_STORE' | 'FRACTIONATE' | 'RESEARCH';

export type GameData = {
	readonly items: readonly Item[];
	readonly recipes: readonly Recipe[];
	readonly startingRecipes: readonly Recipe[];
}

export type Item = BaseItem<Exclude<ItemType, 'PRODUCTION'>> | ProductionItem;

export type BaseItem<T extends ItemType = ItemType> = {
	readonly name: string;
	readonly type: T;
}

export type BaseProductionItem<T extends ProductionType = ProductionType> =
	BaseItem<'PRODUCTION'> & {
		readonly productionType: T;
	};

export type FacilityProductionItem = BaseProductionItem<Exclude<ProductionType, 'NONE'>> & {
	readonly productionSpeed: number;
}

export type NonFacilityProductionItem = BaseProductionItem<'NONE'>;

export type ProductionItem = FacilityProductionItem | NonFacilityProductionItem;

export type Recipe = {
	readonly outputs: readonly ItemWithFrequency[];
	readonly inputs: readonly ItemWithFrequency[];
	readonly producedIn: FacilityProductionItem;
	readonly productionTimeInSeconds: number;
}

export type ItemWithFrequency = {
	readonly item: Item;
	readonly count: number;
}

export type ItemWithRate = {
	readonly item: Item;
	readonly perMinute: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isItemType(x: any): x is ItemType {
	if (x == null || typeof x !== 'string') return false;

	switch (x) {
		case 'RESOURCE':
		case 'MATERIAL':
		case 'COMPONENT':
		case 'PRODUCT':
		case 'LOGISTICS':
		case 'PRODUCTION':
		case 'MATRIX':
			return true;
		default:
			return false;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isProductionType(x: any): x is ProductionType {
	if (x == null || typeof x !== 'string') {
		return false;
	}

	switch (x) {
		case 'NONE':
		case 'SMELT':
		case 'CHEMICAL':
		case 'REFINE':
		case 'ASSEMBLE' :
		case 'PARTICLE':
		case 'EXCHANGE':
		case 'PHOTON_STORE':
		case 'FRACTIONATE':
		case 'RESEARCH':
			return true;
		default:
			return false;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isFacilityProductionItem(x: any): x is FacilityProductionItem {
	if (x == null || typeof x !== 'object') {
		return false;
	}

	return x.type === 'PRODUCTION' && isProductionType(x.productionType) && x.productionType !== 'NONE';
}

export function gameDataToJson(gameData: GameData): string {
	function serializeRecipe(recipe: Recipe): SerializedRecipe {
		let inputs = recipe.inputs.map(serializeItemWithFrequency);
		let outputs = recipe.outputs.map(serializeItemWithFrequency);
		let producedInItemIndex = gameData.items.indexOf(recipe.producedIn);

		if (producedInItemIndex < 0) {
			throw new Error(`Recipe ${JSON.stringify(recipe)} is made in ${JSON.stringify(recipe.producedIn)}, but cannot find a reference to the item in the items array`);
		}

		return {
			inputs,
			outputs,
			producedInItemIndex: producedInItemIndex,
			productionTimeInSeconds: recipe.productionTimeInSeconds
		}
	}

	function serializeItemWithFrequency(iwf: ItemWithFrequency): SerializedItemWithFrequency {
		let itemIndex = gameData.items.indexOf(iwf.item);
		if (itemIndex < 0) {
			throw new Error(`Unable to find reference to item ${JSON.stringify(iwf.item)}`);
		}

		return {
			itemIndex: itemIndex,
			count: iwf.count
		}
	}

	let recipes = gameData.recipes.map(serializeRecipe);
	let startingRecipeIds = gameData.startingRecipes.map(recipe => {
		let recipeIndex = gameData.recipes.indexOf(recipe);
		if (recipeIndex < 0) {
			throw new Error(`Unable to find reference to recipe ${JSON.stringify(recipe)}`);
		}

		return recipeIndex;
	})

	let serializedGameData: SerializedGameData = {
		items: gameData.items,
		recipes,
		startingRecipeIndices: startingRecipeIds
	}

	return JSON.stringify(serializedGameData);
}

export function gameDataFromJson(jsonStr: string): GameData {
	let serializedGameData = JSON.parse(jsonStr) as SerializedGameData;

	function deserializeRecipe(serializedRecipe: SerializedRecipe): Recipe {
		let inputs = serializedRecipe.inputs.map(deserializeItemWithFrequency);
		let outputs = serializedRecipe.outputs.map(deserializeItemWithFrequency);
		let producedInItem = serializedGameData.items[serializedRecipe.producedInItemIndex];

		if (producedInItem == null) {
			throw new Error(`No item at index ${serializedRecipe.producedInItemIndex}`);
		}

		if (producedInItem.type !== 'PRODUCTION' || producedInItem.productionType === 'NONE') {
			let msg = `Expected recipe to be produced in a facility production item, but is produced in something else: ${JSON.stringify(producedInItem)}`
			throw new Error(msg);
		}

		return {
			inputs,
			outputs,
			producedIn: producedInItem,
			productionTimeInSeconds: serializedRecipe.productionTimeInSeconds
		}
	}

	function deserializeItemWithFrequency(serializedIwf: SerializedItemWithFrequency): ItemWithFrequency {
		let item = serializedGameData.items[serializedIwf.itemIndex];

		if (item == null) {
			throw new Error(`No item at index ${serializedIwf.itemIndex}`);
		}

		return {
			item,
			count: serializedIwf.count
		}
	}

	let recipes = serializedGameData.recipes.map(deserializeRecipe);
	let startingRecipes = serializedGameData.startingRecipeIndices.map(recipeId => {
		let recipe = recipes[recipeId];
		if (recipe == null) {
			throw new Error(`No recipe at index ${recipeId}`);
		}
		return recipe;
	});

	return {
		items: serializedGameData.items,
		recipes,
		startingRecipes
	}
}

type SerializedGameData = {
	readonly items: readonly Item[];
	readonly recipes: readonly SerializedRecipe[];
	readonly startingRecipeIndices: readonly number[];
}

type SerializedRecipe = {
	readonly inputs: readonly SerializedItemWithFrequency[];
	readonly outputs: readonly SerializedItemWithFrequency[];
	readonly producedInItemIndex: number;
	readonly productionTimeInSeconds: number;
}

type SerializedItemWithFrequency = {
	readonly itemIndex: number;
	readonly count: number;
}
