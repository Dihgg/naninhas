import type { IsoPlayer, KahluaTable, Perk } from "@asledgehammer/pipewrench";

export type PerkBoost = {
	perk: Perk;
	value: number
};

export type PlushieProps = {
	player: IsoPlayer;
	name: string;
	traitsToAdd?: string[];
	traitsToSuppress?: string[];
	xpBoostsToAdd?: PerkBoost[];
};

export type ModDataProps<T> = {
	/** The player object from PZ */
	object: { getModData(): KahluaTable };
	/** The key to be used in `getModData()` */
	modKey: string;
	/** The data that shall be returned by default */
	defaultData: T;
};

export type PlayerModData = {
	addedTraits: string[];
	suppressedTraits: string[];
	xpBoosts: Record<string, number>;
};

export type EventData = PlayerModData & {
	name: string;
};

// ---------------------------------------------------------------------------
// Network protocol types
// ---------------------------------------------------------------------------

/**
 * Payload sent from the client to the server to request a set of plushie
 * effects be applied authoritatively.
 *
 * Handlers must reject payloads whose `schemaVersion` they do not recognise.
 */
export type SyncDesiredPlushiesPayload = {
	/** Protocol version — must equal `PROTOCOL_SCHEMA_VERSION`. */
	schemaVersion: number;
	/**
	 * Monotonically increasing counter scoped to the client's current session.
	 * The server drops payloads whose revision is not strictly greater than
	 * the last accepted revision to prevent stale / out-of-order processing.
	 */
	revision: number;
	/** Item names the client currently has attached. */
	desiredNames: string[];
};

/**
 * Payload sent from the server back to the requesting client confirming
 * which plushie effects were applied and which were rejected.
 */
export type SyncAppliedPlushiesPayload = {
	/** Echo of the `schemaVersion` from the originating request. */
	schemaVersion: number;
	/** Echo of the `revision` from the originating request. */
	revision: number;
	/** Names of plushies whose effects were successfully applied. */
	appliedNames: string[];
	/** Names of plushies that were rejected (unknown name, not attached, etc.). */
	rejectedNames: string[];
};

// ---------------------------------------------------------------------------
// Server-side authoritative state (stored in player modData under "Naninhas")
// ---------------------------------------------------------------------------

/**
 * Protocol bookkeeping persisted on the server to detect stale requests and
 * schema mismatches across client reconnects.
 */
export type ServerProtocolState = {
	/** The last `revision` value accepted from this client. */
	lastClientRevision: number;
	/** The `schemaVersion` that was in effect when state was last written. */
	lastSchemaVersion: number;
};

/**
 * Authoritative snapshot of which plushie effects are currently active for a
 * player, as determined and persisted by the server.
 */
export type ServerAuthoritativeState = {
	/** Plushie names whose effects are currently active. */
	activePlushieNames: string[];
	/** Traits added by active plushies. */
	addedTraits: string[];
	/** Traits suppressed by active plushies. */
	suppressedTraits: string[];
	/** XP multiplier deltas keyed by `"plushieName:perkName"`. */
	xpBoosts: Record<string, number>;
};

/**
 * Full server-side modData structure stored under the `"Naninhas"` key in
 * `player.getModData()` on the server.
 */
export type ServerModData = {
	protocol: ServerProtocolState;
	authoritative: ServerAuthoritativeState;
};
