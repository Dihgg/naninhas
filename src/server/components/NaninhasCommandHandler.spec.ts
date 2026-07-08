import type { CommandPayload, SyncDesiredPlushiesPayload, NaninhasAuthoritativeState } from "@types";
import { Commands, PROTOCOL_SCHEMA_VERSION } from "@constants";

jest.mock("@asledgehammer/pipewrench");
jest.mock("@shared/components/PlushieReconciler");
jest.mock("@shared/catalog/PlushieCatalog");
jest.mock("@shared/utils/ItemType");
jest.mock("@shared/components/PlayerApi");
jest.mock("@shared/components/ModData");

const emptyAuthoritative = (): NaninhasAuthoritativeState => ({
	activePlushieNames: [],
	addedTraits: [],
	suppressedTraits: [],
	xpBoosts: {}
});

const makePayload = (revision: number, desiredNames: string[]): CommandPayload<SyncDesiredPlushiesPayload> => ({
	schemaVersion: PROTOCOL_SCHEMA_VERSION,
	revision,
	data: { desiredNames }
});

const makePlayer = (username: string) => ({
	getUsername: jest.fn().mockReturnValue(username),
	getXp: jest.fn().mockReturnValue({ getMultiplier: jest.fn(), addXpMultiplier: jest.fn() })
});

