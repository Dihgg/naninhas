/**
 * Cross-build trait data shape declarations used by CharacterTraitApi.
 * Build 42 runtime globals are declared in pz-b42-player-traits.d.ts.
 */

export {};

declare global {
	interface PzCharacterTraitRef {
		getName?: () => string;
		toString?: () => string;
	}

	interface PzKnownTraitList {
		size?: () => number;
		get?: (index: number) => PzCharacterTraitRef | string;
	}

	interface PzCharacterTraits {
		get?: (trait: PzCharacterTraitRef) => boolean;
		add?: (trait: PzCharacterTraitRef) => void;
		remove?: (trait: PzCharacterTraitRef) => void;
		getKnownTraits?: () => PzKnownTraitList;
	}

	interface PzLegacyTraitCollection {
		add?: (trait: string) => void;
		remove?: (trait: string) => boolean;
	}

	interface PzCharacterTraitStaticApi {
		get?: (this: void, id: unknown) => PzCharacterTraitRef | undefined;
	}

	interface PzResourceLocationStaticApi {
		of?: (this: void, id: string) => unknown;
	}
}