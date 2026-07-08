import { IsoPlayer, sendServerCommand } from "@asledgehammer/pipewrench";
import { PROTOCOL_SCHEMA_VERSION } from "@constants";
import { ModData } from "@shared/components/ModData";
import { CommandPayload, NetworkCommand, ServerModData } from "@types";

/**
 * Generic server-side command pipeline for request/response multiplayer flows.
 *
 * It centralizes module/command filtering, revision freshness tracking,
 * persisted authoritative state bootstrapping, and response envelope shaping.
 * Concrete handlers only need to supply their authoritative state type and
 * implement the domain-specific request handling.
 *
 * @typeParam TAuthoritative Persisted authoritative state for this command flow.
 * @typeParam TRequestPayload Inner `data` payload received from the client.
 * @typeParam TResponsePayload Inner `data` payload sent back to the client.
 */
export abstract class CommandHandler<TAuthoritative, TRequestPayload, TResponsePayload> {
    /**
     * @param module Mod namespace used by Project Zomboid command dispatch.
     * @param command Request and response command names for this flow.
     * @param defaultData Seed authoritative state used when modData is missing.
     */
    constructor(
        private readonly module: string,
        private readonly command: NetworkCommand,
        private readonly defaultData: TAuthoritative
    ) { }

    /**
     * Loads the server-side modData for a player and ensures it is fully shaped.
     *
     * @param player Player whose persisted state should be loaded.
     * @returns Normalized modData containing protocol bookkeeping and authoritative state.
     */
    protected getModData(player: IsoPlayer): ServerModData<TAuthoritative> {
        return new ModData<ServerModData<TAuthoritative>>({
            object: player,
            modKey: this.module,
            defaultData: {
                protocol: { lastClientRevision: 0, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
                authoritative: this.defaultData
            },
            ensure: this.ensureServerModData.bind(this)
        }).data;
    }

    /**
     * Entry point invoked from the global `OnClientCommand` listener.
     *
     * It ignores unrelated commands, accepts reconnect resets when revision
     * returns to `1`, rejects stale revisions, and forwards fresh requests to
     * the concrete handler implementation.
     *
     * @param props Raw command dispatch data received from Project Zomboid.
     */
    public handler(props: {
        module: string;
        command: string;
        player: IsoPlayer;
        args: unknown;
    }) {
        const { module, command, player, args } = props;


        // Ignore commands that don't match the expected module and command
        if (module !== this.module || command !== this.command.REQUEST) return;

        // payload is the deserialized data sent by the client via `sendClientCommand`
        const payload = args as CommandPayload<TRequestPayload>;
        
        const { protocol } = this.getModData(player);

        if(payload.revision === 1 && protocol.lastClientRevision > 0) {
            protocol.lastClientRevision = 0;
        }
        
        if(payload.revision <= protocol.lastClientRevision) {
            print(`[${this.module}][Server][${this.command.REQUEST}] Ignoring stale or out-of-order request from player ${player.getUsername()}`);
            this.onStaleCommand(player, payload);
            return;
        }

        protocol.lastClientRevision = payload.revision;
        protocol.lastSchemaVersion = PROTOCOL_SCHEMA_VERSION;

        this.onCommand(player, payload);
    }

	/**
	 * Normalizes persisted modData into the expected protocol + authoritative shape.
	 *
	 * @param data Partially populated persisted modData.
	 * @returns A fully initialized modData object for this handler.
	 */
    private ensureServerModData(data: Partial<ServerModData<unknown>>): ServerModData<TAuthoritative> {
        const lastSchemaVersion = data.protocol?.lastSchemaVersion ?? 0;
        return {
            protocol: {
                lastClientRevision: data.protocol?.lastClientRevision ?? 0,
                lastSchemaVersion
            },
            authoritative: this.migrateAuthoritativeData(lastSchemaVersion, data.authoritative) ?? this.defaultData
        }
    }

    /**
     * Migrates persisted authoritative state to the current runtime shape.
     *
     * Override this when a handler needs to reshape older persisted data.
     *
     * @param _persistedVersion Schema version found in persisted protocol data.
     * @param authoritativeData Persisted authoritative payload from modData.
     * @returns Normalized authoritative state for the current runtime.
     */
    protected migrateAuthoritativeData(_persistedVersion: number, authoritativeData: unknown): TAuthoritative {
        // Default implementation does nothing with the data, subclasses should override this to perform migrations as needed.
        return authoritativeData as TAuthoritative;
    }

    /**
     * Sends the standard response envelope for this command flow.
     *
     * The response always echoes the originating schema version and revision so
     * clients can correlate replies with their outstanding request.
     *
     * @param player Target player who should receive the server command.
     * @param payload Original request envelope.
     * @param data Domain-specific response payload.
     */
    protected sendResponse(player: IsoPlayer, payload: CommandPayload<TRequestPayload>, data: TResponsePayload): void {
        sendServerCommand(player, this.module, this.command.RESPONSE, {
            schemaVersion: payload.schemaVersion,
            revision: payload.revision,
            data
        });
    }

    /**
     * Handles stale or out-of-order commands.
     *
     * Subclasses can override this to emit an explicit rejection reply instead
     * of silently ignoring stale requests.
     *
     * @param _player Player who sent the stale request.
     * @param _payload Rejected request envelope.
     */
    protected onStaleCommand(_player: IsoPlayer, _payload: CommandPayload<TRequestPayload>): void {
        // Default behavior is to ignore stale commands without a reply.
    }

    /**
     * Applies the domain-specific behavior for a fresh request.
     *
     * @param player Player who sent the request.
     * @param payload Request envelope already validated for freshness.
     */
    protected abstract onCommand(player: IsoPlayer, payload: CommandPayload<TRequestPayload>): void;
}