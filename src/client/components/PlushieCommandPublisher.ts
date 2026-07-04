/* @noSelfInFile */
import type { SyncAppliedPlushiesPayload } from "@types";
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { NETWORK_MODULE, NetworkRequestCommands } from "@constants";
import { CommandPublisher } from "@client/components/CommandPublisher";


export class PlushieCommandPublisher extends CommandPublisher {
	/** Names of plushies confirmed as active during the last acknowledged sync. */
	private lastKnownNames: ReadonlySet<string> = new Set();

    constructor(player: IsoPlayer) {
        super(
			player,
			NETWORK_MODULE,
			NetworkRequestCommands.SYNC_DESIRED_PLUSHIES
		);
    }
    
	protected onCommandReceived(args: unknown): void {
        const payload = args as unknown as SyncAppliedPlushiesPayload;
		const { appliedNames = [], rejectedNames = [] } = payload;

		if (rejectedNames.length > 0) {
			print(`[Naninhas][Client] SyncAppliedPlushies: rejected names: ${rejectedNames.join(", ")}`);
		}

		// Only applied names are authoritative active plushies.
		// Rejected names represent desired items the server did not apply.
		const replyNames = new Set(appliedNames);
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
	}
	
	/** Returns true if `names` differs from `lastKnownNames`. */
	private hasChanged(names: Set<string>): boolean {
		if (names.size !== this.lastKnownNames.size) return true;

		for (const name of names) {
			if (!this.lastKnownNames.has(name)) return true;
		}

		return false;
	}
}
