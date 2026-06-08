/* @noSelfInFile */
import * as Events from "@asledgehammer/pipewrench-events";
import { NaninhasCommandHandler } from "@server/components/NaninhasCommandHandler";
import { NETWORK_MODULE, NetworkCommands } from "@constants";

/**
 * Server-side entry point for the Naninhas mod.
 *
 * Registers the OnClientCommand listener for SyncDesiredPlushies commands
 * sent by clients during multiplayer sessions.
 */
const handler = new NaninhasCommandHandler();

Events.onClientCommand.addListener((module, command, player, args) => {
	if (module === NETWORK_MODULE && command === NetworkCommands.SyncDesiredPlushies) {
		handler.onSyncDesiredPlushies(player, args);
	}
});
