/* @noSelfInFile */
import * as Events from "@asledgehammer/pipewrench-events";
import { NaninhasCommandHandler } from "@server/components/NaninhasCommandHandler";

/**
 * Server-side entry point for the Naninhas mod.
 *
 * Registers the OnClientCommand listener and delegates routing to
 * command handlers.
 */
const handler = new NaninhasCommandHandler();

Events.onClientCommand.addListener((module, command, player, args) => {
	handler.handle(module, command, player, args);
});
