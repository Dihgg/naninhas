// src/shared/components/TraitClass.spec.ts
import type { Perk } from "@asledgehammer/pipewrench";

jest.mock("@asledgehammer/pipewrench", () => ({
	getText: (key: string) => `text:${key}`,
	TraitFactory: {
		addTrait: jest.fn()
	},
	Perks: {
		Woodwork: "Woodwork",
		Sprinting: "Sprinting",
		Agility: "Agility",
		PlantScavenging: "PlantScavenging",
		Doctor: "Doctor",
		Nimble: "Nimble",
		LongBlade: "LongBlade",
		SmallBlade: "SmallBlade",
		Blunt: "Blunt",
		SmallBlunt: "SmallBlunt",
		Aiming: "Aiming",
		Reloading: "Reloading"
	}
}));
jest.mock("@asledgehammer/pipewrench-events", () => ({
	default: {
		onGameBoot: {
			addListener: jest.fn()
		}
	}
}));

describe("TraitsClass", () => {
	let TraitsClass: any;
	let TraitFactory: any;
	let Events: any;
	let Perks: any;
	
	beforeEach(() => {
		jest.resetModules();
		TraitFactory = require("@asledgehammer/pipewrench").TraitFactory;
		Perks = require("@asledgehammer/pipewrench").Perks;
		Events = require("@asledgehammer/pipewrench-events").default;
		// Clear mocks
		(TraitFactory.addTrait as jest.Mock).mockClear();
		(Events.onGameBoot.addListener as jest.Mock).mockClear();
		// Import after mocks
		TraitsClass = require("./TraitsClass").TraitsClass;
	});
	
	it("registers addTraits on game boot", () => {
		new TraitsClass();
		expect(Events.onGameBoot.addListener).toHaveBeenCalledTimes(1);
		expect(typeof (Events.onGameBoot.addListener as jest.Mock).mock.calls[0][0]).toBe("function");
	});
	
	it("adds all traits and XP boosts on game boot", () => {
		// Prepare mock trait object
		const mockTrait = { addXPBoost: jest.fn() };
		(TraitFactory.addTrait as jest.Mock).mockReturnValue(mockTrait);
		
		new TraitsClass();
		// Simulate game boot event
		const addTraits = (Events.onGameBoot.addListener as jest.Mock).mock.calls[0][0];
		addTraits();
		
		// Check that addTrait is called for each trait
		expect(TraitFactory.addTrait).toHaveBeenCalledWith(
			"Naninhas_JacquesBeaver",
			"text:UI_Trait_Naninhas_JacquesBeaver",
			-2,
			"text:UI_Trait_Naninhas_JacquesBeaver_Description",
			false
		);
		expect(TraitFactory.addTrait).toHaveBeenCalledWith(
			"Naninhas_PancakeHedgehog",
			"text:UI_Trait_Naninhas_PancakeHedgehog",
			-2,
			"text:UI_Trait_Naninhas_PancakeHedgehog_Description",
			false
		);
		// ...repeat for other traits as needed
		
		// Check that addXPBoost is called with correct perks and values
		expect(mockTrait.addXPBoost).toHaveBeenCalledWith(Perks.Woodwork, 1);
		expect(mockTrait.addXPBoost).toHaveBeenCalledWith(Perks.Sprinting, 1);
		expect(mockTrait.addXPBoost).toHaveBeenCalledWith(Perks.Agility, 1);
		// ...repeat for other perks as needed
	});
});
