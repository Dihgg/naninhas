/* @noSelfInFile */
import type { Perk } from "@asledgehammer/pipewrench";
import { Perks } from "@asledgehammer/pipewrench";
import { NETWORK_MODULE, NetworkCommands, PROTOCOL_SCHEMA_VERSION } from "@constants";
import type {
	SyncAppliedPlushiesPayload,
	SyncDesiredPlushiesPayload,
	ServerAuthoritativeState
} from "@types";
import { PlushieReconciler } from "@shared/components/PlushieReconciler";
import { isKnownPlushie } from "@shared/catalog/PlushieCatalog";
import { PlayerApi } from "@shared/components/PlayerApi";
import {
	CommandHandler,
	CommandRequestContext
} from "@server/components/CommandHandler";

/**
 * Server-side command handler for the Naninhas mod.
 *
 * Receives client sync requests, validates them, applies reconciled effects to
 * the live player, and sends a confirmed reply back to the client.
 */
export class NaninhasCommandHandler extends CommandHandler<
	SyncDesiredPlushiesPayload,
	SyncAppliedPlushiesPayload,
	ServerAuthoritativeState
> {
	constructor() {
		super(NETWORK_MODULE, "Naninhas", [NetworkCommands.SyncDesiredPlushies], PROTOCOL_SCHEMA_VERSION);
	}

	protected getResponseCommand(requestCommand: string): string {
		switch (requestCommand) {
			case NetworkCommands.SyncDesiredPlushies:
				return NetworkCommands.SyncAppliedPlushies;
			default:
				return requestCommand;
		}
	}

	protected isValidRequestPayload(value: unknown): value is SyncDesiredPlushiesPayload {
		if (!value || typeof value !== "object") return false;
		const payload = value as Partial<SyncDesiredPlushiesPayload>;
		if (typeof payload.schemaVersion !== "number") return false;
		if (typeof payload.revision !== "number") return false;
		if (!Array.isArray(payload.desiredNames)) return false;
		for (const name of payload.desiredNames) {
			if (typeof name !== "string") return false;
		}
		return true;
	}

	protected defaultAuthoritativeState(): ServerAuthoritativeState {
		return {
			activePlushieNames: [],
			addedTraits: [],
			suppressedTraits: [],
			xpBoosts: {}
		};
	}

	protected ensureAuthoritativeState(
		value?: Partial<ServerAuthoritativeState>
	): ServerAuthoritativeState {
		return {
			activePlushieNames: value?.activePlushieNames ?? [],
			addedTraits: value?.addedTraits ?? [],
			suppressedTraits: value?.suppressedTraits ?? [],
			xpBoosts: value?.xpBoosts ?? {}
		};
	}

	/**
	 * Processes a SyncDesiredPlushies request from a client.
	 *
	 * Responsibilities:
	 * 1. Validate revision to ensure freshness
	 * 2. Verify player has the items they claim to have attached
	 * 3. Call the reconciler to compute trait/XP deltas
	 * 4. Apply those changes to the live player
	 * 5. Persist the new server state
	 * 6. Reply to the client with SyncAppliedPlushies
	 *
	 * @param player The player sending the sync request
	 * @param payload The deserialized payload sent by the client via `sendClientCommand`
	 */
	protected buildAcceptedResponse(
		context: CommandRequestContext<ServerAuthoritativeState, SyncDesiredPlushiesPayload>
	): SyncAppliedPlushiesPayload {
		const { player, payload, state } = context;
		const playerApi = new PlayerApi(player);
		const { authoritative } = state;

		// -----------------------------------------------------------------------
		// 2. Verify attachment and validate plushie names
		// -----------------------------------------------------------------------
		const attachedSet = playerApi.getAttachedItemNames();

		const validNames: string[] = [];
		const rejectedNames: string[] = [];
		const desiredNames = payload?.desiredNames ?? [];

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
		state.authoritative = {
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
		return {
			...super.buildResponse(context, "ACCEPTED"),
			appliedNames: validNames,
			rejectedNames
		};
	}

	/**
	 * Sends a rejection reply echoing the payload's version and revision, with
	 * all desired names moved to `rejectedNames`.
	 */
	protected buildRejectedResponse(
		context: CommandRequestContext<ServerAuthoritativeState, SyncDesiredPlushiesPayload>
	): SyncAppliedPlushiesPayload {
		const { payload } = context;
		return {
			...this.buildResponse(context, "REJECTED"),
			appliedNames: [],
			rejectedNames: payload?.desiredNames ?? []
		};
	}

	/**
	 * Sends a canonical rejection reply for malformed payloads.
	 *
	 * Because request args failed validation, the response does not echo
	 * client-provided protocol metadata and instead uses a server-authored
	 * sentinel revision (`0`) with empty applied/rejected lists.
	 */
	protected buildInvalidPayloadResponse(
		context: CommandRequestContext<ServerAuthoritativeState, SyncDesiredPlushiesPayload>
	): SyncAppliedPlushiesPayload {

		return {
			...super.buildResponse(context, "REJECTED"),
			revision: 0,
			appliedNames: [],
			rejectedNames: []
		};
	}
}
