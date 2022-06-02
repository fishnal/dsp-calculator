gameData = {
	game_items = {
		[1000] = {
			name = 'Copper Ore',
			type = 'RESOURCE'
		},
		[1001] = {
			name = 'Iron Ore',
			type = 'RESOURCE'
		},
		[1002] = {
			name = 'Oil',
			type = 'RESOURCE'
		},
		[1100] = {
			name = 'Copper Ingot',
			type = 'COMPONENT'
		},
		[1101] = {
			name = 'Iron Ingot',
			type = 'COMPONENT'
		},
		[1102] = {
			name = 'Refined Oil',
			type = 'COMPONENT'
		},
		[2001] = {
			name = 'Smelting Facility',
			type = 'PRODUCTION'
		},
		[2002] = {
			name = 'Chemical Facility',
			type = 'PRODUCTION'
		},
		[2003] = {
			name = "Some Production Item",
			type = 'PRODUCTION'
		}
	},

	game_recipes = {
		{
			id = 0,
			type = 'SMELT',
			inputs = {1000, 1},
			outputs = {1100, 1},
			seconds = 1
		},
		{
			id = 1,
			type = 'SMELT',
			inputs = { 1001, 1 },
			outputs = { 1101, 1 },
			seconds = 1
		},
		{
			id = 2,
			type = 'CHEMICAL',
			inputs = { 1002, 3 },
			outputs = { 1102, 9 },
			seconds = 9
		}
	},

	game_facilities = {
		NONE = { buildings = {} },
		SMELT = { buildings = {2001} },
		CHEMICAL = { buildings = {2002} }
	},

	starting_recipes = {0, 1}
}
