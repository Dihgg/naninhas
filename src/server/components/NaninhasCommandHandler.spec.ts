import { mock } from "jest-mock-extended";
import type { SyncDesiredPlushiesPayload, ServerAuthoritativeState } from "types";
import { PROTOCOL_SCHEMA_VERSION, PlushieNames } from "@constants";

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
		expect(typeof handler.onSyncDesiredPlushies).toBe("function");
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

			handler.onSyncDesiredPlushies({
				getUsername: jest.fn().mockReturnValue("TestPlayer"),
				getXp: jest.fn().mockReturnValue({ getMultiplier: jest.fn(), addXpMultiplier: jest.fn() })
			} as any, payload);

			// Player never had ShortSighted — removeTrait should not be called for it
			expect(removeTraitFn).not.toHaveBeenCalledWith("ShortSighted");
		});
	});
});
