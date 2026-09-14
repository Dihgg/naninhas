/* @noSelfInFile */
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { Commands } from "@constants";
import type {
	BedType,
	CommandPayload,
	SyncSleepBuffAppliedPayload,
	SyncSleepBuffRequestPayload
} from "@types";
import { CommandPublisher } from "@client/components/CommandPublisher";
import { Logger } from "@shared/components/Logger";

/**
 * Publishes wake-time temporary sleep buff requests to the authoritative server.
 */
export class SleepBuffRequestPublisher extends CommandPublisher<
	SyncSleepBuffRequestPayload,
	SyncSleepBuffAppliedPayload
> {
	private logger = new Logger("SleepBuff");
	constructor(player: IsoPlayer) {
		super(player, Commands.SYNC_SLEEP_BUFF);
	}

	/** Sends a wake-time candidate payload to the server. */
	send(candidateNames: string[], bedType: BedType): void {
		this.logger.log(
			["Client", "Network"],
			`Sending wake request; bedType=${bedType}; candidates=${Logger.formatList(candidateNames)}`
		);
		this.sendRequest({
			candidateNames,
			bedType
		});
	}

	protected onReply(payload: CommandPayload<SyncSleepBuffAppliedPayload>): void {
		const data = payload.data;
		this.logger.log(
			["Client", "Network"],
			`Server response; applied=${data.appliedName ?? "none"}; duration=${data.durationHours ?? "none"}; expiresAt=${data.expiresAtWorldAgeHours ?? "none"}; rejected=${Logger.formatList(data.rejectedNames)}`
		);
	}
}
