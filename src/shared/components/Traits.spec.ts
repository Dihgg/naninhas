let addXPBoost: jest.Mock;
let addTrait: jest.Mock;

jest.mock("@asledgehammer/pipewrench", () => {
  addXPBoost = jest.fn();
  addTrait = jest.fn(() => ({ addXPBoost }));
  return {
    getText: jest.fn((...args: string[]) => args.join()),
    Perks: { Aiming: "Aiming" },
    TraitFactory: { addTrait }
  };
});

jest.mock("@asledgehammer/pipewrench-events", () => {
  const addListenerMock = jest.fn();
  return {
    onGameBoot: { addListener: addListenerMock }
  };
});

describe("Traitss", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
  
  it("registers addTraits on game boot", async () => {
    jest.doMock("./TraitValues", () => ({
      NaninhasTraits: []
    }));
    
    await jest.isolateModulesAsync(async () => {
      const { onGameBoot } = await import("@asledgehammer/pipewrench-events");
      const { Traits } = await import("@shared/components/Traits");
      new Traits();
      expect(onGameBoot.addListener).toHaveBeenCalledTimes(1);
    });
  });
  
  it("calls addXPBoost if trait has XP boosts", async () => {
    jest.doMock("./TraitValues", () => ({
      NaninhasTraits: [
        {
          id: "Mocked_Trait",
          cost: -2,
          xpBoosts: [
            { perk: "Aiming", value: 1 }
          ]
        }
      ]
    }));
    
    await jest.isolateModulesAsync(async () => {
      const { onGameBoot } = await import("@asledgehammer/pipewrench-events");
      const { Traits } = await import("@shared/components/Traits");
      new Traits();
      const [addTraits] = (onGameBoot.addListener as jest.Mock).mock.calls[0];
      addTraits();
      expect(addXPBoost).toHaveBeenCalledWith("Aiming", 1);
    });
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
    
    await jest.isolateModulesAsync(async () => {
      const { onGameBoot } = await import("@asledgehammer/pipewrench-events");
      const { Traits } = await import("@shared/components/Traits");
      new Traits();
      const [addTraits] = (onGameBoot.addListener as jest.Mock).mock.calls[0];
      addTraits();
      expect(addXPBoost).not.toHaveBeenCalled();
    });
  });
  
  it("returns perk boosts for a given trait", async () => {
    jest.doMock("./TraitValues", () => ({
      NaninhasTraits: [
        {
          id: "TestTrait",
          xpBoosts: [
            { perk: "Aiming", value: 2 }
          ]
        },
        {
          id: "NoBoost"
        }
      ]
    }));
    
    await jest.isolateModulesAsync(async () => {
      const { Traits } = await import("@shared/components/Traits");
      expect(Traits.getPerkBoostsForTrait("TestTrait")).toEqual([
        { perk: "Aiming", value: 2 }
      ]);
      expect(Traits.getPerkBoostsForTrait("NoBoost")).toEqual([]);
      expect(Traits.getPerkBoostsForTrait("Unknown")).toEqual([]);
    });
  });

});
