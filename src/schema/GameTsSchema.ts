export type ItemType = 'RESOURCE' | 'MATERIAL' | 'COMPONENT' | 'PRODUCT'
	| 'LOGISTICS' | 'PRODUCTION' | 'MATRIX';

export type ProductionType = 'NONE' | 'SMELT' | 'CHEMICAL' | 'REFINE' | 'ASSEMBLE'
	| 'PARTICLE' | 'EXCHANGE' | 'PHOTON_STORE' | 'FRACTIONATE' | 'RESEARCH';

export type GameData = {
	readonly items: ReadonlyArray<Item>;
	readonly recipes: ReadonlyRecipeArray;
	readonly startingRecipes: ReadonlyRecipeArray;
}

export interface ReadonlyRecipeArray extends ReadonlyArray<Recipe> {
	byOutput(itemName: string): ReadonlyRecipeArray;
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
