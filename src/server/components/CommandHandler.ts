/* @noSelfInFile */

import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { sendServerCommand } from "@asledgehammer/pipewrench";
import { PROTOCOL_SCHEMA_VERSION } from "@constants";
import { ModData } from "@shared/components/ModData";
import type { ServerProtocolState, SyncProtocolPayload } from "@types";

/**
 * Reasons why a request can be rejected by protocol guard rails.
 */
export type CommandRejectReason = "INVALID_PAYLOAD" | "SCHEMA_MISMATCH" | "STALE_REVISION";

/**
 * Persisted state shape shared by all command handlers.
 *
 * `protocol` is generic, while `authoritative` is mod-specific.
 */
export type CommandPersistedState<TAuthoritative> = {
	protocol: ServerProtocolState;
	authoritative: TAuthoritative;
};

/**
 * Context passed to protocol-level rejection builders.
 */
export type CommandRejectedContext<
	TRequest extends SyncProtocolPayload,
	TAuthoritative
> = {
	player: IsoPlayer;
	requestCommand: string;
	payload: TRequest;
	reason: Exclude<CommandRejectReason, "INVALID_PAYLOAD">;
	state: CommandPersistedState<TAuthoritative>;
};

/**
 * Context passed to invalid-payload rejection builders.
 */
export type CommandInvalidPayloadContext<TAuthoritative> = {
	player: IsoPlayer;
	requestCommand: string;
	rawArgs: unknown;
	state: CommandPersistedState<TAuthoritative>;
};

/**
 * Context passed to accepted-response builders.
 */
export type CommandAcceptedContext<
	TRequest extends SyncProtocolPayload,
	TAuthoritative
> = {
	player: IsoPlayer;
	requestCommand: string;
	payload: TRequest;
	state: CommandPersistedState<TAuthoritative>;
};

/**
 * Result returned from protocol validation.
 */
type CommandValidationResult = {
	ok: boolean;
	reason?: Exclude<CommandRejectReason, "INVALID_PAYLOAD">;
};

/**
 * Generic server-side command handler template.
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
	TResponse extends SyncProtocolPayload,
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
				rawArgs: args,
				state
			});
			this.sendResponse(player, command, rejected);
			return true;
		}

		const payload = args as TRequest;

		print(
			`[${this.moduleName}][MP][Server] received ${command} player=${username} revision=${payload.revision} schema=${payload.schemaVersion}`
		);

		const validation = this.validateAndAdvanceProtocol(command, payload, state.protocol, username);
		if (!validation.ok) {
			const rejected = this.buildRejectedResponse({
				player,
				requestCommand: command,
				payload,
				reason: validation.reason as Exclude<CommandRejectReason, "INVALID_PAYLOAD">,
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
	 * Subclasses usually only override `getResponseCommand`; this method can
	 * still be overridden for advanced custom transport behavior.
	 */
	protected sendResponse(player: IsoPlayer, requestCommand: string, response: TResponse): void {
		sendServerCommand(player, this.moduleName, this.getResponseCommand(requestCommand), response);
	}

	/**
	 * Returns response command name for a given request command.
	 */
	protected abstract getResponseCommand(requestCommand: string): string;

	/**
	 * Runtime guard for incoming request payload.
	 *
	 * Implementations should validate command-specific fields in addition to
	 * `schemaVersion` and `revision`.
	 */
	protected abstract isValidRequestPayload(value: unknown): value is TRequest;

	/**
	 * Returns default authoritative state used for first-time persistence.
	 */
	protected abstract defaultAuthoritativeState(): TAuthoritative;

	/**
	 * Normalizes potentially partial authoritative state loaded from persistence.
	 */
	protected abstract ensureAuthoritativeState(value?: Partial<TAuthoritative>): TAuthoritative;

	/**
	 * Builds accepted response and performs accepted-path side effects.
	 */
	protected abstract buildAcceptedResponse(
		context: CommandAcceptedContext<TRequest, TAuthoritative>
	): TResponse;

	/**
	 * Builds rejection response payload for protocol-level rejections.
	 */
	protected abstract buildRejectedResponse(
		context: CommandRejectedContext<TRequest, TAuthoritative>
	): TResponse;

	/**
	 * Builds rejection response payload for payload-shape validation failures.
	 *
	 * `rawArgs` is untrusted and may have any shape.
	 */
	protected abstract buildInvalidPayloadResponse(
		context: CommandInvalidPayloadContext<TAuthoritative>
	): TResponse;

	/**
	 * Ensures protocol object always has required fields.
	 */
	private ensureProtocolState(value: Partial<ServerProtocolState> | undefined): ServerProtocolState {
		return {
			lastClientRevision: value?.lastClientRevision ?? 0,
			lastSchemaVersion: value?.lastSchemaVersion ?? this.schemaVersion
		};
	}

	/**
	 * Applies protocol guard rails and advances protocol state on acceptance.
	 */
	private validateAndAdvanceProtocol(
		command: string,
		payload: SyncProtocolPayload,
		protocol: ServerProtocolState,
		username: string
	): CommandValidationResult {
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