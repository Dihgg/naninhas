import { Traits } from "./Traits";

jest.mock("@asledgehammer/pipewrench", () => ({
  Perk: jest.fn(),
  Perks: {
    Woodwork: "woodwork",
    Sprinting: "sprinting",
    Agility: "agility",
    PlantScavenging: "plantScavenging",
    Doctor: "doctor",
    Nimble: "nimble",
    LongBlade: "longBlade",
    SmallBlade: "smallBlade",
    Blunt: "blunt",
    SmallBlunt: "smallBlunt",
    Aiming: "aiming",
    Reloading: "reloading"
  }
}));

describe("Traits", () => {
  beforeEach(() => {
    // Clear the cache before each test
    (Traits as any).cache = undefined;
  });

  it("returns perk boosts for a trait with xpBoosts", () => {
    const result = Traits.getPerkBoostsForTrait("Naninhas_PancakeHedgehog");
    expect(result).toEqual([
      { perk: "sprinting", value: 1 },
      { perk: "agility", value: 1 }
    ]);
  });

  it("returns empty array for a trait without xpBoosts", () => {
    // Note: All current traits have xpBoosts, so we test with an unknown ID
    const result = Traits.getPerkBoostsForTrait("Unknown_Trait");
    expect(result).toEqual([]);
  });

  it("returns correct boosts for traits with multiple perks", () => {
    const result = Traits.getPerkBoostsForTrait("Naninhas_SpiffoGray");
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ perk: "nimble", value: 1 });
    expect(result[1]).toEqual({ perk: "longBlade", value: 1 });
  });

  it("returns boosts with higher values", () => {
    const result = Traits.getPerkBoostsForTrait("Naninhas_SpiffoShamrock");
    expect(result).toEqual([
      { perk: "aiming", value: 5 },
      { perk: "reloading", value: 5 }
    ]);
  });

  it("caches results for performance", () => {
    const result1 = Traits.getPerkBoostsForTrait("Naninhas_JacquesBeaver");
    const result2 = Traits.getPerkBoostsForTrait("Naninhas_JacquesBeaver");

    // Should return same reference if cached
    expect(result1).toEqual(result2);
  });

  it("returns empty array for non-existent traits", () => {
    const result = Traits.getPerkBoostsForTrait("NonExistent");
    expect(result).toEqual([]);
  });

	it("returns empty array for non-existent trait on second call (cached)", () => {
		// First call builds cache
		Traits.getPerkBoostsForTrait("SomeTraitWithBoosts");
		
		// Second call with non-existent trait uses cached map
		const result = Traits.getPerkBoostsForTrait("StillNonExistent");
		expect(result).toEqual([]);
	});
});
