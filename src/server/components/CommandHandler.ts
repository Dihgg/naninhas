/* @noSelfInFile */

import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { sendServerCommand } from "@asledgehammer/pipewrench";
import { PROTOCOL_SCHEMA_VERSION } from "@constants";
import { ModData } from "@shared/components/ModData";
import type {
	ResponseStatus,
	ServerProtocolState,
	SyncProtocolPayload,
	SyncProtocolResponse,
	CommandRejectReason
} from "@types";

/**
 * Persisted state shape shared by all command handlers.
 */
type CommandPersistedState<TAuthoritative> = {
	/** Protocol bookkeeping persisted on the server to detect stale requests and schema mismatches across client reconnects. */
	protocol: ServerProtocolState;
	/** Authoritative state persisted on the server and applied to the live player. */
	authoritative: TAuthoritative;
};

/**
 * Context object passed to command handler methods.
 */
export type CommandRequestContext<
	TAuthoritative,
	TRequest extends SyncProtocolPayload
> = {
	/** The player who sent the request. */
	player: IsoPlayer;
	/** The command name sent by the client. */
	requestCommand: string;
	/** The authoritative state persisted on the server. */
	state: CommandPersistedState<TAuthoritative>;
	/** The deserialized payload sent by the client via `sendClientCommand`. */
	payload?: TRequest;
	/** Optional rejection reason when the request is rejected. */
	reason?: CommandRejectReason;
	/** The raw arguments sent by the client via `sendClientCommand`. */
	args?: unknown;
}

/**
 * Result returned from protocol validation.
 */
type CommandValidationResult = {
	/** Whether the command is valid and can be processed. */
	ok: boolean;
	/** Optional reason for rejection if the command is invalid. */
	reason?: CommandRejectReason;
};

/**
 * Input object used to validate and advance protocol state.
 */
type ProtocolValidationContext = {
	/** Incoming request command name. */
	command: string;
	/** Client payload containing schema and revision metadata. */
	payload: SyncProtocolPayload;
	/** Mutable persisted protocol state for the player. */
	protocol: ServerProtocolState;
	/** Player username used for structured logging. */
	username: string;
};

/**
 * Generic server-side command handler template.
 * @abstract
 * @template TRequest Request payload type handled by this command handler.
 * @template TResponse Response payload type sent back to the client.
 * @template TAuthoritative Authoritative server-side state persisted per player.
 *
 * Responsibilities handled in this base class:
 * 1) Route filter (`module` + `command`) via `canHandle`
 * 2) Runtime payload shape guard via `isValidRequestPayload`
 * 3) Persistent state retrieval/initialization from `player.getModData()`
 * 4) Protocol guard rails (schema mismatch, reconnect reset, stale revision)
 * 5) Protocol state advancement when request is accepted
 * 6) Response dispatch (`sendServerCommand`) with overridable response command mapping
 *
 * Responsibilities delegated to subclasses:
 * 1) Authoritative state defaults and normalization
 * 2) Accepted-path game logic (validation/reconciliation/application)
 * 3) Rejected-path payload shape
 * 4) Response command mapping
 */
export abstract class CommandHandler<
	TRequest extends SyncProtocolPayload,
	TResponse extends SyncProtocolResponse,
	TAuthoritative
