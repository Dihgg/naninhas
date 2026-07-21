// src/__mocks__/@asledgehammer/pipewrench/index.ts
import { mock } from "jest-mock-extended";
import type { Trait } from "@asledgehammer/pipewrench";

export const getText = jest.fn((...args: string[]) => args.join());

export const addXPBoost = jest.fn();

export const sendClientCommand = jest.fn();
export const sendServerCommand = jest.fn();

/** Default: single-player. Override per-test with mockReturnValue(true) to simulate MP client. */
export const isClient = jest.fn().mockReturnValue(false);
/** Default: false (not a dedicated/listen server). */
export const isServer = jest.fn().mockReturnValue(false);

export const TraitFactory = {
	addTrait: jest.fn(() =>
		mock<Trait>({
			addXPBoost,
		})
	),
};

export const getCore = jest.fn().mockImplementation(() => ({
	getVersionNumber: jest.fn().mockReturnValue("42.0")
}));

export class GameTime {
	static getInstance = jest.fn(() => ({
		getWorldAgeHours: jest.fn(() => 0)
	}));
}

export const Perks = {
	Woodwork: "Woodwork",
	Aiming: "Aiming",
};

(globalThis as any).string = {
	match: (version: string) => {
		const [, major, minor] = version.match(/(\d+)\.(\d+)/) ?? [];
		return [ major, minor ];
	}
};

export const triggerEvent = jest.fn();

export const getScriptManager = jest.fn().mockImplementation(() => ({
	getItem: jest.fn().mockImplementation(() => ({
		DoParam: jest.fn()
	}))
}));

export default {
	TraitFactory,
	Perks,
	getText,
	getCore,
	triggerEvent,
	getScriptManager
};
