import { Commands, PROTOCOL_SCHEMA_VERSION } from "@constants";
import type {
	CommandPayload,
	NaninhasAuthoritativeState,
	SyncSleepBuffRequestPayload
} from "@types";

jest.mock("@asledgehammer/pipewrench");
jest.mock("@shared/catalog/PlushieCatalog");
jest.mock("@shared/components/PlayerApi");
jest.mock("@shared/components/ModData");
jest.mock("@shared/components/PlushieReconciler");

const makePlayer = (username: string) => ({
	getUsername: jest.fn().mockReturnValue(username),
	getXp: jest.fn().mockReturnValue({ getMultiplier: jest.fn(), addXpMultiplier: jest.fn() })
});

const makeState = (): NaninhasAuthoritativeState => ({
	activePlushieNames: [],
	addedTraits: [],
	suppressedTraits: [],
	xpBoosts: {},
	temporaryBuff: { source: null }
});

const makePayload = (
	data: Partial<SyncSleepBuffRequestPayload> = {}
): CommandPayload<SyncSleepBuffRequestPayload> => ({
	schemaVersion: PROTOCOL_SCHEMA_VERSION,
	revision: 1,
	data: {
		candidateNames: [],
		bedType: "averageBed",
		...data
	}
});

describe("SleepBuffCommandHandler", () => {
	beforeEach(() => {
		jest.resetModules();
	});

	it("applies a temporary sleep buff from valid candidates", () => {
		const sendServerCommandMock = jest.fn();
		jest.doMock("@asledgehammer/pipewrench", () => ({
			isDebugEnabled: jest.fn(() => false),
			sendServerCommand: sendServerCommandMock,
			Perks: {}
		}));

		const modData = {
			protocol: { lastClientRevision: 0, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
			authoritative: makeState()
		};

		jest.doMock("@shared/components/ModData", () => ({
			ModData: jest.fn().mockImplementation(() => ({ data: modData }))
		}));

		const mockPlayerApi = {
			player: {},
			getAttachedItemNames: jest.fn().mockReturnValue(new Set<string>()),
			getWorldAgeHours: jest.fn().mockReturnValue(100),
			hasTrait: jest.fn().mockReturnValue(false),
			addTrait: jest.fn(),
			removeTrait: jest.fn(),
			applyXpMultiplierDelta: jest.fn()
		};
		jest.doMock("@shared/components/PlayerApi", () => ({
			PlayerApi: jest.fn().mockImplementation(() => mockPlayerApi)
		}));

		const { PlushieReconciler } = jest.requireMock("@shared/components/PlushieReconciler");
		PlushieReconciler.reconcile = jest.fn().mockReturnValue({
			traitsToAdd: [],
			traitsToRemove: [],
			traitsToSuppress: [],
			traitsToRestore: [],
			xpBoostDeltas: {},
			newState: makeState()
		});

		const { isKnownPlushie } = jest.requireMock("@shared/catalog/PlushieCatalog");
		isKnownPlushie.mockImplementation((name: string) => name === "Doll");

		(globalThis as any).ZombRand = jest.fn().mockReturnValue(0);

		const { SleepBuffCommandHandler } = require("@server/components/SleepBuffCommandHandler");
		const handler = new SleepBuffCommandHandler();
		handler.handler({
			module: "Naninhas",
			command: Commands.SYNC_SLEEP_BUFF.REQUEST,
			player: makePlayer("sleeper") as any,
			args: makePayload({ candidateNames: ["Doll"], bedType: "goodBed" })
		});

		expect(modData.authoritative.temporaryBuff.activeName).toBe("Doll");
		expect(modData.authoritative.temporaryBuff.expiresAtWorldAgeHours).toBe(108);
		expect(sendServerCommandMock).toHaveBeenCalledWith(
			expect.anything(),
			"Naninhas",
			Commands.SYNC_SLEEP_BUFF.RESPONSE,
			expect.objectContaining({
				data: expect.objectContaining({
					appliedName: "Doll",
					durationHours: 8,
					resolvedBedType: "goodBed"
				})
			})
		);
	});

	it("rejects unknown and already attached candidates", () => {
		const sendServerCommandMock = jest.fn();
		jest.doMock("@asledgehammer/pipewrench", () => ({
			isDebugEnabled: jest.fn(() => false),
			sendServerCommand: sendServerCommandMock,
			Perks: {}
		}));

		const modData = {
			protocol: { lastClientRevision: 0, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
			authoritative: makeState()
		};

		jest.doMock("@shared/components/ModData", () => ({
			ModData: jest.fn().mockImplementation(() => ({ data: modData }))
		}));

		const mockPlayerApi = {
			player: {},
			getAttachedItemNames: jest.fn().mockReturnValue(new Set<string>(["Doll"])),
			getWorldAgeHours: jest.fn().mockReturnValue(100),
			hasTrait: jest.fn().mockReturnValue(false),
			addTrait: jest.fn(),
			removeTrait: jest.fn(),
			applyXpMultiplierDelta: jest.fn()
		};
		jest.doMock("@shared/components/PlayerApi", () => ({
			PlayerApi: jest.fn().mockImplementation(() => mockPlayerApi)
		}));

		const { PlushieReconciler } = jest.requireMock("@shared/components/PlushieReconciler");
		PlushieReconciler.reconcile = jest.fn().mockReturnValue({
			traitsToAdd: [],
			traitsToRemove: [],
			traitsToSuppress: [],
			traitsToRestore: [],
			xpBoostDeltas: {},
			newState: makeState()
		});

		const { isKnownPlushie } = jest.requireMock("@shared/catalog/PlushieCatalog");
		isKnownPlushie.mockImplementation((name: string) => name === "Doll");

		const { SleepBuffCommandHandler } = require("@server/components/SleepBuffCommandHandler");
		const handler = new SleepBuffCommandHandler();
		handler.handler({
			module: "Naninhas",
			command: Commands.SYNC_SLEEP_BUFF.REQUEST,
			player: makePlayer("sleeper") as any,
			args: makePayload({ candidateNames: ["Doll", "Unknown"] })
		});

		expect(modData.authoritative.temporaryBuff.activeName).toBeUndefined();
		expect(sendServerCommandMock).toHaveBeenCalledWith(
			expect.anything(),
			"Naninhas",
			Commands.SYNC_SLEEP_BUFF.RESPONSE,
			expect.objectContaining({
				data: expect.objectContaining({
					appliedName: undefined,
					rejectedNames: ["Doll", "Unknown"]
				})
			})
		);
	});

	it("clears the previous temporary buff after an empty wake scan", () => {
		const sendServerCommandMock = jest.fn();
		jest.doMock("@asledgehammer/pipewrench", () => ({
			isDebugEnabled: jest.fn(() => false),
			sendServerCommand: sendServerCommandMock,
			Perks: {}
		}));

		const modData = {
			protocol: { lastClientRevision: 0, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
			authoritative: {
				...makeState(),
				activePlushieNames: [],
				addedTraits: ["Lucky"],
				temporaryBuff: {
					source: "sleep" as const,
					activeName: "Doll",
					expiresAtWorldAgeHours: 108
				}
			}
		};

		jest.doMock("@shared/components/ModData", () => ({
			ModData: jest.fn().mockImplementation(() => ({ data: modData }))
		}));

		const removeTrait = jest.fn();
		const mockPlayerApi = {
			player: {},
			getAttachedItemNames: jest.fn().mockReturnValue(new Set<string>()),
			getWorldAgeHours: jest.fn().mockReturnValue(101),
			hasTrait: jest.fn().mockReturnValue(true),
			addTrait: jest.fn(),
			removeTrait,
			applyXpMultiplierDelta: jest.fn()
		};
		jest.doMock("@shared/components/PlayerApi", () => ({
			PlayerApi: jest.fn().mockImplementation(() => mockPlayerApi)
		}));

		const { PlushieReconciler } = jest.requireMock("@shared/components/PlushieReconciler");
		PlushieReconciler.reconcile = jest.fn().mockReturnValue({
			traitsToAdd: [],
			traitsToRemove: ["Lucky"],
			traitsToSuppress: [],
			traitsToRestore: [],
			xpBoostDeltas: {},
			newState: makeState()
		});

		const { SleepBuffCommandHandler } = require("@server/components/SleepBuffCommandHandler");
		new SleepBuffCommandHandler().handler({
			module: "Naninhas",
			command: Commands.SYNC_SLEEP_BUFF.REQUEST,
			player: makePlayer("sleeper") as any,
			args: makePayload({ candidateNames: [] })
		});

		expect(removeTrait).toHaveBeenCalledWith("Lucky");
		expect(modData.authoritative.temporaryBuff).toEqual({ source: null });
		expect(sendServerCommandMock).toHaveBeenCalledWith(
			expect.anything(),
			"Naninhas",
			Commands.SYNC_SLEEP_BUFF.RESPONSE,
			expect.objectContaining({
				data: expect.objectContaining({ appliedName: undefined, rejectedNames: [] })
			})
		);
	});
});
