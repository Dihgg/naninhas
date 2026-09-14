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

	constructor() {
		super(NETWORK_MODULE, Commands.SYNC_SLEEP_BUFF, {
			activePlushieNames: [],
			addedTraits: [],
			suppressedTraits: [],
			xpBoosts: {},
			temporaryBuff: { source: null }
		});
	}

	protected onCommand(
		player: IsoPlayer,
		payload: CommandPayload<SyncSleepBuffRequestPayload>
	): void {
		const playerApi = new PlayerApi(player);
		const serverModData = this.getModData(playerApi.player);
		const { authoritative } = serverModData;
		const now = playerApi.getWorldAgeHours();
		const username = player.getUsername();
		this.logger.log(
			["Server", "Request"],
			`player=${username}; worldAge=${now}; requestedBedType=${payload.data.bedType}; candidates=${Logger.formatList(payload.data.candidateNames)}`
		);

		const attachedKnownNames = this.getKnownAttachedNames(playerApi);
		this.logger.log(
			["Server", "Validation"],
			`player=${username}; attachedNaninhas=${Logger.formatList(attachedKnownNames)}`
		);
		const currentTemporaryBuff = AuthoritativeStateController.sanitizeTemporaryBuff(
			authoritative.temporaryBuff,
			now
		);

		const rejectedNames: string[] = [];
		const validCandidatesSet = new Set<string>();

		for (const name of payload.data.candidateNames) {
			if (!isKnownPlushie(name)) {
				this.logger.log(
					["Server", "Validation"],
					`player=${username}; rejected unknown candidate=${name}`
				);
				rejectedNames.push(name);
				continue;
			}
			if (attachedKnownNames.includes(name)) {
				this.logger.log(
					["Server", "Validation"],
					`player=${username}; rejected already-attached candidate=${name}`
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
		this.logger.log(
			["Server", "Selection"],
			`player=${username}; validCandidates=${Logger.formatList(validCandidates)}; selected=${selectedName ?? "none"}; resolvedBedType=${resolvedBedType}; durationHours=${durationHours}`
		);

		let nextTemporaryBuff: TemporaryBuffState = currentTemporaryBuff;
		if (emptyWakeScan) {
			nextTemporaryBuff = { source: null };
			this.logger.log(
				["Server", "Apply"],
				`player=${username}; empty wake scan; clearing previous temporary buff=${currentTemporaryBuff.activeName ?? "none"}`
			);
		} else if (selectedName) {
			nextTemporaryBuff = {
				activeName: selectedName,
				expiresAtWorldAgeHours: now + durationHours,
				source: "sleep"
			};
			this.logger.log(
				["Server", "Apply"],
				`player=${username}; applying=${selectedName}; expiresAtWorldAge=${nextTemporaryBuff.expiresAtWorldAgeHours}`
			);
		} else {
			this.logger.log(
				["Server", "Apply"],
				`player=${username}; no valid selection; existing temporary buff remains=${currentTemporaryBuff.activeName ?? "none"}`
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
		this.logger.log(
			["Server", "Apply"],
			`player=${username}; effectiveNaninhas=${Logger.formatList(desiredEffectiveNames)}; state persisted`
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

	protected onStaleCommand(
		player: IsoPlayer,
		payload: CommandPayload<SyncSleepBuffRequestPayload>
	): void {
		this.sendResponse(player, payload, {
			rejectedNames: payload.data.candidateNames
		});
	}

	protected onUnsupportedSchema(
		player: IsoPlayer,
		payload: CommandPayload<SyncSleepBuffRequestPayload>
	): void {
		this.sendResponse(player, payload, {
			rejectedNames: payload.data.candidateNames
		});
	}

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

	private getKnownAttachedNames(playerApi: PlayerApi): string[] {
		const names: string[] = [];
		for (const name of playerApi.getAttachedItemNames()) {
			if (isKnownPlushie(name)) {
				names.push(name);
			}
		}
		return names;
	}

	private selectRandom(candidates: string[]): string | undefined {
		if (candidates.length === 0) return undefined;
		const index = ZombRand(candidates.length);
		return candidates[index];
	}

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
