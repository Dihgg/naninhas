export enum PlushieNames {
    BORISBADGER = "BorisBadger",
    DOLL = "Doll",
    FLAMINGO = "Flamingo",
    FLUFFYFOOTBUNNY = "FluffyfootBunny",
    FREDDYFOX = "FreddyFox",
    FURBERTSQUIRREL = "FurbertSquirrel",
    GROGUAZ = "GroguAZ",
    JACQUESBEAVER = "JacquesBeaver",
    MOLEYMOLE = "MoleyMole",
    OTISPUG = "OtisPug",
    PANCAKEHEDGEHOG = "PancakeHedgehog",
    SPIFFO = "Spiffo",
    SPIFFOBLUEBERRY = "SpiffoBlueberry",
    SPIFFOCHERRY = "SpiffoCherry",
    SPIFFOGREY = "SpiffoGrey",
    SPIFFOHEART = "SpiffoHeart",
    SPIFFOPLUSHIERAINBOW = "SpiffoPlushieRainbow",
    SPIFFOSANTA = "SpiffoSanta",
    SPIFFOSHAMROCK = "SpiffoShamrock",
    SUBSTITUTIONDOLL = "SubstitutionDoll",
    TOYBEAR = "ToyBear",
    TOYBEARSMALL = "ToyBearSmall",
};

export enum EventsEnum {
    /** Event fired when a plushie is equipped. */
    Equipped = "NaninhasEquipped",
    /** Event fired when a plushie is unequipped. */
    Unequipped = "NaninhasUnequipped",
    /** Event fired when the player updates */
    Update = "NaninhasUpdate"
};

/**
 * PZ networking module name used as the first argument of
 * `sendClientCommand` / `sendServerCommand` / `OnClientCommand` / `OnServerCommand`.
 */
export const NETWORK_MODULE = "Naninhas";

/**
 * Current schema version for the Naninhas network protocol.
 *
 * Increment this when the payload shape of any command changes in a
 * backward-incompatible way. Handlers that receive an unknown schemaVersion
 * must drop the message safely without crashing or corrupting state.
 */
export const PROTOCOL_SCHEMA_VERSION = 1;

/**
 * Network command names used for client-server communication.
 *
 * Client -> Server: `SyncDesiredPlushies`
 */
export enum NetworkRequestCommands {
    SYNC_DESIRED_PLUSHIES = "SyncDesiredPlushies",
}

/**
 * Network command names used for server-client communication.
 *
 * Server -> Client: `SyncAppliedPlushies`
 */
export enum NetworkResponseCommands {
    SYNC_APPLIED_PLUSHIES = "SyncAppliedPlushies",
}

/**
 * Returns response command name for a given request command.
 * @param requestCommand Incoming request command name.
 * @returns Response command name used by `sendServerCommand`.
 */
export const getResponseCommand = (command: string): NetworkResponseCommands | string => {
    switch (command) {
        case NetworkRequestCommands.SYNC_DESIRED_PLUSHIES:
            return NetworkResponseCommands.SYNC_APPLIED_PLUSHIES;
        default:
            return command;
    }
}