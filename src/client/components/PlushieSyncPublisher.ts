/* @noSelfInFile */
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { Commands } from "@constants";
import type { CommandPayload, SyncAppliedPlushiesPayload, SyncDesiredPlushiesPayload } from "@types";
import { isKnownPlushie } from "@shared/catalog/PlushieCatalog";
import { PlayerApi } from "@shared/components/PlayerApi";
import { CommandPublisher } from "@client/components/CommandPublisher";

/**
 * Client-side publisher responsible for detecting plushie attachment changes
 * and notifying the server authoritatively.
 *
 * On each tick it compares the current attached plushie set against the
 * previously known set. When a change is detected it sends a
 * `SyncPlushie.Request` command to the server and waits for the
 * `SyncPlushie.Response` reply before updating the known set.
 *
 * A monotonically increasing revision counter is used so the server can
 * safely drop stale / out-of-order requests.
 */
export class PlushieSyncPublisher extends CommandPublisher<SyncDesiredPlushiesPayload, SyncAppliedPlushiesPayload> {
	private readonly playerApi: PlayerApi;

	/** Names of plushies confirmed as active during the last acknowledged sync. */
	private lastKnownNames: ReadonlySet<string> = new Set();

	/**
	 * @param player Local player whose attached plushies should be synchronized.
	 */
	constructor(player: IsoPlayer) {
		super(player, Commands.SYNC_PLUSHIE);
		this.playerApi = new PlayerApi(player);
	}

	/**
	 * Should be called on each game tick (e.g. `everyOneMinute`).
	 * Compares current attached plushies against the last acknowledged set and
	 * sends a sync request to the server when a change is detected.
	 */
	tick(): void {
		const currentNames = this.getAttachedPlushieNames();

		if (!this.hasChanged(currentNames)) {
			return;
		}

		this.send(currentNames);
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

	/**
	 * Sends a `SyncPlushie.Request` command to the server with the current
	 * plushie set. The revision is incremented before sending so the server
	 * can reject stale replays.
	 *
	 * `lastKnownNames` is updated eagerly here so that a subsequent attachment
	 * change within the same reply window is still detected on the next tick,
	 * even if the server reply for this send has not yet arrived.
	 *
	 * @param names Current known-good set of attached plushies.
	 */
	private send(names: Set<string>): void {
		this.lastKnownNames = new Set(names);
		this.sendRequest({ desiredNames: [...names] });
	}

	/**
	 * Registers the `OnServerCommand` listener for `SyncPlushie.Response` replies.
	 * Updates `lastKnownNames` on a successful response so the next tick does
	 * not re-send needlessly.
	 */
	protected onReply(payload: CommandPayload<SyncAppliedPlushiesPayload>): void {
		if (payload.data.rejectedNames.length > 0) {
			print(`[Naninhas] ${Commands.SYNC_PLUSHIE.RESPONSE}: rejected names: ${payload.data.rejectedNames.join(", ")}`);
		}

		// Update our reference. If a corrective send already updated
		// lastKnownNames ahead of this reply, the reply may contain a
		// stale set — leave it as-is so the next tick re-evaluates correctly.
		const replyNames = new Set([...payload.data.appliedNames, ...payload.data.rejectedNames]);
		if (!this.hasChanged(replyNames)) {
			// Reply matches our current expectation — nothing to do
			return;
		}
		this.lastKnownNames = replyNames;
	}

	/**
	 * Returns whether `names` differs from the last acknowledged state.
	 *
	 * @param names Current local plushie set.
	 * @returns `true` when a sync request should be sent.
	 */
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
