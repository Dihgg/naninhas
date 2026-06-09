import {
	PLUSHIE_CATALOG,
	getPlushieDefinition,
	isKnownPlushie
} from "@shared/catalog/PlushieCatalog";
import { PlushieNames } from "@constants";

describe("PlushieCatalog", () => {
	it("contains all PlushieNames entries", () => {
		const catalogKeys = Object.keys(PLUSHIE_CATALOG);
		const enumValues = Object.values(PlushieNames);
		for (const name of enumValues) {
			expect(catalogKeys).toContain(name);
		}
	});

	it("getPlushieDefinition returns definition for known name", () => {
		const def = getPlushieDefinition(PlushieNames.DOLL);
		expect(def).toBeDefined();
		expect(def?.name).toBe(PlushieNames.DOLL);
		expect(def?.traitsToAdd).toContain("EagleEyed");
		expect(def?.traitsToSuppress).toContain("ShortSighted");
	});

	it("getPlushieDefinition returns undefined for unknown name", () => {
		expect(getPlushieDefinition("NonExistentPlushie")).toBeUndefined();
	});

	it("isKnownPlushie returns true for catalog entries", () => {
		expect(isKnownPlushie(PlushieNames.SPIFFOSANTA)).toBe(true);
	});

	it("isKnownPlushie returns false for unknown names", () => {
		expect(isKnownPlushie("FakePlushie")).toBe(false);
	});

	it("every definition has required fields with correct types", () => {
		for (const def of Object.values(PLUSHIE_CATALOG)) {
			expect(typeof def.name).toBe("string");
			expect(Array.isArray(def.traitsToAdd)).toBe(true);
			expect(Array.isArray(def.traitsToSuppress)).toBe(true);
			expect(Array.isArray(def.xpBoostsToAdd)).toBe(true);
		}
	});

	it("xpBoostsToAdd entries have perk string and numeric value", () => {
		const def = getPlushieDefinition(PlushieNames.JACQUESBEAVER);
		expect(def?.xpBoostsToAdd).toHaveLength(1);
		expect(def?.xpBoostsToAdd[0].perk).toBe("Woodwork");
		expect(def?.xpBoostsToAdd[0].value).toBe(1);
	});
});
