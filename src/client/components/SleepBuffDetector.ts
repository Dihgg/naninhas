/* @noSelfInFile */
import { isKnownPlushie } from "@shared/catalog/PlushieCatalog";
import { PlayerApi } from "@shared/components/PlayerApi";
import { extractItemName } from "@shared/utils/ItemType";
import type { BedType } from "@types";
import type { IsoPlayer, InventoryItem } from "@asledgehammer/pipewrench";
import { SleepBuffRequestPublisher } from "@client/components/SleepBuffRequestPublisher";

/**
 * Detects sleep->wake transitions and publishes wake-time plushie candidates.
 */
export class SleepBuffDetector {
	private readonly playerApi: PlayerApi;
	private readonly publisher: SleepBuffRequestPublisher;
	private wasAsleep = false;

	constructor(player: IsoPlayer) {
		this.playerApi = new PlayerApi(player);
		this.publisher = new SleepBuffRequestPublisher(player);
	}

	/** Should run periodically to detect wake transitions. */
	tick(): void {
		const asleep = this.playerApi.isAsleep();
		if (this.wasAsleep && !asleep) {
			this.onWake();
		}
		this.wasAsleep = asleep;
	}

	private onWake(): void {
		// Explicit v1 decision: no vehicle sleep support.
		if (this.playerApi.player.getVehicle()) {
			return;
		}

		const bedType = this.playerApi.getBedType();
		const candidates = this.collectCandidateNames();
		if (candidates.length === 0) {
			return;
		}

		this.publisher.send(candidates, bedType);
	}

	private collectCandidateNames(): string[] {
		const found = new Set<string>();
		const bed = this.playerApi.getBed();

		if (bed?.getContainer?.()) {
			this.addFromContainerItems(found, bed.getContainer().getItems());
		}

		const bedSquare = bed?.getSquare?.();
		if (bedSquare) {
			this.addFromSquareWorldObjects(found, bedSquare);
		}

		const playerSquare = this.playerApi.player.getSquare();
		if (playerSquare && playerSquare !== bedSquare) {
			this.addFromSquareWorldObjects(found, playerSquare);
		}

		return [...found];
	}

	private addFromContainerItems(found: Set<string>, items: { size: () => number; get: (index: number) => InventoryItem }): void {
		for (let i = 0; i < items.size(); i++) {
			const item = items.get(i);
			this.addItemName(found, item);
		}
	}

	private addFromSquareWorldObjects(
		found: Set<string>,
		square: { getWorldObjects: () => { size: () => number; get: (index: number) => { getItem: () => InventoryItem | undefined } } }
	): void {
		const worldObjects = square.getWorldObjects();
		for (let i = 0; i < worldObjects.size(); i++) {
			const item = worldObjects.get(i).getItem();
			if (item) {
				this.addItemName(found, item);
			}
		}
	}

	private addItemName(found: Set<string>, item: InventoryItem): void {
		const name = extractItemName(item.getFullType());
		if (!isKnownPlushie(name)) {
			return;
		}

		found.add(name);
	}

	/** Used by tests. */
	public static normalizeBedTypeForPayload(bedType: BedType): BedType {
		return bedType;
	}
}
