import { IsoPlayer, sendServerCommand } from "@asledgehammer/pipewrench";
import { PROTOCOL_SCHEMA_VERSION } from "@constants";
import { ModData } from "@shared/components/ModData";
import { CommandPayload, NetworkCommand, ServerModData } from "@types";

export abstract class CommandHandler<TAuthoritative, TPayload> {
    constructor(
        private readonly module: string,
        private readonly command: NetworkCommand,
        private readonly defaultData: TAuthoritative
    ) { }

    private getModData(player: IsoPlayer): ServerModData<TAuthoritative> {
        return new ModData<ServerModData<TAuthoritative>>({
            object: player,
            modKey: this.module,
            defaultData: {
                protocol: { lastClientRevision: 0, lastSchemaVersion: PROTOCOL_SCHEMA_VERSION },
                authoritative: this.defaultData
            },
            ensure: this.ensureServerModData
        }).data;
    }

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
        const payload = args as CommandPayload<TPayload>;
        
        // TODO: we need to validate the protocol and schema here, in a generic way
        const { protocol, authoritative } = this.getModData(player);

        if(payload.revision === 1 && protocol.lastClientRevision > 0) {
            protocol.lastClientRevision = 0;
        }
        
        if(payload.revision <= protocol.lastClientRevision) {
            // TODO: Ignore stale or out-of-order requests
            print(`[${this.module}][Server][${this.command.REQUEST}] Ignoring stale or out-of-order request from player ${player.getUsername()}`);
            return;
        }

        protocol.lastClientRevision = payload.revision;
        protocol.lastSchemaVersion = PROTOCOL_SCHEMA_VERSION;

        this.onCommand(player, payload);
    }

    private ensureServerModData(data: Partial<ServerModData<unknown>>): ServerModData<TAuthoritative> {
        const lastSchemaVersion = data.protocol?.lastSchemaVersion ?? 0;
        return {
            protocol: {
                lastClientRevision: data.protocol?.lastClientRevision ?? 0,
                lastSchemaVersion
            },
            authoritative: this.migrateAuthoritativerData(lastSchemaVersion, data.authoritative) ?? this.defaultData
        }
    }

    protected migrateAuthoritativerData(_persistedVersion: number, authoritativeData: unknown): TAuthoritative {
        // Default implementation does nothing with the data, subclasses should override this to perform migrations as needed.
        return authoritativeData as TAuthoritative;
    }

    protected onCommand(player: IsoPlayer, payload: CommandPayload<TPayload>) {
        sendServerCommand(player, this.module, this.command.RESPONSE, {
            schemaVersion: payload.schemaVersion,
            revision: payload.revision,
            ...payload.data
        });
    }
}