import type { Perk } from "@asledgehammer/pipewrench";
import { Perks } from "@asledgehammer/pipewrench";
import type { NaninhasAuthoritativeState, TemporaryBuffState } from "@types";
import { PlushieReconciler } from "@shared/components/PlushieReconciler";
import { PlayerApi } from "@shared/components/PlayerApi";

/**
 * Applies and persists authoritative plushie effects with support for
 * an independent temporary buff source.
 */
export class AuthoritativeStateController {
	/** Returns a sanitized temporary buff state with expiration applied. */
	static sanitizeTemporaryBuff(temporaryBuff: TemporaryBuffState, nowWorldAgeHours: number): TemporaryBuffState {
		if (
            !temporaryBuff.activeName ||
            temporaryBuff.expiresAtWorldAgeHours === undefined ||
            temporaryBuff.expiresAtWorldAgeHours <= nowWorldAgeHours
        ) {
			return { source: null };
		}

		return temporaryBuff;
	}

	/** Builds effective names from attached names plus active temporary buff. */
	static buildEffectiveNames(attachedNames: string[], temporaryBuff: TemporaryBuffState): string[] {
		if (
            !temporaryBuff.activeName ||
            attachedNames.includes(temporaryBuff.activeName)
        
        ) {
			return [...attachedNames];
		}

		return [...attachedNames, temporaryBuff.activeName];
	}

	/**
	 * Reconciles and applies the transition to `desiredEffectiveNames`, then
	 * returns the authoritative state to persist.
	 */
	static applyDesiredState(
		playerApi: PlayerApi,
		current: NaninhasAuthoritativeState,
		desiredEffectiveNames: string[],
		nextAttachedNames: string[],
		nextTemporaryBuff: TemporaryBuffState
	): NaninhasAuthoritativeState {
		const {
			traitsToAdd,
			traitsToRemove,
			traitsToSuppress,
			traitsToRestore,
			xpBoostDeltas,
			newState
		} = PlushieReconciler.reconcile(current, desiredEffectiveNames);

		const actuallyAdded: string[] = [];
		for (const trait of traitsToAdd) {
			if (!playerApi.hasTrait(trait)) {
				playerApi.addTrait(trait);
				actuallyAdded.push(trait);
			}
		}

		for (const trait of traitsToRemove) {
			playerApi.removeTrait(trait);
		}

		const actuallySuppressed: string[] = [];
		for (const trait of traitsToSuppress) {
			if (playerApi.hasTrait(trait)) {
				playerApi.removeTrait(trait);
				actuallySuppressed.push(trait);
			}
		}

		for (const trait of traitsToRestore) {
			playerApi.addTrait(trait);
		}

		for (const [key, delta] of Object.entries(xpBoostDeltas)) {
			const [, perkName] = key.split(":");
			const perk = Perks[perkName as keyof typeof Perks] as Perk;
			if (!perk) continue;
			playerApi.applyXpMultiplierDelta(perk, delta);
		}

		return {
			...newState,
			activePlushieNames: [...nextAttachedNames],
			temporaryBuff: nextTemporaryBuff,
			addedTraits: [
				...current.addedTraits.filter((t: string) => !traitsToRemove.includes(t)),
				...actuallyAdded
			],
			suppressedTraits: [
				...current.suppressedTraits.filter((t: string) => !traitsToRestore.includes(t)),
				...actuallySuppressed
			]
		};
	}
}
