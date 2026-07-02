/* @noSelfInFile */
import type { SyncAppliedPlushiesPayload } from "@types";
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { NETWORK_MODULE, NetworkRequestCommands } from "@constants";
import { PlayerApi } from "@shared/components/PlayerApi";
import { CommandPublisher } from "@client/components/CommandPublisher";


export class PlushieCommandPublisher extends CommandPublisher {
	private readonly playerApi: PlayerApi;

	/** Names of plushies confirmed as active during the last acknowledged sync. */
	private lastKnownNames: ReadonlySet<string> = new Set();

    constructor(player: IsoPlayer) {
        super(
			player,
			NETWORK_MODULE,
			NetworkRequestCommands.SYNC_DESIRED_PLUSHIES
		);
		this.playerApi = new PlayerApi(player);
    }
    
	protected onCommandReceived(args: unknown): void {
        const payload = args as unknown as SyncAppliedPlushiesPayload;
		if (payload.rejectedNames.length > 0) {
				print(`[Naninhas] SyncAppliedPlushies: rejected names: ${payload.rejectedNames.join(", ")}`);
			}

			// Update our reference. If a corrective send already updated
			// lastKnownNames ahead of this reply, the reply may contain a
			// stale set — leave it as-is so the next tick re-evaluates correctly.
			const replyNames = new Set([...payload.appliedNames, ...payload.rejectedNames]);
			if (!this.hasChanged(replyNames)) {
				// Reply matches our current expectation — nothing to do
				return;
			}
			this.lastKnownNames = replyNames;
    }

	public sendIfChanged(attachedSet: Set<string>): void {

		if (!this.hasChanged(attachedSet)) return;

		super.send({
			desiredNames: [...attachedSet]
		});

		this.lastKnownNames = attachedSet;
	}
	
	/** Returns true if `names` differs from `lastKnownNames`. */
	private hasChanged(names: Set<string>): boolean {
		if (names.size !== this.lastKnownNames.size) {
			return true;
		}

		for (const name of names) {
			if (!this.lastKnownNames.has(name)) {
				return true;
			}
		}

		return false;
	}
}
