import { mock } from "jest-mock-extended";
import { Plushie } from "./Plushie.class";
import { IsoPlayer } from "@asledgehammer/pipewrench";

describe("Plushie", () => {
	it("Should instantiate a Plushie abstracted class", () => {
	const player = mock<IsoPlayer>({
			getModData: jest.fn().mockImplementation(() =>({
				NaninhasData: { traits: [] }
			}))
		});
		class ExamplePlushie extends Plushie {}
		const plushie = new ExamplePlushie(player, "mocked");
	});
});