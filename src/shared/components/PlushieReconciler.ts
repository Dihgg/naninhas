import type { ServerAuthoritativeState } from "types";
import { getPlushieDefinition } from "@shared/catalog/PlushieCatalog";

/**
 * The set of operations the server must perform to transition from the current
 * authoritative state to a new one when the active plushie set changes.
 *
 * Every field is a minimal diff — items already in the correct state are
 * never included. This keeps the application side cheap and idempotent.
 */
export type ReconcilePlan = {
	/** Traits that should be added to the player. */
	traitsToAdd: string[];
	/** Traits that were added by plushies and must be removed. */
	traitsToRemove: string[];
	/** Traits that should be suppressed (removed from the player) by active plushies. */
	traitsToSuppress: string[];
	/** Traits that were suppressed but whose plushie is no longer active — restore them. */
	traitsToRestore: string[];
	/**
	 * XP multiplier adjustments keyed by `"plushieName:perk"`.
	 * Positive values add multiplier, negative values remove it.
	 */
	xpBoostDeltas: Record<string, number>;
	/** The authoritative state that results from applying this plan. */
	newState: ServerAuthoritativeState;
};

/**
 * Pure reconciliation engine that computes minimal trait and XP multiplier
 * diffs between a current authoritative state and a desired plushie set.
 *
 * Stateless and side-effect-free — safe to use in tests and shared code paths.
 */
export class PlushieReconciler {
	/**
	 * Computes a minimal {@link ReconcilePlan} that transitions `currentState` to
	 * the effects implied by `newActivePlushieNames`.
	 *
	 * Unknown plushie names are silently skipped — the caller is expected to
	 * validate names against the catalog before invoking this method.
	 *
	 * @param currentState - The server's current authoritative state for the player.
	 * @param newActivePlushieNames - The verified list of plushies to make active.
	 * @returns A plan describing what to change and the resulting new state.
	 */
	static reconcile(currentState: ServerAuthoritativeState, newActivePlushieNames: string[]): ReconcilePlan {
		// -----------------------------------------------------------------------
		// 1. Build desired aggregate from the new active set
		// -----------------------------------------------------------------------
		const desiredAddedTraits = new Set<string>();
		const desiredSuppressedTraits = new Set<string>();
		const desiredXpBoosts: Record<string, number> = {};

		for (const name of newActivePlushieNames) {
			const definitions = getPlushieDefinition(name);
			if (!definitions) continue;
			
			const { traitsToAdd, traitsToSuppress, xpBoostsToAdd } = definitions;

			for (const trait of traitsToAdd) {
				desiredAddedTraits.add(trait);
			}

			for (const trait of traitsToSuppress) {
				desiredSuppressedTraits.add(trait);
			}
			
			for (const boost of xpBoostsToAdd) {
				const key = `${name}:${boost.perk}`;
				desiredXpBoosts[key] = boost.value;
			}
		}

		// -----------------------------------------------------------------------
		// 2. Diff against current state
		// -----------------------------------------------------------------------
		const currentAddedTraits = new Set(currentState.addedTraits);
		const currentSuppressedTraits = new Set(currentState.suppressedTraits);

		const traitsToAdd = [...desiredAddedTraits].filter(t => !currentAddedTraits.has(t));
		const traitsToRemove = [...currentAddedTraits].filter(t => !desiredAddedTraits.has(t));
		const traitsToSuppress = [...desiredSuppressedTraits].filter(t => !currentSuppressedTraits.has(t));
		const traitsToRestore = [...currentSuppressedTraits].filter(t => !desiredSuppressedTraits.has(t));

		// XP deltas: add new boosts (positive delta) and remove dropped boosts (negative delta)
		const xpBoostDeltas: Record<string, number> = {};
		for (const [key, value] of Object.entries(desiredXpBoosts)) {
			if (currentState.xpBoosts[key] !== value) {
				xpBoostDeltas[key] = value - (currentState.xpBoosts[key] ?? 0);
			}
		}
		for (const key of Object.keys(currentState.xpBoosts)) {
			if (!(key in desiredXpBoosts)) {
				xpBoostDeltas[key] = -(currentState.xpBoosts[key]);
			}
		}

		// -----------------------------------------------------------------------
		// 3. Build the new authoritative state
		// -----------------------------------------------------------------------
		const newState: ServerAuthoritativeState = {
			activePlushieNames: [...newActivePlushieNames],
			addedTraits: [...desiredAddedTraits],
			suppressedTraits: [...desiredSuppressedTraits],
			xpBoosts: { ...desiredXpBoosts }
		};

		return {
			traitsToAdd,
			traitsToRemove,
			traitsToSuppress,
			traitsToRestore,
			xpBoostDeltas,
			newState
		};
	}
}
