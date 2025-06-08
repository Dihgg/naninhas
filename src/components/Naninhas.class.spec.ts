import { mock } from "jest-mock-extended";
import { AttachedItem, InventoryItem, IsoPlayer } from "@asledgehammer/pipewrench";
import { Naninhas } from "./Naninhas.class";
import {Subject} from "./Observer";
import {Plushie} from "./Plushies";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("components/Plushies");
/* jest.mock("components/Plushies", () => ({
	SpiffoSanta: MockedPlushie,
}));*/
jest.mock("components/Observer");

describe("Naninhas.class", () => {

	it("Should instantiate", () => {
		const player = mock<IsoPlayer>({
			getAttachedItems: jest.fn().mockReturnValue([])
		});
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
		new Naninhas(player, [mock({ name: "SpiffoSanta" })]);
		expect(Subject.prototype.subscribe).toHaveBeenCalled();
	});

	it("Should unsubscribe plushie effect when plushie is no longer attached ", () => {
		const player = mock<IsoPlayer>({
			// First call returns an attached item
			getAttachedItems: jest.fn().mockReturnValueOnce([
				mock<AttachedItem>({
					getItem: jest.fn()
						.mockReturnValue(mock<InventoryItem>({
							getFullType: jest.fn()
								.mockReturnValue/*Once*/("AuthenticZClothing.SpiffoSanta")
					}))
				})
			])
				// second call returns an empty array
				.mockReturnValue([])
		});
		jest.spyOn(Subject.prototype, "find")
			.mockReturnValueOnce(undefined) // First call returns undefined, meaning no plushie is attached
			.mockReturnValueOnce(mock<Plushie>({ name: "SpiffoSanta" })); // In second call, it finds the plushie
		const naninhas = new Naninhas(player, [mock({ name: "SpiffoSanta" }) /*, mock({ name: "BorisBadger" }) */]);
		naninhas.update();
		expect(Subject.prototype.unsubscribe).toHaveBeenCalledWith("SpiffoSanta");
	});
});
