// src/shared/components/TraitClass.spec.ts
import { mock } from "jest-mock-extended";
import { Perks, Trait, TraitFactory } from "@asledgehammer/pipewrench";
import { TraitsClass } from "./TraitsClass";
import * as Events from "@asledgehammer/pipewrench-events";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("@asledgehammer/pipewrench");

describe("TraitsClass", () => {
	const addXPBoost = jest.fn();
	
	beforeEach(() => {
		jest.resetAllMocks();
		TraitFactory.addTrait = () => mock<Trait>({
			addXPBoost
		});	
	});
	
	it("registers addTraits on game boot", () => {
		new TraitsClass();
		expect(Events.onGameBoot.addListener).toHaveBeenCalledTimes(1);
	});
	
	it("Should call addXPBoost if trait have any boost related to it", () => {
		new TraitsClass([{
			id: "Mocked_Trait",
			cost: -2,
			xpBoosts: [
				{
					perk: Perks.Aiming,
					value: 1
				}
			]
		}]);
		
		// Simulate game boot event
		const [addTraits] = (Events.onGameBoot.addListener as jest.Mock).mock.calls[0];
		
		addTraits();

		expect(addXPBoost).toHaveBeenCalledWith(Perks.Aiming, 1);
	});

	it("Should not call addXPBoost if the trait does not have any boost related to it", () => {
		new TraitsClass([{
			id: "Mocked_Trait",
			cost: -2,
		}]);

		// Simulate game boot event
		const [addTraits] = (Events.onGameBoot.addListener as jest.Mock).mock.calls[0];
		
		addTraits();

		expect(addXPBoost).not.toHaveBeenCalled();

	});
});
