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
} from "./List.plushie";
import { Plushie } from './Plushie.class';

jest.mock('./Plushie.class');

describe("List.plushie.ts", () => {
	const spyUpdate = jest.spyOn(Plushie.prototype, 'update');
	const player = mock<IsoPlayer>();
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
			plushie.update();
			expect(spyUpdate).toHaveBeenCalled();
		});
	});
});