describe("NaninhasCommandHandler", () => {
	it("should be instantiable without runtime errors", () => {
		const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
		const handler = new NaninhasCommandHandler();
		expect(handler).toBeDefined();
		expect(typeof handler.handler).toBe("function");
	});

	describe("trait suppression", () => {
		it("does not suppress a trait the player does not have", () => {
			jest.resetModules();

			const removeTraitFn = jest.fn();
			const mockPlayerApi = {
				player: {},
				getAttachedItemNames: jest.fn().mockReturnValue(new Set(["Doll"])),
				hasTrait: jest.fn().mockReturnValue(false),
				addTrait: jest.fn(),
				removeTrait: removeTraitFn,
				applyXpMultiplierDelta: jest.fn()
			};

			jest.doMock("@shared/components/PlayerApi", () => ({
				PlayerApi: jest.fn().mockImplementation(() => mockPlayerApi)
			}));

			jest.doMock("@shared/components/ModData", () => ({
				ModData: jest.fn().mockImplementation(() => ({
					data: {
						protocol: { lastClientRevision: 0, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
						authoritative: emptyAuthoritative()
					}
				}))
			}));

			const { PlushieReconciler } = jest.requireMock("@shared/components/PlushieReconciler");
			PlushieReconciler.reconcile = jest.fn().mockReturnValue({
				traitsToAdd: [],
				traitsToRemove: [],
				traitsToSuppress: ["ShortSighted"],
				traitsToRestore: [],
				xpBoostDeltas: {},
				newState: {
					activePlushieNames: ["Doll"],
					addedTraits: [],
					suppressedTraits: ["ShortSighted"],
					xpBoosts: {}
				}
			});

			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();
			handler.handler({
				module: "Naninhas",
				command: Commands.SYNC_PLUSHIE.REQUEST,
				player: makePlayer("TestPlayer") as any,
				args: makePayload(1, ["Doll"])
			});

			expect(removeTraitFn).not.toHaveBeenCalledWith("ShortSighted");
		});

		it("does not add or persist a positive trait the player already has", () => {
			jest.resetModules();

			const addTraitFn = jest.fn();
			const removeTraitFn = jest.fn();
			const mockPlayerApi = {
				player: {},
				getAttachedItemNames: jest.fn().mockReturnValue(new Set(["SpiffoCherry"])),
				hasTrait: jest.fn((traitId: string) => traitId === "Organized"),
				addTrait: addTraitFn,
				removeTrait: removeTraitFn,
				applyXpMultiplierDelta: jest.fn()
			};

			jest.doMock("@shared/components/PlayerApi", () => ({
				PlayerApi: jest.fn().mockImplementation(() => mockPlayerApi)
			}));

			const serverData = {
				protocol: { lastClientRevision: 0, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
				authoritative: emptyAuthoritative()
			};

			jest.doMock("@shared/components/ModData", () => ({
				ModData: jest.fn().mockImplementation(() => ({ data: serverData }))
			}));

			const { PlushieReconciler } = jest.requireMock("@shared/components/PlushieReconciler");
			PlushieReconciler.reconcile = jest.fn().mockReturnValue({
				traitsToAdd: ["Organized"],
				traitsToRemove: [],
				traitsToSuppress: [],
				traitsToRestore: [],
				xpBoostDeltas: {},
				newState: {
					activePlushieNames: ["SpiffoCherry"],
					addedTraits: ["Organized"],
					suppressedTraits: [],
					xpBoosts: {}
				}
			});

			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();
			handler.handler({
				module: "Naninhas",
				command: Commands.SYNC_PLUSHIE.REQUEST,
				player: makePlayer("TestPlayer") as any,
				args: makePayload(1, ["SpiffoCherry"])
			});

			expect(addTraitFn).not.toHaveBeenCalledWith("Organized");
			expect(removeTraitFn).not.toHaveBeenCalledWith("Organized");
			expect(serverData.authoritative.addedTraits).toEqual([]);
		});
	});

	describe("revision handling", () => {
		it("accepts revision 1 after reconnect when server has persisted higher revision", () => {
			jest.resetModules();

			const sendServerCommandMock = jest.fn();
			jest.doMock("@asledgehammer/pipewrench", () => ({
				sendServerCommand: sendServerCommandMock,
				Perks: {}
			}));

			const mockPlayerApi = {
				player: {},
				getAttachedItemNames: jest.fn().mockReturnValue(new Set(["Doll"])),
				hasTrait: jest.fn().mockReturnValue(false),
				addTrait: jest.fn(),
				removeTrait: jest.fn(),
				applyXpMultiplierDelta: jest.fn()
			};

			jest.doMock("@shared/components/PlayerApi", () => ({
				PlayerApi: jest.fn().mockImplementation(() => mockPlayerApi)
			}));

			const initialAuthoritative = emptyAuthoritative();
			const serverData = {
				protocol: { lastClientRevision: 10, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
				authoritative: initialAuthoritative
			};

			jest.doMock("@shared/components/ModData", () => ({
				ModData: jest.fn().mockImplementation(() => ({ data: serverData }))
			}));

			const { PlushieReconciler } = jest.requireMock("@shared/components/PlushieReconciler");
			PlushieReconciler.reconcile = jest.fn().mockReturnValue({
				traitsToAdd: [],
				traitsToRemove: [],
				traitsToSuppress: [],
				traitsToRestore: [],
				xpBoostDeltas: {},
				newState: {
					activePlushieNames: ["Doll"],
					addedTraits: [],
					suppressedTraits: [],
					xpBoosts: {}
				}
			});

			const { isKnownPlushie } = jest.requireMock("@shared/catalog/PlushieCatalog");
			isKnownPlushie.mockImplementation((name: string) => name === "Doll");

			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();
			handler.handler({
				module: "Naninhas",
				command: Commands.SYNC_PLUSHIE.REQUEST,
				player: makePlayer("ReconnectPlayer") as any,
				args: makePayload(1, ["Doll"])
			});

			expect(PlushieReconciler.reconcile).toHaveBeenCalledWith(initialAuthoritative, ["Doll"]);
			expect(serverData.protocol.lastClientRevision).toBe(1);
			expect(sendServerCommandMock).toHaveBeenCalledWith(
				expect.anything(),
				"Naninhas",
				Commands.SYNC_PLUSHIE.RESPONSE,
				expect.objectContaining({
					revision: 1,
					schemaVersion: PROTOCOL_SCHEMA_VERSION,
					data: {
						appliedNames: ["Doll"],
						rejectedNames: []
					}
				})
			);
		});

		it("rejects stale revisions without reconciling", () => {
			jest.resetModules();

			const sendServerCommandMock = jest.fn();
			jest.doMock("@asledgehammer/pipewrench", () => ({
				sendServerCommand: sendServerCommandMock,
				Perks: {}
			}));

			const mockPlayerApi = {
				player: {},
				getAttachedItemNames: jest.fn().mockReturnValue(new Set(["Doll"])),
				hasTrait: jest.fn().mockReturnValue(false),
				addTrait: jest.fn(),
				removeTrait: jest.fn(),
				applyXpMultiplierDelta: jest.fn()
			};

			jest.doMock("@shared/components/PlayerApi", () => ({
				PlayerApi: jest.fn().mockImplementation(() => mockPlayerApi)
			}));

			const serverData = {
				protocol: { lastClientRevision: 5, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
				authoritative: emptyAuthoritative()
			};

			jest.doMock("@shared/components/ModData", () => ({
				ModData: jest.fn().mockImplementation(() => ({ data: serverData }))
			}));

			const { PlushieReconciler } = jest.requireMock("@shared/components/PlushieReconciler");
			PlushieReconciler.reconcile = jest.fn();

			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();
			const payload = makePayload(5, ["Doll"]);
			handler.handler({
				module: "Naninhas",
				command: Commands.SYNC_PLUSHIE.REQUEST,
				player: makePlayer("StaleRevisionPlayer") as any,
				args: payload
			});

			expect(PlushieReconciler.reconcile).not.toHaveBeenCalled();
			expect(sendServerCommandMock).toHaveBeenCalledWith(
				expect.anything(),
				"Naninhas",
				Commands.SYNC_PLUSHIE.RESPONSE,
				expect.objectContaining({
					schemaVersion: payload.schemaVersion,
					revision: payload.revision,
					data: {
						appliedNames: [],
						rejectedNames: payload.data.desiredNames
					}
				})
			);
		});
	});

	describe("xp and persistence", () => {
		it("applies XP deltas only for known perks and persists filtered trait state", () => {
			jest.resetModules();

			const sendServerCommandMock = jest.fn();
			const fitnessPerk = { id: "Fitness" };
			jest.doMock("@asledgehammer/pipewrench", () => ({
				sendServerCommand: sendServerCommandMock,
				Perks: {
					Fitness: fitnessPerk
				}
			}));

			const addTraitFn = jest.fn();
			const removeTraitFn = jest.fn();
			const applyXpMultiplierDeltaFn = jest.fn();

			const mockPlayerApi = {
				player: {},
				getAttachedItemNames: jest.fn().mockReturnValue(new Set(["Doll"])),
				hasTrait: jest.fn((trait: string) => trait === "ShortSighted"),
				addTrait: addTraitFn,
				removeTrait: removeTraitFn,
				applyXpMultiplierDelta: applyXpMultiplierDeltaFn
			};

			jest.doMock("@shared/components/PlayerApi", () => ({
				PlayerApi: jest.fn().mockImplementation(() => mockPlayerApi)
			}));

			const serverData = {
				protocol: { lastClientRevision: 0, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
				authoritative: {
					activePlushieNames: ["Doll"],
					addedTraits: ["OldTrait", "KeepTrait"],
					suppressedTraits: ["Clumsy", "KeepSuppressed"],
					xpBoosts: {}
				}
			};

			jest.doMock("@shared/components/ModData", () => ({
				ModData: jest.fn().mockImplementation(() => ({ data: serverData }))
			}));

			const { isKnownPlushie } = jest.requireMock("@shared/catalog/PlushieCatalog");
			isKnownPlushie.mockImplementation((name: string) => name === "Doll");

			const { PlushieReconciler } = jest.requireMock("@shared/components/PlushieReconciler");
			PlushieReconciler.reconcile = jest.fn().mockReturnValue({
				traitsToAdd: ["Organized"],
				traitsToRemove: ["OldTrait"],
				traitsToSuppress: ["ShortSighted"],
				traitsToRestore: ["Clumsy"],
				xpBoostDeltas: {
					perk: 0.1,
					"xp:Fitness": 0.2,
					"xp:Missing": 0.9
				},
				newState: {
					activePlushieNames: ["Doll"],
					addedTraits: [],
					suppressedTraits: [],
					xpBoosts: {}
				}
			});

			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();
			handler.handler({
				module: "Naninhas",
				command: Commands.SYNC_PLUSHIE.REQUEST,
				player: makePlayer("XPPlayer") as any,
				args: makePayload(2, ["Doll"])
			});

			expect(applyXpMultiplierDeltaFn).toHaveBeenCalledTimes(1);
			expect(applyXpMultiplierDeltaFn).toHaveBeenCalledWith(fitnessPerk, 0.2);

			expect(serverData.authoritative.addedTraits).toEqual(["KeepTrait", "Organized"]);
			expect(serverData.authoritative.suppressedTraits).toEqual([
				"KeepSuppressed",
				"ShortSighted"
			]);

			expect(addTraitFn).toHaveBeenCalledWith("Organized");
			expect(addTraitFn).toHaveBeenCalledWith("Clumsy");
			expect(removeTraitFn).toHaveBeenCalledWith("OldTrait");
			expect(removeTraitFn).toHaveBeenCalledWith("ShortSighted");
			expect(sendServerCommandMock).toHaveBeenCalled();
		});
	});

	describe("migrateAuthoritativeData", () => {
		it("fills defaults for missing authoritative fields", () => {
			jest.resetModules();
			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			const ensured = (handler as any).migrateAuthoritativeData(0, {});

			expect(ensured).toEqual({
				activePlushieNames: [],
				addedTraits: [],
				suppressedTraits: [],
				xpBoosts: {}
			});
		});

		it("preserves provided nested values", () => {
			jest.resetModules();
			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			const ensured = (handler as any).migrateAuthoritativeData(PROTOCOL_SCHEMA_VERSION, {
				activePlushieNames: ["Doll"],
				addedTraits: ["Organized"],
				suppressedTraits: ["ShortSighted"],
				xpBoosts: { "xp:Fitness": 0.2 }
			});

			expect(ensured.activePlushieNames).toEqual(["Doll"]);
			expect(ensured.xpBoosts).toEqual({ "xp:Fitness": 0.2 });
		});
	});
});
