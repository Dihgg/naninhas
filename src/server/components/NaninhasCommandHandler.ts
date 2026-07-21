/* @noSelfInFile */
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { Commands, NETWORK_MODULE, PROTOCOL_SCHEMA_VERSION } from "@constants";
import type {
	CommandPayload,
	SyncAppliedPlushiesPayload,
	SyncDesiredPlushiesPayload,
	NaninhasAuthoritativeState
} from "@types";
import { isKnownPlushie } from "@shared/catalog/PlushieCatalog";
import { PlayerApi } from "@shared/components/PlayerApi";
import { AuthoritativeStateController } from "@server/components/AuthoritativeStateController";
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
			{ activePlushieNames: [], addedTraits: [], suppressedTraits: [], xpBoosts: {}, temporaryBuff: { source: null } }
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
		const now = playerApi.getWorldAgeHours();
		const nextTemporaryBuff = AuthoritativeStateController.sanitizeTemporaryBuff(authoritative.temporaryBuff, now);
		const desiredEffectiveNames = AuthoritativeStateController.buildEffectiveNames(validNames, nextTemporaryBuff);
		const nextState = AuthoritativeStateController.applyDesiredState(
			playerApi,
			authoritative,
			desiredEffectiveNames,
			validNames,
			nextTemporaryBuff
		);
		// -----------------------------------------------------------------------
		// 4. Persist updated server state
		// -----------------------------------------------------------------------
		serverModData.authoritative = nextState;

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
			xpBoosts: authoritative?.xpBoosts ?? {},
			temporaryBuff: {
				activeName: authoritative?.temporaryBuff?.activeName,
				expiresAtWorldAgeHours: authoritative?.temporaryBuff?.expiresAtWorldAgeHours,
				source: authoritative?.temporaryBuff?.source ?? null
			}
		};
	}
}