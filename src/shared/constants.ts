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
 * Network command names shared between client and server.
 *
 * Client -> Server: `SyncDesiredPlushies`
 * Server -> Client: `SyncAppliedPlushies`
 */
export enum NetworkCommands {
    /**
     * Sent by the client to request a specific set of plushie effects be
     * applied authoritatively. The server validates, reconciles, and applies.
     */
    SyncDesiredPlushies = "SyncDesiredPlushies",
    /**
     * Sent by the server back to the requesting client confirming which
     * plushie effects were applied or rejected.
     */
    SyncAppliedPlushies = "SyncAppliedPlushies",
};