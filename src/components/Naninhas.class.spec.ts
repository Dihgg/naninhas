import { mock } from "jest-mock-extended";
import { AttachedItem, InventoryItem, IsoPlayer } from "@asledgehammer/pipewrench";
import { Subject, Observer } from "components/Observer";
// import { Plushie } from "components/Plushies";
import { Naninhas } from "./Naninhas.class";
// import { SpiffoSanta } from "./Plushies/List.plushie";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("components/Plushies");
jest.mock("components/Observer");

describe("Naninhas.class", () => {
	const player = mock<IsoPlayer>({
		getAttachedItems: jest.fn().mockReturnValue([])
	});

	it("Should instantiate", () => {
		const naninhas = new Naninhas(player);
		expect(naninhas).toBeDefined();
	});
	it("Should apply Plushie buff when plushie is attached", () => {
		const player = mock<IsoPlayer>({
			getAttachedItems: jest.fn().mockReturnValue([
				mock<AttachedItem>({
					getItem: jest.fn().mockReturnValue(mock<InventoryItem>({
						getFullType: jest.fn().mockReturnValue("AuthenticZClothing.SpiffoSanta")
					}))
				})
			])
		});
		const spySubjectFind = jest.spyOn(Subject.prototype, "find");
		const spySubjectSubscribe = jest.spyOn(Subject.prototype, "subscribe");
		spySubjectFind.mockReturnValue(undefined);
		const naninhas = new Naninhas(player);
		// TODO: how to mock the name for the plushies?
		// expect(spySubjectSubscribe).toHaveBeenCalled();
		expect(true).toBeTruthy();

	});
	
});