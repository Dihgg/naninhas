/* @noSelfInFile */
import { isKnownPlushie } from "@shared/catalog/PlushieCatalog";
import { PlayerApi } from "@shared/components/PlayerApi";
import { Logger } from "@shared/components/Logger";

import { extractItemName } from "@shared/utils/ItemType";
import type { BedType, Square } from "@types";
import type { IsoPlayer, InventoryItem } from "@asledgehammer/pipewrench";
import { SleepBuffRequestPublisher } from "@client/components/SleepBuffRequestPublisher";

/**
 * Detects sleep->wake transitions and publishes wake-time plushie candidates.
 */
export class SleepBuffDetector {
	private static readonly SCAN_RADIUS = 6;
	private readonly playerApi: PlayerApi;
	private readonly publisher: SleepBuffRequestPublisher;
	private logger = new Logger("SleepBuff");
	private wasAsleep = false;

	/**
	 * Creates a detector for one local player's sleep transitions.
	 *
	 * @param player Player whose wake events and surroundings should be scanned.
	 */
	constructor(player: IsoPlayer) {
		this.playerApi = new PlayerApi(player);
		this.publisher = new SleepBuffRequestPublisher(player);
	}

	/** Should run periodically to detect wake transitions. */
	tick(): void {
		const asleep = this.playerApi.isAsleep();
		if (!this.wasAsleep && asleep) {
			this.debug("Sleep started; waiting for wake transition");
		}
		if (this.wasAsleep && !asleep) {
			this.debug("Wake detected; inspecting sleep context");
			this.onWake();
		}
		this.wasAsleep = asleep;
	}

	/** Scans the wake location and publishes all eligible plushie candidates. */
	private onWake(): void {
		// Explicit v1 decision: no vehicle sleep support.
		if (this.playerApi.getVehicle() !== null) {
			this.debug("Skipping candidate scan because vehicle sleep is not supported");
			return;
		}

		const bedType = this.playerApi.getBedType();
		this.debug(`Resolved bed type: ${bedType}`);
		const candidates = this.collectCandidateNames();
		if (candidates.length === 0) {
			this.debug(
				"Scan complete; no eligible naninhas found, sending empty wake request to clear any previous buff"
			);
		} else {
			this.debug(`Scan complete; sending candidates: ${candidates.join(", ")}`);
		}

		this.publisher.send(candidates, bedType);
	}

	/**
	 * Collects unique plushie names from the bed container and nearby squares.
	 *
	 * @returns Candidate item names for server-side validation and selection.
	 */
	private collectCandidateNames(): string[] {
		const found = new Set<string>();
		const bed = this.playerApi.getBed();
		this.debug(bed === null ? "No bed object found; scanning player square" : "Bed object found");

		const bedContainer = bed?.getContainer?.();
		if (bedContainer !== null && bedContainer !== undefined) {
			const items = bedContainer.getItems();
			this.debug(`Scanning bed container (${items.size()} items)`);
			this.addFromContainerItems(found, items, "bed container");
		} else {
			this.debug("Bed container not found");
		}

		const playerSquare = this.playerApi.getSquare();
		if (playerSquare === null || playerSquare === undefined) {
			this.debug("Player square not found; radius scan cannot run");
			return [...found];
		}

		this.addFromNearbySquares(found, playerSquare);

		return [...found];
	}

	/**
	 * Adds plushies found on loaded squares within the scan radius and eligible room.
	 *
	 * @param found Set receiving unique candidate names.
	 * @param center Square used as the scan origin and room boundary.
	 */
	private addFromNearbySquares(
		found: Set<string>,
		center: ReturnType<PlayerApi["getSquare"]>
	): void {
		const radius = SleepBuffDetector.SCAN_RADIUS;
		const centerX = center.getX();
		const centerY = center.getY();
		const centerZ = center.getZ();
		const centerRoom = center.getRoom();
		const restrictToRoom = centerRoom !== null && centerRoom !== undefined;
		const roomName = restrictToRoom ? centerRoom.getName() : "none";
		const cell = this.playerApi.getCell();
		let scannedSquares = 0;
		let outsideRoomSquares = 0;
		let unavailableSquares = 0;

		this.debug(
			`Starting radius scan; center=(${centerX},${centerY},${centerZ}); radius=${radius}; room=${roomName}; sameRoomOnly=${restrictToRoom}`
		);

		for (let dx = -radius; dx <= radius; dx++) {
			for (let dy = -radius; dy <= radius; dy++) {
				if (!SleepBuffDetector.isOffsetWithinRadius(dx, dy, radius)) {
					continue;
				}

				const x = centerX + dx;
				const y = centerY + dy;
				const square = cell.getGridSquare(x, y, centerZ);
				if (square === null || square === undefined) {
					unavailableSquares++;
					continue;
				}

				if (!SleepBuffDetector.isRoomEligible(centerRoom, square.getRoom())) {
					outsideRoomSquares++;
					continue;
				}

				scannedSquares++;
				const source = `radius square (${x},${y},${centerZ}), distanceSquared=${dx * dx + dy * dy}`;
				this.addFromSquareWorldObjects(found, square, source);
			}
		}

		this.debug(
			`Radius scan complete; scanned=${scannedSquares}; outsideRoom=${outsideRoomSquares}; unavailable=${unavailableSquares}; uniqueNaninhas=${found.size}`
		);
	}

	/** Adds plushie names from every inventory item in a container list. */
	private addFromContainerItems(
		found: Set<string>,
		items: { size: () => number; get: (index: number) => InventoryItem },
		source: string
	): void {
		for (let i = 0; i < items.size(); i++) {
			const item = items.get(i);
			this.addItemName(found, item, source);
		}
	}

	/** Adds plushie names from inventory-item world objects on a square. */
	private addFromSquareWorldObjects(found: Set<string>, square: Square, source: string): void {
		const worldObjects = square.getWorldObjects();
		if (worldObjects.size() > 0) {
			this.debug(`${source} contains ${worldObjects.size()} world objects`);
		}
		for (let i = 0; i < worldObjects.size(); i++) {
			const item = worldObjects.get(i).getItem();
			if (item) {
				this.addItemName(found, item, source);
			}
		}
	}

	/** Adds an item's extracted name when it belongs to the known plushie catalog. */
	private addItemName(found: Set<string>, item: InventoryItem, source: string): void {
		const fullType = item.getFullType();
		const name = extractItemName(fullType);
		if (!isKnownPlushie(name)) {
			this.debug(`Ignoring non-naninha item from ${source}: ${fullType}`);
			return;
		}

		this.debug(`Found naninha in ${source}: ${name}${found.has(name) ? " (duplicate)" : ""}`);
		found.add(name);
	}

	/** Emits a client scan diagnostic through the debug-only logger. */
	private debug(message: string): void {
		this.logger.debug(message, ["Client", "Detector"]);
	}

	/** Circular distance rule used by the wake-time scan. */
	public static isOffsetWithinRadius(dx: number, dy: number, radius: number): boolean {
		return dx * dx + dy * dy <= radius * radius;
	}

	/** Restricts indoor scans to the player's room and permits all rooms outdoors. */
	public static isRoomEligible(centerRoom: unknown, candidateRoom: unknown): boolean {
		return centerRoom === null || centerRoom === undefined || candidateRoom === centerRoom;
	}

	/** Used by tests. */
	public static normalizeBedTypeForPayload(bedType: BedType): BedType {
		return bedType;
	}
}
