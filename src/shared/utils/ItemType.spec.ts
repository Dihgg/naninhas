import { extractItemName } from "@shared/utils/ItemType";

describe("ItemType", () => {
	it("extracts the item name from a module full name", () => {
		expect(extractItemName("AuthenticZClothing.SpiffoSanta")).toBe("SpiffoSanta");
	});

	it("extracts the item name from alternative module prefixes", () => {
		expect(extractItemName("AuthenticZBackpacksPlus.Doll")).toBe("Doll");
	});

	it("uses the right-most token when fullName has multiple dots", () => {
		expect(extractItemName("mod.items.SpiffoBlueberry")).toBe("SpiffoBlueberry");
	});

	it("returns the value unchanged when there is no dot", () => {
		expect(extractItemName("Doll")).toBe("Doll");
	});

	it("returns an empty string for empty input", () => {
		expect(extractItemName("")).toBe("");
	});
});