globalThis.print = console.log;

const _statValue = (name: string) => ({ __brand: "CharacterStatValue", name } as any);
(globalThis as any).CharacterStat = {
	ANGER: _statValue("ANGER"),
	BOREDOM: _statValue("BOREDOM"),
	DISCOMFORT: _statValue("DISCOMFORT"),
	ENDURANCE: _statValue("ENDURANCE"),
	FATIGUE: _statValue("FATIGUE"),
	FITNESS: _statValue("FITNESS"),
	FOOD_SICKNESS: _statValue("FOOD_SICKNESS"),
	HUNGER: _statValue("HUNGER"),
	IDLENESS: _statValue("IDLENESS"),
	INTOXICATION: _statValue("INTOXICATION"),
	MORALE: _statValue("MORALE"),
	NICOTINE_WITHDRAWAL: _statValue("NICOTINE_WITHDRAWAL"),
	PAIN: _statValue("PAIN"),
	PANIC: _statValue("PANIC"),
	POISON: _statValue("POISON"),
	SANITY: _statValue("SANITY"),
	SICKNESS: _statValue("SICKNESS"),
	STRESS: _statValue("STRESS"),
	TEMPERATURE: _statValue("TEMPERATURE"),
	THIRST: _statValue("THIRST"),
	UNHAPPINESS: _statValue("UNHAPPINESS"),
	WETNESS: _statValue("WETNESS"),
	ZOMBIE_FEVER: _statValue("ZOMBIE_FEVER"),
	ZOMBIE_INFECTION: _statValue("ZOMBIE_INFECTION"),
};

export const addListenerMock = jest.fn((callback) => {
	// Simulate the event firing
	callback();
});
