/* @noSelfInFile */
import type { IsoPlayer, Perk } from "@asledgehammer/pipewrench";
import { Perks } from "@asledgehammer/pipewrench";
import { Commands, NETWORK_MODULE, PROTOCOL_SCHEMA_VERSION } from "@constants";
import type {
	CommandPayload,
	SyncAppliedPlushiesPayload,
	SyncDesiredPlushiesPayload,
	NaninhasAuthoritativeState
} from "@types";
import { PlushieReconciler } from "@shared/components/PlushieReconciler";
import { isKnownPlushie } from "@shared/catalog/PlushieCatalog";
import { PlayerApi } from "@shared/components/PlayerApi";
import { CommandHandler } from "./CommandHandler";

/**
 * Server-side command handler for the Naninhas mod.
 *
 * Receives client sync requests, validates them, applies reconciled effects to
 * the live player, and sends a confirmed reply back to the client.
 */
export class NaninhasCommandHandler extends CommandHandler<NaninhasAuthoritativeState, SyncDesiredPlushiesPayload, SyncAppliedPlushiesPayload> {
	/**
	 * Configures the Naninhas multiplayer command flow.
	 */
	constructor() {
		super(
			NETWORK_MODULE,
			Commands.SYNC_PLUSHIE,
			{ activePlushieNames: [], addedTraits: [], suppressedTraits: [], xpBoosts: {} }
		);
	}

	/**
	 * Processes a SyncPlushie request from a client.
	 *
	 * Responsibilities:
	 * 1. Validate revision to ensure freshness
	 * 2. Verify player has the items they claim to have attached
	 * 3. Call the reconciler to compute trait/XP deltas
	 * 4. Apply those changes to the live player
	 * 5. Persist the new server state
	 * 6. Reply to the client with the applied and rejected plushie names
	 *
	 * @param player The player sending the sync request
	 * @param payload The deserialized payload sent by the client via `sendClientCommand`
	 */
	protected onCommand(player: IsoPlayer, payload: CommandPayload<SyncDesiredPlushiesPayload>): void {
		// -----------------------------------------------------------------------
		// 1. Load or initialize server state
		// -----------------------------------------------------------------------
		const playerApi = new PlayerApi(player);
		const serverModData = this.getModData(playerApi.player);
		const { authoritative } = serverModData;
		const { desiredNames } = payload.data;

		// -----------------------------------------------------------------------
		// 2. Verify attachment and validate plushie names
		// -----------------------------------------------------------------------
		const attachedSet = playerApi.getAttachedItemNames();

		const validNames: string[] = [];
		const rejectedNames: string[] = [];

		for (const name of desiredNames) {
			if (!isKnownPlushie(name) || !attachedSet.has(name)) {
				rejectedNames.push(name);
			} else {
				validNames.push(name);
			}
		}

		// -----------------------------------------------------------------------
		// 3. Reconcile and apply
		// -----------------------------------------------------------------------
		const {
			traitsToAdd,
			traitsToRemove,
			traitsToSuppress,
			traitsToRestore,
			xpBoostDeltas,
			newState
		} = PlushieReconciler.reconcile(authoritative, validNames);

		// Only add traits the player does not already have; adding an existing
		// trait can create duplicate entries in Build 42 trait lists.
		const actuallyAdded: string[] = [];
		for (const trait of traitsToAdd) {
			if (!playerApi.hasTrait(trait)) {
				playerApi.addTrait(trait);
				actuallyAdded.push(trait);
			}
		}
		for (const trait of traitsToRemove) {
			playerApi.removeTrait(trait);
		}

		// Only suppress traits the player actually has — suppressing a trait the
		// player never had would cause it to be granted on the next plushie removal.
		const actuallySuppressed: string[] = [];
		for (const trait of traitsToSuppress) {
			if (playerApi.hasTrait(trait)) {
				playerApi.removeTrait(trait);
				actuallySuppressed.push(trait);
			}
		}

		for (const trait of traitsToRestore) {
			playerApi.addTrait(trait);
		}

		for (const [key, delta] of Object.entries(xpBoostDeltas)) {
			const [, perkName] = key.split(":");
			const perk = Perks[perkName as keyof typeof Perks] as Perk;
			if (!perk) continue;
			playerApi.applyXpMultiplierDelta(perk, delta);
		}
		// -----------------------------------------------------------------------
		// 4. Persist updated server state
		// -----------------------------------------------------------------------
		// suppressedTraits must only contain traits actually removed from the player,
		// not the full desired-suppression set from the reconciler.
		// addedTraits must only contain traits that were actually added by the mod,
		// so detaching plushies never removes a trait the player had originally.
		serverModData.authoritative = {
			...newState,
			addedTraits: [
				...authoritative.addedTraits.filter((t: string) => !traitsToRemove.includes(t)),
				...actuallyAdded
			],
			suppressedTraits: [
				...authoritative.suppressedTraits.filter((t: string) => !traitsToRestore.includes(t)),
				...actuallySuppressed
			]
		};

		// -----------------------------------------------------------------------
		// 5. Reply to the client
		// -----------------------------------------------------------------------
		const reply: SyncAppliedPlushiesPayload = {
			appliedNames: validNames,
			rejectedNames
		};
		this.sendResponse(player, payload, reply);
	}

	/**
	 * Sends a rejection reply echoing the payload's version and revision, with
	 * all desired names moved to `rejectedNames`.
	 *
	 * @param player Player who sent the stale request.
	 * @param payload Stale request envelope being rejected.
	 */
	protected onStaleCommand(player: IsoPlayer, payload: CommandPayload<SyncDesiredPlushiesPayload>): void {
		const reply: SyncAppliedPlushiesPayload = {
			appliedNames: [],
			rejectedNames: payload.data.desiredNames
		};
		this.sendResponse(player, payload, reply);
	}

	/**
	 * Sends a rejection reply for requests using an unsupported payload schema.
	 *
	 * @param player Player who sent the incompatible request.
	 * @param payload Rejected request envelope being rejected.
	 */
	protected onUnsupportedSchema(player: IsoPlayer, payload: CommandPayload<SyncDesiredPlushiesPayload>): void {
		const reply: SyncAppliedPlushiesPayload = {
			appliedNames: [],
			rejectedNames: payload.data.desiredNames
		};
		this.sendResponse(player, payload, reply);
	}

	/**
	 * Returns a fully initialized authoritative state from the persisted
	 * authoritative payload.
	 *
	 * @param persistedVersion Schema version stored alongside the authoritative data.
	 * @param authoritativeData Partially populated persisted authoritative state.
	 * @returns Current authoritative state shape for runtime use.
	 */
	protected migrateAuthoritativeData(persistedVersion: number, authoritativeData: unknown): NaninhasAuthoritativeState {
		if (persistedVersion < PROTOCOL_SCHEMA_VERSION) {
			print(`[Naninhas] Migrating server mod data from schema v${persistedVersion} to v${PROTOCOL_SCHEMA_VERSION}`);
			//TODO: Add migration logic here when a breaking schema change is introduced:
			// if (persistedVersion < 2) { /* reshape fields for schema 2 */ }
			// if (persistedVersion < 3) { /* reshape fields for schema 3 */ }
		}

		const authoritative = authoritativeData as Partial<NaninhasAuthoritativeState> | undefined;

		return {
			activePlushieNames: authoritative?.activePlushieNames ?? [],
			addedTraits: authoritative?.addedTraits ?? [],
			suppressedTraits: authoritative?.suppressedTraits ?? [],
			xpBoosts: authoritative?.xpBoosts ?? {}
		};
	}
}