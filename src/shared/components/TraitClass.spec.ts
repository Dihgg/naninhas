// src/shared/components/TraitClass.spec.ts
import { mock } from "jest-mock-extended";

const addListener = jest.fn();
const addXPBoost = jest.fn();

const Perks = { Aiming: "Aiming" };
const TraitFactory = {
  addTrait: jest.fn(() => ({ addXPBoost }))
};

jest.mock("@asledgehammer/pipewrench-events", () => ({
  __esModule: true,
  onGameBoot: { addListener }
}));

jest.mock("@asledgehammer/pipewrench", () => ({
  TraitFactory,
  Perks,
  getText: (key: string) => key
}));

describe("TraitsClass", () => {
  beforeEach(() => {
    jest.resetModules();
    addListener.mockClear();
    addXPBoost.mockClear();
    TraitFactory.addTrait.mockClear();
  });
  
  it("registers addTraits on game boot", async () => {
    jest.doMock("./TraitValues", () => ({
      NaninhasTraits: []
    }));
    
    const { TraitsClass } = await import("./TraitsClass");
    new TraitsClass();
    
    expect(addListener).toHaveBeenCalledTimes(1);
  });
  
  it("calls addXPBoost if trait has XP boosts", async () => {
    jest.doMock("./TraitValues", () => ({
      NaninhasTraits: [
        {
          id: "Mocked_Trait",
          cost: -2,
          xpBoosts: [
            { perk: Perks.Aiming, value: 1 }
          ]
        }
      ]
    }));
    
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
