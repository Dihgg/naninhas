/* @noSelfInFile */
import { sendClientCommand } from "@asledgehammer/pipewrench";
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { NETWORK_MODULE, PROTOCOL_SCHEMA_VERSION } from "@constants";
import type { CommandPayload, NetworkCommand } from "@types";

/**
 * Shared request/response transport scaffolding for client publishers.
 */
export abstract class CommandPublisher<TRequest, TResponse> {
	private revision = 0;

	protected constructor(
		private readonly player: IsoPlayer,
		private readonly command: NetworkCommand
	) {
		this.registerReplyListener();
	}

	/** Sends a typed request payload and auto-increments revision. */
	protected sendRequest(data: TRequest): void {
		this.revision++;
		const payload: CommandPayload<TRequest> = {
			schemaVersion: PROTOCOL_SCHEMA_VERSION,
			revision: this.revision,
			data
		};
		sendClientCommand(this.player, NETWORK_MODULE, this.command.REQUEST, payload);
	}

	/** Handles a validated response envelope for this publisher's command. */
	protected abstract onReply(payload: CommandPayload<TResponse>): void;

	private registerReplyListener(): void {
		Events.onServerCommand.addListener((module, command, args) => {
			if (module !== NETWORK_MODULE || command !== this.command.RESPONSE) {
				return;
			}

			const payload = args as unknown as CommandPayload<TResponse>;
			if (payload.schemaVersion !== PROTOCOL_SCHEMA_VERSION) {
				return;
			}

			this.onReply(payload);
		});
	}
}
