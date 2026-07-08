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
 * Request data sent from the client to the server to request a set of plushie
 * effects be applied authoritatively.
 */
export type SyncDesiredPlushiesPayload = {
	/** Item names the client currently has attached. */
	desiredNames: string[];
};

/**
 * Response data sent from the server back to the requesting client confirming
 * which plushie effects were applied and which were rejected.
 */
export type SyncAppliedPlushiesPayload = {
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
export type NaninhasAuthoritativeState = {
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
export type ServerModData<TAuthoritative> = {
	protocol: ServerProtocolState;
	authoritative: TAuthoritative;
};

/**
 * Standard network envelope shared by request and response commands.
 *
 * In this branch, the command name describes the transport action while the
 * domain payload is carried inside `data`.
 *
 * @typeParam T Inner payload for the command.
 */
export type CommandPayload<T> = {
	/** Monotonically increasing request counter scoped to the current session. */
	revision: number;
	/** Protocol schema version for the command payload. */
	schemaVersion: number;
	/** Domain-specific request or response data. */
	data: T;
};

/**
 * Pair of transport command names used for a multiplayer request/response flow.
 */
export type NetworkCommand = { REQUEST: string; RESPONSE: string };