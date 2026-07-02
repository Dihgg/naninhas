import { IsoPlayer } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { getResponseCommand, PROTOCOL_SCHEMA_VERSION } from "@constants";
import { sendClientCommand } from "@asledgehammer/pipewrench";
import { SyncProtocolPayload } from "@types";
/**
 * This class should be used to publish commands to the server.
 * This should control revision numbers
 * this should handler the server command listener
 */
export abstract class CommandPublisher {
    protected revistion = 0;
    constructor(
        private readonly player: IsoPlayer,
        private readonly module: string,
        private readonly command: string,
        private readonly schemaVersion = PROTOCOL_SCHEMA_VERSION
    ) {
        this.registerListener();
    }

    /** Registers a listener for server commands. */
    private registerListener() {
        Events.onServerCommand.addListener((module, command, args) => {
            if (module !== this.module || command !== getResponseCommand(this.command)) return;

            this.onCommandReceived(args);
        });
    }

    /** Handles a command received from the server.
     * @param args The arguments received from the server.
     * @abstract
     */
    protected abstract onCommandReceived(args: unknown): void;

    /** Sends a command to the server with the provided arguments.
     * The arguments will be merged with the protocol envelope containing the schema version and revision number.
     * @param args The arguments to send to the server. This will be merged with the protocol envelope.
     */
    protected send<T>(args: T) {
        this.revistion++;
        const payload: T & SyncProtocolPayload = {
            ...args,
            schemaVersion: this.schemaVersion,
            revision: this.revistion,
        }
        sendClientCommand(this.player, this.module, this.command, payload);
    }
}