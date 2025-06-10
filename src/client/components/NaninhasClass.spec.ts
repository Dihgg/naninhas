import { mock } from "jest-mock-extended";
import { InventoryItem, IsoPlayer } from "@asledgehammer/pipewrench";
import { Naninhas } from "./NaninhasClass";
import { Subject } from "./Observer/Subject";
import { Plushie } from "./Plushies/Plushie";

jest.mock("@asledgehammer/pipewrench-events");
jest.mock("./Plushies/List");
jest.mock("./Observer/Subject");

describe("Naninhas.class", () => {

	it("Should instantiate", () => {
		const player = mock<IsoPlayer>({
			getAttachedItems: jest.fn().mockReturnValue({
				size: jest.fn().mockReturnValue(0)
			})
		});
		const naninhas = new Naninhas(player);
		expect(naninhas).toBeDefined();
	});
	
	describe("Plushies attachement effects", () => {
		const mockPlayer = () => mock<IsoPlayer>({
			getAttachedItems: jest.fn().mockReturnValue(mock({
				size: jest.fn().mockReturnValue(1),
				get: jest.fn().mockReturnValue(mock({
					getItem: jest.fn().mockReturnValue(mock<InventoryItem>({
						getFullType: jest.fn().mockReturnValue("AuthenticZClothing.SpiffoSanta")
					}))
				}))
			}))
		});
		
		it("Should apply Plushie buff when plushie is attached", () => {
			const player = mockPlayer();
			new Naninhas(player, [mock({ name: "SpiffoSanta" })]);
			expect(Subject.prototype.subscribe).toHaveBeenCalled();
		});
		
		it("Should unsubscribe plushie effect when plushie is no longer attached ", () => {
			const player = mock<IsoPlayer>({
				getAttachedItems: jest.fn()
					.mockReturnValueOnce(mockPlayer().getAttachedItems())
					.mockReturnValue(mock({
						size: jest.fn().mockReturnValue(0) // Simulating no plushie attached
					}))
			})
			jest.spyOn(Subject.prototype, "find")
				.mockReturnValueOnce(undefined) // First call returns undefined, meaning no plushie is attached
				.mockReturnValueOnce(mock<Plushie>({ name: "SpiffoSanta" })); // In second call, it finds the plushie
			const naninhas = new Naninhas(player, [mock({ name: "SpiffoSanta" }) /*, mock({ name: "BorisBadger" }) */]);
			naninhas.update();
			expect(Subject.prototype.unsubscribe).toHaveBeenCalledWith("SpiffoSanta");
		});
		
	});
});
