import { mock } from 'jest-mock-extended';
import { IsoPlayer } from "@asledgehammer/pipewrench";
import {
	BorisBadger,
	Doll,
	Flamingo,
	FluffyfootBunny,
	FreddyFox,
	FurbertSquirrel,
	GroguAZ,
	JacquesBeaver,
	MoleyMole,
	OtisPug,
	PancakeHedgehog,
	Spiffo,
	SpiffoBlueberry,
	SpiffoCherry,
	SpiffoGrey,
	SpiffoHeart,
	SpiffoPlushieRainbow,
	SpiffoSanta,
	SpiffoShamrock,
	SubstitutionDoll,
	ToyBear,
	ToyBearSmall
} from "./List";
import { Plushie } from './Plushie';

jest.mock('./Plushie');

describe("List.ts", () => {
	const player = mock<IsoPlayer>({
		getStats: jest.fn().mockImplementation(() => ({
			setEndurance: jest.fn(),
			getEndurance: jest.fn(),
			getBoredom: jest.fn(),
			setBoredom: jest.fn(),
			setFatigue: jest.fn(),
			getFatigue: jest.fn(),
			setFear: jest.fn(),
			getFear: jest.fn(),
			setPanic: jest.fn(),
			getPanic: jest.fn(),
		}))
	});
	const PLUSHIES = [
		{
			name: "BorisBadger",
			instance: BorisBadger
		},
		{
			name: "Doll",
			instance: Doll
		},
		{
			name: "Flamingo",
			instance: Flamingo
		},
		{
			name: "FluffyfootBunny",
			instance: FluffyfootBunny
		},
		{
			name: "FreddyFox",
			instance: FreddyFox
		},
		{
			name: "FurbertSquirrel",
			instance: FurbertSquirrel
		},
		{
			name: "GroguAZ",
			instance: GroguAZ
		},
		{
			name: "JacquesBeaver",
			instance: JacquesBeaver
		},
		{
			name: "MoleyMole",
			instance: MoleyMole
		},
		{
			name: "OtisPug",
			instance: OtisPug
		},
		{
			name: "PancakeHedgehog",
			instance: PancakeHedgehog
		},
		{
			name: "Spiffo",
			instance: Spiffo
		},
		{
			name: "SpiffoBlueberry",
			instance: SpiffoBlueberry
		},
		{
			name: "SpiffoCherry",
			instance: SpiffoCherry
		},
		{
			name: "SpiffoGrey",
			instance: SpiffoGrey
		},
		{
			name: "SpiffoHeart",
			instance: SpiffoHeart
		},
		{
			name: "SpiffoPlushieRainbow",
			instance: SpiffoPlushieRainbow
		},
		{
			name: "SpiffoSanta",
			instance: SpiffoSanta
		},
		{
			name: "SpiffoShamrock",
			instance: SpiffoShamrock
		},
		{
			name: "SubstitutionDoll",
			instance: SubstitutionDoll
		},
		{
			name: "ToyBear",
			instance: ToyBear
		},
		{
			name: "ToyBearSmall",
			instance: ToyBearSmall
		}
	];
	describe.each(PLUSHIES)("For $name", ({name, instance}) => {
		const plushie = new instance(player);
		it(`Should instantiate ${name}`, () => {
			expect(plushie).toBeInstanceOf(Plushie);
		});
		it(`Should call update for ${name}`, () => {
			const spy = jest.spyOn(Plushie.prototype, 'update');
			plushie.update();
			expect(spy).toHaveBeenCalled();
		});
	});
});
