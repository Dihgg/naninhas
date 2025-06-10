import { mock } from "jest-mock-extended";
import { Trait } from "@asledgehammer/pipewrench";

export const getText = jest.fn().mockImplementation((...args: string[]) => args.join());

export class TraitFactory {
	static addTrait() {
		return mock<Trait>({
			addXPBoost: jest.fn()
		});
	}
}

export class Perks {
	static Woodwork = "Woodwork";
}