> {
	/**
	 * @param moduleName Networking module this handler listens to.
	 * @param modDataKey ModData key used to persist protocol + authoritative state.
	 * @param handledCommands Request command names accepted by this handler.
	 * @param schemaVersion Protocol schema expected by this handler.
	 */
	constructor(
		protected readonly moduleName: string,
		protected readonly modDataKey: string,
		protected readonly handledCommands: readonly string[],
		protected readonly schemaVersion: number = PROTOCOL_SCHEMA_VERSION
	) {}

	/**
	 * Checks whether this handler should process a specific incoming command.
	 */
	public canHandle(module: string, command: string): boolean {
		return module === this.moduleName && this.handledCommands.includes(command);
	}

	/**
	 * Main template method executed by the server entrypoint listener.
	 *
	 * @returns `true` when this handler consumed the event (even if rejected),
	 *          `false` when module/command does not belong to this handler.
	 */
	public handle(module: string, command: string, player: IsoPlayer, args: unknown): boolean {
		if (!this.canHandle(module, command)) {
			return false;
		}

		const username = player.getUsername();
		const state = this.readState(player);

		if (!this.isValidRequestPayload(args)) {
			print(
				`[${this.moduleName}][MP][Server] reject ${command} player=${username} reason=INVALID_PAYLOAD`
			);
			const rejected = this.buildInvalidPayloadResponse({
				player,
				requestCommand: command,
				args,
				reason: "INVALID_PAYLOAD",
				state
			});
			this.sendResponse(player, command, rejected);
			return true;
		}

		const payload = args as TRequest;

		print(
			`[${this.moduleName}][MP][Server] received ${command} player=${username} revision=${payload.revision} schema=${payload.schemaVersion}`
		);

		const validation = this.validateAndAdvanceProtocol({
			command,
			payload,
			protocol: state.protocol,
			username
		});
		if (!validation.ok) {
			const rejected = this.buildRejectedResponse({
				player,
				requestCommand: command,
				payload,
				reason: validation.reason,
				state
			});
			this.sendResponse(player, command, rejected);
			return true;
		}

		const accepted = this.buildAcceptedResponse({
			player,
			requestCommand: command,
			payload,
			state
		});
		this.sendResponse(player, command, accepted);
		return true;
	}

	/**
	 * Reads persisted state from ModData, seeding defaults and normalizing shape.
	 */
	protected readState(player: IsoPlayer): CommandPersistedState<TAuthoritative> {
		return new ModData<CommandPersistedState<TAuthoritative>>({
			object: player,
			modKey: this.modDataKey,
			defaultData: {
				protocol: {
					lastClientRevision: 0,
					lastSchemaVersion: this.schemaVersion
				},
				authoritative: this.defaultAuthoritativeState()
			},
			ensure: (data: Partial<CommandPersistedState<TAuthoritative>>) => ({
				protocol: this.ensureProtocolState(data.protocol),
				authoritative: this.ensureAuthoritativeState(data.authoritative)
			})
		}).data;
	}

	/**
	 * Sends response payload to the client.
	 *
	 * Implementations usually only override `getResponseCommand`; this method can
	 * still be overridden for advanced custom transport behavior.
	 */
	protected sendResponse(player: IsoPlayer, requestCommand: string, response: TResponse): void {
		sendServerCommand(player, this.moduleName, this.getResponseCommand(requestCommand), response);
	}

	/**
	 * Returns response command name for a given request command.
	 * @abstract
	 * @param requestCommand Incoming request command name.
	 * @returns Response command name used by `sendServerCommand`.
	 */
	protected abstract getResponseCommand(requestCommand: string): string;

	/**
	 * Runtime guard for incoming request payload.
	 * @abstract
	 *
	 * Implementations should validate command-specific fields in addition to
	 * `schemaVersion` and `revision`.
	 * @param value Raw incoming payload candidate.
	 * @returns `true` when payload matches `TRequest`; otherwise `false`.
	 */
	protected abstract isValidRequestPayload(value: unknown): value is TRequest;

	/**
	 * Returns default authoritative state used for first-time persistence.
	 * @abstract
	 * @returns Initial authoritative state for this command domain.
	 */
	protected abstract defaultAuthoritativeState(): TAuthoritative;

	/**
	 * Normalizes potentially partial authoritative state loaded from persistence.
	 * @abstract
	 * @param value Partial authoritative state loaded from persistence.
	 * @returns Normalized authoritative state with required fields populated.
	 */
	protected abstract ensureAuthoritativeState(value?: Partial<TAuthoritative>): TAuthoritative;

	/**
	 * Builds accepted response and performs accepted-path side effects.
	 * @abstract
	 * @param context Command request context for an accepted request.
	 * @returns Response payload sent to the client.
	 */
	protected abstract buildAcceptedResponse(
		context: CommandRequestContext<TAuthoritative, TRequest>
	): TResponse;

	/**
	 * Builds the shared protocol response for both accepted and rejected paths.
	 * This method is called by `buildAcceptedResponse` and `buildRejectedResponse`
	 * to ensure consistent protocol fields are returned to the client.
	 * @param context The command request context containing the player, request command, payload, and state.
	 * @param status The response status, either "ACCEPTED" or "REJECTED".
	 * @returns A SyncProtocolResponse object containing the protocol fields and any additional response data.
	 */
	protected buildResponse(
		context: CommandRequestContext<TAuthoritative, TRequest>,
		status: ResponseStatus
	): SyncProtocolResponse {
		const { state, payload, reason } = context;

		return {
			revision: payload?.revision ?? 0,
			schemaVersion: payload?.schemaVersion ?? this.schemaVersion,
			status,
			reason,
			expectedSchemaVersion: this.schemaVersion,
			lastAcceptedRevision: state.protocol.lastClientRevision
		};
	}

	/**
	 * Builds rejection response payload for protocol-level rejections.
	 * @abstract
	 * @param context The command request context containing the player, request command, payload, and state.
	 * @returns A SyncProtocolResponse object containing the protocol fields and any additional response data.
	 * The response will have a status of "REJECTED" and a reason indicating the cause of rejection.
	 */
	protected abstract buildRejectedResponse(
		context: CommandRequestContext<TAuthoritative, TRequest>
	): TResponse;

	/**
	 * Builds rejection response payload for payload-shape validation failures.
	 * @abstract
	 * @param context The command request context containing the player, request command, payload, and state.
	 * @returns A SyncProtocolResponse object containing the protocol fields and any additional response data.
	 */
	protected abstract buildInvalidPayloadResponse(
		context: CommandRequestContext<TAuthoritative, TRequest>
	): TResponse;

	/**
	 * Ensures protocol object always has required fields.
	 * @param value Optional partial protocol state to normalize.
	 * @returns A complete ServerProtocolState object with default values for any missing fields.
	 */
	private ensureProtocolState(value?: Partial<ServerProtocolState>): ServerProtocolState {
		return {
			lastClientRevision: value?.lastClientRevision ?? 0,
			lastSchemaVersion: value?.lastSchemaVersion ?? this.schemaVersion
		};
	}

	/**
	 * Applies protocol guard rails and advances protocol state on acceptance.
	 * @param props Named protocol validation inputs.
	 * @returns Validation outcome including optional rejection reason.
	 */
	private validateAndAdvanceProtocol(props: ProtocolValidationContext): CommandValidationResult {

		const { command, payload, protocol, username } = props;

		if (payload.schemaVersion !== this.schemaVersion) {
			print(
				`[${this.moduleName}][MP][Server] reject ${command} player=${username} reason=SCHEMA_MISMATCH payload=${payload.schemaVersion} expected=${this.schemaVersion}`
			);
			return { ok: false, reason: "SCHEMA_MISMATCH" };
		}

		if (payload.revision === 1 && protocol.lastClientRevision > 0) {
			print(
				`[${this.moduleName}][MP][Server] reconnect detected player=${username} resetting protocol revision from ${protocol.lastClientRevision} to 0`
			);
			protocol.lastClientRevision = 0;
		}

		if (payload.revision <= protocol.lastClientRevision) {
			print(
				`[${this.moduleName}][MP][Server] reject ${command} player=${username} reason=STALE_REVISION payload=${payload.revision} lastAccepted=${protocol.lastClientRevision}`
			);
			return { ok: false, reason: "STALE_REVISION" };
		}

		protocol.lastClientRevision = payload.revision;
		protocol.lastSchemaVersion = this.schemaVersion;

		print(
			`[${this.moduleName}][MP][Server] accepted ${command} player=${username} revision=${payload.revision}`
		);

		return { ok: true };
	}
}