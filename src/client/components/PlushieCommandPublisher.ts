/* @noSelfInFile */
import type { SyncAppliedPlushiesPayload } from "@types";
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { NETWORK_MODULE, NetworkCommands } from "@constants";
import { isKnownPlushie } from "@shared/catalog/PlushieCatalog";
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
			NetworkCommands.SYNC_APPLIED_PLUSHIES
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

	override send(): void {
		const currentNames = this.getAttachedPlushieNames();

		if (!this.hasChanged(currentNames)) return;

		super.send({
			desiredNames: [...currentNames]
		});
	}

	/**
	 * Filters all attached item names down to those that are known plushies.
	 */
	getAttachedPlushieNames(): Set<string> {
		const result = new Set<string>();

		for (const name of this.playerApi.getAttachedItemNames()) {
			if (isKnownPlushie(name)) {
				result.add(name);
			}
		}

		return result;
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
