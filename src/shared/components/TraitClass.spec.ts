// src/shared/components/TraitClass.spec.ts
import { mock } from "jest-mock-extended";
import { TraitFactory, Perks, Trait } from "@asledgehammer/pipewrench";
// First, mock pipewrench-events correctly with a spy onGameBoot.addListener

const addListener = jest.fn();
jest.mock("@asledgehammer/pipewrench-events", () => ({
  __esModule: true,
  onGameBoot: {
    addListener
  }
}));

// TraitFactory will be mocked manually
jest.mock("@asledgehammer/pipewrench");


describe("TraitsClass", () => {
	const addXPBoost = jest.fn();

	beforeEach(() => {
		jest.resetModules();
		// jest.clearAllMocks();

		jest.spyOn(TraitFactory, 'addTrait').mockReturnValue(mock<Trait>({
			addXPBoost
		}));
	});

  it("registers addTraits on game boot", async () => {
    jest.doMock("./TraitValues", () => ({
      NaninhasTraits: []
    }));

    const { TraitsClass } = await import("./TraitsClass");
    new TraitsClass();

    expect(addListener).toHaveBeenCalledTimes(1);
  });

  // TODO: fix this
  it.skip("calls addXPBoost if trait has XP boosts", async () => {
    jest.doMock("./TraitValues", () => ({
      NaninhasTraits: [
        {
          id: "Mocked_Trait",
          cost: -2,
          xpBoosts: [
            {
              perk: Perks.Aiming,
              value: 1
            }
          ]
        }
      ]
    }));

    // Trigger the simulated boot event
    const { onGameBoot } = await import("@asledgehammer/pipewrench-events");
    
	const { TraitsClass } = await import("./TraitsClass");
    new TraitsClass();
	const [addTraits] = (onGameBoot.addListener as jest.Mock).mock.calls[0];
    addTraits();

    expect(addXPBoost).toHaveBeenCalledWith(Perks.Aiming, 1);
  });

  it("does not call addXPBoost if trait has no boosts", async () => {
    jest.doMock("./TraitValues", () => ({
      NaninhasTraits: [
        {
          id: "NoBoost",
          cost: 0,
        }
      ]
    }));

    const { TraitsClass } = await import("./TraitsClass");
    new TraitsClass();

    const { onGameBoot } = await import("@asledgehammer/pipewrench-events");
    const [addTraits] = (onGameBoot.addListener as jest.Mock).mock.calls[0];
    addTraits();

    expect(addXPBoost).not.toHaveBeenCalled();
  });
});
