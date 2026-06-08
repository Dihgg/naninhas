/* @noSelfInFile */
import type { IsoPlayer, KahluaTable, Perk } from "@asledgehammer/pipewrench";
import { sendServerCommand, Perks } from "@asledgehammer/pipewrench";
import { NETWORK_MODULE, NetworkCommands, PROTOCOL_SCHEMA_VERSION } from "@constants";
import type {
	SyncAppliedPlushiesPayload,
	SyncDesiredPlushiesPayload,
	ServerModData
} from "types";
import { PlushieReconciler } from "@shared/components/PlushieReconciler";
import { isKnownPlushie } from "@shared/catalog/PlushieCatalog";
import { ModData } from "@shared/components/ModData";
import { PlayerApi } from "@shared/components/PlayerApi";

/**
 * Server-side command handler for the Naninhas mod.
 *
 * Receives client sync requests, validates them, applies reconciled effects to
 * the live player, and sends a confirmed reply back to the client.
 */
export class NaninhasCommandHandler {
	/**
	 * Processes a SyncDesiredPlushies request from a client.
	 *
	 * Responsibilities:
	 * 1. Validate schemaVersion and revision to ensure freshness
	 * 2. Verify player has the items they claim to have attached
	 * 3. Call the reconciler to compute trait/XP deltas
	 * 4. Apply those changes to the live player
	 * 5. Persist the new server state
	 * 6. Reply to the client with SyncAppliedPlushies
	 *
	 * @param player The player sending the sync request
	 * @param args The KahluaTable payload sent by the client via `sendClientCommand`
	 */
	onSyncDesiredPlushies(player: IsoPlayer, args: KahluaTable): void {
		const payload = args as unknown as SyncDesiredPlushiesPayload;

		// Validate schemaVersion
		if (payload.schemaVersion !== PROTOCOL_SCHEMA_VERSION) {
			print(
				`[Naninhas] SyncDesiredPlushies: schema mismatch from ${player.getUsername()} ` +
				`(expected ${PROTOCOL_SCHEMA_VERSION}, got ${payload.schemaVersion})`
			);
			this.sendRejectReply(player, payload);
			return;
		}

		// -----------------------------------------------------------------------
		// 2. Load or initialize server state
		// -----------------------------------------------------------------------
		const playerApi = new PlayerApi(player);
		const serverModData = new ModData<ServerModData>({
			object: playerApi.player,
			modKey: "Naninhas",
			defaultData: {
				protocol: { lastClientRevision: 0, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
				authoritative: { activePlushieNames: [], addedTraits: [], suppressedTraits: [], xpBoosts: {} }
			},
			ensure: NaninhasCommandHandler.ensureServerModData
		}).data;
		const { protocol, authoritative } = serverModData;

		// Check revision freshness to prevent stale / out-of-order requests
		if (payload.revision <= protocol.lastClientRevision) {
			print(
				`[Naninhas] SyncDesiredPlushies: stale revision from ${player.getUsername()} ` +
				`(expected > ${protocol.lastClientRevision}, got ${payload.revision})`
			);
			this.sendRejectReply(player, payload);
			return;
		}

		// -----------------------------------------------------------------------
		// 3. Verify attachment and validate plushie names
		// -----------------------------------------------------------------------
		const attachedSet = playerApi.getAttachedItemNames();

		const validNames: string[] = [];
		const rejectedNames: string[] = [];

		for (const name of payload.desiredNames) {
			if (!isKnownPlushie(name) || !attachedSet.has(name)) {
				rejectedNames.push(name);
			} else {
				validNames.push(name);
			}
		}

		// -----------------------------------------------------------------------
		// 4. Reconcile and apply
		// -----------------------------------------------------------------------
		const plan = PlushieReconciler.reconcile(authoritative, validNames);

		for (const trait of plan.traitsToAdd) {
			playerApi.addTrait(trait);
		}
		for (const trait of plan.traitsToRemove) {
			playerApi.removeTrait(trait);
		}
		for (const trait of plan.traitsToSuppress) {
			playerApi.removeTrait(trait);
		}
		for (const trait of plan.traitsToRestore) {
			playerApi.addTrait(trait);
		}

		const xp = player.getXp();
		for (const [key, delta] of Object.entries(plan.xpBoostDeltas)) {
			const [, perkName] = key.split(":");
			const perk = Perks[perkName as keyof typeof Perks] as Perk;
			if (!perk) continue;
			const newMultiplier = Math.max(xp.getMultiplier(perk) + delta, 0);
			xp.addXpMultiplier(perk, newMultiplier, 0, 0);
		}

		// -----------------------------------------------------------------------
		// 5. Persist updated server state
		// -----------------------------------------------------------------------
		protocol.lastClientRevision = payload.revision;
		protocol.lastSchemaVersion = PROTOCOL_SCHEMA_VERSION;
		serverModData.authoritative = plan.newState;

		// -----------------------------------------------------------------------
		// 6. Reply to the client
		// -----------------------------------------------------------------------
		const reply: SyncAppliedPlushiesPayload = {
			schemaVersion: payload.schemaVersion,
			revision: payload.revision,
			appliedNames: validNames,
			rejectedNames
		};
		sendServerCommand(player, `${NETWORK_MODULE}:${NetworkCommands.SyncAppliedPlushies}`, reply);
	}

	/**
	 * Sends a rejection reply echoing the payload's version and revision, with
	 * all desired names moved to `rejectedNames`.
	 */
	private sendRejectReply(player: IsoPlayer, payload: SyncDesiredPlushiesPayload): void {
		const reply: SyncAppliedPlushiesPayload = {
			schemaVersion: payload.schemaVersion,
			revision: payload.revision,
			appliedNames: [],
			rejectedNames: payload.desiredNames
		};
		sendServerCommand(player, `${NETWORK_MODULE}:${NetworkCommands.SyncAppliedPlushies}`, reply);
	}

	/**
	 * Returns a fully initialized `ServerModData` from the player's modData,
	 * creating and seeding defaults if the structure is absent or incomplete.
	 */
	private static ensureServerModData(data: Partial<ServerModData>): ServerModData {
		const ensured = data as ServerModData;
		ensured.protocol = {
			lastClientRevision: data.protocol?.lastClientRevision ?? 0,
			lastSchemaVersion: data.protocol?.lastSchemaVersion ?? PROTOCOL_SCHEMA_VERSION
		};
		ensured.authoritative = {
			activePlushieNames: data.authoritative?.activePlushieNames ?? [],
			addedTraits: data.authoritative?.addedTraits ?? [],
			suppressedTraits: data.authoritative?.suppressedTraits ?? [],
			xpBoosts:
				data.authoritative?.xpBoosts && typeof data.authoritative.xpBoosts === "object"
					? data.authoritative.xpBoosts
					: {}
		};
		return ensured;
	}
}
