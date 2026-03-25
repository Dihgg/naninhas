const getTextMock = jest.fn((...args: string[]) => args.join());

jest.mock("@asledgehammer/pipewrench", () => ({
  getText: getTextMock,
  TraitFactory: {}
}));

jest.mock("@asledgehammer/pipewrench-events", () => {
  const addListenerMock = jest.fn();
  return {
		onCreateLivingCharacter: { addListener: addListenerMock }
  };
});

describe("Traitss", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
		getTextMock.mockClear();
  });
  
  it("registers addTraits on character creation", async () => {
    jest.doMock("./TraitValues", () => ({
      NaninhasTraits: []
    }));
    
    await jest.isolateModulesAsync(async () => {
      const { onCreateLivingCharacter } = await import("@asledgehammer/pipewrench-events");
      const { Traits } = await import("@shared/components/Traits");
      new Traits();
      expect(onCreateLivingCharacter.addListener).toHaveBeenCalledTimes(1);
    });
  });
  
  it("registers configured traits when trait register is available", async () => {
    const addTrait = jest.fn();
    const setMutualExclusive = jest.fn();

    jest.doMock("./TraitValues", () => ({
      NaninhasTraits: [
        {
          id: "Mocked_Trait",
          cost: -2,
          profession: true
        }
      ]
    }));

    jest.doMock("./TraitRegister", () => ({
      TraitRegister: {
        create: () => ({
          isAvailable: () => true,
          addTrait,
          setMutualExclusive,
        }),
      },
    }));
    
    await jest.isolateModulesAsync(async () => {
      const { onCreateLivingCharacter } = await import("@asledgehammer/pipewrench-events");
      const { Traits } = await import("@shared/components/Traits");
      new Traits();
      const [addTraits] = (onCreateLivingCharacter.addListener as jest.Mock).mock.calls[0];
      addTraits();
      expect(addTrait).toHaveBeenCalledWith(
        "Mocked_Trait",
        "UI_Trait_Mocked_Trait",
        -2,
        "UI_Trait_Mocked_Trait_Description",
        true
      );
      expect(setMutualExclusive).not.toHaveBeenCalled();
    });
  });
  
  it("does nothing when trait register is unavailable", async () => {
    const addTrait = jest.fn();
    const setMutualExclusive = jest.fn();

    jest.doMock("./TraitValues", () => ({
      NaninhasTraits: [
        {
          id: "NoBoost",
          cost: 0,
        }
      ]
    }));

    jest.doMock("./TraitRegister", () => ({
      TraitRegister: {
        create: () => ({
          isAvailable: () => false,
          addTrait,
          setMutualExclusive,
        }),
      },
    }));
    
    await jest.isolateModulesAsync(async () => {
      const { onCreateLivingCharacter } = await import("@asledgehammer/pipewrench-events");
      const { Traits } = await import("@shared/components/Traits");
      new Traits();
      const [addTraits] = (onCreateLivingCharacter.addListener as jest.Mock).mock.calls[0];
      addTraits();
      expect(addTrait).not.toHaveBeenCalled();
      expect(setMutualExclusive).not.toHaveBeenCalled();
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
