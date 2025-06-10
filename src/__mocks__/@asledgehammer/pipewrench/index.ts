import { mock } from "jest-mock-extended";
import { IsoPlayer } from "@asledgehammer/pipewrench";

export const getPlayer = jest.fn().mockImplementation(() => mock<IsoPlayer>())

export const getText = jest.fn().mockImplementation((...args:string[]) => args.join());