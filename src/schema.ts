export interface Item {
	readonly name: string;
	readonly type: ItemType;
}

export type Building = Item & {
	type: ItemType.BUILDING;
	productionMultiplier: number;
}

export enum ItemType {
	COMPONENT,
	BUILDING
}

export interface Recipe {
	readonly outputs: readonly ItemWithFrequency[];
	readonly inputs: readonly ItemWithFrequency[];
	readonly building: Building;
	readonly productionTimeInSeconds: number;
}

export type ItemWithFrequency = {
	item: Item;
	count: number;
};

export type ItemWithRate = {
	item: Item;
	perMinute: number;
}
