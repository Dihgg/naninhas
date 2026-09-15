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

	/**
	 * Creates a wake-time request publisher for a local player.
	 *
	 * @param player Local player whose sleep context is being reported.
	 */
	constructor(player: IsoPlayer) {
		super(player, Commands.SYNC_SLEEP_BUFF);
	}

	/** Sends a wake-time candidate payload to the server. */
	send(candidateNames: string[], bedType: BedType): void {
		this.logger.debug(
			`Sending wake request; bedType=${bedType}; candidates=${Logger.formatList(candidateNames)}`,
			["Client", "Network"]
		);
		this.sendRequest({
			candidateNames,
			bedType
		});
	}

	/**
	 * Logs the authoritative result returned for a wake-time request.
	 *
	 * @param payload Server response describing the applied or rejected buff.
	 */
	protected onReply(payload: CommandPayload<SyncSleepBuffAppliedPayload>): void {
		const data = payload.data;
		this.logger.debug(
			`Server response; applied=${data.appliedName ?? "none"}; duration=${data.durationHours ?? "none"}; expiresAt=${data.expiresAtWorldAgeHours ?? "none"}; rejected=${Logger.formatList(data.rejectedNames)}`,
			["Client", "Network"]
		);
	}
}
