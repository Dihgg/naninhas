// src/__mocks__/@asledgehammer/pipewrench/index.ts
import { mock } from "jest-mock-extended";
import type { Trait } from "@asledgehammer/pipewrench";

export const getText = jest.fn((...args: string[]) => args.join());

export const addXPBoost = jest.fn();

export const TraitFactory = {
	addTrait: jest.fn(() =>
		mock<Trait>({
			addXPBoost,
		})
	),
};

export const getCore = jest.fn().mockImplementation(() => ({
	getVersionNumber: jest.fn()
}));

export const Perks = {
	Woodwork: "Woodwork",
	Aiming: "Aiming",
};

(globalThis as any).string = {
	match: (version: string, pattern: string) => version.match(pattern)
};

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

export default {
	TraitFactory,
	Perks,
	getText,
	getCore,
};
