/* @noSelfInFile */
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { getSearchMode, sendClientCommand } from "@asledgehammer/pipewrench";
import * as Events from "@asledgehammer/pipewrench-events";
import { NETWORK_MODULE, NetworkCommands, PROTOCOL_SCHEMA_VERSION } from "@constants";
import type { SyncAppliedPlushiesPayload, SyncDesiredPlushiesPayload } from "types";
import { getPlushieDefinition, isKnownPlushie } from "@shared/catalog/PlushieCatalog";
import { PlayerApi } from "@shared/components/PlayerApi";

/**
 * Client-side publisher responsible for detecting plushie attachment changes
 * and notifying the server authoritatively.
 *
 * On each tick it compares the current attached plushie set against the
 * previously known set. When a change is detected it sends a
 * `SyncDesiredPlushies` command to the server and waits for the
 * `SyncAppliedPlushies` reply before updating the known set.
 *
 * A monotonically increasing revision counter is used so the server can
 * safely drop stale / out-of-order requests.
 */
export class PlushieSyncPublisher {
	private readonly playerApi: PlayerApi;

	/** Names of plushies confirmed as active during the last acknowledged sync. */
	private lastKnownNames: ReadonlySet<string> = new Set();

	/** Monotonically increasing request counter. */
	private revision = 0;

	constructor(player: IsoPlayer) {
		this.playerApi = new PlayerApi(player);
		this.registerReplyListener();
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
	 * Sends a `SyncDesiredPlushies` command to the server with the current
	 * plushie set. The revision is incremented before sending so the server
	 * can reject stale replays.
	 *
	 * `lastKnownNames` is updated eagerly here so that a subsequent attachment
	 * change within the same reply window is still detected on the next tick,
	 * even if the server reply for this send has not yet arrived.
	 */
	private send(names: Set<string>): void {
		this.revision++;
		this.lastKnownNames = new Set(names);

		const payload: SyncDesiredPlushiesPayload = {
			schemaVersion: PROTOCOL_SCHEMA_VERSION,
			revision: this.revision,
			desiredNames: [...names]
		};

		sendClientCommand(this.playerApi.player, NETWORK_MODULE, NetworkCommands.SyncDesiredPlushies, payload);
	}

	/**
	 * Registers the `OnServerCommand` listener for `SyncAppliedPlushies` replies.
	 * Updates `lastKnownNames` on a successful (non-schema-mismatch) response so
	 * the next tick does not re-send needlessly.
	 */
	private registerReplyListener(): void {
		Events.onServerCommand.addListener((module, command, args) => {
			if (module !== NETWORK_MODULE || command !== NetworkCommands.SyncAppliedPlushies) {
				return;
			}

			const payload = args as unknown as SyncAppliedPlushiesPayload;

			if (payload.schemaVersion !== PROTOCOL_SCHEMA_VERSION) {
				print(`[Naninhas] SyncAppliedPlushies: schema mismatch `);
				print(`(expected ${PROTOCOL_SCHEMA_VERSION}, got ${payload.schemaVersion})`);
				return;
			}

			if (payload.rejectedNames.length > 0) {
				print(`[Naninhas] SyncAppliedPlushies: rejected names: ${payload.rejectedNames.join(", ")}`);
			}

			this.clearShortSightedBlurIfSuppressed(payload.appliedNames);

			// Update our reference. If a corrective send already updated
			// lastKnownNames ahead of this reply, the reply may contain a
			// stale set — leave it as-is so the next tick re-evaluates correctly.
			const replyNames = new Set([...payload.appliedNames, ...payload.rejectedNames]);
			if (!this.hasChanged(replyNames)) {
				// Reply matches our current expectation — nothing to do
				return;
			}
			this.lastKnownNames = replyNames;
		});
	}

	/**
	 * Clears the search-mode blur shader if a synced plushie suppresses
	 * ShortSighted and the trait is currently absent on the player.
	 */
	private clearShortSightedBlurIfSuppressed(appliedNames: readonly string[]): void {
		if (!this.hasSuppressionForTrait(appliedNames, "ShortSighted")) {
			return;
		}

		if (this.playerApi.hasTrait("ShortSighted")) {
			return;
		}

		if (typeof getSearchMode !== "function") {
			return;
		}

		const playerNum = this.playerApi.player.getPlayerNum();
		if (playerNum < 0) {
			return;
		}

		const searchMode = getSearchMode();
		const playerSearchMode = searchMode?.getSearchModeForPlayer(playerNum);
		const blur = playerSearchMode?.getBlur();

		if (!blur) {
			return;
		}

		// Keep both live and target blur at 0 to prevent stale short-sighted blur.
		blur.setExterior(0);
		blur.setInterior(0);
		blur.setTargets(0, 0);
		blur.equalise();
	}

	private hasSuppressionForTrait(appliedNames: readonly string[], traitId: string): boolean {
		for (const name of appliedNames) {
			const def = getPlushieDefinition(name);
			if (!def) {
				continue;
			}

			if (def.traitsToSuppress.includes(traitId)) {
				return true;
			}
		}

		return false;
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
