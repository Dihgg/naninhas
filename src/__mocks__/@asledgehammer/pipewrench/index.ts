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

export const Perks = {
	Woodwork: "Woodwork",
	Aiming: "Aiming",
};

export default {
	TraitFactory,
	Perks,
	getText,
};
