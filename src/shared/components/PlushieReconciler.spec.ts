import { PlushieReconciler } from "@shared/components/PlushieReconciler";
import type { NaninhasAuthoritativeState } from "@types";
import { PlushieNames } from "@constants";

const emptyState = (): NaninhasAuthoritativeState => ({
	activePlushieNames: [],
	addedTraits: [],
	suppressedTraits: [],
	xpBoosts: {}
});

describe("PlushieReconciler", () => {
	describe("apply from empty state", () => {
		it("adds traits when plushie with traitsToAdd becomes active", () => {
			const plan = PlushieReconciler.reconcile(emptyState(), [PlushieNames.DOLL]);
			expect(plan.traitsToAdd).toContain("EagleEyed");
			expect(plan.traitsToSuppress).toContain("ShortSighted");
			expect(plan.traitsToRemove).toHaveLength(0);
			expect(plan.traitsToRestore).toHaveLength(0);
		});

		it("sets xpBoostDeltas for xp plushie", () => {
		const plan = PlushieReconciler.reconcile(emptyState(), [PlushieNames.JACQUESBEAVER]);
			expect(plan.xpBoostDeltas[`${PlushieNames.JACQUESBEAVER}:Woodwork`]).toBe(1);
		});

		it("new state reflects the active plushie effects", () => {
		const plan = PlushieReconciler.reconcile(emptyState(), [PlushieNames.DOLL]);
			expect(plan.newState.activePlushieNames).toContain(PlushieNames.DOLL);
			expect(plan.newState.addedTraits).toContain("EagleEyed");
			expect(plan.newState.suppressedTraits).toContain("ShortSighted");
		});
	});

	describe("switch plushies", () => {
		it("removes old plushie traits and adds new ones", () => {
			const current: NaninhasAuthoritativeState = {
				activePlushieNames: [PlushieNames.DOLL],
				addedTraits: ["EagleEyed"],
				suppressedTraits: ["ShortSighted"],
				xpBoosts: {}
			};
		const plan = PlushieReconciler.reconcile(current, [PlushieNames.FLAMINGO]);
			expect(plan.traitsToAdd).toContain("Graceful");
			expect(plan.traitsToRemove).toContain("EagleEyed");
			expect(plan.traitsToSuppress).toContain("Clumsy");
			expect(plan.traitsToRestore).toContain("ShortSighted");
		});
	});

	describe("detach all plushies", () => {
		it("removes all effects when empty set is provided", () => {
			const current: NaninhasAuthoritativeState = {
				activePlushieNames: [PlushieNames.DOLL],
				addedTraits: ["EagleEyed"],
				suppressedTraits: ["ShortSighted"],
				xpBoosts: {}
			};
		const plan = PlushieReconciler.reconcile(current, []);
			expect(plan.traitsToRemove).toContain("EagleEyed");
			expect(plan.traitsToRestore).toContain("ShortSighted");
			expect(plan.traitsToAdd).toHaveLength(0);
			expect(plan.traitsToSuppress).toHaveLength(0);
			expect(plan.newState.activePlushieNames).toHaveLength(0);
		});
	});

	describe("idempotence", () => {
		it("produces empty diffs when state already matches desired plushies", () => {
			const current: NaninhasAuthoritativeState = {
				activePlushieNames: [PlushieNames.DOLL],
				addedTraits: ["EagleEyed"],
				suppressedTraits: ["ShortSighted"],
				xpBoosts: {}
			};
		const plan = PlushieReconciler.reconcile(current, [PlushieNames.DOLL]);
			expect(plan.traitsToAdd).toHaveLength(0);
			expect(plan.traitsToRemove).toHaveLength(0);
			expect(plan.traitsToSuppress).toHaveLength(0);
			expect(plan.traitsToRestore).toHaveLength(0);
			expect(plan.xpBoostDeltas).toEqual({});
		});

		it("produces empty xp deltas when same xp plushie is already applied", () => {
			const current: NaninhasAuthoritativeState = {
				activePlushieNames: [PlushieNames.JACQUESBEAVER],
				addedTraits: [],
				suppressedTraits: [],
				xpBoosts: { [`${PlushieNames.JACQUESBEAVER}:Woodwork`]: 1 }
			};
		const plan = PlushieReconciler.reconcile(current, [PlushieNames.JACQUESBEAVER]);
			expect(plan.xpBoostDeltas).toEqual({});
		});
	});

	describe("overlapping effects", () => {
		it("unions traits from multiple plushies", () => {
		const plan = PlushieReconciler.reconcile(emptyState(), [PlushieNames.DOLL, PlushieNames.FLAMINGO]);
			expect(plan.traitsToAdd).toContain("EagleEyed");
			expect(plan.traitsToAdd).toContain("Graceful");
			expect(plan.traitsToSuppress).toContain("ShortSighted");
			expect(plan.traitsToSuppress).toContain("Clumsy");
		});

		it("sums xp boosts from multiple xp plushies", () => {
		const plan = PlushieReconciler.reconcile(emptyState(), [
				PlushieNames.JACQUESBEAVER,
				PlushieNames.SPIFFOSHAMROCK
			]);
			expect(plan.xpBoostDeltas[`${PlushieNames.JACQUESBEAVER}:Woodwork`]).toBe(1);
			expect(plan.xpBoostDeltas[`${PlushieNames.SPIFFOSHAMROCK}:Aiming`]).toBe(5);
		});
	});

	describe("unknown plushie names", () => {
		it("silently skips names not in catalog", () => {
		const plan = PlushieReconciler.reconcile(emptyState(), ["FakePlushie"]);
			expect(plan.traitsToAdd).toHaveLength(0);
			expect(plan.newState.activePlushieNames).toContain("FakePlushie");
		});
	});

	describe("xp boost removal", () => {
		it("emits negative delta when xp plushie is removed", () => {
			const current: NaninhasAuthoritativeState = {
				activePlushieNames: [PlushieNames.JACQUESBEAVER],
				addedTraits: [],
				suppressedTraits: [],
				xpBoosts: { [`${PlushieNames.JACQUESBEAVER}:Woodwork`]: 1 }
			};
		const plan = PlushieReconciler.reconcile(current, []);
		expect(plan.xpBoostDeltas[`${PlushieNames.JACQUESBEAVER}:Woodwork`]).toBe(-1);
		});
	});
});
