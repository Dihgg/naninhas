/* @noSelfInFile */
import type { IsoPlayer } from "@asledgehammer/pipewrench";
import { Commands, NETWORK_MODULE, PROTOCOL_SCHEMA_VERSION } from "@constants";
import type {
	BedType,
	CommandPayload,
	NaninhasAuthoritativeState,
	SyncSleepBuffAppliedPayload,
	SyncSleepBuffRequestPayload,
	TemporaryBuffState
} from "@types";
import { isKnownPlushie } from "@shared/catalog/PlushieCatalog";
import { PlayerApi } from "@shared/components/PlayerApi";
import { Logger } from "@shared/components/Logger";

import { AuthoritativeStateController } from "@server/components/AuthoritativeStateController";
import { CommandHandler } from "./CommandHandler";

/**
 * Server-side command handler for wake-time temporary sleep buffs.
 */
export class SleepBuffCommandHandler extends CommandHandler<
	NaninhasAuthoritativeState,
	SyncSleepBuffRequestPayload,
	SyncSleepBuffAppliedPayload
> {
	private logger = new Logger("SleepBuff");

	/** Configures the authoritative wake-time buff command flow. */
	constructor() {
		super(NETWORK_MODULE, Commands.SYNC_SLEEP_BUFF, {
			activePlushieNames: [],
			addedTraits: [],
			suppressedTraits: [],
			xpBoosts: {},
			temporaryBuff: { source: null }
		});
	}

	/**
	 * Validates wake-time candidates, selects a temporary buff, and persists the
	 * resulting authoritative player state.
	 *
	 * @param player Player who submitted the wake-time scan.
	 * @param payload Validated request containing nearby plushies and bed quality.
	 */
	protected onCommand(
		player: IsoPlayer,
		payload: CommandPayload<SyncSleepBuffRequestPayload>
	): void {
		const playerApi = new PlayerApi(player);
		const serverModData = this.getModData(playerApi.player);
		const { authoritative } = serverModData;
		const now = playerApi.getWorldAgeHours();
		const username = player.getUsername();
		this.logger.debug(
			`player=${username}; worldAge=${now}; requestedBedType=${payload.data.bedType}; candidates=${Logger.formatList(payload.data.candidateNames)}`,
			["Server", "Request"]
		);

		const attachedKnownNames = this.getKnownAttachedNames(playerApi);
		this.logger.debug(
			`player=${username}; attachedNaninhas=${Logger.formatList(attachedKnownNames)}`,
			["Server", "Validation"]
		);
		const currentTemporaryBuff = AuthoritativeStateController.sanitizeTemporaryBuff(
			authoritative.temporaryBuff,
			now
		);

		const rejectedNames: string[] = [];
		const validCandidatesSet = new Set<string>();

		for (const name of payload.data.candidateNames) {
			if (!isKnownPlushie(name)) {
				this.logger.debug(
					`player=${username}; rejected unknown candidate=${name}`,
					["Server", "Validation"]
				);
				rejectedNames.push(name);
				continue;
			}
			if (attachedKnownNames.includes(name)) {
				this.logger.debug(
					`player=${username}; rejected already-attached candidate=${name}`,
					["Server", "Validation"]
				);
				rejectedNames.push(name);
				continue;
			}
			validCandidatesSet.add(name);
		}

		const validCandidates = [...validCandidatesSet];
		const selectedName = this.selectRandom(validCandidates);
		const resolvedBedType = this.normalizeBedType(payload.data.bedType);
		const durationHours = this.getDurationForBedType(resolvedBedType);
		const emptyWakeScan = payload.data.candidateNames.length === 0;
		this.logger.debug(
			`player=${username}; validCandidates=${Logger.formatList(validCandidates)}; selected=${selectedName ?? "none"}; resolvedBedType=${resolvedBedType}; durationHours=${durationHours}`,
			["Server", "Selection"]
		);

		let nextTemporaryBuff: TemporaryBuffState = currentTemporaryBuff;
		if (emptyWakeScan) {
			nextTemporaryBuff = { source: null };
			this.logger.debug(
				`player=${username}; empty wake scan; clearing previous temporary buff=${currentTemporaryBuff.activeName ?? "none"}`,
				["Server", "Apply"]
			);
		} else if (selectedName) {
			nextTemporaryBuff = {
				activeName: selectedName,
				expiresAtWorldAgeHours: now + durationHours,
				source: "sleep"
			};
			this.logger.debug(
				`player=${username}; applying=${selectedName}; expiresAtWorldAge=${nextTemporaryBuff.expiresAtWorldAgeHours}`,
				["Server", "Apply"]
			);
		} else {
			this.logger.debug(
				`player=${username}; no valid selection; existing temporary buff remains=${currentTemporaryBuff.activeName ?? "none"}`,
				["Server", "Apply"]
			);
		}

		const desiredEffectiveNames = AuthoritativeStateController.buildEffectiveNames(
			attachedKnownNames,
			nextTemporaryBuff
		);
		serverModData.authoritative = AuthoritativeStateController.applyDesiredState(
			playerApi,
			authoritative,
			desiredEffectiveNames,
			attachedKnownNames,
			nextTemporaryBuff
		);
		this.logger.debug(
			`player=${username}; effectiveNaninhas=${Logger.formatList(desiredEffectiveNames)}; state persisted`,
			["Server", "Apply"]
		);

		const reply: SyncSleepBuffAppliedPayload = {
			appliedName: selectedName,
			rejectedNames,
			resolvedBedType,
			durationHours: selectedName ? durationHours : undefined,
			expiresAtWorldAgeHours: selectedName
				? nextTemporaryBuff.expiresAtWorldAgeHours
				: undefined
		};
		this.sendResponse(player, payload, reply);
	}

	/**
	 * Rejects every candidate in a stale or out-of-order wake-time request.
	 *
	 * @param player Player who submitted the stale request.
	 * @param payload Stale request envelope to echo in the response.
	 */
	protected onStaleCommand(
		player: IsoPlayer,
		payload: CommandPayload<SyncSleepBuffRequestPayload>
	): void {
		this.sendResponse(player, payload, {
			rejectedNames: payload.data.candidateNames
		});
	}

	/**
	 * Rejects every candidate when the request schema is unsupported.
	 *
	 * @param player Player who submitted the incompatible request.
	 * @param payload Incompatible request envelope to echo in the response.
	 */
	protected onUnsupportedSchema(
		player: IsoPlayer,
		payload: CommandPayload<SyncSleepBuffRequestPayload>
	): void {
		this.sendResponse(player, payload, {
			rejectedNames: payload.data.candidateNames
		});
	}

	/**
	 * Normalizes persisted state into the complete current authoritative shape.
	 *
	 * @param persistedVersion Schema version stored with the persisted state.
	 * @param authoritativeData Persisted state, which may be partial or absent.
	 * @returns Fully initialized authoritative state for runtime use.
	 */
	protected migrateAuthoritativeData(
		persistedVersion: number,
		authoritativeData: unknown
	): NaninhasAuthoritativeState {
		if (persistedVersion < PROTOCOL_SCHEMA_VERSION) {
			print(
				`[Naninhas] Migrating server mod data from schema v${persistedVersion} to v${PROTOCOL_SCHEMA_VERSION}`
			);
		}

		const authoritative = authoritativeData as Partial<NaninhasAuthoritativeState> | undefined;
		return {
			activePlushieNames: authoritative?.activePlushieNames ?? [],
			addedTraits: authoritative?.addedTraits ?? [],
			suppressedTraits: authoritative?.suppressedTraits ?? [],
			xpBoosts: authoritative?.xpBoosts ?? {},
			temporaryBuff: {
				activeName: authoritative?.temporaryBuff?.activeName,
				expiresAtWorldAgeHours: authoritative?.temporaryBuff?.expiresAtWorldAgeHours,
				source: authoritative?.temporaryBuff?.source ?? null
			}
		};
	}

	/** Returns the known plushie names currently attached to the player. */
	private getKnownAttachedNames(playerApi: PlayerApi): string[] {
		const names: string[] = [];
		for (const name of playerApi.getAttachedItemNames()) {
			if (isKnownPlushie(name)) {
				names.push(name);
			}
		}
		return names;
	}

	/**
	 * Selects one candidate with Project Zomboid's runtime random generator.
	 *
	 * @returns A candidate name, or `undefined` when the list is empty.
	 */
	private selectRandom(candidates: string[]): string | undefined {
		if (candidates.length === 0) return undefined;
		const index = ZombRand(candidates.length);
		return candidates[index];
	}

	/** Returns a supported bed type, defaulting unknown values to `averageBed`. */
	private normalizeBedType(bedType: string): BedType {
		switch (bedType) {
			case "badBed":
			case "averageBed":
			case "goodBed":
			case "floor":
				return bedType;
			default:
				return "averageBed";
		}
	}

	/** Returns the temporary buff duration, in world-age hours, for a bed type. */
	private getDurationForBedType(bedType: BedType): number {
		switch (bedType) {
			case "goodBed":
				return 8;
			case "averageBed":
				return 6;
			case "badBed":
			case "floor":
			default:
				return 3;
		}
	}
}
