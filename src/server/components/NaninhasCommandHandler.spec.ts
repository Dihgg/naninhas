import { mock } from "jest-mock-extended";
import type { SyncDesiredPlushiesPayload, ServerAuthoritativeState } from "@types";
import { NETWORK_MODULE, NetworkCommands, PROTOCOL_SCHEMA_VERSION, PlushieNames } from "@constants";

jest.mock("@asledgehammer/pipewrench");
jest.mock("@shared/components/PlushieReconciler");
jest.mock("@shared/catalog/PlushieCatalog");
jest.mock("@shared/utils/ItemType");
jest.mock("@shared/components/PlayerApi");
jest.mock("@shared/components/ModData");

const emptyAuthoritative = (): ServerAuthoritativeState => ({
	activePlushieNames: [],
	addedTraits: [],
	suppressedTraits: [],
	xpBoosts: {}
});

describe("NaninhasCommandHandler", () => {
	it("should be instantiable without runtime errors", () => {
		const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
		const handler = new NaninhasCommandHandler();
		expect(handler).toBeDefined();
		expect(typeof handler.handle).toBe("function");
	});

	describe("trait suppression", () => {
		it("does not suppress a trait the player does not have", () => {
			jest.resetModules();

			const removeTraitFn = jest.fn();
			const hasTraitFn = jest.fn().mockReturnValue(false); // player does NOT have ShortSighted

			const mockPlayerApi = {
				player: {},
				getAttachedItemNames: jest.fn().mockReturnValue(new Set(["Doll"])),
				hasTrait: hasTraitFn,
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
						authoritative: {
							activePlushieNames: [],
							addedTraits: [],
							suppressedTraits: [],
							xpBoosts: {}
						}
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

			const payload: SyncDesiredPlushiesPayload = {
				schemaVersion: PROTOCOL_SCHEMA_VERSION,
				revision: 1,
				desiredNames: ["Doll"]
			};

			handler.handle(NETWORK_MODULE, NetworkCommands.SYNC_DESIRED_PLUSHIES, {
				getUsername: jest.fn().mockReturnValue("TestPlayer"),
				getXp: jest.fn().mockReturnValue({ getMultiplier: jest.fn(), addXpMultiplier: jest.fn() })
			} as any, payload);

			// Player never had ShortSighted — removeTrait should not be called for it
			expect(removeTraitFn).not.toHaveBeenCalledWith("ShortSighted");
		});

		it("does not add or persist a positive trait the player already has", () => {
			jest.resetModules();

			const addTraitFn = jest.fn();
			const removeTraitFn = jest.fn();
			const hasTraitFn = jest.fn((traitId: string) => traitId === "Organized");

			const mockPlayerApi = {
				player: {},
				getAttachedItemNames: jest.fn().mockReturnValue(new Set(["SpiffoCherry"])),
				hasTrait: hasTraitFn,
				addTrait: addTraitFn,
				removeTrait: removeTraitFn,
				applyXpMultiplierDelta: jest.fn()
			};

			jest.doMock("@shared/components/PlayerApi", () => ({
				PlayerApi: jest.fn().mockImplementation(() => mockPlayerApi)
			}));

			const serverData = {
				protocol: { lastClientRevision: 0, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
				authoritative: {
					activePlushieNames: [],
					addedTraits: [],
					suppressedTraits: [],
					xpBoosts: {}
				}
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

			const payload: SyncDesiredPlushiesPayload = {
				schemaVersion: PROTOCOL_SCHEMA_VERSION,
				revision: 1,
				desiredNames: ["SpiffoCherry"]
			};

			handler.handle(NETWORK_MODULE, NetworkCommands.SYNC_DESIRED_PLUSHIES, {
				getUsername: jest.fn().mockReturnValue("TestPlayer"),
				getXp: jest.fn().mockReturnValue({ getMultiplier: jest.fn(), addXpMultiplier: jest.fn() })
			} as any, payload);

			expect(addTraitFn).not.toHaveBeenCalledWith("Organized");
			expect(removeTraitFn).not.toHaveBeenCalledWith("Organized");
			expect(serverData.authoritative.addedTraits).toEqual([]);
		});
	});

	describe("revision handling", () => {
		it("sends explicit rejection reply for invalid payloads with revision sentinel 0", () => {
			jest.resetModules();

			const sendServerCommandMock = jest.fn();
			jest.doMock("@asledgehammer/pipewrench", () => ({
				sendServerCommand: sendServerCommandMock,
				Perks: {}
			}));

			const serverData = {
				protocol: { lastClientRevision: 3, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
				authoritative: emptyAuthoritative()
			};

			jest.doMock("@shared/components/ModData", () => ({
				ModData: jest.fn().mockImplementation(() => ({ data: serverData }))
			}));

			const { PlushieReconciler } = jest.requireMock("@shared/components/PlushieReconciler");
			PlushieReconciler.reconcile = jest.fn();

			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			handler.handle(
				NETWORK_MODULE,
				NetworkCommands.SYNC_DESIRED_PLUSHIES,
				{
					getUsername: jest.fn().mockReturnValue("BadPayloadPlayer"),
					getXp: jest.fn().mockReturnValue({ getMultiplier: jest.fn(), addXpMultiplier: jest.fn() })
				} as any,
				{ bad: true }
			);

			expect(PlushieReconciler.reconcile).not.toHaveBeenCalled();
			expect(sendServerCommandMock).toHaveBeenCalledWith(
				expect.anything(),
				"Naninhas",
				"SyncAppliedPlushies",
				expect.objectContaining({
					schemaVersion: PROTOCOL_SCHEMA_VERSION,
					revision: 0,
					appliedNames: [],
					rejectedNames: [],
					status: "REJECTED",
					reason: "INVALID_PAYLOAD",
					expectedSchemaVersion: PROTOCOL_SCHEMA_VERSION,
					lastAcceptedRevision: 3
				})
			);
		});

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

			const payload: SyncDesiredPlushiesPayload = {
				schemaVersion: PROTOCOL_SCHEMA_VERSION,
				revision: 1,
				desiredNames: ["Doll"]
			};

			handler.handle(NETWORK_MODULE, NetworkCommands.SYNC_DESIRED_PLUSHIES, {
				getUsername: jest.fn().mockReturnValue("ReconnectPlayer"),
				getXp: jest.fn().mockReturnValue({ getMultiplier: jest.fn(), addXpMultiplier: jest.fn() })
			} as any, payload);

			expect(PlushieReconciler.reconcile).toHaveBeenCalledWith(initialAuthoritative, ["Doll"]);
			expect(serverData.protocol.lastClientRevision).toBe(1);
			expect(sendServerCommandMock).toHaveBeenCalledWith(
				expect.anything(),
				"Naninhas",
				"SyncAppliedPlushies",
				expect.objectContaining({
					revision: 1,
					appliedNames: ["Doll"],
					rejectedNames: []
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

			const payload: SyncDesiredPlushiesPayload = {
				schemaVersion: PROTOCOL_SCHEMA_VERSION,
				revision: 5,
				desiredNames: ["Doll"]
			};

			handler.handle(
				NETWORK_MODULE,
				NetworkCommands.SYNC_DESIRED_PLUSHIES,
				{
					getUsername: jest.fn().mockReturnValue("StaleRevisionPlayer"),
					getXp: jest.fn().mockReturnValue({ getMultiplier: jest.fn(), addXpMultiplier: jest.fn() })
				} as any,
				payload
			);

			expect(PlushieReconciler.reconcile).not.toHaveBeenCalled();
			expect(sendServerCommandMock).toHaveBeenCalledWith(
				expect.anything(),
				"Naninhas",
				"SyncAppliedPlushies",
				expect.objectContaining({
					schemaVersion: payload.schemaVersion,
					revision: payload.revision,
					appliedNames: [],
					rejectedNames: payload.desiredNames
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

			const payload: SyncDesiredPlushiesPayload = {
				schemaVersion: PROTOCOL_SCHEMA_VERSION,
				revision: 2,
				desiredNames: ["Doll"]
			};

			handler.handle(
				NETWORK_MODULE,
				NetworkCommands.SYNC_DESIRED_PLUSHIES,
				{
					getUsername: jest.fn().mockReturnValue("XPPlayer"),
					getXp: jest.fn().mockReturnValue({ getMultiplier: jest.fn(), addXpMultiplier: jest.fn() })
				} as any,
				payload
			);

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

	describe("authoritative normalization", () => {
		it("defaultAuthoritativeState returns empty authoritative shape", () => {
			jest.resetModules();
			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			const state = (handler as any).defaultAuthoritativeState();

			expect(state).toEqual({
				activePlushieNames: [],
				addedTraits: [],
				suppressedTraits: [],
				xpBoosts: {}
			});
		});

		it("ensureAuthoritativeState fills missing fields and preserves provided values", () => {
			jest.resetModules();
			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			const ensured = (handler as any).ensureAuthoritativeState({
				activePlushieNames: ["Doll"],
				xpBoosts: { "xp:Fitness": 0.2 }
			});

			expect(ensured).toEqual({
				activePlushieNames: ["Doll"],
				addedTraits: [],
				suppressedTraits: [],
				xpBoosts: { "xp:Fitness": 0.2 }
			});
		});

		it("ensureAuthoritativeState preserves fully populated authoritative values", () => {
			jest.resetModules();
			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			const ensured = (handler as any).ensureAuthoritativeState({
				activePlushieNames: ["Doll"],
				addedTraits: ["Organized"],
				suppressedTraits: ["ShortSighted"],
				xpBoosts: { "xp:Fitness": 0.2 }
			});

			expect(ensured).toEqual({
				activePlushieNames: ["Doll"],
				addedTraits: ["Organized"],
				suppressedTraits: ["ShortSighted"],
				xpBoosts: { "xp:Fitness": 0.2 }
			});
		});

		it("ensureAuthoritativeState returns defaults when called with undefined", () => {
			jest.resetModules();
			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			const ensured = (handler as any).ensureAuthoritativeState(undefined);

			expect(ensured).toEqual({
				activePlushieNames: [],
				addedTraits: [],
				suppressedTraits: [],
				xpBoosts: {}
			});
		});
	});

	describe("protected hook behavior", () => {
		it("getResponseCommand maps known command and falls back for unknown command", () => {
			jest.resetModules();
			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			expect((handler as any).getResponseCommand(NetworkCommands.SYNC_DESIRED_PLUSHIES)).toBe(
				NetworkCommands.SYNC_APPLIED_PLUSHIES
			);
			expect((handler as any).getResponseCommand("UnmappedCommand")).toBe("UnmappedCommand");
		});

		it("isValidRequestPayload rejects malformed payloads and accepts valid payload", () => {
			jest.resetModules();
			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			expect((handler as any).isValidRequestPayload(undefined)).toBe(false);
			expect((handler as any).isValidRequestPayload({ revision: 1, desiredNames: [] })).toBe(false);
			expect((handler as any).isValidRequestPayload({ schemaVersion: 1, desiredNames: [] })).toBe(false);
			expect((handler as any).isValidRequestPayload({ schemaVersion: 1, revision: 1, desiredNames: "Doll" })).toBe(false);
			expect(
				(handler as any).isValidRequestPayload({
					schemaVersion: 1,
					revision: 1,
					desiredNames: ["Doll", 7]
				})
			).toBe(false);
			expect(
				(handler as any).isValidRequestPayload({
					schemaVersion: 1,
					revision: 1,
					desiredNames: ["Doll"]
				})
			).toBe(true);
		});

		it("buildRejectedResponse falls back to empty rejectedNames when payload is missing", () => {
			jest.resetModules();
			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			const response = (handler as any).buildRejectedResponse({
				player: {},
				requestCommand: NetworkCommands.SYNC_DESIRED_PLUSHIES,
				reason: "STALE_REVISION",
				state: {
					protocol: { lastClientRevision: 2, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
					authoritative: emptyAuthoritative()
				}
			});

			expect(response).toEqual(
				expect.objectContaining({
					status: "REJECTED",
					reason: "STALE_REVISION",
					rejectedNames: []
				})
			);
		});

		it("buildAcceptedResponse handles missing payload by reconciling an empty desired list", () => {
			jest.resetModules();

			const mockPlayerApi = {
				player: {},
				getAttachedItemNames: jest.fn().mockReturnValue(new Set<string>()),
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
				newState: emptyAuthoritative()
			});

			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			const response = (handler as any).buildAcceptedResponse({
				player: {},
				requestCommand: NetworkCommands.SYNC_DESIRED_PLUSHIES,
				state: {
					protocol: { lastClientRevision: 4, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
					authoritative: emptyAuthoritative()
				}
			});

			expect(PlushieReconciler.reconcile).toHaveBeenCalledWith(emptyAuthoritative(), []);
			expect(response).toEqual(
				expect.objectContaining({
					status: "ACCEPTED",
					revision: 0,
					appliedNames: [],
					rejectedNames: []
				})
			);
		});

		it("buildAcceptedResponse rejects known plushies that are not attached", () => {
			jest.resetModules();

			const mockPlayerApi = {
				player: {},
				getAttachedItemNames: jest.fn().mockReturnValue(new Set<string>()),
				hasTrait: jest.fn().mockReturnValue(false),
				addTrait: jest.fn(),
				removeTrait: jest.fn(),
				applyXpMultiplierDelta: jest.fn()
			};

			jest.doMock("@shared/components/PlayerApi", () => ({
				PlayerApi: jest.fn().mockImplementation(() => mockPlayerApi)
			}));

			const { isKnownPlushie } = jest.requireMock("@shared/catalog/PlushieCatalog");
			isKnownPlushie.mockImplementation((name: string) => name === "Doll");

			const { PlushieReconciler } = jest.requireMock("@shared/components/PlushieReconciler");
			PlushieReconciler.reconcile = jest.fn().mockReturnValue({
				traitsToAdd: [],
				traitsToRemove: [],
				traitsToSuppress: [],
				traitsToRestore: [],
				xpBoostDeltas: {},
				newState: emptyAuthoritative()
			});

			const { NaninhasCommandHandler } = require("@server/components/NaninhasCommandHandler");
			const handler = new NaninhasCommandHandler();

			const response = (handler as any).buildAcceptedResponse({
				player: {},
				requestCommand: NetworkCommands.SYNC_DESIRED_PLUSHIES,
				payload: {
					schemaVersion: PROTOCOL_SCHEMA_VERSION,
					revision: 3,
					desiredNames: ["Doll"]
				},
				state: {
					protocol: { lastClientRevision: 2, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
					authoritative: emptyAuthoritative()
				}
			});

			expect(PlushieReconciler.reconcile).toHaveBeenCalledWith(emptyAuthoritative(), []);
			expect(response.rejectedNames).toEqual(["Doll"]);
			expect(response.appliedNames).toEqual([]);
		});
	});
});
