import { mock } from 'jest-mock-extended';
import { IsoPlayer } from '@asledgehammer/pipewrench';
import { Naninhas } from './Naninhas.class';

jest.mock('./Plushies');
jest.mock('@asledgehammer/pipewrench-events');

describe("Naninhas.class", () => {
	const player = mock<IsoPlayer>({
		getAttachedItems: jest.fn().mockReturnValue([])
	});

	it("Should instantiate", () => {
		const naninhas = new Naninhas(player);
		expect(naninhas).toBeDefined();
	});
	
});