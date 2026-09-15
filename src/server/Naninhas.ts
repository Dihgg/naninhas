/* @noSelfInFile */
import { getOnlinePlayers } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { NaninhasCommandHandler } from "@server/components/NaninhasCommandHandler";
import { SleepBuffCommandHandler } from "@server/components/SleepBuffCommandHandler";
import { NETWORK_MODULE } from "@constants";

/**
 * Server-side entry point for the Naninhas mod.
 *
 * Registers the OnClientCommand listener for SyncPlushie commands
 * sent by clients during multiplayer sessions.
 */
const handler = new NaninhasCommandHandler();

/**
 * Server-side entry point for the SleepBuff mod.
 *
 * Registers the OnClientCommand listener for SleepBuff commands
 * sent by clients during multiplayer sessions.
 */
const sleepBuffHandler = new SleepBuffCommandHandler();

Events.onClientCommand.addListener((module, command, player, args) => {
	if (module === NETWORK_MODULE) {
		handler.handler({ module, command, player, args });
		sleepBuffHandler.handler({ module, command, player, args });
	}
});

Events.everyOneMinute.addListener(() => {
	const players = getOnlinePlayers();
	for (let index = 0; index < players.size(); index++) {
		handler.expireTemporaryBuff(players.get(index));
	}
});
