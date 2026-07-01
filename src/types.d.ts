import type { IsoPlayer, KahluaTable, Perk } from "@asledgehammer/pipewrench";

export type PerkBoost = {
	perk: Perk;
	value: number
};

export type PlushieProps = {
	player: IsoPlayer;
	name: string;
};

export type ModDataProps<T> = {
	/** The player object from PZ */
	object: { getModData(): KahluaTable };
	/** The key to be used in `getModData()` */
	modKey: string;
	/** The data that shall be returned by default */
	defaultData: T;
	/** Optional normalizer for partially populated persisted data. */
	ensure?: (data: Partial<T>) => T;
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
 * Shared protocol envelope for all synced command payloads.
 *
 * Request and response payloads should extend this type so protocol metadata
 * has a single source of truth across the codebase.
 */
export type SyncProtocolPayload = {
	/** Protocol version — must equal `PROTOCOL_SCHEMA_VERSION`. */
	schemaVersion: number;
	/**
	 * Monotonically increasing counter scoped to the client's current session.
	 * The server drops payloads whose revision is not strictly greater than
	 * the last accepted revision to prevent stale / out-of-order processing.
	 */
	revision: number;
};

/**
 * Payload sent from the client to the server to request a set of plushie
 * effects be applied authoritatively.
 *
 * Handlers must reject payloads whose `schemaVersion` they do not recognise.
 */
export type SyncDesiredPlushiesPayload = SyncProtocolPayload & {
	/** Item names the client currently has attached. */
	desiredNames: string[];
};

/**
 * Payload sent from the server back to the requesting client confirming
 * which plushie effects were applied and which were rejected.
 */
export type SyncAppliedPlushiesPayload = SyncProtocolPayload & {
	/** Names of plushies whose effects were successfully applied. */
	appliedNames: string[];
	/** Names of plushies that were rejected (unknown name, not attached, etc.). */
	rejectedNames: string[];
	/** Optional response status for protocol-aware handling. */
	status?: "ACCEPTED" | "REJECTED";
	/** Optional protocol rejection reason when status is REJECTED. */
	reason?: "INVALID_PAYLOAD" | "SCHEMA_MISMATCH" | "STALE_REVISION";
	/** Server schema expected by this handler. */
	expectedSchemaVersion?: number;
	/** Last accepted client revision persisted on the server. */
	lastAcceptedRevision?: number;
};

// ---------------------------------------------------------------------------
// Server-side protocol and persistence types
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
 * Generic server-side modData shape used by command handlers.
 */
export type GenericServerModData<TAuthoritative> = {
	protocol: ServerProtocolState;
	authoritative: TAuthoritative;
};

// ---------------------------------------------------------------------------
// Naninhas-specific authoritative state
// ---------------------------------------------------------------------------

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
export type ServerModData = GenericServerModData<ServerAuthoritativeState>;
