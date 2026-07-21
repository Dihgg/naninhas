/* @noSelfInFile */
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { Commands } from "@constants";
import type { BedType, CommandPayload, SyncSleepBuffAppliedPayload, SyncSleepBuffRequestPayload } from "@types";
import { CommandPublisher } from "@client/components/CommandPublisher";

/**
 * Publishes wake-time temporary sleep buff requests to the authoritative server.
 */
export class SleepBuffRequestPublisher extends CommandPublisher<SyncSleepBuffRequestPayload, SyncSleepBuffAppliedPayload> {

	constructor(player: IsoPlayer) {
		super(player, Commands.SYNC_SLEEP_BUFF);
	}

	/** Sends a wake-time candidate payload to the server. */
	send(candidateNames: string[], bedType: BedType): void {
		this.sendRequest({
			candidateNames,
			bedType
		});
	}

	protected onReply(payload: CommandPayload<SyncSleepBuffAppliedPayload>): void {
		if (payload.data.rejectedNames.length > 0) {
			print(`[Naninhas] ${Commands.SYNC_SLEEP_BUFF.RESPONSE}: rejected names: ${payload.data.rejectedNames.join(", ")}`);
		}
	}
}
